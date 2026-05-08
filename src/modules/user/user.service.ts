import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { User } from './entities/user.entity';

@Injectable()
export default class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async deactivateUser(userId: string): Promise<{ status_code: number; message: string }> {
    const user = await this.getUserById(userId);
    if (!user.is_active) {
      throw new CustomHttpException(SYS_MSG.BAD_REQUEST, HttpStatus.BAD_REQUEST);
    }
    user.is_active = false;
    await this.userRepository.save(user);
    return {
      status_code: HttpStatus.OK,
      message: SYS_MSG.ACCOUNT_DEACTIVATED_SUCCESSFULLY,
    };
  }

  async softDeleteUser(userId: string, requesterId: string): Promise<{ status_code: number; message: string }> {
    if (userId !== requesterId) {
      throw new CustomHttpException(SYS_MSG.UNAUTHORISED_TOKEN, HttpStatus.UNAUTHORIZED);
    }
    await this.getUserById(userId);
    await this.userRepository.softDelete(userId);
    return {
      status_code: HttpStatus.OK,
      message: SYS_MSG.USER_DELETED,
    };
  }
}
