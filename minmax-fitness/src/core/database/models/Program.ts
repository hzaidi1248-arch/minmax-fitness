/**
 * @module core/database/models/Program
 * @description WatermelonDB model for the `programs` table.
 * Defines training program metadata (e.g. the 12-week Min-Max block).
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, children } from '@nozbe/watermelondb/decorators';
import { type Associations } from '@nozbe/watermelondb/Model';
import { TableName } from '@core/types';

export default class Program extends Model {
  static table = TableName.PROGRAMS;

  static associations: Associations = {
    [TableName.WORKOUT_SESSIONS]: {
      type: 'has_many' as const,
      foreignKey: 'program_id',
    },
  };

  @field('name') declare name: string;
  @field('duration_weeks') declare durationWeeks: number;
  @field('days_per_week') declare daysPerWeek: number;
  @field('description') declare description: string;
  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;

  @children(TableName.WORKOUT_SESSIONS)
  declare workoutSessions: ReturnType<typeof children>;
}
