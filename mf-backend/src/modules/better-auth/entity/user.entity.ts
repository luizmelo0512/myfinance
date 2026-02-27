import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  emailVerified: boolean;

  @Column({ nullable: true })
  image?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos para facilitar buscas no NestJS
  @OneToMany('Account', 'user')
  accounts: any[];

  @OneToMany('Session', 'user')
  sessions: any[];
}
