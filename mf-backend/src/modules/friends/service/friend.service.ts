import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friend } from '../entity/friend.entity.js';
import { User } from '../../better-auth/entity/user.entity.js';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendRepository: Repository<Friend>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async linkUserByEmail(userId: string, targetEmail: string) {
    if (!targetEmail) {
      throw new BadRequestException('Email é obrigatório.');
    }

    const targetUser = await this.userRepository.findOne({
      where: { email: targetEmail },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuário não encontrado com este e-mail.');
    }

    if (targetUser.id === userId) {
      throw new BadRequestException('Você não pode vincular a si mesmo.');
    }

    // Verifica se já existe o vínculo
    const existingFriend = await this.friendRepository.findOne({
      where: { userId, friendId: targetUser.id },
    });

    if (existingFriend) {
      return { message: 'Usuário já está vinculado.', friend: existingFriend };
    }

    // Cria o vínculo (Apenas unidirecional para a lista do usuário que solicitou, ou bidirecional se preferir. Aqui faremos unidirecional para refletir a agenda pessoal)
    const newFriend = this.friendRepository.create({
      userId,
      friendId: targetUser.id,
    });

    await this.friendRepository.save(newFriend);

    return { message: 'Usuário vinculado com sucesso!', friend: newFriend };
  }

  async listFriends(userId: string) {
    // Busca todos os vínculos onde o usuário é o dono da lista
    const friendships = await this.friendRepository.find({
      where: { userId },
      relations: ['friend'], // Carrega os dados do amigo
    });

    // Retorna apenas os objetos do tipo User para o frontend
    return friendships.map((f) => f.friend);
  }
}
