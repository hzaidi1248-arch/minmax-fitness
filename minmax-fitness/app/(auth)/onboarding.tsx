/**
 * @module app/(auth)/onboarding
 * @description Premium Onboarding Flow with Reanimated 3 paginated carousel.
 * Handles:
 * - Unit preference selection
 * - Initial bodyweight logging
 * - Asynchronous DB seeding (exercises, programs)
 * - Dummy JWT registration to bypass auth
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import database from '@core/database';
import { TableName } from '@core/types';
import type { User, BodyweightLog } from '@core/database/models';
import { seedDatabase } from '@core/database/seed';
import { useAuthStore } from '@core/auth/authStore';
import { useWorkoutStore } from '@store/workoutStore';
import { lbsToKg } from '@core/math/units';

import { colors, spacing } from '@ui/theme';
import { Typography, ActionSwipe } from '@ui/primitives';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Component ────────────────────────────────────────────────────────

export default function OnboardingScreen(): React.ReactElement {
  const router = useRouter();
  
  const setToken = useAuthStore((s) => s.setToken);
  const { isMetric, toggleMetric } = useWorkoutStore();

  const [weightInput, setWeightInput] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  // Pagination state
  const currentPage = useSharedValue(0);

  const nextPage = useCallback(() => {
    if (currentPage.value < 2) {
      currentPage.value = withSpring(currentPage.value + 1, { damping: 20, stiffness: 90 });
    }
  }, [currentPage]);

  const prevPage = useCallback(() => {
    if (currentPage.value > 0) {
      currentPage.value = withSpring(currentPage.value - 1, { damping: 20, stiffness: 90 });
    }
  }, [currentPage]);

  // Carousel animation
  const carouselStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -currentPage.value * SCREEN_WIDTH }],
    };
  });

  // ─── Registration & Seeding Logic ───────────────────────────────────

  const finishOnboarding = useCallback(async () => {
    if (isFinishing) return;
    setIsFinishing(true);

    try {
      const parsedWeight = parseFloat(weightInput);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        Alert.alert('Invalid Input', 'Please enter a valid bodyweight.');
        setIsFinishing(false);
        return;
      }

      // 1. Seed foundational data
      await seedDatabase(database);

      // 2. Create User and initial Bodyweight Log locally
      const finalWeightKg = isMetric ? parsedWeight : lbsToKg(parsedWeight);
      
      await database.write(async () => {
        const user = await database.get<User>(TableName.USERS).create(() => {});
        
        await database.get<BodyweightLog>(TableName.BODYWEIGHT_LOGS).create((record) => {
          record.user.set(user);
          record.weightKg = finalWeightKg;
        });
      });

      // 3. Register user on the server and get a real JWT
      //    The userId from WatermelonDB is used as the server-side identity.
      const users = await database.get<User>(TableName.USERS).query().fetch();
      const userId = users[0]?.id ?? '';

      let jwtToken = '';
      try {
        const authBaseUrl = process.env.EXPO_PUBLIC_SYNC_API_URL
          ? process.env.EXPO_PUBLIC_SYNC_API_URL.replace('/sync', '')
          : 'https://minmax-fitness.vercel.app';

        const res = await fetch(`${authBaseUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (res.ok) {
          const data = await res.json() as { token: string };
          jwtToken = data.token;
        }
      } catch {
        // Network unavailable — store empty token and sync will work once online
      }

      await setToken(jwtToken || `offline-${userId}`);

      // Index route handles redirect to dashboard automatically via useAuthStore
      router.replace('/');

    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding.');
      setIsFinishing(false);
    }
  }, [isFinishing, weightInput, isMetric, setToken, router]);

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.carousel, carouselStyle]}>
        
        {/* PAGE 1: Welcome */}
        <View style={styles.page}>
          <View style={styles.pageContent}>
            <Typography variant="h1" style={styles.title}>Welcome to Min-Max.</Typography>
            <Typography variant="body" color="secondary" style={styles.subtitle}>
              Offline-first tracking. High performance. No distractions.
            </Typography>
          </View>
          <Pressable style={styles.primaryButton} onPress={nextPage}>
            <Typography variant="bodyStrong">Continue</Typography>
          </Pressable>
        </View>

        {/* PAGE 2: Units */}
        <View style={styles.page}>
          <View style={styles.pageContent}>
            <Typography variant="h1" style={styles.title}>Unit Preference</Typography>
            <Typography variant="body" color="secondary" style={styles.subtitle}>
              Choose your preferred measurement system. This can be changed later.
            </Typography>

            <View style={styles.unitToggleContainer}>
              <Pressable 
                style={[styles.unitOption, !isMetric && styles.unitOptionSelected]} 
                onPress={() => isMetric && toggleMetric()}
              >
                <Typography variant="h2" color={!isMetric ? 'primary' : 'tertiary'}>LBS</Typography>
              </Pressable>
              
              <Pressable 
                style={[styles.unitOption, isMetric && styles.unitOptionSelected]} 
                onPress={() => !isMetric && toggleMetric()}
              >
                <Typography variant="h2" color={isMetric ? 'primary' : 'tertiary'}>KG</Typography>
              </Pressable>
            </View>
          </View>
          <View style={styles.rowButtons}>
            <Pressable style={styles.secondaryButton} onPress={prevPage}>
              <Typography variant="bodyStrong" color="secondary">Back</Typography>
            </Pressable>
            <Pressable style={[styles.primaryButton, { flex: 1, marginLeft: spacing['4'] }]} onPress={nextPage}>
              <Typography variant="bodyStrong">Continue</Typography>
            </Pressable>
          </View>
        </View>

        {/* PAGE 3: Bodyweight & Finish */}
        <View style={styles.page}>
          <View style={styles.pageContent}>
            <Typography variant="h1" style={styles.title}>Current Bodyweight</Typography>
            <Typography variant="body" color="secondary" style={styles.subtitle}>
              We use this to calculate your strength-to-bodyweight ratios.
            </Typography>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={colors.textTertiary}
                value={weightInput}
                onChangeText={setWeightInput}
                maxLength={6}
              />
              <Typography variant="h3" color="secondary">{isMetric ? 'KG' : 'LBS'}</Typography>
            </View>
          </View>
          
          <View style={styles.rowButtons}>
            <Pressable style={styles.secondaryButton} onPress={prevPage}>
              <Typography variant="bodyStrong" color="secondary">Back</Typography>
            </Pressable>
            <View style={{ flex: 1, marginLeft: spacing['4'] }}>
              <ActionSwipe 
                label={isFinishing ? "Loading..." : "Swipe to Start"} 
                onSwipeComplete={finishOnboarding} 
                disabled={isFinishing || weightInput.length === 0}
              />
            </View>
          </View>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  carousel: {
    flex: 1,
    flexDirection: 'row',
    width: SCREEN_WIDTH * 3, // 3 pages
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    padding: spacing['6'],
    justifyContent: 'space-between',
  },
  pageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    marginBottom: spacing['4'],
  },
  subtitle: {
    marginBottom: spacing['10'],
  },
  primaryButton: {
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing['4'],
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: spacing['4'],
    paddingHorizontal: spacing['6'],
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  rowButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['6'],
  },
  unitToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unitOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing['6'],
    borderWidth: 2,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    marginHorizontal: spacing['2'],
  },
  unitOptionSelected: {
    borderColor: colors.accentPR,
    backgroundColor: colors.backgroundElevated,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.accentPR,
    paddingBottom: spacing['2'],
  },
  textInput: {
    flex: 1,
    fontSize: 48,
    fontFamily: 'Inter-Bold', // Ensure tabular nums font is correct if needed
    color: colors.textPrimary,
  },
});
