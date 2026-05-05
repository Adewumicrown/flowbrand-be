import { Injectable, CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@modules/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const currentUserId = request.user.sub;
    return true;
  }
}
