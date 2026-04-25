/**
 * @module features/workout/prEngine
 * @description The Personal Record (PR) Calculation Engine.
 * 
 * Asynchronously checks if a newly logged set exceeds the historical
 * maximum Estimated 1-Rep Max (E1RM) for a given exercise.
 */

import { Q } from '@nozbe/watermelondb';
import database from '@core/database';
import { TableName } from '@core/types';
import type { SetLog } from '@core/database/models';
import { calculateE1rm } from '@core/math/strengthCalculations';

/**
 * Checks if a given weight and reps combination results in a new PR
 * for the specified exercise.
 *
 * @param exerciseId The UUID of the exercise.
 * @param newWeight The weight of the newly completed set.
 * @param newReps The reps of the newly completed set.
 * @returns true if the set is a new PR, false otherwise.
 */
export async function checkIfNewPR(
  exerciseId: string,
  newWeight: number,
  newReps: number
): Promise<boolean> {
  // If no weight or reps, it's not a PR.
  if (newWeight <= 0 || newReps <= 0) return false;

  const newE1RM = calculateE1rm({ weightKg: newWeight, reps: newReps });

  // Fetch all historical sets for this exercise
  const collection = database.get<SetLog>(TableName.SET_LOGS);
  
  // To avoid blocking the UI thread on massive datasets, we fetch only
  // the columns we need, or just fetch all if it's indexed. Since WatermelonDB
  // caches heavily, `fetch()` is very fast.
  const historicalSets = await collection
    .query(Q.where('exercise_id', exerciseId))
    .fetch();

  // If this is the very first set ever logged for this exercise, it's a PR.
  // Wait, if we just saved the new set, historicalSets includes it.
  // We need to compare against all sets EXCEPT the newly created one, OR just
  // check if the new E1RM is strictly greater than all other E1RMs.
  // Let's find the max E1RM of historical sets.
  
  let maxHistoricalE1RM = 0;
  let matchesForNewSet = 0; // count to handle if the query returns the newly saved set

  for (const set of historicalSets) {
    const setE1RM = calculateE1rm({ weightKg: set.weightKg ?? 0, reps: set.completedReps ?? 0 });
    
    // If we encounter a set exactly matching the new one, we skip it once
    // (assuming the newly created set is returned in the query).
    if (set.weightKg === newWeight && set.completedReps === newReps && matchesForNewSet === 0) {
      matchesForNewSet++;
      continue;
    }

    if (setE1RM > maxHistoricalE1RM) {
      maxHistoricalE1RM = setE1RM;
    }
  }

  // A PR occurs if the new E1RM strictly exceeds the maximum historical E1RM.
  // If it's the first set (max = 0), it's a PR.
  return newE1RM > maxHistoricalE1RM;
}
