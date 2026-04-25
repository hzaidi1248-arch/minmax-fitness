/**
 * @module ui/components/BreadcrumbHeader
 * @description Minimalist custom header replacing the Expo Router native header.
 * 
 * Dynamically reads the current route to generate a breadcrumb title.
 * Integrates directly with the Zustand store to render a pulsing Reanimated
 * "Active Session" indicator when a workout is in progress, allowing
 * users to safely navigate away from the active session and return later.
 */

import React, { useEffect, memo } from 'react';
import { View, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@ui/theme';
import { Typography } from '@ui/primitives';
import { useWorkoutStore, selectIsWorkoutActive } from '@store/workoutStore';

const BreadcrumbHeader: React.FC = memo(function BreadcrumbHeader(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const isWorkoutActive = useWorkoutStore(selectIsWorkoutActive);
  
  // ─── Breadcrumb Derivation ────────────────────────────────────────

  const segments = pathname.split('/').filter(Boolean);
  let breadcrumbText = 'MinMax';
  
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    // Remove Expo Router group parenthesis and capitalize
    const cleaned = (lastSegment ?? '').replace(/\(|\)/g, '');
    if (cleaned) {
      breadcrumbText = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }

  // ─── Animation ────────────────────────────────────────────────────

  const pulseOpacity: SharedValue<number> = useSharedValue(0);
  
  useEffect(() => {
    if (isWorkoutActive) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite loop
        true // reverse on repeat
      );
    } else {
      pulseOpacity.value = 0;
    }
  }, [isWorkoutActive, pulseOpacity]);

  const dotAnimatedStyle = useAnimatedStyle((): ViewStyle => ({
    opacity: pulseOpacity.value,
  }));

  // ─── Render ───────────────────────────────────────────────────────

  const containerStyle: ViewStyle = {
    paddingTop: insets.top + theme.spacing['2'],
    paddingBottom: theme.spacing['3'],
    paddingHorizontal: theme.spacing['4'],
    backgroundColor: theme.colors.backgroundElevated,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100, // Ensure header sits above content
  };

  const dotStyle: ViewStyle = {
    width: theme.spacing['2'],
    height: theme.spacing['2'],
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.statusSuccess,
  };

  return (
    <View style={containerStyle}>
      <View style={styles.left}>
        {router.canGoBack() && (
          <Pressable 
            onPress={(): void => router.back()} 
            style={{ paddingRight: theme.spacing['3'] }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Typography variant="bodyStrong" color="secondary">
              ← Back
            </Typography>
          </Pressable>
        )}
        <Typography variant="h3" color="primary">
          {breadcrumbText}
        </Typography>
      </View>
      
      {isWorkoutActive && (
        <View style={styles.right}>
          <Typography 
            variant="labelSmall" 
            color="success" 
            style={{ paddingRight: theme.spacing['1.5'] }}
          >
            ACTIVE
          </Typography>
          <Animated.View style={[dotStyle, dotAnimatedStyle]} />
        </View>
      )}
    </View>
  );
});

BreadcrumbHeader.displayName = 'BreadcrumbHeader';

const styles = StyleSheet.create({
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default BreadcrumbHeader;
