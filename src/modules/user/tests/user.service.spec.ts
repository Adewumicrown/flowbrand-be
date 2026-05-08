import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { User } from '../entities/user.entity';
import UserService from '../user.service';

describe('UserService', () => {
  let service: UserService;
  const repositoryMock = {
    findOne: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: getRepositoryToken(User), useValue: repositoryMock }],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserById', () => {
    it('returns the user when found', async () => {
      repositoryMock.findOne.mockResolvedValueOnce({ id: 'user-1', email: 'a@b.c' });
      const user = await service.getUserById('user-1');
      expect(user.id).toBe('user-1');
    });

    it('throws when user is missing', async () => {
      repositoryMock.findOne.mockResolvedValueOnce(null);
      await expect(service.getUserById('user-1')).rejects.toThrow(CustomHttpException);
    });
  });

  describe('deactivateUser', () => {
    it('flips is_active when active', async () => {
      repositoryMock.findOne.mockResolvedValueOnce({ id: 'user-1', is_active: true });
      repositoryMock.save.mockResolvedValueOnce(undefined);
      const result = await service.deactivateUser('user-1');
      expect(result.message).toBeDefined();
      expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
    });

    it('rejects when already inactive', async () => {
      repositoryMock.findOne.mockResolvedValueOnce({ id: 'user-1', is_active: false });
      await expect(service.deactivateUser('user-1')).rejects.toThrow(CustomHttpException);
    });
  });

  describe('softDeleteUser', () => {
    it('calls softDelete when caller matches', async () => {
      repositoryMock.findOne.mockResolvedValueOnce({ id: 'user-1' });
      repositoryMock.softDelete.mockResolvedValueOnce(undefined);
      await service.softDeleteUser('user-1', 'user-1');
      expect(repositoryMock.softDelete).toHaveBeenCalledWith('user-1');
    });

    it('rejects when caller does not match', async () => {
      await expect(service.softDeleteUser('user-1', 'user-2')).rejects.toThrow(CustomHttpException);
    });
  });
});
