/**
 * @module ui/primitives/NumericKeypad
 * @description Custom oversized-touch-target numeric keypad for
 * weight, reps, and RIR input during workouts.
 *
 * Replaces the native iOS/Android keyboard which is:
 * 1. Too small for sweaty hands during sets
 * 2. Unpredictable in decimal behavior across platforms
 * 3. Causes layout shift when appearing/disappearing
 *
 * This keypad lives inline in the workout screen, always visible,
 * and feeds directly into the Zustand input buffer via
 * `useWorkoutStore`.
 *
 * Performance: Every key is React.memo'd individually. Press feedback
 * uses Reanimated 3 shared values on the UI thread — zero bridge
 * crossings for the press animation.
 */

import React, { memo, useCallback } from 'react';
import { View, Pressable, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useTheme } from '@ui/theme';
import { useWorkoutStore } from '@store/workoutStore';
import Typography from './Typography';

// ─── Key Configuration ──────────────────────────────────────────────

/**
 * Keypad layout definition.
 * Each row is an array of key descriptors.
 */
interface KeyDescriptor {
  readonly label: string;
  readonly value: string;
  readonly action: 'digit' | 'decimal' | 'backspace' | 'clear';
  readonly span?: number;
}

const KEYPAD_LAYOUT: readonly (readonly KeyDescriptor[])[] = [
  [
    { label: '1', value: '1', action: 'digit' },
    { label: '2', value: '2', action: 'digit' },
    { label: '3', value: '3', action: 'digit' },
  ],
  [
    { label: '4', value: '4', action: 'digit' },
    { label: '5', value: '5', action: 'digit' },
    { label: '6', value: '6', action: 'digit' },
  ],
  [
    { label: '7', value: '7', action: 'digit' },
    { label: '8', value: '8', action: 'digit' },
    { label: '9', value: '9', action: 'digit' },
  ],
  [
    { label: '.', value: '.', action: 'decimal' },
    { label: '0', value: '0', action: 'digit' },
    { label: '⌫', value: '', action: 'backspace' },
  ],
] as const;

// ─── Individual Key Component ───────────────────────────────────────

interface KeyButtonProps {
  readonly descriptor: KeyDescriptor;
  readonly onPress: (descriptor: KeyDescriptor) => void;
  readonly keySize: number;
  readonly gap: number;
}

const KeyButton: React.FC<KeyButtonProps> = memo(function KeyButton({
  descriptor,
  onPress,
  keySize,
  gap,
}: KeyButtonProps): React.ReactElement {
  const theme = useTheme();
  const pressScale: SharedValue<number> = useSharedValue(1);

  const animatedStyle = useAnimatedStyle((): ViewStyle => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = useCallback((): void => {
    pressScale.value = withTiming(0.92, { duration: theme.durations.instant });
  }, [pressScale, theme.durations.instant]);

  const handlePressOut = useCallback((): void => {
    pressScale.value = withTiming(1, { duration: theme.durations.fast });
  }, [pressScale, theme.durations.fast]);

  const handlePress = useCallback((): void => {
    onPress(descriptor);
  }, [onPress, descriptor]);

  const isSpecial: boolean =
    descriptor.action === 'backspace' || descriptor.action === 'decimal';

  const buttonStyle: ViewStyle = {
    width: keySize,
    height: keySize,
    borderRadius: theme.radii.lg,
    backgroundColor: isSpecial
      ? theme.colors.backgroundPressed
      : theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: gap / 2,
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={
        descriptor.action === 'backspace'
          ? 'Delete'
          : descriptor.label
      }
    >
      <Animated.View style={[buttonStyle, animatedStyle]}>
        <Typography
          variant={descriptor.action === 'backspace' ? 'h2' : 'h3'}
          color="primary"
        >
          {descriptor.label}
        </Typography>
      </Animated.View>
    </Pressable>
  );
});

KeyButton.displayName = 'KeyButton';

// ─── Keypad Component ───────────────────────────────────────────────

interface NumericKeypadProps {
  /** Maximum width constraint. Defaults to full width. */
  readonly maxWidth?: number;
}

const NumericKeypad: React.FC<NumericKeypadProps> = memo(
  function NumericKeypad({
    maxWidth,
  }: NumericKeypadProps): React.ReactElement {
    const theme = useTheme();
    const appendToInput = useWorkoutStore((s) => s.appendToInput);
    const backspaceInput = useWorkoutStore((s) => s.backspaceInput);

    const gap: number = theme.spacing['2'];
    // Compute key size: fill available width minus gaps, 3 columns
    const availableWidth: number = maxWidth ?? theme.screenWidth - theme.spacing['8'];
    const keySize: number = Math.min(
      (availableWidth - gap * 4) / 3,
      theme.touchTargets.xl
    );

    const handleKeyPress = useCallback(
      (descriptor: KeyDescriptor): void => {
        switch (descriptor.action) {
          case 'digit':
          case 'decimal':
            appendToInput(descriptor.value);
            break;
          case 'backspace':
            backspaceInput();
            break;
          case 'clear':
            // Reserved for future use
            break;
        }
      },
      [appendToInput, backspaceInput]
    );

    const containerStyle: ViewStyle = {
      paddingVertical: theme.spacing['2'],
      alignItems: 'center',
    };

    const rowStyle: ViewStyle = {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: gap,
    };

    return (
      <View style={containerStyle}>
        {KEYPAD_LAYOUT.map(
          (row: readonly KeyDescriptor[], rowIndex: number) => (
            <View key={`row-${String(rowIndex)}`} style={rowStyle}>
              {row.map(
                (descriptor: KeyDescriptor) => (
                  <KeyButton
                    key={descriptor.label}
                    descriptor={descriptor}
                    onPress={handleKeyPress}
                    keySize={keySize}
                    gap={gap}
                  />
                )
              )}
            </View>
          )
        )}
      </View>
    );
  }
);

NumericKeypad.displayName = 'NumericKeypad';

export default NumericKeypad;
