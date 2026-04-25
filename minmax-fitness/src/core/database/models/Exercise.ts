/**
 * @module core/database/models/Exercise
 * @description WatermelonDB model for the `exercises` table.
 * This is the master exercise dictionary — immutable reference data.
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, children } from '@nozbe/watermelondb/decorators';
import { type Associations } from '@nozbe/watermelondb/Model';
import { TableName, type MuscleGroup } from '@core/types';

export default class Exercise extends Model {
  static table = TableName.EXERCISES;

  static associations: Associations = {
    [TableName.SET_LOGS]: {
      type: 'has_many' as const,
      foreignKey: 'exercise_id',
    },
  };

  @field('name') declare name: string;
  @field('muscle_group') declare muscleGroup: MuscleGroup;
  @field('is_compound') declare isCompound: boolean;
  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;

  @children(TableName.SET_LOGS)
  declare setLogs: ReturnType<typeof children>;
}
