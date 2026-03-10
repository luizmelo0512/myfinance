export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  transactionDate: string | null;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  ledgerId: string;
}

export enum TransactionType {
  DEBT = 'DEBT',
  PAYMENT = 'PAYMENT',
}

export enum LedgerStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface Ledger {
  id: string;
  title: string;
  ownerId: string;
  participantId: string | null;
  targetName: string;
  status: LedgerStatus;
  createdAt: string;
  transactions: Transaction[];
}

export interface LedgerWithBalance extends Ledger {
  balance: number;
}

export interface CreateLedgerRequest {
  title: string;
  targetName: string;
  participantId?: string;
}

export interface CreateTransactionRequest {
  amount: number;
  type: TransactionType;
  description?: string;
  ledgerId: string;
  transactionDate?: string;
}
