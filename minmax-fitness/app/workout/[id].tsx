/**
 * @module app/workout/[id]
 * @description Active workout session screen.
 * 
 * Core transactional loop: bridges WatermelonDB and Zustand.
 * - Hydrates Zustand on mount
 * - Allows adding exercises via the ExercisePicker bottom sheet
 * - Tracks sets via the NumericKeypad buffer
 * - Commits sets asynchronously to DB via ActionSwipe
 * - Cleans up state strictly on unmount
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Q } from '@nozbe/watermelondb';

import database from '@core/database';
import { TableName, SetType } from '@core/types';
import type { WorkoutSession, SetLog, Exercise } from '@core/database/models';

import { useTheme } from '@ui/theme';
import { Typography, ActionSwipe, NumericKeypad } from '@ui/primitives';
import { useWorkoutStore, selectParsedWeight, selectParsedReps } from '@store/workoutStore';
import ExercisePicker, { type ExercisePickerRef } from '@features/workout/components/ExercisePicker';
import { checkIfNewPR } from '@features/workout/prEngine';
import { startResilientRestTimer } from '@services/timerService';
import { formatWeight, lbsToKg } from '@core/math/units';

export default function WorkoutSessionScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  // ─── Local DB State ───────────────────────────────────────────────

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Zustand State ────────────────────────────────────────────────

  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const logSetStore = useWorkoutStore((s) => s.logSet);
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const enqueuePRCelebration = useWorkoutStore((s) => s.enqueuePRCelebration);
  
  const setActiveField = useWorkoutStore((s) => s.setActiveField);
  const activeField = useWorkoutStore((s) => s.activeField);
  
  const weightInput = useWorkoutStore((s) => s.weightInput);
  const repsInput = useWorkoutStore((s) => s.repsInput);
  const parsedWeight = useWorkoutStore(selectParsedWeight);
  const parsedReps = useWorkoutStore(selectParsedReps);
  const isMetric = useWorkoutStore((s) => s.isMetric);

  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const pickerRef = useRef<ExercisePickerRef>(null);

  // ─── Lifecycle & Hydration ────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const sessionRecord = await database.get<WorkoutSession>(TableName.WORKOUT_SESSIONS).find(id);
        if (!isMounted) return;
        setSession(sessionRecord);

        // Load exercises for this session (for this demo, we'll just track active exercises locally)
        // In a real app, we'd query SetLogs and extract unique Exercise IDs
        const setLogs = await sessionRecord.setLogs.fetch();
        const exerciseIds = Array.from(new Set(setLogs.map(s => s.exerciseId)));
        
        if (exerciseIds.length > 0) {
          const exercisesList = await database.get<Exercise>(TableName.EXERCISES)
            .query(Q.where('id', Q.oneOf(exerciseIds)))
            .fetch();
          if (isMounted) setExercises(exercisesList);
        }

        // Hydrate Zustand
        startWorkout(id);
        setLoading(false);

      } catch (err) {
        if (!isMounted) return;
        Alert.alert('Error', 'Workout session not found.');
        router.back();
      }
    }

    void loadSession();

    // Clean up all Zustand transient state on unmount
    return () => {
      isMounted = false;
      finishWorkout();
    };
  }, [id]);

  // ─── Transactional Operations ─────────────────────────────────────

  const handleAddExercise = useCallback(async (exerciseId: string) => {
    const exercise = await database.get<Exercise>(TableName.EXERCISES).find(exerciseId);
    setExercises((prev) => {
      if (prev.some((e) => e.id === exerciseId)) return prev;
      return [...prev, exercise];
    });
    setActiveExerciseId(exerciseId);
    setActiveField('weight');
  }, [setActiveField]);

  const commitSet = useCallback(async () => {
    if (!session || !activeExerciseId || !parsedWeight || !parsedReps) return;

    const finalWeightKg = isMetric ? parsedWeight : lbsToKg(parsedWeight);

    try {
      let newSetId = '';
      await database.write(async () => {
        const newSet = await database.get<SetLog>(TableName.SET_LOGS).create((record) => {
          record.workoutSession.set(session);
          record.exercise.id = activeExerciseId;
          record.setOrder = 1; // Simplification for MVP
          record.setType = SetType.WORKING;
          record.completedReps = parsedReps;
          record.weightKg = finalWeightKg;
        });
        newSetId = newSet.id;
      });

      logSetStore(newSetId);
      startResilientRestTimer(120); // 2 minutes rest
      
      // Async PR check (doesn't block UI)
      checkIfNewPR(activeExerciseId, finalWeightKg, parsedReps).then((isPR) => {
        if (isPR) enqueuePRCelebration(activeExerciseId);
      });
      
      Alert.alert('Success', `Logged ${formatWeight(finalWeightKg, isMetric)} × ${parsedReps} reps.`);
      
    } catch (e) {
      Alert.alert('Error', 'Failed to log set to database.');
    }
  }, [session, activeExerciseId, parsedWeight, parsedReps, logSetStore, startRestTimer, isMetric]);

  // ─── Render ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <View style={styles.center}><Typography>Loading session...</Typography></View>
      </SafeAreaView>
    );
  }

  const isInputValid = parsedWeight !== null && parsedReps !== null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Typography variant="h2">Week {session?.weekNumber} — Day {session?.dayNumber}</Typography>
        </View>

        {exercises.map((ex) => (
          <Pressable 
            key={ex.id} 
            onPress={() => setActiveExerciseId(ex.id)}
            style={[
              styles.exerciseCard, 
              { 
                backgroundColor: theme.colors.backgroundElevated,
                borderColor: activeExerciseId === ex.id ? theme.colors.accentPR : theme.colors.borderSubtle,
                borderWidth: 1,
              }
            ]}
          >
            <Typography variant="h3">{ex.name}</Typography>
          </Pressable>
        ))}

        <Pressable 
          style={[styles.addButton, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => pickerRef.current?.present()}
        >
          <Typography variant="bodyStrong" color="primary">+ Add Exercise</Typography>
        </Pressable>
        
        {activeExerciseId && (
          <View style={[styles.inputRow, { backgroundColor: theme.colors.backgroundElevated }]}>
            <Pressable 
              style={[styles.inputField, activeField === 'weight' && { borderColor: theme.colors.accentPR, borderWidth: 1 }]}
              onPress={() => setActiveField('weight')}
            >
              <Typography variant="label" color="tertiary">{isMetric ? 'KG' : 'LBS'}</Typography>
              <Typography variant="h2" tabular>{weightInput || '0'}</Typography>
            </Pressable>
            
            <Pressable 
              style={[styles.inputField, activeField === 'reps' && { borderColor: theme.colors.accentPR, borderWidth: 1 }]}
              onPress={() => setActiveField('reps')}
            >
              <Typography variant="label" color="tertiary">REPS</Typography>
              <Typography variant="h2" tabular>{repsInput || '0'}</Typography>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Persistent Bottom Bar */}
      <View style={[styles.bottomBar, { borderTopColor: theme.colors.borderSubtle, backgroundColor: theme.colors.backgroundElevated }]}>
        <ActionSwipe
          label={isInputValid ? `Swipe to Log ${parsedWeight} ${isMetric ? 'KG' : 'LBS'} × ${parsedReps}` : "Enter Weight & Reps"}
          onSwipeComplete={commitSet}
          disabled={!isInputValid}
        />
        <NumericKeypad />
      </View>

      <ExercisePicker ref={pickerRef} onSelectExercise={handleAddExercise} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  addButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  inputField: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1A1A1E', // secondary
    marginHorizontal: 8,
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
