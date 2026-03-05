import {
  IsNumber,
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { TransactionType } from '../entity/transaction.entity.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @IsNumber()
  @ApiProperty({
    description: 'Valor da Transação',
    example: 150.0,
    required: true,
  })
  amount: number;

  @IsEnum(TransactionType)
  @ApiProperty({
    description: 'Tipo da Transação',
    example: TransactionType.DEBT,
  })
  type: TransactionType; // 'DEBT' ou 'PAYMENT'

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Descrição da Transação',
    example: 'Emprestimo com meu pai',
  })
  description?: string;

  @IsUUID()
  @ApiProperty({
    description: 'Id da Divida',
    example: 'UUID da Divida',
  })
  ledgerId: string; // ID da dívida à qual esta transação pertence

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Data da movimentação (quando o evento aconteceu). Se não informar, usa a data atual.',
    example: '2026-01-15',
  })
  transactionDate?: string;
}
