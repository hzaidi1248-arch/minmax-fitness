/**
 * @module features/profile/components/BodyweightTracker
 * @description Card module for tracking and logging bodyweight.
 * Includes a Skia sparkline for recent history and a bottom sheet for data entry.
 */

import React, { useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { format } from 'date-fns';

import database from '@core/database';
import { TableName } from '@core/types';
import type { BodyweightLog, User } from '@core/database/models';

import { colors, spacing } from '@ui/theme';
import { Typography, NumericKeypad, ActionSwipe } from '@ui/primitives';
import { useWorkoutStore, selectParsedWeight } from '@store/workoutStore';
import { formatWeight, lbsToKg } from '@core/math/units';

interface BodyweightTrackerProps {
  logs: BodyweightLog[];
  user: User | null; // For MVP we might just attach to the first user
}

function BodyweightTracker({ logs, user }: BodyweightTrackerProps): React.ReactElement {
  const sheetRef = useRef<BottomSheet>(null);
  
  const setActiveField = useWorkoutStore((s) => s.setActiveField);
  const weightInput = useWorkoutStore((s) => s.weightInput);
  const parsedWeight = useWorkoutStore(selectParsedWeight);
  const resetInputs = useWorkoutStore((s) => s.resetAllInputs);
  const isMetric = useWorkoutStore((s) => s.isMetric);

  const currentWeightKg = logs.length > 0 && logs[0] ? logs[0].weightKg : null;

  // ─── Sparkline Path Generation ──────────────────────────────────────
  const sparklinePath = useMemo(() => {
    const skPath = Skia.Path.Make();
    if (logs.length < 2) return skPath;

    // Use up to the last 30 entries
    const recentLogs = [...logs].reverse().slice(-30);
    const minW = Math.min(...recentLogs.map((l) => l.weightKg));
    const maxW = Math.max(...recentLogs.map((l) => l.weightKg));
    
    const rangeY = Math.max(maxW - minW, 1);
    const width = 100;
    const height = 40;

    const pts = recentLogs.map((l, i) => ({
      x: (i / (recentLogs.length - 1)) * width,
      y: height - (((l.weightKg - minW) / rangeY) * height),
    }));

    const firstPt = pts[0];
    if (firstPt) {
      skPath.moveTo(firstPt.x, firstPt.y);
      for (let i = 1; i < pts.length; i++) {
        const pt = pts[i];
        if (pt) skPath.lineTo(pt.x, pt.y);
      }
    }
    return skPath;
  }, [logs]);

  // ─── Bottom Sheet & Logging ─────────────────────────────────────────

  const openSheet = useCallback(() => {
    resetInputs();
    setActiveField('weight');
    sheetRef.current?.expand();
  }, [resetInputs, setActiveField]);

  const handleLogWeight = useCallback(async () => {
    if (!parsedWeight || !user) return;

    // Convert UI input to KG for database
    const finalWeightKg = isMetric ? parsedWeight : lbsToKg(parsedWeight);

    try {
      await database.write(async () => {
        await database.get<BodyweightLog>(TableName.BODYWEIGHT_LOGS).create((record) => {
          record.user.set(user);
          record.weightKg = finalWeightKg;
        });
      });
      sheetRef.current?.close();
      Alert.alert('Success', `Logged bodyweight: ${formatWeight(finalWeightKg, isMetric)}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to log bodyweight.');
    }
  }, [parsedWeight, user, isMetric]);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <Typography variant="h2">Bodyweight</Typography>
          <Pressable onPress={openSheet} style={styles.logButton}>
            <Typography variant="bodyStrong" color="primary">+ Log</Typography>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View>
            <Typography variant="h1" tabular>{formatWeight(currentWeightKg, isMetric)}</Typography>
            <Typography variant="caption" color="secondary">
              {logs.length > 0 && logs[0] ? `Last updated: ${format(new Date(logs[0].createdAt), 'MMM d')}` : 'No data yet'}
            </Typography>
          </View>
          
          <View style={styles.sparklineContainer}>
            {logs.length >= 2 ? (
              <Canvas style={StyleSheet.absoluteFill}>
                <Path 
                  path={sparklinePath} 
                  style="stroke" 
                  strokeWidth={2} 
                  color={colors.accentPR} 
                  strokeJoin="round"
                />
              </Canvas>
            ) : (
              <Typography variant="caption" color="tertiary">Need more data</Typography>
            )}
          </View>
        </View>
      </View>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['60%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.backgroundElevated }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <View style={styles.sheetContent}>
          <Typography variant="h2" style={styles.sheetTitle}>Log Bodyweight</Typography>
          
          <View style={styles.inputDisplay}>
            <Typography variant="h1" tabular>{weightInput || '0'}</Typography>
            <Typography variant="label" color="tertiary">{isMetric ? 'KG' : 'LBS'}</Typography>
          </View>

          <NumericKeypad />

          <View style={styles.swipeContainer}>
            <ActionSwipe 
              label={parsedWeight ? `Log ${parsedWeight} ${isMetric ? 'KG' : 'LBS'}` : 'Enter Weight'} 
              onSwipeComplete={handleLogWeight} 
              disabled={!parsedWeight}
            />
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: 12,
    padding: spacing['4'],
    marginBottom: spacing['6'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['4'],
  },
  logButton: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['2'],
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sparklineContainer: {
    width: 100,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetContent: {
    flex: 1,
    padding: spacing['4'],
  },
  sheetTitle: {
    textAlign: 'center',
    marginBottom: spacing['6'],
  },
  inputDisplay: {
    alignItems: 'center',
    marginBottom: spacing['6'],
  },
  swipeContainer: {
    marginTop: spacing['6'],
    paddingBottom: spacing['8'],
  },
});

// Let's implement the map directly or just observe all logs without user relation for MVP to avoid RXJS map issues if not imported.
export default withObservables([], () => ({
  logs: database.get<BodyweightLog>(TableName.BODYWEIGHT_LOGS)
    .query(Q.sortBy('created_at', Q.desc))
    .observe(),
}))(BodyweightTracker);
