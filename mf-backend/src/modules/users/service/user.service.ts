import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../better-auth/entity/user.entity.js';
import { Not, Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findAll(userId: string) {
    const users = await this.repository.find();
    return users;
  }
}
