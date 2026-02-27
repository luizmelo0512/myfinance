import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLedgerDto {
  @IsString()
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @ApiProperty({
    description: 'Título da transação.',
    example: 'Emprestimo',
    required: true,
  })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'O nome/apelido da contraparte é necessário.' })
  @ApiProperty({
    description: 'Nome do participante da transação.',
    example: 'Pai',
  })
  targetName: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Id do participante da transação.',
    example: 'UUID do Participante',
  })
  participantId?: string;
}
