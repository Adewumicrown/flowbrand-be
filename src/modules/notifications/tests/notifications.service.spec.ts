import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../entities/notifications.entity';
import { mockNotificationRepository } from './mocks/notification-repo.mock';
import { HttpStatus } from '@nestjs/common';
import { User } from '../../../modules/user/entities/user.entity';
import { EmailService } from '../../../modules/email/email.service';
import UserService from '../../../modules/user/user.service';
import { CreateNotificationForAllUsersDto } from '../dtos/create-notifiction-all-users.dto';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';

const mockEmailService = {
  sendNotificationMail: jest.fn(),
};

const mockUserService = {
  getUserRecord: jest.fn(),
};

const mockUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: Repository<Notification>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        { provide: EmailService, useValue: mockEmailService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGlobalNotifications', () => {
    const createNotificationDto = new CreateNotificationForAllUsersDto();
    createNotificationDto.message = 'Test notification';

    it('should create notifications for all users successfully', async () => {
      const users = [{ id: '1' }, { id: '2' }] as User[];
      const notifications = users.map(user => ({
        message: createNotificationDto.message,
        user,
      }));

      mockUserRepository.find.mockResolvedValue(users);
      mockNotificationRepository.create.mockImplementation(notification => notification);
      mockNotificationRepository.save.mockResolvedValue(notifications);

      const result = await service.createGlobalNotifications(createNotificationDto);

      expect(result).toEqual({
        status: 'success',
        message: 'Notification created successfully',
        data: null,
      });
      expect(mockUserRepository.find).toHaveBeenCalledTimes(1);
      expect(mockNotificationRepository.create).toHaveBeenCalledTimes(users.length);
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(notifications);
    });

    it('should propagate underlying error when notificationRepository.save fails', async () => {
      const users = [{ id: '1' }, { id: '2' }] as User[];
      mockUserRepository.find.mockResolvedValue(users);
      mockNotificationRepository.create.mockImplementation(notification => notification);
      const saveError = new Error('Failed to save notifications');
      mockNotificationRepository.save.mockRejectedValue(saveError);

      await expect(service.createGlobalNotifications(createNotificationDto)).rejects.toThrow(
        'Failed to save notifications'
      );

      expect(mockUserRepository.find).toHaveBeenCalledTimes(1);
      expect(mockNotificationRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
