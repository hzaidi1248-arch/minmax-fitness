import { Controller, Get, Post, Body, Query, UseGuards, Request, UseFilters } from '@nestjs/common';
import { Throttle, UseGuards as UseThrottlerGuard } from '@nestjs/throttler';
import { SyncService } from './sync.service';
import { SyncPushDto } from './dto/sync.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserIdThrottlerGuard } from '../../common/guards/user-id-throttler.guard';
import { PrismaExceptionFilter } from '../../common/filters/prisma-exception.filter';

@Controller('sync')
@UseGuards(JwtAuthGuard)
@UseFilters(PrismaExceptionFilter)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get()
  async pull(@Request() req: any, @Query('lastPulledAt') lastPulledAt: string) {
    const userId = req.user.userId;
    const lastPulled = parseInt(lastPulledAt || '0', 10);
    return this.syncService.pullChanges(userId, lastPulled);
  }

  @Post()
  @UseThrottlerGuard(UserIdThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async push(@Request() req: any, @Body() syncPushDto: SyncPushDto) {
    const userId = req.user.userId;
    await this.syncService.pushChanges(userId, syncPushDto);
    return { status: 'ok' };
  }
}
