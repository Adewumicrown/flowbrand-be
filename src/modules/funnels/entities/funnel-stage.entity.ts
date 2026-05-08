import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Strategy } from '../../strategies/entities/strategy.entity';
import { AbstractBaseEntity } from '../../../entities/base.entity';

@Entity({ name: 'funnel_stages' })
@Index('IDX_funnel_stages_strategy_order', ['strategy_id', 'stage_order'], { unique: true })
export class FunnelStage extends AbstractBaseEntity {
  @Column({ type: 'uuid', nullable: false })
  strategy_id: string;

  @ManyToOne(() => Strategy, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'strategy_id' })
  strategy: Strategy;

  @Column({ type: 'smallint', nullable: false })
  stage_order: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  is_unlocked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;
}
