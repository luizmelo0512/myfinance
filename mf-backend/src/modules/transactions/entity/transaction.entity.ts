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

  // Data da movimentação (quando o evento realmente aconteceu)
  @Column({ type: 'timestamp', nullable: true })
  transactionDate: Date;

  // Auditoria: quem registrou esta transação
  @Column({ nullable: true })
  createdById: string;

  @Column({ nullable: true })
  createdByName: string;

  // Data de inserção no sistema (automática)
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Ledger, (ledger) => ledger.transactions, {
    onDelete: 'CASCADE',
  })
  ledger: Ledger;

  @RelationId((qtc: Transaction) => qtc.ledger)
  ledgerId: string;
}
