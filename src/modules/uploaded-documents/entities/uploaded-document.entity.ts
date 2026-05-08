import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'uploaded_documents' })
export class UploadedDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file_name: string;

  @Column({ type: 'integer', nullable: true })
  file_size_kb: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  file_type: string;

  @Column({ type: 'text', nullable: true })
  storage_path: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;
}
