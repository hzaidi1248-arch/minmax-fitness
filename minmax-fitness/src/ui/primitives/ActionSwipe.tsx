/**
 * @module ui/primitives/ActionSwipe
 * @description Gesture-driven "Swipe to Complete" component using
 * Reanimated 3 and React Native Gesture Handler.
 *
 * Replaces standard "Save" buttons for logging sets during a workout.
 * The swipe gesture prevents accidental double-taps from sweaty hands
 * and provides satisfying haptic-ready tactile feedback.
 *
 * Architecture:
 * - The track is a fixed-width container.
 * - The thumb is a draggable element constrained to the track.
 * - When the thumb reaches the activation threshold (80% of track),
 *   the action fires and the thumb snaps to the end with a spring.
 * - If released before threshold, it springs back to start.
 */

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, type ViewStyle, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  interpolateColor,
  type SharedValue,
} from 'react-native-reanimated';

import { useTheme } from '@ui/theme';
import Typography from './Typography';

// ─── Constants ──────────────────────────────────────────────────────

/** Fraction of track width the thumb must reach to activate. */
const ACTIVATION_THRESHOLD: number = 0.80;

/** Spring configuration for snapping animations. */
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
} as const;

// ─── Props ──────────────────────────────────────────────────────────

interface ActionSwipeProps {
  /** Text displayed on the track behind the thumb. */
  readonly label: string;
  /** Callback fired when the swipe reaches the activation threshold. */
  readonly onSwipeComplete: () => void;
  /** Whether the component is in a disabled/loading state. */
  readonly disabled?: boolean;
  /** Optional custom height. Defaults to touchTargets.xl (64pt). */
  readonly height?: number;
}

// ─── Component ──────────────────────────────────────────────────────

const ActionSwipe: React.FC<ActionSwipeProps> = memo(function ActionSwipe({
  label,
  onSwipeComplete,
  disabled = false,
  height,
}: ActionSwipeProps): React.ReactElement {
  const theme = useTheme();
  const thumbSize: number = height ?? theme.touchTargets.xl;
  const trackHeight: number = thumbSize;

  // Shared values for gesture and layout
  const translateX: SharedValue<number> = useSharedValue(0);
  const trackWidth: SharedValue<number> = useSharedValue(300);
  const isActivated: SharedValue<boolean> = useSharedValue(false);

  // Track layout measurement
  const onTrackLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      trackWidth.value = event.nativeEvent.layout.width;
    },
    [trackWidth]
  );

  // Maximum translation = track width - thumb width
  const getMaxTranslation = (): number => {
    'worklet';
    return Math.max(trackWidth.value - thumbSize, 0);
  };

  // ── Pan Gesture ─────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX(10)
    .onUpdate((event) => {
      'worklet';
      if (isActivated.value) return;

      const maxX: number = getMaxTranslation();
      const clamped: number = Math.min(Math.max(event.translationX, 0), maxX);
      translateX.value = clamped;
    })
    .onEnd(() => {
      'worklet';
      if (isActivated.value) return;

      const maxX: number = getMaxTranslation();
      const progress: number = maxX > 0 ? translateX.value / maxX : 0;

      if (progress >= ACTIVATION_THRESHOLD) {
        // Snap to end and fire callback
        isActivated.value = true;
        translateX.value = withSpring(maxX, SPRING_CONFIG);
        runOnJS(onSwipeComplete)();
      } else {
        // Spring back to start
        translateX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  // ── Animated Styles ─────────────────────────────────────

  const thumbAnimatedStyle = useAnimatedStyle((): ViewStyle => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const trackFillStyle = useAnimatedStyle((): ViewStyle => {
    const maxX: number = getMaxTranslation();
    const progress: number = maxX > 0 ? translateX.value / maxX : 0;

    return {
      width: translateX.value + thumbSize,
      backgroundColor: interpolateColor(
        progress,
        [0, ACTIVATION_THRESHOLD, 1],
        [
          theme.colors.backgroundPressed,
          theme.colors.statusSuccessBg,
          theme.colors.statusSuccess,
        ]
      ),
    };
  });

  const labelOpacityStyle = useAnimatedStyle((): ViewStyle => {
    const maxX: number = getMaxTranslation();
    const progress: number = maxX > 0 ? translateX.value / maxX : 0;

    return {
      opacity: interpolate(progress, [0, 0.5], [1, 0], 'clamp'),
    };
  });

  // ── Render ──────────────────────────────────────────────

  const trackStyle: ViewStyle = {
    height: trackHeight,
    borderRadius: trackHeight / 2,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: disabled ? theme.colors.borderSubtle : theme.colors.border,
    overflow: 'hidden',
  };

  const thumbStyle: ViewStyle = {
    width: thumbSize - 8,
    height: thumbSize - 8,
    borderRadius: (thumbSize - 8) / 2,
    backgroundColor: disabled
      ? theme.colors.textDisabled
      : theme.colors.interactivePrimary,
    position: 'absolute',
    left: 4,
    top: 4,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  };

  return (
    <View style={trackStyle} onLayout={onTrackLayout}>
      {/* Fill indicator */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: trackHeight / 2 },
          trackFillStyle,
        ]}
      />

      {/* Track label */}
      <Animated.View
        style={[
          styles.labelContainer,
          { height: trackHeight },
          labelOpacityStyle,
        ]}
        pointerEvents="none"
      >
        <Typography variant="label" color="tertiary">
          {label}
        </Typography>
      </Animated.View>

      {/* Draggable thumb */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[thumbStyle, thumbAnimatedStyle]}>
          <Typography
            variant="bodyStrong"
            style={{ color: theme.colors.interactiveOnPrimary }}
          >
            →
          </Typography>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

ActionSwipe.displayName = 'ActionSwipe';

// ─── Static Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  labelContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActionSwipe;
