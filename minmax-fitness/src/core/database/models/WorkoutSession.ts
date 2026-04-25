/**
 * @module core/database/models/WorkoutSession
 * @description WatermelonDB model for the `workout_sessions` table.
 * Represents a single workout day within a program week.
 */

import { Model } from '@nozbe/watermelondb';
import {
  field,
  readonly,
  date,
  relation,
  children,
} from '@nozbe/watermelondb/decorators';
import { type Associations } from '@nozbe/watermelondb/Model';
import { TableName, type DaySplit } from '@core/types';

export default class WorkoutSession extends Model {
  static table = TableName.WORKOUT_SESSIONS;

  static associations: Associations = {
    [TableName.USERS]: {
      type: 'belongs_to' as const,
      key: 'user_id',
    },
    [TableName.PROGRAMS]: {
      type: 'belongs_to' as const,
      key: 'program_id',
    },
    [TableName.SET_LOGS]: {
      type: 'has_many' as const,
      foreignKey: 'workout_session_id',
    },
  };

  @field('user_id') declare userId: string;
  @field('program_id') declare programId: string;
  @field('week_number') declare weekNumber: number;
  @field('day_number') declare dayNumber: number;
  @field('day_split') declare daySplit: DaySplit;
  @date('completed_at') declare completedAt: Date | null;
  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;

  @relation(TableName.USERS, 'user_id')
  declare user: ReturnType<typeof relation>;

  @relation(TableName.PROGRAMS, 'program_id')
  declare program: ReturnType<typeof relation>;

  @children(TableName.SET_LOGS)
  declare setLogs: any;
}
