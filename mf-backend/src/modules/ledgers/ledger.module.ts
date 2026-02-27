import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerController } from './controller/ledger.controller.js';
import { LedgerService } from './service/ledger.service.js';
import { Ledger } from './entity/ledger.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ledger])],
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
