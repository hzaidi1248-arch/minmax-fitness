/**
 * @module core/database/sync/syncConfig
 * @description WatermelonDB synchronization configuration.
 *
 * Implements the pull/push protocol for offline-first sync with the
 * NestJS backend. Uses WatermelonDB's built-in `synchronize()` which
 * handles conflict resolution, incremental sync, and batch operations.
 *
 * The sync endpoint must conform to the WatermelonDB sync protocol:
 * - POST /sync/pull  → returns { changes, timestamp }
 * - POST /sync/push  → accepts { changes, lastPulledAt }
 */

import { synchronize } from '@nozbe/watermelondb/sync';
import type { Database } from '@nozbe/watermelondb';
import { useAuthStore } from '@core/auth/authStore';

/** Base URL for the sync API. Configured via environment variable. */
const SYNC_API_URL: string =
  process.env.EXPO_PUBLIC_SYNC_API_URL ?? 'http://localhost:3000/api/sync';

/**
 * Executes a full bidirectional sync cycle with the backend.
 *
 * @param database - The WatermelonDB database instance to sync.
 * @returns A promise that resolves when sync completes successfully.
 * @throws Will throw if the network request fails or the server
 *         returns an invalid sync response.
 */
export async function performSync(database: Database): Promise<void> {
  await synchronize({
    database,

    pullChanges: async ({
      lastPulledAt,
      schemaVersion,
      migration,
    }: {
      lastPulledAt?: number;
      schemaVersion: number;
      migration: unknown;
    }) => {
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response: Response = await fetch(`${SYNC_API_URL}/pull`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ lastPulledAt, schemaVersion, migration }),
      });

      if (!response.ok) {
        throw new Error(
          `Sync pull failed with status ${String(response.status)}`
        );
      }

      const result: { changes: Record<string, unknown>; timestamp: number } =
        (await response.json()) as {
          changes: Record<string, unknown>;
          timestamp: number;
        };

      return result;
    },

    pushChanges: async ({
      changes,
      lastPulledAt,
    }: {
      changes: Record<string, unknown>;
      lastPulledAt: number;
    }) => {
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response: Response = await fetch(`${SYNC_API_URL}/push`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ changes, lastPulledAt }),
      });

      if (!response.ok) {
        throw new Error(
          `Sync push failed with status ${String(response.status)}`
        );
      }
    },
  });
}
