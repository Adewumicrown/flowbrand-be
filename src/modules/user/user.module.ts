import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import UserService from './user.service';
import { UserController } from './user.controller';
import { Profile } from '@modules/profile/entities/profile.entity';
import { User } from './entities/user.entity';

@Module({
  controllers: [UserController],
  providers: [UserService, Repository],
  imports: [TypeOrmModule.forFeature([User, Profile])],
  exports: [UserService],
})
export class UserModule {}
