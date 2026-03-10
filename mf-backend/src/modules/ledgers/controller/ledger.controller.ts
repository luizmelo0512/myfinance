import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { LedgerService } from '../service/ledger.service.js';
import { CreateLedgerDto } from '../dto/create-ledger.dto.js';

@Controller('ledger')
@UseGuards(AuthGuard)
export class LedgerController {
  constructor(private readonly ledgersService: LedgerService) {}

  @Post()
  create(
    @Body() createLedgerDto: CreateLedgerDto,
    @Session() session: UserSession,
  ) {
    return this.ledgersService.create(createLedgerDto, session.user.id);
  }

  @Get()
  findAll(@Session() session: UserSession) {
    return this.ledgersService.findAll(session.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.ledgersService.findOneWithBalance(id, session.user.id);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @Session() session: UserSession) {
    return this.ledgersService.accept(id, session.user.id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Session() session: UserSession) {
    return this.ledgersService.reject(id, session.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Session() session: UserSession) {
    return this.ledgersService.delete(id, session.user.id);
  }
}
