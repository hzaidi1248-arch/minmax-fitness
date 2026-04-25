/**
 * @module core/types/database
 * @description Canonical type definitions for all database entities.
 * These types are the single source of truth for data shapes across
 * the entire client application. They mirror the WatermelonDB schema
 * and the Prisma backend schema.
 */

// ─── Enums ──────────────────────────────────────────────────────────

export enum SetType {
  WARM_UP = 'WARM_UP',
  WORKING = 'WORKING',
}

export enum MuscleGroup {
  QUADS = 'QUADS',
  HAMSTRINGS = 'HAMSTRINGS',
  GLUTES = 'GLUTES',
  CHEST = 'CHEST',
  BACK = 'BACK',
  SHOULDERS = 'SHOULDERS',
  BICEPS = 'BICEPS',
  TRICEPS = 'TRICEPS',
  CALVES = 'CALVES',
  FOREARMS = 'FOREARMS',
  ABS = 'ABS',
}

export enum DaySplit {
  FULL_BODY = 'FULL_BODY',
  UPPER = 'UPPER',
  LOWER = 'LOWER',
  ARMS_DELTS = 'ARMS_DELTS',
}

// ─── Entity Interfaces ─────────────────────────────────────────────

export interface UserRecord {
  readonly id: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface BodyweightLogRecord {
  readonly id: string;
  readonly userId: string;
  readonly weightKg: number;
  readonly loggedAt: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface ExerciseRecord {
  readonly id: string;
  readonly name: string;
  readonly muscleGroup: MuscleGroup;
  readonly isCompound: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface ProgramRecord {
  readonly id: string;
  readonly name: string;
  readonly durationWeeks: number;
  readonly daysPerWeek: number;
  readonly description: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface WorkoutSessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly programId: string;
  readonly weekNumber: number;
  readonly dayNumber: number;
  readonly daySplit: DaySplit;
  readonly completedAt: number | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface SetLogRecord {
  readonly id: string;
  readonly workoutSessionId: string;
  readonly exerciseId: string;
  readonly setOrder: number;
  readonly setType: SetType;
  readonly targetRir: number | null;
  readonly completedReps: number | null;
  readonly weightKg: number | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

// ─── Table Name Constants ───────────────────────────────────────────

export const TableName = {
  USERS: 'users',
  BODYWEIGHT_LOGS: 'bodyweight_logs',
  EXERCISES: 'exercises',
  PROGRAMS: 'programs',
  WORKOUT_SESSIONS: 'workout_sessions',
  SET_LOGS: 'set_logs',
} as const;

export type TableNameValue = typeof TableName[keyof typeof TableName];
