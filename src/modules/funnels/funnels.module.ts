import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FunnelStage } from './entities/funnel-stage.entity';
import { FunnelTask } from './entities/funnel-task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FunnelStage, FunnelTask])],
  exports: [TypeOrmModule],
})
export class FunnelsModule {}
