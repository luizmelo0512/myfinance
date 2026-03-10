import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ledger, LedgerStatus } from '../entity/ledger.entity.js';
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
      // Se tem participante vinculado, fica pendente até o amigo aceitar
      status: createLedgerDto.participantId
        ? LedgerStatus.PENDING
        : LedgerStatus.ACCEPTED,
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

  // 4. Aceitar uma dívida (apenas o participante pode aceitar)
  async accept(id: string, userId: string) {
    const ledger = await this.ledgerRepository.findOne({ where: { id } });

    if (!ledger) throw new NotFoundException('Dívida não encontrada.');

    if (ledger.participantId !== userId) {
      throw new ForbiddenException('Apenas o participante pode aceitar esta dívida.');
    }

    if (ledger.status !== LedgerStatus.PENDING) {
      throw new ForbiddenException('Esta dívida não está pendente.');
    }

    ledger.status = LedgerStatus.ACCEPTED;
    return await this.ledgerRepository.save(ledger);
  }

  // 5. Recusar uma dívida (apenas o participante pode recusar)
  async reject(id: string, userId: string) {
    const ledger = await this.ledgerRepository.findOne({ where: { id } });

    if (!ledger) throw new NotFoundException('Dívida não encontrada.');

    if (ledger.participantId !== userId) {
      throw new ForbiddenException('Apenas o participante pode recusar esta dívida.');
    }

    if (ledger.status !== LedgerStatus.PENDING) {
      throw new ForbiddenException('Esta dívida não está pendente.');
    }

    ledger.status = LedgerStatus.REJECTED;
    return await this.ledgerRepository.save(ledger);
  }

  // 6. Deletar uma conta de dívida (apenas o owner)
  async delete(id: string, userId: string) {
    const ledger = await this.ledgerRepository.findOne({
      where: { id },
    });

    if (!ledger) {
      throw new NotFoundException('Dívida não encontrada.');
    }

    if (ledger.ownerId !== userId) {
      throw new NotFoundException(
        'Apenas o criador da dívida pode excluí-la.',
      );
    }

    await this.ledgerRepository.remove(ledger);
    return { message: 'Dívida excluída com sucesso.' };
  }
}
