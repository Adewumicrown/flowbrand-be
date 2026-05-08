import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { FunnelStage } from './funnel-stage.entity';
import { AbstractBaseEntity } from '../../../entities/base.entity';

@Entity({ name: 'funnel_tasks' })
export class FunnelTask extends AbstractBaseEntity {
  @Column({ type: 'uuid', nullable: false })
  funnel_stage_id: string;

  @ManyToOne(() => FunnelStage, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'funnel_stage_id' })
  funnel_stage: FunnelStage;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'smallint', nullable: true })
  task_order: number;

  @Column({ type: 'boolean', default: false })
  is_checked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  checked_at: Date | null;
}
