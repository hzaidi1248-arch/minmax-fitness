/**
 * @module app/profile
 * @description Full-screen profile pushed from the stack navigator.
 * Shows the same content as the tab profile: bodyweight tracking + data export.
 */

import React from 'react';
import { ScrollView, StyleSheet, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@ui/theme';
import { Typography } from '@ui/primitives';
import BodyweightTracker from '@features/profile/components/BodyweightTracker';
import { exportDatabaseToJson } from '@core/database/export';

export default function ProfileScreen(): React.ReactElement {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h1">Profile</Typography>
        </View>

        <BodyweightTracker />

        <View style={styles.section}>
          <Typography variant="h2" style={{ marginBottom: spacing['4'] }}>Settings</Typography>

          <Pressable style={styles.exportButton} onPress={exportDatabaseToJson}>
            <Typography variant="bodyStrong">Export Data (JSON)</Typography>
          </Pressable>
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
  header: {
    marginBottom: spacing['8'],
  },
  section: {
    marginTop: spacing['4'],
  },
  exportButton: {
    backgroundColor: colors.backgroundElevated,
    padding: spacing['4'],
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
});
