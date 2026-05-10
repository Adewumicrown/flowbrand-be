import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import authConfig from '@config/auth.config';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { User } from '@modules/user/entities/user.entity';
import { AuthMetadata } from './entities/auth-metadata.entity';
import { UserSession } from './entities/user-session.entity';
import { CreateUserDTO } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RedisService } from '@modules/redis/services/redis.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

@Injectable()
export default class AuthenticationService implements OnModuleInit {
  private readonly logger = new Logger(AuthenticationService.name);
  private dummyHash = '';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuthMetadata)
    private readonly authMetadataRepository: Repository<AuthMetadata>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService
  ) {}

  async onModuleInit(): Promise<void> {
    // Pre-compute once at startup so every failed lookup runs a real bcrypt compare,
    // making response time identical whether the user exists or not.
    this.dummyHash = await bcrypt.hash('__timing_safety_dummy__', 10);
  }

  async createNewUser(createUserDto: CreateUserDTO) {
    const existing = await this.userRepository.findOne({ where: { email: createUserDto.email } });
    if (existing) {
      throw new CustomHttpException(SYS_MSG.USER_ACCOUNT_EXIST, HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      email: createUserDto.email,
      full_name: createUserDto.full_name,
      country: createUserDto.country ?? null,
      password: hashedPassword,
      auth_provider: 'email',
      otp_code: this.generateOtp(),
      expires_at: this.computeOtpExpiry(),
    });
    const saved = await this.userRepository.save(user);

    const access_token = this.jwtService.sign({ id: saved.id, sub: saved.id, email: saved.email });

    return {
      status_code: HttpStatus.CREATED,
      message: SYS_MSG.USER_CREATED_SUCCESSFULLY,
      access_token,
      data: {
        user: {
          id: saved.id,
          full_name: saved.full_name,
          email: saved.email,
          avatar_url: saved.avatar_url,
        },
      },
    };
  }

  async loginUser(loginDto: LoginDto, ip: string): Promise<object> {
    // Fast-path: check Redis before hitting the DB. If the key exists and count >= threshold,
    // the account is locked — no need to load the user row at all.
    // If Redis is unavailable, swallow the error and fall through to the DB lockout check below.
    try {
      const redisFailCount = await this.redisService.get(`fail:${loginDto.email}`);
      if (redisFailCount !== null && +redisFailCount >= MAX_FAILED_ATTEMPTS) {
        throw new CustomHttpException(`Account locked. Please try again later.`, HttpStatus.FORBIDDEN);
      }
    } catch (err) {
      if (err instanceof CustomHttpException) throw err;
      this.logger.warn({ event: 'redis_unavailable', detail: 'skipping Redis fast-path, falling back to DB lockout check' });
    }

    const user = await this.userRepository.findOne({ where: { email: loginDto.email } });

    // Run dummy bcrypt so response time is the same whether the email exists or not.
    // This prevents user enumeration via timing.
    if (!user || !user.password) {
      await bcrypt.compare(loginDto.password, this.dummyHash);
      await this.incrementRedisFailCounter(loginDto.email);
      this.auditLog('login_failed', loginDto.email, ip, 'email_not_found');
      throw new CustomHttpException(SYS_MSG.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    const meta = await this.loadOrCreateMeta(user.id);

    // Lockout check must happen BEFORE bcrypt to deny locked accounts immediately.
    // Comparison is done in the DB using CURRENT_TIMESTAMP so both sides share the
    // same timezone — avoids bugs from TIMESTAMP WITHOUT TIME ZONE being misread
    // as local time by the Node.js pg driver.
    const lockResult = await this.dataSource.query<{ is_locked: boolean; seconds_remaining: number }[]>(
      `SELECT locked_until > CURRENT_TIMESTAMP AS is_locked,
              CEIL(EXTRACT(EPOCH FROM (locked_until - CURRENT_TIMESTAMP))) AS seconds_remaining
       FROM auth_metadata WHERE id = $1`,
      [meta.id]
    );
    const lock = lockResult[0];
    if (lock?.is_locked) {
      throw new CustomHttpException(
        `Account locked. Try again in ${lock.seconds_remaining} seconds.`,
        HttpStatus.FORBIDDEN
      );
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);

    if (!isMatch) {
      await this.recordFailedAttempt(meta.id, loginDto.email);
      this.auditLog('login_failed', loginDto.email, ip, 'wrong_password');
      throw new CustomHttpException(SYS_MSG.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    return this.createSession(user, meta.id, loginDto.email, ip);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (!user.password || !(await bcrypt.compare(oldPassword, user.password))) {
      throw new CustomHttpException(SYS_MSG.INVALID_PASSWORD, HttpStatus.BAD_REQUEST);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { status_code: HttpStatus.OK, message: SYS_MSG.PASSWORD_UPDATED };
  }

  private async loadOrCreateMeta(userId: string): Promise<AuthMetadata> {
    const existing = await this.authMetadataRepository.findOneBy({ user_id: userId });
    if (existing) return existing;
    return this.authMetadataRepository.save(
      this.authMetadataRepository.create({ user_id: userId, failed_attempts: 0 })
    );
  }

  private async recordFailedAttempt(metaId: string, email: string): Promise<void> {
    // Single atomic UPDATE avoids race conditions — no separate SELECT needed.
    // locked_until uses CURRENT_TIMESTAMP (DB server time) to avoid clock drift
    // across distributed nodes.
    await this.dataSource.query(
      `UPDATE auth_metadata
       SET failed_attempts = failed_attempts + 1,
           locked_until = CASE
             WHEN failed_attempts + 1 >= $1
             THEN CURRENT_TIMESTAMP + ($2 || ' minutes')::interval
             ELSE locked_until
           END
       WHERE id = $3`,
      [MAX_FAILED_ATTEMPTS, String(LOCKOUT_MINUTES), metaId]
    );

    await this.incrementRedisFailCounter(email);
  }

  private auditLog(event: 'login_failed' | 'login_success', email: string, ip: string, reason?: string): void {
    this.logger.log({ event, email, ip, ...(reason && { reason }), timestamp: new Date().toISOString() });
  }

  private async incrementRedisFailCounter(email: string): Promise<void> {
    try {
      const count = await this.redisService.incr(`fail:${email}`);
      if (count === 1) {
        await this.redisService.set(`fail:${email}`, '1', LOCKOUT_MINUTES * 60);
      }
    } catch {
      this.logger.warn({ event: 'redis_unavailable', detail: 'fail counter not incremented in Redis; DB counter is authoritative' });
    }
  }

  private async createSession(user: User, metaId: string, email: string, ip: string): Promise<object> {
    const refreshToken = randomBytes(32).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const savedSession = await this.dataSource.manager
      .transaction(async em => {
        // Only clear lockout if it has expired or was never set. A concurrent failed-login
        // on another device/IP may have set locked_until moments ago — we must not erase it.
        await em.query(
          `UPDATE auth_metadata
           SET failed_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP
           WHERE id = $1
             AND (locked_until IS NULL OR locked_until <= CURRENT_TIMESTAMP)`,
          [metaId]
        );
        const session = em.create(UserSession, {
          user_id: user.id,
          refresh_token: refreshToken,
          expires_at: refreshExpiresAt,
          is_revoked: false,
        });
        return em.save(UserSession, session);
      })
      .catch(() => {
        throw new CustomHttpException(SYS_MSG.ERROR_OCCURED, HttpStatus.INTERNAL_SERVER_ERROR);
      });

    const jwtExpirySeconds = +(authConfig().jwtExpiry ?? 3600);

    await Promise.all([
      this.redisService.del(`fail:${email}`),
      this.redisService.set(`active_session:${savedSession.id}`, user.id, jwtExpirySeconds),
    ]).catch(() => {
      this.logger.warn({ event: 'redis_unavailable', detail: 'session keys not written to Redis after login' });
    });
    this.auditLog('login_success', email, ip);

    const tokenExpiresAt = new Date(Date.now() + jwtExpirySeconds * 1000);
    const access_token = this.jwtService.sign({
      sub: user.id,
      id: user.id,
      email: user.email,
      sid: savedSession.id,
    });

    return {
      status_code: HttpStatus.OK,
      message: SYS_MSG.LOGIN_SUCCESSFUL,
      data: {
        access_token,
        refresh_token: refreshToken,
        expires_at: tokenExpiresAt.toISOString(),
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          avatar_url: user.avatar_url,
        },
      },
    };
  }

  private generateOtp(): string {
    return Math.floor(Math.random() * 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, '0');
  }

  private computeOtpExpiry(): Date {
    return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  }
}
