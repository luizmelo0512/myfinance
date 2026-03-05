import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { TransactionService } from '../service/transaction.service.js';
import { LedgerService } from '../../ledgers/service/ledger.service.js';
import { CreateTransactionDto } from '../dto/transaction.dto.js';

@Controller('transactions')
@UseGuards(AuthGuard)
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

    return this.transactionService.create(
      dto,
      session.user.id,
      session.user.name,
    );
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Session() session: UserSession,
  ) {
    return this.transactionService.delete(id, session.user.id);
  }
}
