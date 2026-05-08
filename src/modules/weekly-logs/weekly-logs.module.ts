import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeeklyLog } from './entities/weekly-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeeklyLog])],
  exports: [TypeOrmModule],
})
export class WeeklyLogsModule {}
