/**
 * @module app/(tabs)/dashboard
 * @description Main Analytics Dashboard.
 *
 * Uses `withObservables` to stream WatermelonDB data directly into the UI.
 * Renders the Trophy Room (recent PRs), Volume AreaChart, and E1RM LineChart.
 * Provides a "Start Workout" button that creates a new WorkoutSession and
 * navigates to the active workout screen.
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { switchMap } from 'rxjs/operators';

import database from '@core/database';
import { TableName, DaySplit } from '@core/types';
import type { Program, User, Exercise, SetLog, WorkoutSession } from '@core/database/models';
import { colors, spacing } from '@ui/theme';
import { Typography } from '@ui/primitives';
import { AreaChart, LineChart } from '@ui/charts';
import {
  observeWeeklyVolumeTrend,
  observeE1RMTrend,
  observeRecentPRs,
  type VolumeDataPoint,
  type E1RMDataPoint,
} from '@features/analytics/analyticsService';
import { useWorkoutStore } from '@store/workoutStore';
import { formatWeight } from '@core/math/units';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - spacing['4'] * 2;
const CHART_HEIGHT = 220;

/** Day split cycle for the 4-day Min-Max program */
const DAY_SPLITS: DaySplit[] = [
  DaySplit.UPPER,
  DaySplit.LOWER,
  DaySplit.UPPER,
  DaySplit.LOWER,
];

interface DashboardProps {
  volumeTrend: VolumeDataPoint[];
  e1rmTrend: E1RMDataPoint[];
  recentPRs: SetLog[];
  completedSessions: WorkoutSession[];
}

function DashboardScreen({
  volumeTrend,
  e1rmTrend,
  recentPRs,
  completedSessions,
}: DashboardProps): React.ReactElement {
  const isMetric = useWorkoutStore((s) => s.isMetric);
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const hasVolumeData = volumeTrend.length > 0;
  const hasE1rmData = e1rmTrend.length > 0;

  /**
   * Derives the next week/day numbers from completed sessions so the
   * program progresses automatically through its 12-week schedule.
   */
  const deriveNextSessionParams = useCallback((): {
    weekNumber: number;
    dayNumber: number;
    daySplit: DaySplit;
    programId: string | null;
  } => {
    const last = completedSessions[0];
    if (!last) {
      return { weekNumber: 1, dayNumber: 1, daySplit: DAY_SPLITS[0] ?? DaySplit.UPPER, programId: null };
    }

    const daysPerWeek = 4;
    let nextDay = last.dayNumber + 1;
    let nextWeek = last.weekNumber;

    if (nextDay > daysPerWeek) {
      nextDay = 1;
      nextWeek += 1;
    }

    const splitIndex = (nextDay - 1) % DAY_SPLITS.length;
    return {
      weekNumber: nextWeek,
      dayNumber: nextDay,
      daySplit: DAY_SPLITS[splitIndex] ?? DaySplit.UPPER,
      programId: last.programId,
    };
  }, [completedSessions]);

  const handleStartWorkout = useCallback(async () => {
    if (starting) return;
    setStarting(true);

    try {
      // Resolve user and program (created during onboarding seed)
      const users = await database.get<User>(TableName.USERS).query().fetch();
      const user = users[0];
      if (!user) {
        Alert.alert('Error', 'User profile not found. Please restart the app.');
        setStarting(false);
        return;
      }

      let programId: string | null = null;

      // Try to get programId from last session first, then fall back to seeded program
      const { weekNumber, dayNumber, daySplit, programId: lastProgramId } = deriveNextSessionParams();
      programId = lastProgramId;

      if (!programId) {
        const programs = await database.get<Program>(TableName.PROGRAMS).query().fetch();
        const program = programs[0];
        if (!program) {
          Alert.alert('Error', 'No program found. Please restart the app to seed data.');
          setStarting(false);
          return;
        }
        programId = program.id;
      }

      // Create new WorkoutSession in WatermelonDB
      let newSessionId = '';
      await database.write(async () => {
        const session = await database.get<WorkoutSession>(TableName.WORKOUT_SESSIONS).create((record) => {
          // WatermelonDB uses direct field assignment for relation foreign keys
          (record as any).userId = user.id;
          (record as any).programId = programId;
          record.weekNumber = weekNumber;
          record.dayNumber = dayNumber;
          record.daySplit = daySplit;
        });
        newSessionId = session.id;
      });

      router.push(`/workout/${newSessionId}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to create workout session.');
    } finally {
      setStarting(false);
    }
  }, [starting, deriveNextSessionParams, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Start Workout CTA */}
        <Pressable
          style={[styles.startButton, starting && styles.startButtonDisabled]}
          onPress={handleStartWorkout}
          disabled={starting}
        >
          {starting ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Typography variant="bodyStrong">Start Workout</Typography>
          )}
        </Pressable>

        {/* Trophy Room */}
        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Trophy Room</Typography>
          {recentPRs.length > 0 ? (
            recentPRs.map((pr) => (
              <View key={pr.id} style={styles.prCard}>
                <Typography variant="bodyStrong">PR</Typography>
                <Typography variant="h3" color="accent" tabular>
                  {formatWeight(pr.weightKg ?? 0, isMetric)} × {pr.completedReps}
                </Typography>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Typography variant="body" color="tertiary">Log workouts to earn PRs!</Typography>
            </View>
          )}
        </View>

        {/* Volume Trend */}
        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Volume Trend</Typography>
          <Typography variant="caption" color="secondary" style={styles.subtitle}>
            Weekly total tonnage ({isMetric ? 'KG' : 'LBS'})
          </Typography>
          {hasVolumeData ? (
            <AreaChart data={volumeTrend} width={CHART_WIDTH} height={CHART_HEIGHT} />
          ) : (
            <View style={styles.emptyCard}>
              <Typography variant="body" color="tertiary">Complete workouts to see volume trends.</Typography>
            </View>
          )}
        </View>

        {/* E1RM Progression */}
        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Strength Progression</Typography>
          <Typography variant="caption" color="secondary" style={styles.subtitle}>
            Estimated 1-Rep Max — compound lifts
          </Typography>
          {hasE1rmData ? (
            <LineChart data={e1rmTrend} width={CHART_WIDTH} height={CHART_HEIGHT} />
          ) : (
            <View style={styles.emptyCard}>
              <Typography variant="body" color="tertiary">Log compound lifts to track E1RM.</Typography>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  content: {
    paddingHorizontal: spacing['4'],
    paddingTop: spacing['6'],
    paddingBottom: spacing['10'],
  },
  startButton: {
    backgroundColor: colors.interactivePrimary ?? colors.accentPR,
    paddingVertical: spacing['5'],
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing['8'],
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  section: {
    marginBottom: spacing['8'],
  },
  sectionTitle: {
    marginBottom: spacing['1'],
  },
  subtitle: {
    marginBottom: spacing['4'],
  },
  prCard: {
    backgroundColor: colors.backgroundElevated,
    padding: spacing['4'],
    borderRadius: 8,
    marginBottom: spacing['2'],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.accentPR,
  },
  emptyCard: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing['6'],
    borderRadius: 8,
    alignItems: 'center',
  },
});

// Observe all compound exercises from the DB to wire E1RM chart with real IDs
const enhance = withObservables([], () => ({
  volumeTrend: observeWeeklyVolumeTrend(),
  e1rmTrend: database
    .get<Exercise>(TableName.EXERCISES)
    .query(Q.where('is_compound', true))
    .observe()
    .pipe(
      switchMap((exercises) => {
        const ids = exercises.map((e) => e.id);
        return observeE1RMTrend(ids);
      })
    ),
  recentPRs: observeRecentPRs(),
  completedSessions: database
    .get<WorkoutSession>(TableName.WORKOUT_SESSIONS)
    .query(Q.sortBy('created_at', Q.desc))
    .observe(),
}));

export default enhance(DashboardScreen);
