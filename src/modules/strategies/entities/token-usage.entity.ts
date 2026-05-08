import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Strategy } from './strategy.entity';
import { AbstractBaseEntity } from '../../../entities/base.entity';

@Entity({ name: 'token_usage' })
export class TokenUsage extends AbstractBaseEntity {
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

  @Column({ type: 'integer', nullable: true })
  token_used: number;
}
