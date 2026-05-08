import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Strategy } from '../../strategies/entities/strategy.entity';
import { FunnelStage } from '../../funnels/entities/funnel-stage.entity';

@Entity({ name: 'weekly_logs' })
@Index('IDX_weekly_logs_user_strategy_week', ['user_id', 'strategy_id', 'week_number'], { unique: true })
export class WeeklyLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: false })
  strategy_id: string;

  @ManyToOne(() => Strategy, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'strategy_id' })
  strategy: Strategy;

  @Column({ type: 'uuid', nullable: false })
  funnel_stage_id: string;

  @ManyToOne(() => FunnelStage, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'funnel_stage_id' })
  funnel_stage: FunnelStage;

  @Column({ type: 'smallint', nullable: false })
  week_number: number;

  @Column({ type: 'text', nullable: false })
  log_text: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  submitted_at: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;
}
