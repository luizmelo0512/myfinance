import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { Ledger } from '../../ledgers/entity/ledger.entity.js';

export enum TransactionType {
  DEBT = 'DEBT', // Acrescentar ao montante
  PAYMENT = 'PAYMENT', // Descontar do montante
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Ledger, (ledger) => ledger.transactions, {
    onDelete: 'CASCADE',
  })
  ledger: Ledger;

  @RelationId((qtc: Transaction) => qtc.ledger)
  ledgerId: string;
}
