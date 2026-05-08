import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { AbstractBaseEntity } from '../../../entities/base.entity';

@Entity({ name: 'strategies' })
export class Strategy extends AbstractBaseEntity {
  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 200, default: 'My Marketing Strategy' })
  title: string;

  @Column({ type: 'text', nullable: true })
  ai_prompt_used: string | null;

  @Column({ type: 'text', nullable: true })
  ai_raw_output: string | null;

  @Column({ type: 'integer', default: 0 })
  request_count: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'boolean', default: false })
  is_paid: boolean;
}
