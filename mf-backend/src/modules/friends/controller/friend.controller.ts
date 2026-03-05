import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { FriendService } from '../service/friend.service.js';

@Controller('friends')
@UseGuards(AuthGuard)
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('link')
  async linkUser(
    @Session() session: UserSession,
    @Body('email') email: string,
  ) {
    return this.friendService.linkUserByEmail(session.user.id, email);
  }

  @Get()
  async getFriends(@Session() session: UserSession) {
    const friends = await this.friendService.listFriends(session.user.id);
    return { friends };
  }
}
