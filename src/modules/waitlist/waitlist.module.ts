import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Waitlist } from './entities/waitlist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Waitlist])],
  exports: [TypeOrmModule],
})
export class WaitlistModule {}
