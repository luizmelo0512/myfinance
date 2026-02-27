import { Transaction } from '../../transactions/entity/transaction.entity.js';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('friends') // Nome da tabela no banco
@Index(['userId', 'friendId'], { unique: true }) // Garante que a combinação de userId e friendId seja única
export class Friend {
  @PrimaryGeneratedColumn('uuid')
  id: string; // ID padrao UUID

  @Column()
  userId: string; // Id do Usuario

  @Column()
  friendId: string; // Id do Amigo

  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user: any;

  @ManyToOne('User')
  @JoinColumn({ name: 'friendId' })
  friend: any;
}
