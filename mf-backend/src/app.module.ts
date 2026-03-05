import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppService } from './app.service.js';
import { auth } from './auth/auth.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerModule } from './modules/ledgers/ledger.module.js';
import { TransactionModule } from './modules/transactions/transaction.module.js';
import { UserModule } from './modules/users/user.module.js';
import { FriendModule } from './modules/friends/friend.module.js';
// Importar entities explicitamente
import { User } from './modules/better-auth/entity/user.entity.js';
import { Account } from './modules/better-auth/entity/account.entity.js';
import { Session } from './modules/better-auth/entity/session.entity.js';
import { Friend } from './modules/friends/entity/friend.entity.js';
import { Ledger } from './modules/ledgers/entity/ledger.entity.js';
import { Transaction } from './modules/transactions/entity/transaction.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: false,
      entities: [User, Account, Session, Friend, Ledger, Transaction],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    AuthModule.forRoot({ auth }),
    UserModule,
    FriendModule,
    LedgerModule,
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
