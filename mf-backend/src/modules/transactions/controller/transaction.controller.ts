import { Controller, Post, Body, ForbiddenException } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { TransactionService } from '../service/transaction.service.js';
import { LedgerService } from '../../ledgers/service/ledger.service.js';
import { CreateTransactionDto } from '../dto/transaction.dto.js';

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly ledgerService: LedgerService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateTransactionDto,
    @Session() session: UserSession,
  ) {
    // Validação de segurança: o Ledger pertence a quem está logado?
    const ledger = await this.ledgerService.findOneWithBalance(
      dto.ledgerId,
      session.user.id,
    );

    if (!ledger) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar esta conta.',
      );
    }

    return this.transactionService.create(dto);
  }
}
