import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notifications.entity';
import { AdminNotification } from './entities/admin-notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, AdminNotification, NotificationPreference])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [TypeOrmModule],
})
export class NotificationsModule {}
