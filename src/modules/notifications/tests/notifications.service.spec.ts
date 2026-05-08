import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { Notification } from '../entities/notifications.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationsService } from '../notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const repositoryMock = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, { provide: getRepositoryToken(Notification), useValue: repositoryMock }],
    }).compile();
    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listForUser', () => {
    it('returns paginated notifications and unread count', async () => {
      const sample = [
        { id: 'n-1', user_id: 'u-1', type: NotificationType.SYSTEM, title: 't', body: 'b', is_read: false },
      ];
      repositoryMock.findAndCount.mockResolvedValueOnce([sample, 1]);
      repositoryMock.count.mockResolvedValueOnce(1);

      const result = await service.listForUser('u-1', 1, 10);

      expect(result.data.total_notification_count).toBe(1);
      expect(result.data.total_unread_notification_count).toBe(1);
      expect(result.data.notifications).toEqual(sample);
    });
  });

  describe('markRead', () => {
    it('marks the notification as read when ownership matches', async () => {
      repositoryMock.findOne.mockResolvedValueOnce({ id: 'n-1', user_id: 'u-1', is_read: false });
      repositoryMock.save.mockResolvedValueOnce(undefined);

      const result = await service.markRead('n-1', 'u-1');

      expect(result.data.is_read).toBe(true);
      expect(result.data.read_at).toBeInstanceOf(Date);
    });

    it('rejects when ownership does not match', async () => {
      repositoryMock.findOne.mockResolvedValueOnce({ id: 'n-1', user_id: 'someone-else' });
      await expect(service.markRead('n-1', 'u-1')).rejects.toThrow(CustomHttpException);
    });

    it('rejects when notification missing', async () => {
      repositoryMock.findOne.mockResolvedValueOnce(null);
      await expect(service.markRead('n-1', 'u-1')).rejects.toThrow(CustomHttpException);
    });
  });
});
