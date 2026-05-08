import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'waitlist' })
export class Waitlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;
}
