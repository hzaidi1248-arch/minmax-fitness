/**
 * @module core/database/models/User
 * @description WatermelonDB model for the `users` table.
 */

import { Model } from '@nozbe/watermelondb';
import { readonly, date, children } from '@nozbe/watermelondb/decorators';
import { type Associations } from '@nozbe/watermelondb/Model';
import { TableName } from '@core/types';

export default class User extends Model {
  static table = TableName.USERS;

  static associations: Associations = {
    [TableName.BODYWEIGHT_LOGS]: {
      type: 'has_many' as const,
      foreignKey: 'user_id',
    },
    [TableName.WORKOUT_SESSIONS]: {
      type: 'has_many' as const,
      foreignKey: 'user_id',
    },
  };

  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;

  @children(TableName.BODYWEIGHT_LOGS)
  declare bodyweightLogs: ReturnType<typeof children>;

  @children(TableName.WORKOUT_SESSIONS)
  declare workoutSessions: ReturnType<typeof children>;
}
