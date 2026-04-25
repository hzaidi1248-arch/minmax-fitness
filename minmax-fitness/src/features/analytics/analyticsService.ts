/**
 * @module features/analytics/analyticsService
 * @description RxJS-based reactive data aggregators for the Analytics Dashboard.
 * 
 * Observes WatermelonDB queries and transforms raw SetLogs into structured
 * chart data for high-performance rendering via React Native Skia.
 */

import { Q } from '@nozbe/watermelondb';
import { switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import database from '@core/database';
import { TableName } from '@core/types';
import type { SetLog } from '@core/database/models';
import { calculateTonnage, calculateE1rm } from '@core/math/strengthCalculations';

// ─── Types ──────────────────────────────────────────────────────────

export interface VolumeDataPoint {
  readonly week: number;
  readonly muscleGroup: string;
  readonly tonnage: number;
}

export interface E1RMDataPoint {
  readonly week: number;
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly maxE1RM: number;
}

// ─── Aggregators ────────────────────────────────────────────────────

/**
 * Observes all set logs and aggregates total tonnage by week and muscle group.
 * Useful for stacked area charts.
 */
export function observeWeeklyVolumeTrend(): Observable<VolumeDataPoint[]> {
  const setsCollection = database.get<SetLog>(TableName.SET_LOGS);
  
  return setsCollection.query().observe().pipe(
    switchMap(async (sets) => {
      // Because we need relationships (Session for week, Exercise for muscleGroup),
      // and we want this to be fast, we'll fetch them.
      // In a production app with huge data, this would use a raw SQL query or 
      // observeWithColumns, but for MVP we resolve relations in-memory.
      const dataPoints: VolumeDataPoint[] = [];
      const aggregateMap = new Map<string, number>();

      for (const set of sets) {
        const session = await set.workoutSession.fetch();
        const exercise = await set.exercise.fetch();
        if (!session || !exercise) continue;

        const week = session.weekNumber;
        const mg = exercise.muscleGroup;
        const key = `${week}-${mg}`;
        
        const tonnage = calculateTonnage({ sets: 1, weightKg: set.weightKg ?? 0, reps: set.completedReps ?? 0 });
        
        aggregateMap.set(key, (aggregateMap.get(key) || 0) + tonnage);
      }

      for (const [key, tonnage] of aggregateMap.entries()) {
        const [weekStr = '0', muscleGroup = ''] = key.split('-');
        dataPoints.push({
          week: parseInt(weekStr, 10),
          muscleGroup,
          tonnage,
        });
      }

      return dataPoints.sort((a, b) => a.week - b.week);
    })
  );
}

/**
 * Observes maximum E1RM progression per week for specific exercises.
 * @param exerciseIds Array of exercise UUIDs to track (e.g. core lifts)
 */
export function observeE1RMTrend(exerciseIds: string[]): Observable<E1RMDataPoint[]> {
  if (exerciseIds.length === 0) return of([]);

  const setsCollection = database.get<SetLog>(TableName.SET_LOGS);
  
  return setsCollection.query(
    Q.where('exercise_id', Q.oneOf(exerciseIds))
  ).observe().pipe(
    switchMap(async (sets) => {
      const dataPoints: E1RMDataPoint[] = [];
      const aggregateMap = new Map<string, { e1rm: number; name: string }>();

      for (const set of sets) {
        const session = await set.workoutSession.fetch();
        const exercise = await set.exercise.fetch();
        if (!session || !exercise) continue;

        const week = session.weekNumber;
        const exId = exercise.id;
        const key = `${week}-${exId}`;
        
        const e1rm = calculateE1rm({ weightKg: set.weightKg ?? 0, reps: set.completedReps ?? 0 });
        
        const existing = aggregateMap.get(key);
        if (!existing || e1rm > existing.e1rm) {
          aggregateMap.set(key, { e1rm, name: exercise.name });
        }
      }

      for (const [key, data] of aggregateMap.entries()) {
        const [weekStr = '0', exerciseId = ''] = key.split('-');
        dataPoints.push({
          week: parseInt(weekStr, 10),
          exerciseId,
          exerciseName: data.name,
          maxE1RM: data.e1rm,
        });
      }

      return dataPoints.sort((a, b) => a.week - b.week);
    })
  );
}

/**
 * Observes the 3 most recently logged sets. 
 * (For a real "Trophy Room", we'd have a boolean `isPR` column, 
 * but for this MVP we just fetch recent sets).
 */
export function observeRecentPRs(): Observable<SetLog[]> {
  return database.get<SetLog>(TableName.SET_LOGS)
    .query(
      Q.sortBy('created_at', Q.desc),
      Q.take(3)
    ).observe();
}
