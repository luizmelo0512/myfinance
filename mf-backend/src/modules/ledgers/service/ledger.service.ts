import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ledger } from '../entity/ledger.entity.js';
import { CreateLedgerDto } from '../dto/create-ledger.dto.js';
import { TransactionType } from '../../transactions/entity/transaction.entity.js';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(Ledger)
    private readonly ledgerRepository: Repository<Ledger>,
  ) {}

  // 1. Criar uma nova conta de dívida
  async create(createLedgerDto: CreateLedgerDto, userId: string) {
    const ledger = this.ledgerRepository.create({
      ...createLedgerDto,
      ownerId: userId,
    });
    return await this.ledgerRepository.save(ledger);
  }

  // 2. Listar todas as contas onde o usuário está envolvido
  async findAll(userId: string) {
    return await this.ledgerRepository.find({
      where: [{ ownerId: userId }, { participantId: userId }],
      relations: ['transactions'], // Traz as transações para o cálculo
    });
  }

  // 3. Buscar uma conta específica e calcular o saldo total
  async findOneWithBalance(id: string, userId: string) {
    const ledger = await this.ledgerRepository.findOne({
      where: { id },
      relations: ['transactions'],
    });

    if (!ledger) throw new NotFoundException('Dívida não encontrada');

    // Validar se tem vinculo com a divida
    if (ledger.ownerId !== userId && ledger.participantId !== userId) {
      throw new NotFoundException(
        'Acesso negado, você não participa desta divida',
      );
    }

    // Lógica Matemática: Calcula o saldo a partir das transações
    const balance = ledger.transactions.reduce((acc, t) => {
      return t.type === TransactionType.DEBT
        ? acc + Number(t.amount)
        : acc - Number(t.amount);
    }, 0);

    return { ...ledger, balance };
  }
}
