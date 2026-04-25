/**
 * @module core/database/schema
 * @description WatermelonDB schema definition for the offline-first client database.
 *
 * This schema is the canonical definition of all local tables. Every column
 * is explicitly typed and indexed where appropriate for query performance.
 * Foreign keys are enforced via naming convention (`_id` suffix) which
 * WatermelonDB uses for its relation system.
 *
 * Schema version must be incremented for every structural change.
 * Corresponding migrations must be added to the migrations module.
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';
import { TableName } from '@core/types';

const schema = appSchema({
  version: 1,
  tables: [
    // ─── Users ────────────────────────────────────────────────
    tableSchema({
      name: TableName.USERS,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Bodyweight Logs ──────────────────────────────────────
    tableSchema({
      name: TableName.BODYWEIGHT_LOGS,
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'weight_kg', type: 'number' },
        { name: 'logged_at', type: 'number', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Exercises (Master Dictionary) ────────────────────────
    tableSchema({
      name: TableName.EXERCISES,
      columns: [
        { name: 'name', type: 'string' },
        { name: 'muscle_group', type: 'string', isIndexed: true },
        { name: 'is_compound', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Programs ─────────────────────────────────────────────
    tableSchema({
      name: TableName.PROGRAMS,
      columns: [
        { name: 'name', type: 'string' },
        { name: 'duration_weeks', type: 'number' },
        { name: 'days_per_week', type: 'number' },
        { name: 'description', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Workout Sessions ─────────────────────────────────────
    tableSchema({
      name: TableName.WORKOUT_SESSIONS,
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'program_id', type: 'string', isIndexed: true },
        { name: 'week_number', type: 'number', isIndexed: true },
        { name: 'day_number', type: 'number' },
        { name: 'day_split', type: 'string' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Set Logs (Core Transactional Table) ──────────────────
    tableSchema({
      name: TableName.SET_LOGS,
      columns: [
        { name: 'workout_session_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'set_order', type: 'number' },
        { name: 'set_type', type: 'string' },
        { name: 'target_rir', type: 'number', isOptional: true },
        { name: 'completed_reps', type: 'number', isOptional: true },
        { name: 'weight_kg', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

export default schema;
