import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Strategy } from './entities/strategy.entity';
import { StrategyDocument } from './entities/strategy-document.entity';
import { TokenUsage } from './entities/token-usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Strategy, StrategyDocument, TokenUsage])],
  exports: [TypeOrmModule],
})
export class StrategiesModule {}
