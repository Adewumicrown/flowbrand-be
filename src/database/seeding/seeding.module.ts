import { Module } from '@nestjs/common';
import { SeedingController } from './seeding.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@modules/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [],
  controllers: [],
})
export class SeedingModule {}
