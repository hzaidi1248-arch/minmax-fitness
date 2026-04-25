/**
 * @module core/validation/schemas
 * @description Zod validation schemas for all data input boundaries.
 * These schemas validate data at the edge — user input, API responses,
 * and sync payloads — before it enters the domain logic layer.
 *
 * Each schema mirrors its corresponding TypeScript interface in
 * `core/types/database.ts` and enforces business-rule constraints
 * (e.g., weight > 0, reps >= 1, week 1–12).
 */

import { z } from 'zod';
import { SetType, MuscleGroup, DaySplit } from '@core/types';

// ─── Shared Primitives ──────────────────────────────────────────────

const positiveDecimal = z
  .number()
  .positive('Must be a positive number')
  .finite('Must be a finite number');

const positiveInteger = z
  .number()
  .int('Must be an integer')
  .positive('Must be a positive integer');

const nonNegativeInteger = z
  .number()
  .int('Must be an integer')
  .nonnegative('Must be zero or greater');

const uuidString = z.string().uuid('Must be a valid UUID');

// ─── Entity Schemas ─────────────────────────────────────────────────

export const BodyweightLogInputSchema = z.object({
  userId: uuidString,
  weightLbs: positiveDecimal.max(1500, 'Weight exceeds maximum'),
  loggedAt: z.number().positive('Timestamp must be positive'),
});

export const ExerciseInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(120, 'Name exceeds 120 characters'),
  muscleGroup: z.nativeEnum(MuscleGroup),
  isCompound: z.boolean(),
});

export const ProgramInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name exceeds 200 characters'),
  durationWeeks: positiveInteger.max(52, 'Duration exceeds 52 weeks'),
  daysPerWeek: positiveInteger.max(7, 'Days per week exceeds 7'),
  description: z.string(),
});

export const WorkoutSessionInputSchema = z.object({
  userId: uuidString,
  programId: uuidString,
  weekNumber: positiveInteger.max(52, 'Week number exceeds 52'),
  dayNumber: positiveInteger.max(7, 'Day number exceeds 7'),
  daySplit: z.nativeEnum(DaySplit),
  completedAt: z.number().positive().nullable(),
});

export const SetLogInputSchema = z.object({
  workoutSessionId: uuidString,
  exerciseId: uuidString,
  setOrder: positiveInteger,
  setType: z.nativeEnum(SetType),
  targetRir: nonNegativeInteger.max(10, 'RIR exceeds 10').nullable(),
  completedReps: positiveInteger.max(100, 'Reps exceed 100').nullable(),
  weightLbs: positiveDecimal.max(2000, 'Weight exceeds maximum').nullable(),
});

// ─── Inferred Types ─────────────────────────────────────────────────

export type BodyweightLogInput = z.infer<typeof BodyweightLogInputSchema>;
export type ExerciseInput = z.infer<typeof ExerciseInputSchema>;
export type ProgramInput = z.infer<typeof ProgramInputSchema>;
export type WorkoutSessionInput = z.infer<typeof WorkoutSessionInputSchema>;
export type SetLogInput = z.infer<typeof SetLogInputSchema>;
