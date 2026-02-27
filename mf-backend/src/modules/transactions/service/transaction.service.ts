import { Injectable } from '@nestjs/common';
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

  async create(dto: CreateTransactionDto) {
    const transaction = this.repository.create({
      ...dto,
      ledger: { id: dto.ledgerId },
    });
    return await this.repository.save(transaction);
  }

  async findAllByLedger(ledgerId: string) {
    return await this.repository.find({
      where: { ledger: { id: ledgerId } },
      order: { createdAt: 'DESC' },
    });
  }
}
