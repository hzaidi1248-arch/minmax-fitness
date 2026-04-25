/**
 * @module features/history/components/HistoryCard
 * @description Card component for the historical logbook.
 * Renders session metadata and a summary of exercises performed.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import withObservables from '@nozbe/with-observables';
import { format } from 'date-fns';

import { colors, spacing } from '@ui/theme';
import { Typography } from '@ui/primitives';
import type { WorkoutSession, SetLog } from '@core/database/models';
import { useWorkoutStore } from '@store/workoutStore';
import { formatWeight } from '@core/math/units';

interface HistoryCardProps {
  readonly session: WorkoutSession;
  readonly setLogs: SetLog[]; // Injected by withObservables
  readonly onPress?: () => void;
}

function HistoryCard({ session, setLogs, onPress }: HistoryCardProps): React.ReactElement {
  const isMetric = useWorkoutStore((s) => s.isMetric);
  
  // For MVP: Summarize exercises. 
  // In a real app we'd fetch the Exercise relation properly via withObservables.
  // We'll just show the number of sets and the total volume.
  
  const totalSets = setLogs.length;
  const totalVolumeKg = setLogs.reduce((acc, set) => acc + ((set.weightKg ?? 0) * (set.completedReps ?? 0)), 0);

  const dateString = session.completedAt ? format(new Date(session.completedAt), 'MMM d, yyyy - h:mm a') : 'In Progress';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Typography variant="bodyStrong" color="primary">{dateString}</Typography>
        <Typography variant="caption" color="secondary">
          Week {session.weekNumber} / Day {session.dayNumber}
        </Typography>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Typography variant="label" color="tertiary">SETS</Typography>
          <Typography variant="h3">{totalSets}</Typography>
        </View>
        <View style={styles.statBox}>
          <Typography variant="label" color="tertiary">VOLUME</Typography>
          <Typography variant="h3">{formatWeight(totalVolumeKg, isMetric)}</Typography>
        </View>
        <View style={styles.statBox}>
          <Typography variant="label" color="tertiary">DURATION</Typography>
          {/* Mock duration since we don't track exact start/end yet */ }
          <Typography variant="h3">45m</Typography>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: 12,
    padding: spacing['4'],
    marginBottom: spacing['4'],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['4'],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: spacing['3'],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
});

export default withObservables(['session'], ({ session }: { session: WorkoutSession }) => ({
  session: session.observe(),
  setLogs: session.setLogs.observe(),
}))(HistoryCard);
