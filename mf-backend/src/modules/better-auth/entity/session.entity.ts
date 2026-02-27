import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity('session')
export class Session {
  @PrimaryColumn()
  id: string;

  @Column()
  token: string;

  @Column()
  expiresAt: Date;

  @Column({  nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamento com User
  @ManyToOne('User', 'sessions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: any;
}
