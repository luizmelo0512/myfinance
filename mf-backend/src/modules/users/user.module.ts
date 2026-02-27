import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller.js';
import { UserService } from './service/user.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../better-auth/entity/user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
