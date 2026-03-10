import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

export enum LedgerStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('ledgers') // Nome da tabela no banco
export class Ledger {
  @PrimaryGeneratedColumn('uuid')
  id: string; // ID padrao UUID

  @Column()
  title: string;

  @Column()
  ownerId: string; // Id do Usuario Logado que criou (UUID do Better Auth)

  @Column({ nullable: true })
  participantId: string; // ID do Betther Auth do participante

  @Column()
  targetName: string; // Nome/Apelido do usuario vinculado

  @Column({
    type: 'varchar',
    default: LedgerStatus.ACCEPTED,
  })
  status: LedgerStatus;

  @CreateDateColumn()
  createdAt: Date;

  // Um Ledger pode ter vários registros de pagamento ou empréstimo
  @OneToMany('Transaction', 'ledger')
  transactions: any[];
}
