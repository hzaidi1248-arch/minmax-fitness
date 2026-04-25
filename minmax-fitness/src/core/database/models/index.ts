/**
 * @module core/database/models/index
 * @description Barrel export for all WatermelonDB models.
 * Used by the database initializer to register models.
 */

export { default as User } from './User';
export { default as BodyweightLog } from './BodyweightLog';
export { default as Exercise } from './Exercise';
export { default as Program } from './Program';
export { default as WorkoutSession } from './WorkoutSession';
export { default as SetLog } from './SetLog';

/**
 * Array of all model classes — required by WatermelonDB's
 * `Database` constructor for model registration.
 */
import User from './User';
import BodyweightLog from './BodyweightLog';
import Exercise from './Exercise';
import Program from './Program';
import WorkoutSession from './WorkoutSession';
import SetLog from './SetLog';

export const allModels = [
  User,
  BodyweightLog,
  Exercise,
  Program,
  WorkoutSession,
  SetLog,
] as const;
