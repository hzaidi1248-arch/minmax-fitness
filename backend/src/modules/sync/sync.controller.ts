import { Controller, Get, Post, Body, Query, UseGuards, Request, UseFilters } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SyncService } from './sync.service';
import { SyncPushDto, SyncPullDto } from './dto/sync.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserIdThrottlerGuard } from '../../common/guards/user-id-throttler.guard';
import { PrismaExceptionFilter } from '../../common/filters/prisma-exception.filter';

@Controller('sync')
@UseGuards(JwtAuthGuard)
@UseFilters(PrismaExceptionFilter)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /** Legacy GET /sync (kept for backward compat) */
  @Get()
  async pull(@Request() req: any, @Query('lastPulledAt') lastPulledAt: string) {
    const userId = req.user.userId;
    const lastPulled = parseInt(lastPulledAt || '0', 10);
    return this.syncService.pullChanges(userId, lastPulled);
  }

  /** POST /sync/pull — WatermelonDB client convention */
  @Post('pull')
  async pullPost(@Request() req: any, @Body() dto: SyncPullDto) {
    const userId = req.user.userId;
    const lastPulled = dto.lastPulledAt ?? 0;
    return this.syncService.pullChanges(userId, lastPulled);
  }

  /** Legacy POST /sync (kept for backward compat) */
  @Post()
  @UseGuards(UserIdThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async push(@Request() req: any, @Body() syncPushDto: SyncPushDto) {
    const userId = req.user.userId;
    await this.syncService.pushChanges(userId, syncPushDto);
    return { status: 'ok' };
  }

  /** POST /sync/push — WatermelonDB client convention */
  @Post('push')
  @UseGuards(UserIdThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async pushPost(@Request() req: any, @Body() syncPushDto: SyncPushDto) {
    const userId = req.user.userId;
    await this.syncService.pushChanges(userId, syncPushDto);
    return { status: 'ok' };
  }
}
