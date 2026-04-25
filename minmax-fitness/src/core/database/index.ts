/**
 * @module core/database/index
 * @description WatermelonDB database instance initializer.
 * Creates and exports the singleton database connection configured
 * with the application schema and all registered models.
 *
 * Uses LokiJSAdapter for development/web and will be swapped to
 * SQLiteAdapter for native builds via platform-specific configuration.
 */

import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import schema from './schema';
import { allModels } from './models';

const adapter = new LokiJSAdapter({
  schema,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
});

const database = new Database({
  adapter,
  modelClasses: [...allModels],
});

export default database;
