/**
 * @module ui/theme/useTheme
 * @description Hook that provides fluid, device-responsive design tokens.
 *
 * Computes scaled typography and spacing values based on the current
 * device's screen width and pixel ratio. Guarantees pixel-perfect
 * rendering on everything from iPhone SE to iPad Pro 12.9".
 *
 * The scaling algorithm uses a clamped linear interpolation between
 * a minimum (320pt, iPhone SE) and maximum (768pt, iPad) reference
 * width, ensuring tokens never become absurdly small or large.
 */

import { useMemo } from 'react';
import { Dimensions, PixelRatio } from 'react-native';

import {
  colors,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  spacing,
  radii,
  touchTargets,
  durations,
  shadows,
  type FontSizeKey,
  type SpacingKey,
} from './tokens';

// ─── Scaling Constants ──────────────────────────────────────────────

/** Reference device width (iPhone 14/15 — 390pt) */
const REFERENCE_WIDTH: number = 390;

/** Minimum device width for clamping (iPhone SE — 320pt) */
const MIN_WIDTH: number = 320;

/** Maximum device width for clamping (iPad portrait — 768pt) */
const MAX_WIDTH: number = 768;

// ─── Scaling Functions ──────────────────────────────────────────────

/**
 * Clamps a value between min and max bounds.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Computes a fluid scale factor based on current screen width.
 * Returns 1.0 at the reference width, scales linearly below/above,
 * clamped to prevent extremes.
 *
 * @param screenWidth - Current device screen width in logical pixels.
 * @returns Scale factor (typically 0.82 – 1.97).
 */
function computeScaleFactor(screenWidth: number): number {
  const clampedWidth: number = clamp(screenWidth, MIN_WIDTH, MAX_WIDTH);
  return clampedWidth / REFERENCE_WIDTH;
}

/**
 * Scales a pixel value by the device scale factor, then rounds to
 * the nearest physical pixel for sub-pixel-perfect rendering.
 *
 * @param baseValue - The reference pixel value at 390pt width.
 * @param scaleFactor - The computed scale factor.
 * @returns The scaled value, rounded to nearest physical pixel.
 */
function scaleValue(baseValue: number, scaleFactor: number): number {
  const scaled: number = baseValue * scaleFactor;
  return PixelRatio.roundToNearestPixel(scaled);
}

// ─── Scaled Token Types ─────────────────────────────────────────────

type ScaledFontSizes = Readonly<Record<FontSizeKey, number>>;
type ScaledSpacing = Readonly<Record<SpacingKey, number>>;

interface ThemeTokens {
  readonly colors: typeof colors;
  readonly fontSizes: ScaledFontSizes;
  readonly fontWeights: typeof fontWeights;
  readonly lineHeights: typeof lineHeights;
  readonly letterSpacing: typeof letterSpacing;
  readonly spacing: ScaledSpacing;
  readonly radii: typeof radii;
  readonly touchTargets: typeof touchTargets;
  readonly durations: typeof durations;
  readonly shadows: typeof shadows;
  readonly scale: number;
  readonly screenWidth: number;
  readonly screenHeight: number;
  readonly isTablet: boolean;
}

// ─── Hook ───────────────────────────────────────────────────────────

/**
 * Provides the complete design token set, scaled to the current device.
 *
 * Memoized so that token computation only re-runs if screen dimensions
 * change (e.g., rotation). Safe to call from any component — the
 * returned object is referentially stable across re-renders.
 *
 * @returns Fully scaled, strictly typed design tokens.
 *
 * @example
 * ```tsx
 * const theme = useTheme();
 * <View style={{ padding: theme.spacing['4'] }}>
 *   <Text style={{ fontSize: theme.fontSizes.xl }}>Title</Text>
 * </View>
 * ```
 */
export function useTheme(): ThemeTokens {
  const { width: screenWidth, height: screenHeight } =
    Dimensions.get('window');

  return useMemo((): ThemeTokens => {
    const scale: number = computeScaleFactor(screenWidth);
    const isTablet: boolean = screenWidth >= 768;

    // Scale font sizes
    const scaledFontSizes: ScaledFontSizes = {
      xs: scaleValue(fontSizes.xs, scale),
      sm: scaleValue(fontSizes.sm, scale),
      md: scaleValue(fontSizes.md, scale),
      lg: scaleValue(fontSizes.lg, scale),
      xl: scaleValue(fontSizes.xl, scale),
      xxl: scaleValue(fontSizes.xxl, scale),
      hero: scaleValue(fontSizes.hero, scale),
      display: scaleValue(fontSizes.display, scale),
    };

    // Scale spacing
    const scaledSpacing: ScaledSpacing = {
      '0.5': scaleValue(spacing['0.5'], scale),
      '1': scaleValue(spacing['1'], scale),
      '1.5': scaleValue(spacing['1.5'], scale),
      '2': scaleValue(spacing['2'], scale),
      '3': scaleValue(spacing['3'], scale),
      '4': scaleValue(spacing['4'], scale),
      '5': scaleValue(spacing['5'], scale),
      '6': scaleValue(spacing['6'], scale),
      '8': scaleValue(spacing['8'], scale),
      '10': scaleValue(spacing['10'], scale),
      '12': scaleValue(spacing['12'], scale),
      '16': scaleValue(spacing['16'], scale),
      '20': scaleValue(spacing['20'], scale),
    };

    return {
      colors,
      fontSizes: scaledFontSizes,
      fontWeights,
      lineHeights,
      letterSpacing,
      spacing: scaledSpacing,
      radii,
      touchTargets,
      durations,
      shadows,
      scale,
      screenWidth,
      screenHeight,
      isTablet,
    };
  }, [screenWidth, screenHeight]);
}
