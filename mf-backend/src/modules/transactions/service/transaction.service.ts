import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entity/transaction.entity.js';
import { CreateTransactionDto } from '../dto/transaction.dto.js';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  async create(dto: CreateTransactionDto, userId: string, userName: string) {
    const transaction = this.repository.create({
      ...dto,
      ledger: { id: dto.ledgerId },
      transactionDate: dto.transactionDate
        ? new Date(dto.transactionDate)
        : new Date(),
      createdById: userId,
      createdByName: userName,
    });
    return await this.repository.save(transaction);
  }

  async findAllByLedger(ledgerId: string) {
    return await this.repository.find({
      where: { ledger: { id: ledgerId } },
      order: { createdAt: 'DESC' },
    });
  }

  async delete(transactionId: string, userId: string) {
    const transaction = await this.repository.findOne({
      where: { id: transactionId },
      relations: ['ledger'],
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada.');
    }

    // Verificar se o usuário é dono ou participante do ledger
    if (
      transaction.ledger.ownerId !== userId &&
      transaction.ledger.participantId !== userId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta transação.',
      );
    }

    await this.repository.remove(transaction);
    return { message: 'Transação excluída com sucesso.' };
  }
}
