/**
 * @module app/(tabs)/history
 * @description Historical logbook screen.
 * Displays all past workout sessions using a high-performance FlashList.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';

import database from '@core/database';
import { TableName } from '@core/types';
import type { WorkoutSession } from '@core/database/models';

import { colors, spacing } from '@ui/theme';
import { Typography } from '@ui/primitives';
import HistoryCard from '@features/history/components/HistoryCard';

interface HistoryScreenProps {
  sessions: WorkoutSession[];
}

function HistoryScreen({ sessions }: HistoryScreenProps): React.ReactElement {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Typography variant="h1">Logbook</Typography>
      </View>
      
      <View style={styles.listContainer}>
        {React.createElement(FlashList as React.ComponentType<any>, {
          data: sessions,
          renderItem: ({ item }: { item: WorkoutSession }) => <HistoryCard session={item} />,
          estimatedItemSize: 120,
          keyExtractor: (item: WorkoutSession) => item.id,
          showsVerticalScrollIndicator: false,
          contentContainerStyle: styles.listContent,
          ListEmptyComponent: (
            <View style={styles.emptyContainer}>
              <Typography variant="body" color="tertiary">No workouts logged yet.</Typography>
            </View>
          ),
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  header: {
    paddingHorizontal: spacing['4'],
    paddingTop: spacing['6'],
    paddingBottom: spacing['4'],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  listContainer: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    padding: spacing['4'],
    paddingBottom: spacing['10'],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['10'],
  },
});

// Observe all workout sessions, ordered by completion date
const enhance = withObservables([], () => ({
  sessions: database.collections
    .get<WorkoutSession>(TableName.WORKOUT_SESSIONS)
    .query(Q.sortBy('completed_at', Q.desc))
    .observe(),
}));

export default enhance(HistoryScreen);

