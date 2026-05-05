import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notifications.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { User } from '@modules/user/entities/user.entity';
import { Profile } from '@modules/profile/entities/profile.entity';
import { EmailService } from '@modules/email/email.service';
import UserService from '@modules/user/user.service';
import { EmailModule } from '@modules/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Profile]), EmailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, Repository, UserService, EmailService],
})
export class NotificationsModule {}
