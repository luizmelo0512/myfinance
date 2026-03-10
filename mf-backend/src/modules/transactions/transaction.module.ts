import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './controller/transaction.controller.js';
import { TransactionService } from './service/transaction.service.js';
import { Transaction } from './entity/transaction.entity.js';
import { Ledger } from '../ledgers/entity/ledger.entity.js';
import { LedgerModule } from '../ledgers/ledger.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Ledger]),
    LedgerModule, // Needed for TransactionController which injects LedgerService
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
