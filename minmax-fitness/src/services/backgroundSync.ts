/**
 * @module services/backgroundSync
 * @description Background synchronization service for the mobile client.
 * Registers a background task to keep the local WatermelonDB in sync.
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { performSync } from '@core/database/sync/syncConfig';
import database from '@core/database';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC';

/**
 * Task handler that WatermelonDB will run periodically.
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('[BackgroundSync] Triggering sync...');
    await performSync(database);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[BackgroundSync] Sync failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registers the background sync task.
 * Recommended to call this once during app initialization.
 */
export async function registerBackgroundSync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('[BackgroundSync] Task registered successfully');
    }
  } catch (error) {
    console.error('[BackgroundSync] Task registration failed:', error);
  }
}
