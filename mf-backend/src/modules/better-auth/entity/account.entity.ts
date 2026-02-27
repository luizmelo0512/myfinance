import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity('account')
export class Account {
  @PrimaryColumn()
  id: string;

  @Column()
  userId: string;

  @Column()
  accountId: string;

  @Column()
  providerId: string;

  @Column({nullable: true })
  accessToken?: string;

  @Column({  nullable: true })
  refreshToken?: string;

  @Column({ nullable: true })
  accessTokenExpiresAt?: Date;

  @Column({  nullable: true })
  refreshTokenExpiresAt?: Date;

  @Column({ nullable: true })
  scope?: string;

  @Column({  nullable: true })
  idToken?: string;

  @Column({ nullable: true })
  password?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', 'accounts', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: any;
}
