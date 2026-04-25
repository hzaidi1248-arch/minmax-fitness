/**
 * @module ui/primitives/Typography
 * @description Polymorphic, design-token-constrained text component.
 *
 * All text rendering in the application MUST go through this component
 * to guarantee visual consistency. Direct use of React Native's <Text>
 * is prohibited in feature code.
 *
 * Supports semantic variants (heading, body, label, caption, hero)
 * that map to strictly defined font size / weight / color combinations.
 * Custom overrides are intentionally limited to prevent style drift.
 */

import React, { memo } from 'react';
import {
  Text,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { useTheme } from '@ui/theme';

// ─── Variant Definitions ────────────────────────────────────────────

/**
 * Semantic typography variants.
 * Each maps to an immutable combination of size, weight, color, and spacing.
 */
export type TypographyVariant =
  | 'display'
  | 'hero'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'labelSmall'
  | 'caption'
  | 'micro';

/**
 * Allowed color overrides. Constrained to semantic color keys
 * to prevent arbitrary hex values.
 */
export type TypographyColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger';

// ─── Props ──────────────────────────────────────────────────────────

interface TypographyProps extends Omit<TextProps, 'style'> {
  /** The semantic variant to render. Defaults to 'body'. */
  readonly variant?: TypographyVariant;
  /** Semantic color override. Defaults to the variant's natural color. */
  readonly color?: TypographyColor;
  /** Text alignment override. */
  readonly align?: TextStyle['textAlign'];
  /** Whether to use tabular (monospaced) numerals for data display. */
  readonly tabular?: boolean;
  /** Additional style overrides — use sparingly. */
  readonly style?: TextStyle;
  /** Content to render. */
  readonly children: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────────────────

/**
 * Design-token-constrained text component.
 *
 * @example
 * ```tsx
 * <Typography variant="hero" tabular>225</Typography>
 * <Typography variant="label" color="secondary">Working Weight</Typography>
 * <Typography variant="h2">Week 3 — Upper</Typography>
 * ```
 */
const Typography: React.FC<TypographyProps> = memo(function Typography({
  variant = 'body',
  color,
  align,
  tabular = false,
  style,
  children,
  ...textProps
}: TypographyProps): React.ReactElement {
  const theme = useTheme();

  // Map variant to font size
  const sizeMap: Record<TypographyVariant, number> = {
    display: theme.fontSizes.display,
    hero: theme.fontSizes.hero,
    h1: theme.fontSizes.xxl,
    h2: theme.fontSizes.xl,
    h3: theme.fontSizes.lg,
    body: theme.fontSizes.md,
    bodyStrong: theme.fontSizes.md,
    label: theme.fontSizes.sm,
    labelSmall: theme.fontSizes.xs,
    caption: theme.fontSizes.sm,
    micro: theme.fontSizes.xs,
  };

  // Map variant to font weight
  const weightMap: Record<TypographyVariant, string> = {
    display: theme.fontWeights.black,
    hero: theme.fontWeights.bold,
    h1: theme.fontWeights.bold,
    h2: theme.fontWeights.semibold,
    h3: theme.fontWeights.semibold,
    body: theme.fontWeights.regular,
    bodyStrong: theme.fontWeights.medium,
    label: theme.fontWeights.medium,
    labelSmall: theme.fontWeights.medium,
    caption: theme.fontWeights.regular,
    micro: theme.fontWeights.medium,
  };

  // Map variant to default color
  const defaultColorMap: Record<TypographyVariant, string> = {
    display: theme.colors.textPrimary,
    hero: theme.colors.textPrimary,
    h1: theme.colors.textPrimary,
    h2: theme.colors.textPrimary,
    h3: theme.colors.textPrimary,
    body: theme.colors.textSecondary,
    bodyStrong: theme.colors.textPrimary,
    label: theme.colors.textSecondary,
    labelSmall: theme.colors.textTertiary,
    caption: theme.colors.textTertiary,
    micro: theme.colors.textTertiary,
  };

  // Map variant to letter spacing
  const spacingMap: Record<TypographyVariant, number> = {
    display: theme.letterSpacing.tight,
    hero: theme.letterSpacing.tight,
    h1: theme.letterSpacing.tight,
    h2: theme.letterSpacing.normal,
    h3: theme.letterSpacing.normal,
    body: theme.letterSpacing.normal,
    bodyStrong: theme.letterSpacing.normal,
    label: theme.letterSpacing.wide,
    labelSmall: theme.letterSpacing.extraWide,
    caption: theme.letterSpacing.normal,
    micro: theme.letterSpacing.extraWide,
  };

  // Map variant to line height multiplier
  const lineHeightMap: Record<TypographyVariant, number> = {
    display: theme.lineHeights.tight,
    hero: theme.lineHeights.tight,
    h1: theme.lineHeights.tight,
    h2: theme.lineHeights.normal,
    h3: theme.lineHeights.normal,
    body: theme.lineHeights.relaxed,
    bodyStrong: theme.lineHeights.relaxed,
    label: theme.lineHeights.normal,
    labelSmall: theme.lineHeights.normal,
    caption: theme.lineHeights.relaxed,
    micro: theme.lineHeights.normal,
  };

  // Resolve semantic color override
  const colorMap: Record<TypographyColor, string> = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    tertiary: theme.colors.textTertiary,
    disabled: theme.colors.textDisabled,
    accent: theme.colors.accentPR,
    success: theme.colors.statusSuccess,
    warning: theme.colors.statusWarning,
    danger: theme.colors.statusDanger,
  };

  const fontSize: number = sizeMap[variant];
  const resolvedColor: string =
    color !== undefined ? colorMap[color] : defaultColorMap[variant];

  const computedStyle: TextStyle = {
    fontSize,
    fontWeight: weightMap[variant] as TextStyle['fontWeight'],
    color: resolvedColor,
    letterSpacing: spacingMap[variant],
    lineHeight: fontSize * lineHeightMap[variant],
    textAlign: align,
    fontVariant: tabular ? ['tabular-nums'] : undefined,
  };

  return (
    <Text
      {...textProps}
      style={[computedStyle, style]}
      allowFontScaling={false}
    >
      {children}
    </Text>
  );
});

Typography.displayName = 'Typography';

export default Typography;
