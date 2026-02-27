import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  Session,
  AllowAnonymous,
  OptionalAuth,
  AuthGuard,
} from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { UserService } from '../service/user.service.js';

@Controller('users')
export class UserController {

  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  getProfile(@Session() session: UserSession) {
    return { user: session.user };
  }

  @UseGuards(AuthGuard)
  @Get('listUsers')
  async getAll(@Session() session: UserSession) {
    const users = await this.userService.findAll(session.user.id);
    console.log('Users found:', users);
    return { users};
  }

  @Get('public')
  @AllowAnonymous() // Allow anonymous access
  getPublic() {
    return { message: 'Public route' };
  }

  @Get('optional')
  @OptionalAuth() // Authentication is optional
  getOptional(@Session() session: UserSession) {
    return { authenticated: !!session };
  }
}
