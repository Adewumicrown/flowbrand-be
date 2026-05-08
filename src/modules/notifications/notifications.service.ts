import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { Notification } from './entities/notifications.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>
  ) {}

  async listForUser(userId: string, page: number, limit: number) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const unread = await this.notificationRepository.count({ where: { user_id: userId, is_read: false } });
    return {
      status_code: HttpStatus.OK,
      message: SYS_MSG.REQUEST_SUCCESSFUL,
      data: {
        total_notification_count: total,
        total_unread_notification_count: unread,
        current_page: page,
        total_pages: Math.ceil(total / Math.max(limit, 1)),
        notifications,
      },
    };
  }

  async markRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({ where: { id: notificationId } });
    if (!notification || notification.user_id !== userId) {
      throw new CustomHttpException(SYS_MSG.RESOURCE_NOT_FOUND('Notification'), HttpStatus.NOT_FOUND);
    }
    notification.is_read = true;
    notification.read_at = new Date();
    await this.notificationRepository.save(notification);
    return {
      status_code: HttpStatus.OK,
      message: SYS_MSG.REQUEST_SUCCESSFUL,
      data: { id: notification.id, is_read: notification.is_read, read_at: notification.read_at },
    };
  }
}
