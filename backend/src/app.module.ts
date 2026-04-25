import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { SyncModule } from './modules/sync/sync.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SyncModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
  ],
})
export class AppModule {}
