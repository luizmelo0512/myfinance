import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './controller/transaction.controller.js';
import { TransactionService } from './service/transaction.service.js';
import { Transaction } from './entity/transaction.entity.js';
import { LedgerModule } from '../ledgers/ledger.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    LedgerModule, // Importamos o módulo vizinho para usar o service dele
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
