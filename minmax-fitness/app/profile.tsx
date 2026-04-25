/**
 * @module app/profile
 * @description Profile screen stub.
 * Displays user stats, bodyweight trend, and settings.
 *
 * This is a Phase 2 placeholder — full implementation in Phase 3.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@ui/theme';
import { Typography } from '@ui/primitives';

export default function ProfileScreen(): React.ReactElement {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Typography variant="h1">Profile</Typography>
        <View style={styles.spacer} />
        <Typography variant="body">
          Bodyweight trend, PR history, and settings.
        </Typography>
        <Typography variant="caption">
          Phase 2 scaffold. Full implementation pending.
        </Typography>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['4'],
    paddingTop: spacing['6'],
  },
  spacer: {
    height: spacing['3'],
  },
});
