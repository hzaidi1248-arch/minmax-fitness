/**
 * @module core/database/models/SetLog
 * @description WatermelonDB model for the `set_logs` table.
 * This is the core transactional table — every individual set performed
 * in every workout is recorded here. This is the primary data source
 * for all analytics computations.
 */

import { Model } from '@nozbe/watermelondb';
import {
  field,
  readonly,
  date,
  relation,
} from '@nozbe/watermelondb/decorators';
import { type Associations } from '@nozbe/watermelondb/Model';
import { TableName, type SetType } from '@core/types';

export default class SetLog extends Model {
  static table = TableName.SET_LOGS;

  static associations: Associations = {
    [TableName.WORKOUT_SESSIONS]: {
      type: 'belongs_to' as const,
      key: 'workout_session_id',
    },
    [TableName.EXERCISES]: {
      type: 'belongs_to' as const,
      key: 'exercise_id',
    },
  };

  @field('workout_session_id') declare workoutSessionId: string;
  @field('exercise_id') declare exerciseId: string;
  @field('set_order') declare setOrder: number;
  @field('set_type') declare setType: SetType;
  @field('target_rir') declare targetRir: number | null;
  @field('completed_reps') declare completedReps: number | null;
  @field('weight_kg') declare weightKg: number | null;
  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;

  @relation(TableName.WORKOUT_SESSIONS, 'workout_session_id')
  declare workoutSession: any;

  @relation(TableName.EXERCISES, 'exercise_id')
  declare exercise: any;
}
