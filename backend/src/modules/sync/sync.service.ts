import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SyncPushDto } from './dto/sync.dto';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pulls changes from the server that occurred after lastPulledAt.
   * Conforms to WatermelonDB's pullChanges spec.
   */
  async pullChanges(userId: string, lastPulledAt: number) {
    const timestamp = Date.now();
    const lastPulledBigInt = BigInt(lastPulledAt);

    // Tables to sync
    const tables = [
      'users',
      'bodyweight_logs',
      'exercises',
      'programs',
      'workout_sessions',
      'set_logs',
    ];

    const changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }> = {};

    for (const table of tables) {
      const prismaModel = this.getPrismaModel(table);
      
      // Query for created/updated records
      const records = await (this.prisma[prismaModel] as any).findMany({
        where: {
          OR: [
            { updatedAt: { gt: lastPulledBigInt } },
            { deletedAt: { gt: lastPulledBigInt } },
          ],
          // Filter by userId if the table has it
          ...(this.hasUserId(table) ? { userId } : {}),
        },
      });

      const created: any[] = [];
      const updated: any[] = [];
      const deleted: string[] = [];

      for (const record of records) {
        const formatted = this.formatRecordForClient(record);
        if (record.deletedAt && record.deletedAt > lastPulledBigInt) {
          deleted.push(record.id);
        } else if (record.createdAt > lastPulledBigInt) {
          created.push(formatted);
        } else {
          updated.push(formatted);
        }
      }

      changes[table] = { created, updated, deleted };
    }

    return { changes, timestamp };
  }

  /**
   * Pushes changes from the client to the server.
   * Wrapped in a transaction for atomicity with retry logic for deadlocks.
   */
  async pushChanges(userId: string, syncPushDto: SyncPushDto) {
    return this.withRetry(() => this.executePushTransaction(userId, syncPushDto));
  }

  private async executePushTransaction(userId: string, { changes, lastPulledAt }: SyncPushDto) {
    return this.prisma.$transaction(async (tx) => {
      for (const [table, delta] of Object.entries(changes as any)) {
        const prismaModel = this.getPrismaModel(table);
        const model = tx[prismaModel] as any;

        // Handle Created/Updated
        const allUpserts = [...(delta.created || []), ...(delta.updated || [])];
        for (const record of allUpserts) {
          const data = this.formatRecordForServer(record, table, userId);
          
          await model.upsert({
            where: { id: record.id },
            update: data,
            create: { ...data, id: record.id },
          });
                

        // Handle Deleted (Soft Delete)
        if (delta.deleted && delta.deleted.length > 0) {
          await model.updateMany({
            where: {
              id: { in: delta.deleted },
              ...(this.hasUserId(table) ? { userId } : {}),
            },
            data: {
              deletedAt: BigInt(Date.now()),
              updatedAt: BigInt(Date.now()),
            },
          });
        }
      }
    });
  }

  /**
   * Helper to retry Prisma transactions on deadlocks or timeouts.
   */
  private async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        // P2034: Transaction failed due to a write conflict or deadlock
        // P2028: Transaction API timeout
        if (error.code === 'P2034' || error.code === 'P2028') {
          const delay = Math.random() * (500 - 100) + 100; // Jittered 100ms-500ms
          console.warn(`[SyncService] Transaction conflict (code: ${error.code}). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${retries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error; // Not a retryable error
      }
    }
    throw lastError;
  }

  private getPrismaModel(tableName: string): string {
    const mapping: Record<string, string> = {
      users: 'user',
      bodyweight_logs: 'bodyweightLog',
      exercises: 'exercise',
      programs: 'program',
      workout_sessions: 'workoutSession',
      set_logs: 'setLog',
    };
    return mapping[tableName] || tableName;
  }

  private hasUserId(tableName: string): boolean {
    return ['users', 'bodyweight_logs', 'workout_sessions'].includes(tableName);
  }

  private formatRecordForClient(record: any) {
    const formatted = { ...record };
    // Convert BigInt to Number for JSON serialization
    for (const key in formatted) {
      if (typeof formatted[key] === 'bigint') {
        formatted[key] = Number(formatted[key]);
      }
    }
    return formatted;
  }

  private formatRecordForServer(record: any, table: string, userId: string) {
    const data = { ...record };
    delete data.id; // ID handled by upsert where/create

    // Enforce userId on specific tables
    if (this.hasUserId(table)) {
      data.userId = userId;
    }

    // Convert numeric timestamps to BigInt
    if (data.createdAt) data.createdAt = BigInt(data.createdAt);
    if (data.updatedAt) data.updatedAt = BigInt(data.updatedAt);
    if (data.loggedAt) data.loggedAt = BigInt(data.loggedAt);
    if (data.completedAt) data.completedAt = BigInt(data.completedAt);

    return data;
  }
}
