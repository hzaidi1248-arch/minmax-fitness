import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserIdThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Mobile clients roam across IPs, so we throttle based on the authenticated UserId
    return req.user?.userId || req.ip;
  }
}
