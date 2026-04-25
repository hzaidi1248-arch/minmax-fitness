/**
 * @module core/database/models/BodyweightLog
 * @description WatermelonDB model for the `bodyweight_logs` table.
 */

import { Model } from '@nozbe/watermelondb';
import {
  field,
  readonly,
  date,
  relation,
} from '@nozbe/watermelondb/decorators';
import { type Associations } from '@nozbe/watermelondb/Model';
import { TableName } from '@core/types';

export default class BodyweightLog extends Model {
  static table = TableName.BODYWEIGHT_LOGS;

  static associations: Associations = {
    [TableName.USERS]: {
      type: 'belongs_to' as const,
      key: 'user_id',
    },
  };

  @field('user_id') declare userId: string;
  @field('weight_kg') declare weightKg: number;
  @date('logged_at') declare loggedAt: Date;
  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;

  @relation(TableName.USERS, 'user_id')
  declare user: any;
}
