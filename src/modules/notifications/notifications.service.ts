import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notifications.entity';
import { MarkNotificationAsReadDto } from './dtos/mark-notification-as-read.dto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateNotificationError } from './dtos/create-notification-error.dto';
import { CreateNotificationPropsDto } from './dtos/create-notification-props.dto';
import { CreateNotificationResponseDto } from './dtos/create-notification-response.dto';
import { CreateNotificationForAllUsersDto } from './dtos/create-notifiction-all-users.dto';
import UserInterface from '@modules/user/interfaces/UserInterface';
import { IMessageInterface } from '@modules/email/interface/message.interface';
import { EmailService } from '@modules/email/email.service';
import UserService from '@modules/user/user.service';
import { User } from '@modules/user/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    private emailService: EmailService,
    private readonly userService: UserService,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async createGlobalNotifications(dto: CreateNotificationForAllUsersDto) {
    /* Adding pagination for performance enhancement */
    let page = 0;
    const pageSize = 100;
    /* Only selecting the id for performance enhancement */
    const users = await this.userRepository.find({
      select: ['id'],
    });
    do {
      const notifications = users.map(user => {
        return this.notificationRepository.create({
          message: dto.message,
          user,
        });
      });
      await this.notificationRepository.save(notifications);
      page++;
    } while (users.length === pageSize);
    return {
      status: 'success',
      message: 'Notification created successfully',
      data: null,
    };
  }

  async getNotificationsForUser(userId: string, page: number, limit: number) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const [notifications, totalNotificationCount] = await this.notificationRepository.findAndCount({
        where: { user: { id: userId } },
        order: { created_at: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const totalUnreadNotificationCount = await this.notificationRepository.count({
        where: { user: { id: userId }, is_read: false },
      });

      return {
        totalNotificationCount,
        totalUnreadNotificationCount,
        notifications,
      };
    } catch (error) {
      Logger.error(
        `Failed to retrieve notifications for user with ID ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
        'NotificationsService'
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve notifications.');
    }
  }

  async getUnreadNotificationsForUser(userId: string, is_read: string) {
    if (is_read !== 'false') {
      throw new BadRequestException('Invalid value for is_read');
    }

    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const notifications = await this.notificationRepository.find({
        where: { user: { id: userId }, is_read: false },
        order: { created_at: 'DESC' },
      });

      const totalNotificationCount = await this.notificationRepository.count({ where: { user: { id: userId } } });
      const totalUnreadNotificationCount = notifications.length;

      return {
        totalNotificationCount,
        totalUnreadNotificationCount,
        notifications,
      };
    } catch (error) {
      if (
        error instanceof HttpException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
