import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendController } from './controller/friend.controller.js';
import { Friend } from './entity/friend.entity.js';
import { FriendService } from './service/friend.service.js';
import { User } from '../better-auth/entity/user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Friend, User])],
  controllers: [FriendController],
  providers: [FriendService],
  exports: [FriendService],
})
export class FriendModule {}
