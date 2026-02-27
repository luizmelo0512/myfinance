import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class FriendDto {
   @IsString()
  @IsNotEmpty({ message: 'O ID do amigo é obrigatório.' })
  @ApiProperty({
    description: 'ID do amigo a ser adicionado.',
    example: 'uuid-do-amigo',
    required: true,
  })
  friendId: string;
}