import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { User } from '@modules/user/entities/user.entity';
import { AuthMetadata } from '../entities/auth-metadata.entity';
import { UserSession } from '../entities/user-session.entity';
import { RedisService } from '@modules/redis/services/redis.service';
import AuthenticationService from '../auth.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;

  const userRepositoryMock = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const authMetadataRepositoryMock = { findOneBy: jest.fn(), create: jest.fn(), save: jest.fn() };
  const userSessionRepositoryMock = { findOne: jest.fn() };
  const jwtServiceMock = { sign: jest.fn() };

  const sessionMock = { id: 'session-1', user_id: 'user-1', refresh_token: 'token', expires_at: new Date(), is_revoked: false };
  const dataSourceMock = {
    query: jest.fn(),
    manager: {
      transaction: jest.fn().mockImplementation(async (cb: (em: any) => Promise<any>) => {
        const em = {
          query: jest.fn().mockResolvedValue(undefined),
          create: jest.fn().mockReturnValue(sessionMock),
          save: jest.fn().mockResolvedValue(sessionMock),
        };
        return cb(em);
      }),
    },
  };
  const redisServiceMock = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: getRepositoryToken(User), useValue: userRepositoryMock },
        { provide: getRepositoryToken(AuthMetadata), useValue: authMetadataRepositoryMock },
        { provide: getRepositoryToken(UserSession), useValue: userSessionRepositoryMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: RedisService, useValue: redisServiceMock },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNewUser', () => {
    const dto = {
      email: 'jane@example.com',
      full_name: 'Jane Doe',
      password: 'P@ssword123',
      country: 'Nigeria',
    };

    it('creates a user when none exists with that email', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce(null);
      userRepositoryMock.create.mockImplementation(input => input);
      userRepositoryMock.save.mockResolvedValueOnce({
        id: 'user-1',
        email: dto.email,
        full_name: dto.full_name,
        avatar_url: null,
      });
      jwtServiceMock.sign.mockReturnValueOnce('jwt');

      const result = await service.createNewUser(dto);

      expect(result.status_code).toBe(HttpStatus.CREATED);
      expect(result.message).toBe(SYS_MSG.USER_CREATED_SUCCESSFULLY);
      expect(result.access_token).toBe('jwt');
      expect(result.data.user).toEqual({
        id: 'user-1',
        full_name: dto.full_name,
        email: dto.email,
        avatar_url: null,
      });
      const created = userRepositoryMock.create.mock.calls[0][0];
      expect(created.auth_provider).toBe('email');
      expect(created.otp_code).toMatch(/^\d{6}$/);
      expect(created.expires_at).toBeInstanceOf(Date);
    });

    it('throws when a user with that email already exists', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce({ id: 'existing' });
      await expect(service.createNewUser(dto)).rejects.toThrow(CustomHttpException);
    });
  });

  describe('loginUser', () => {
    const metaMock = { id: 'meta-1', user_id: 'user-1', failed_attempts: 0, locked_until: null };

    it('returns an access token for valid credentials', async () => {
      const password = 'P@ssword123';
      const hashed = await bcrypt.hash(password, 10);
      userRepositoryMock.findOne.mockResolvedValueOnce({
        id: 'user-1',
        email: 'jane@example.com',
        full_name: 'Jane Doe',
        avatar_url: null,
        password: hashed,
      });
      authMetadataRepositoryMock.findOneBy.mockResolvedValueOnce(metaMock);
      dataSourceMock.query.mockResolvedValueOnce([{ is_locked: false, seconds_remaining: 0 }]);
      jwtServiceMock.sign.mockReturnValueOnce('jwt');

      const result = (await service.loginUser({ email: 'jane@example.com', password }, '127.0.0.1')) as Record<
        string,
        unknown
      >;

      expect(result.message).toBe(SYS_MSG.LOGIN_SUCCESSFUL);
      expect((result.data as Record<string, unknown>).access_token).toBe('jwt');
    });

    it('rejects unknown emails', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce(null);
      await expect(service.loginUser({ email: 'x@y.z', password: 'pass' }, '127.0.0.1')).rejects.toThrow(
        CustomHttpException
      );
    });

    it('rejects bad passwords', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      userRepositoryMock.findOne.mockResolvedValueOnce({
        id: 'user-1',
        email: 'jane@example.com',
        full_name: 'Jane Doe',
        avatar_url: null,
        password: hashed,
      });
      authMetadataRepositoryMock.findOneBy.mockResolvedValueOnce(metaMock);
      dataSourceMock.query
        .mockResolvedValueOnce([{ is_locked: false, seconds_remaining: 0 }])
        .mockResolvedValueOnce(undefined);
      await expect(
        service.loginUser({ email: 'jane@example.com', password: 'wrong-password' }, '127.0.0.1')
      ).rejects.toThrow(CustomHttpException);
    });

    it('rejects accounts without a stored password (OAuth-only)', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce({
        id: 'user-1',
        email: 'jane@example.com',
        password: null,
      });
      await expect(service.loginUser({ email: 'jane@example.com', password: 'anything' }, '127.0.0.1')).rejects.toThrow(
        CustomHttpException
      );
    });
  });

  describe('changePassword', () => {
    it('updates the password when the old one matches', async () => {
      const oldPassword = 'OldP@ss123';
      const newPassword = 'NewP@ss123';
      const hashed = await bcrypt.hash(oldPassword, 10);
      userRepositoryMock.findOne.mockResolvedValueOnce({ id: 'user-1', password: hashed });
      userRepositoryMock.save.mockResolvedValueOnce(undefined);

      const result = await service.changePassword('user-1', oldPassword, newPassword);

      expect(result.message).toBe(SYS_MSG.PASSWORD_UPDATED);
      expect(userRepositoryMock.save).toHaveBeenCalled();
    });

    it('throws when the user is missing', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce(null);
      await expect(service.changePassword('user-1', 'x', 'y')).rejects.toThrow(CustomHttpException);
    });

    it('throws when the old password is wrong', async () => {
      const hashed = await bcrypt.hash('correct-old', 10);
      userRepositoryMock.findOne.mockResolvedValueOnce({ id: 'user-1', password: hashed });
      await expect(service.changePassword('user-1', 'wrong-old', 'new')).rejects.toThrow(CustomHttpException);
    });
  });
});
