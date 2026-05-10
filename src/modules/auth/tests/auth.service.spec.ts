import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { User } from '@modules/user/entities/user.entity';
import { RedisService } from '@modules/redis/services/redis.service';
import QueueService from '@modules/email/queue.service';
import AuthenticationService from '../auth.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;

  const userRepositoryMock = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const jwtServiceMock = { sign: jest.fn() };
  const redisServiceMock = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
  };
  const queueServiceMock = {
    sendMail: jest.fn().mockResolvedValue({ jobId: 'mock-job' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: getRepositoryToken(User), useValue: userRepositoryMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: RedisService, useValue: redisServiceMock },
        { provide: QueueService, useValue: queueServiceMock },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createNewUser ────────────────────────────────────────────────────────

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
      expect(queueServiceMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'register-otp', mail: expect.objectContaining({ to: dto.email }) })
      );
    });

    it('throws when a user with that email already exists', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce({ id: 'existing' });
      await expect(service.createNewUser(dto)).rejects.toThrow(CustomHttpException);
    });
  });

  // ─── loginUser ────────────────────────────────────────────────────────────

  describe('loginUser', () => {
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
      jwtServiceMock.sign.mockReturnValueOnce('jwt');

      const result = await service.loginUser({ email: 'jane@example.com', password });

      expect(result.message).toBe(SYS_MSG.LOGIN_SUCCESSFUL);
      expect(result.access_token).toBe('jwt');
    });

    it('rejects unknown emails', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce(null);
      await expect(service.loginUser({ email: 'x@y.z', password: 'pass' })).rejects.toThrow(CustomHttpException);
    });

    it('rejects bad passwords', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      userRepositoryMock.findOne.mockResolvedValueOnce({
        id: 'user-1',
        email: 'jane@example.com',
        password: hashed,
      });
      await expect(service.loginUser({ email: 'jane@example.com', password: 'wrong-password' })).rejects.toThrow(
        CustomHttpException
      );
    });

    it('rejects accounts without a stored password (OAuth-only)', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce({ id: 'user-1', email: 'jane@example.com', password: null });
      await expect(service.loginUser({ email: 'jane@example.com', password: 'anything' })).rejects.toThrow(
        CustomHttpException
      );
    });
  });

  // ─── sendOtp ─────────────────────────────────────────────────────────────

  describe('sendOtp', () => {
    const user = { id: 'user-1', email: 'jane@example.com', otp_code: '', expires_at: new Date() };

    it('sends OTP, stores hash in Redis and triggers email', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce({ ...user });
      userRepositoryMock.save.mockResolvedValueOnce(undefined);

      const result = await service.sendOtp('jane@example.com');

      expect(result.status_code).toBe(HttpStatus.OK);
      expect(result.message).toBe('OTP sent successfully');
      expect(redisServiceMock.set).toHaveBeenCalledWith('otp:jane@example.com', expect.any(String), 300);
      expect(redisServiceMock.set).toHaveBeenCalledWith('limit:jane@example.com', '1', 30);
      expect(queueServiceMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'register-otp', mail: expect.objectContaining({ to: 'jane@example.com' }) })
      );
    });

    it('throws 404 when user does not exist', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce(null);
      await expect(service.sendOtp('nobody@example.com')).rejects.toThrow(CustomHttpException);
    });
  });

  // ─── verifyOtp ────────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    const user = { id: 'user-1', email: 'jane@example.com', full_name: 'Jane', avatar_url: null, is_verified: false };

    it('verifies a valid OTP, marks user as verified and returns a token', async () => {
      const otp = '123456';
      const hashedOtp = await bcrypt.hash(otp, 10);

      userRepositoryMock.findOne.mockResolvedValueOnce({ ...user });
      redisServiceMock.incr.mockResolvedValueOnce(1);
      redisServiceMock.get.mockResolvedValueOnce(hashedOtp);
      userRepositoryMock.save.mockResolvedValueOnce(undefined);
      jwtServiceMock.sign.mockReturnValueOnce('jwt');

      const result = await service.verifyOtp('jane@example.com', otp);

      expect(result.status_code).toBe(HttpStatus.OK);
      expect(result.message).toBe('Email verified successfully');
      expect(result.access_token).toBe('jwt');
      expect(redisServiceMock.del).toHaveBeenCalledWith('otp:jane@example.com');
      expect(redisServiceMock.del).toHaveBeenCalledWith('attempts:jane@example.com');
      expect(redisServiceMock.del).toHaveBeenCalledWith('limit:jane@example.com');
    });

    it('throws 404 when user does not exist', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce(null);
      await expect(service.verifyOtp('nobody@example.com', '123456')).rejects.toThrow(CustomHttpException);
    });

    it('throws 429 when attempt count exceeds 5', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce({ ...user });
      redisServiceMock.incr.mockResolvedValueOnce(6);

      await expect(service.verifyOtp('jane@example.com', '123456')).rejects.toThrow(CustomHttpException);
    });

    it('throws 400 when OTP has expired or does not exist in Redis', async () => {
      userRepositoryMock.findOne.mockResolvedValueOnce({ ...user });
      redisServiceMock.incr.mockResolvedValueOnce(1);
      redisServiceMock.get.mockResolvedValueOnce(null);

      await expect(service.verifyOtp('jane@example.com', '123456')).rejects.toThrow(CustomHttpException);
    });

    it('throws 400 when OTP does not match', async () => {
      const hashedOtp = await bcrypt.hash('654321', 10);
      userRepositoryMock.findOne.mockResolvedValueOnce({ ...user });
      redisServiceMock.incr.mockResolvedValueOnce(1);
      redisServiceMock.get.mockResolvedValueOnce(hashedOtp);

      await expect(service.verifyOtp('jane@example.com', '999999')).rejects.toThrow(CustomHttpException);
    });
  });

  // ─── resendOtp ────────────────────────────────────────────────────────────

  describe('resendOtp', () => {
    const user = { id: 'user-1', email: 'jane@example.com', otp_code: '', expires_at: new Date() };

    it('resends OTP when cooldown has expired', async () => {
      redisServiceMock.exists.mockResolvedValueOnce(0);
      userRepositoryMock.findOne.mockResolvedValueOnce({ ...user });
      userRepositoryMock.save.mockResolvedValueOnce(undefined);

      const result = await service.resendOtp('jane@example.com');

      expect(result.status_code).toBe(HttpStatus.OK);
      expect(queueServiceMock.sendMail).toHaveBeenCalled();
    });

    it('throws 429 when cooldown key still exists in Redis', async () => {
      redisServiceMock.exists.mockResolvedValueOnce(1);

      await expect(service.resendOtp('jane@example.com')).rejects.toThrow(CustomHttpException);
      expect(queueServiceMock.sendMail).not.toHaveBeenCalled();
    });
  });

  // ─── changePassword ───────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('updates the password when the old one matches', async () => {
      const oldPassword = 'OldP@ss123';
      const hashed = await bcrypt.hash(oldPassword, 10);
      userRepositoryMock.findOne.mockResolvedValueOnce({ id: 'user-1', password: hashed });
      userRepositoryMock.save.mockResolvedValueOnce(undefined);

      const result = await service.changePassword('user-1', oldPassword, 'NewP@ss123');

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
