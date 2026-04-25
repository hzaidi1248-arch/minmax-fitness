/**
 * @module core/database/seed
 * @description Idempotent seed script to inject the foundational blueprint
 * data (Programs and Exercises) into WatermelonDB on first launch.
 * Uses `database.batch()` for atomic, non-blocking writes.
 */

import { type Database } from '@nozbe/watermelondb';
import { TableName, MuscleGroup } from '@core/types';
import type { Program, Exercise } from './models';

// ─── Seed Data Constants ────────────────────────────────────────────

const MIN_MAX_PROGRAM = {
  name: '12-Week Min-Max Program 4x',
  durationWeeks: 12,
  daysPerWeek: 4,
  description: 'A 12-week hypertrophy and strength program spanning Upper/Lower splits, tracking E1RM, and utilizing auto-regulation techniques.',
};

/** 
 * Representative array of the 73 exercises from the Excel `_DropdownLists` sheet.
 * Categorized by muscle group and compound status.
 */
const EXERCISES_TO_SEED = [
  // CHEST
  { name: 'Barbell Bench Press', muscleGroup: MuscleGroup.CHEST, isCompound: true },
  { name: 'Dumbbell Incline Press', muscleGroup: MuscleGroup.CHEST, isCompound: true },
  { name: 'Flat Dumbbell Press', muscleGroup: MuscleGroup.CHEST, isCompound: true },
  { name: 'Cable Crossover', muscleGroup: MuscleGroup.CHEST, isCompound: false },
  // BACK
  { name: 'Pull-Up', muscleGroup: MuscleGroup.BACK, isCompound: true },
  { name: 'Barbell Row', muscleGroup: MuscleGroup.BACK, isCompound: true },
  { name: 'Lat Pulldown', muscleGroup: MuscleGroup.BACK, isCompound: true },
  { name: 'Y-Raise', muscleGroup: MuscleGroup.BACK, isCompound: false },
  { name: 'Chest-Supported Row', muscleGroup: MuscleGroup.BACK, isCompound: true },
  // QUADS
  { name: 'Barbell Back Squat', muscleGroup: MuscleGroup.QUADS, isCompound: true },
  { name: 'Leg Press', muscleGroup: MuscleGroup.QUADS, isCompound: true },
  { name: 'Bulgarian Split Squat', muscleGroup: MuscleGroup.QUADS, isCompound: true },
  { name: 'Leg Extension', muscleGroup: MuscleGroup.QUADS, isCompound: false },
  // HAMSTRINGS
  { name: 'Romanian Deadlift', muscleGroup: MuscleGroup.HAMSTRINGS, isCompound: true },
  { name: 'Seated Leg Curl', muscleGroup: MuscleGroup.HAMSTRINGS, isCompound: false },
  { name: 'Lying Leg Curl', muscleGroup: MuscleGroup.HAMSTRINGS, isCompound: false },
  // GLUTES
  { name: 'Barbell Hip Thrust', muscleGroup: MuscleGroup.GLUTES, isCompound: true },
  { name: 'Glute Kickback', muscleGroup: MuscleGroup.GLUTES, isCompound: false },
  // SHOULDERS
  { name: 'Overhead Press', muscleGroup: MuscleGroup.SHOULDERS, isCompound: true },
  { name: 'Seated DB Press', muscleGroup: MuscleGroup.SHOULDERS, isCompound: true },
  { name: 'Lateral Raise', muscleGroup: MuscleGroup.SHOULDERS, isCompound: false },
  { name: 'Cable Lateral Raise', muscleGroup: MuscleGroup.SHOULDERS, isCompound: false },
  { name: 'Face Pull', muscleGroup: MuscleGroup.SHOULDERS, isCompound: false },
  // BICEPS
  { name: 'Barbell Curl', muscleGroup: MuscleGroup.BICEPS, isCompound: false },
  { name: 'Incline Dumbbell Curl', muscleGroup: MuscleGroup.BICEPS, isCompound: false },
  { name: 'Hammer Curl', muscleGroup: MuscleGroup.BICEPS, isCompound: false },
  // TRICEPS
  { name: 'Triceps Pushdown', muscleGroup: MuscleGroup.TRICEPS, isCompound: false },
  { name: 'Overhead Triceps Extension', muscleGroup: MuscleGroup.TRICEPS, isCompound: false },
  { name: 'Skull Crusher', muscleGroup: MuscleGroup.TRICEPS, isCompound: false },
  // CALVES
  { name: 'Standing Calf Raise', muscleGroup: MuscleGroup.CALVES, isCompound: false },
  { name: 'Seated Calf Raise', muscleGroup: MuscleGroup.CALVES, isCompound: false },
  // ABS
  { name: 'Cable Crunch', muscleGroup: MuscleGroup.ABS, isCompound: false },
  { name: 'Hanging Leg Raise', muscleGroup: MuscleGroup.ABS, isCompound: false },
] as const;

// ─── Seed Execution ─────────────────────────────────────────────────

/**
 * Executes the database seed operation.
 * 
 * Idempotency: Checks if any programs exist. If so, skips seeding to
 * prevent duplicate data on subsequent app launches.
 * 
 * Performance: Wraps all creates in a single `database.batch()`
 * so the DB executes them atomically and only fires one UI update.
 * 
 * @param database - The WatermelonDB instance
 */
export async function seedDatabase(database: Database): Promise<void> {
  await database.write(async () => {
    const programsCollection = database.get<Program>(TableName.PROGRAMS);
    const existingProgramsCount = await programsCollection.query().fetchCount();
    
    // Idempotent check
    if (existingProgramsCount > 0) {
      return;
    }

    const exercisesCollection = database.get<Exercise>(TableName.EXERCISES);

    // Prepare Program record
    const programToCreate = programsCollection.prepareCreate((record) => {
      record.name = MIN_MAX_PROGRAM.name;
      record.durationWeeks = MIN_MAX_PROGRAM.durationWeeks;
      record.daysPerWeek = MIN_MAX_PROGRAM.daysPerWeek;
      record.description = MIN_MAX_PROGRAM.description;
    });

    // Prepare Exercise records
    const exercisesToCreate = EXERCISES_TO_SEED.map((ex) =>
      exercisesCollection.prepareCreate((record) => {
        record.name = ex.name;
        record.muscleGroup = ex.muscleGroup;
        record.isCompound = ex.isCompound;
      })
    );

    // Execute batch
    await database.batch(programToCreate, ...exercisesToCreate);
  });
}
