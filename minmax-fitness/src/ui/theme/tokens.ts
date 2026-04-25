/**
 * @module ui/theme/tokens
 * @description Strictly typed design token dictionary for the MinMax
 * fitness application. Implements a monochromatic dark-mode palette
 * with high-contrast PR (Personal Record) accent system.
 *
 * All values are immutable constants. Dynamic scaling is handled
 * separately in the `useTheme` hook — this module contains only
 * the raw token definitions to guarantee tree-shaking.
 */

// ─── Color Palette ──────────────────────────────────────────────────

/**
 * Monochromatic base palette — pure blacks through warm grays.
 * Designed for OLED-optimized dark mode with zero blue-light bleed.
 */
export const palette = {
  /** True black — OLED power-saving background */
  black: '#000000',
  /** Primary background surfaces */
  gray950: '#0A0A0C',
  /** Elevated card/sheet backgrounds */
  gray900: '#121214',
  /** Secondary surfaces, input fields */
  gray850: '#1A1A1E',
  /** Tertiary surfaces, pressed states */
  gray800: '#222228',
  /** Borders, dividers */
  gray700: '#2E2E36',
  /** Disabled text, subtle borders */
  gray600: '#48485A',
  /** Placeholder text */
  gray500: '#6B6B80',
  /** Secondary body text */
  gray400: '#8E8EA0',
  /** Primary body text */
  gray300: '#B0B0C0',
  /** Emphasized body text */
  gray200: '#CDCDE0',
  /** Headings, high-emphasis text */
  gray100: '#E8E8F0',
  /** Maximum contrast text */
  white: '#F5F5FA',

  /** PR accent — electric gold for personal records */
  prGold: '#FFD700',
  /** PR accent muted — for backgrounds behind PR indicators */
  prGoldMuted: '#FFD70020',
  /** PR accent dimmed — for subtle PR borders */
  prGoldDim: '#FFD70040',

  /** Success — set completed */
  successGreen: '#22C55E',
  /** Success muted background */
  successGreenMuted: '#22C55E18',

  /** Warning — approaching failure / high intensity */
  warningAmber: '#F59E0B',
  /** Warning muted background */
  warningAmberMuted: '#F59E0B18',

  /** Danger — failure / missed rep */
  dangerRed: '#EF4444',
  /** Danger muted background */
  dangerRedMuted: '#EF444418',

  /** Info — neutral callouts */
  infoBlue: '#3B82F6',
  /** Info muted background */
  infoBlueMuted: '#3B82F618',
} as const;

export type PaletteKey = keyof typeof palette;

// ─── Semantic Colors ────────────────────────────────────────────────

/**
 * Semantic color assignments mapping intent to palette values.
 * Components should reference these — never raw palette colors.
 */
export const colors = {
  /** App background (root) */
  backgroundPrimary: palette.gray950,
  /** Card / sheet surfaces */
  backgroundElevated: palette.gray900,
  /** Input fields, secondary cards */
  backgroundSecondary: palette.gray850,
  /** Pressed/active state surfaces */
  backgroundPressed: palette.gray800,

  /** Primary text — headings, numbers */
  textPrimary: palette.white,
  /** Secondary text — labels, descriptions */
  textSecondary: palette.gray300,
  /** Tertiary text — placeholders, hints */
  textTertiary: palette.gray500,
  /** Disabled text */
  textDisabled: palette.gray600,

  /** Default border color */
  border: palette.gray700,
  /** Subtle/inner borders */
  borderSubtle: palette.gray800,

  /** PR indicator text and icons */
  accentPR: palette.prGold,
  /** PR indicator background */
  accentPRBackground: palette.prGoldMuted,
  /** PR indicator border */
  accentPRBorder: palette.prGoldDim,

  /** Interactive element fill */
  interactivePrimary: palette.white,
  /** Interactive element text on primary fill */
  interactiveOnPrimary: palette.black,
  /** Subtle interactive fill */
  interactiveSubtle: palette.gray800,

  /** Set completed indicator */
  statusSuccess: palette.successGreen,
  statusSuccessBg: palette.successGreenMuted,
  /** Approaching failure */
  statusWarning: palette.warningAmber,
  statusWarningBg: palette.warningAmberMuted,
  /** Failed / danger */
  statusDanger: palette.dangerRed,
  statusDangerBg: palette.dangerRedMuted,
  /** Informational */
  statusInfo: palette.infoBlue,
  statusInfoBg: palette.infoBlueMuted,
} as const;

export type SemanticColorKey = keyof typeof colors;

// ─── Typography Scale ───────────────────────────────────────────────

/**
 * Base typography scale in logical pixels. These are reference values
 * for a standard 390pt-wide device (iPhone 14). The `useTheme` hook
 * applies fluid scaling based on actual device dimensions.
 */
export const fontSizes = {
  /** Micro labels, badge counts */
  xs: 11,
  /** Captions, timestamps */
  sm: 13,
  /** Body text, input values */
  md: 15,
  /** Subheadings, section labels */
  lg: 17,
  /** Card titles, screen subtitles */
  xl: 20,
  /** Screen titles */
  xxl: 28,
  /** Hero numbers (e.g., live weight display) */
  hero: 48,
  /** Massive stat display (e.g., E1RM on analytics) */
  display: 64,
} as const;

export type FontSizeKey = keyof typeof fontSizes;

/**
 * Font weight mappings.
 * Uses React Native's string-based weight system.
 */
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};

export type FontWeightKey = keyof typeof fontWeights;

/**
 * Line height multipliers relative to font size.
 * Applied as `fontSize * lineHeightMultiplier`.
 */
export const lineHeights = {
  tight: 1.15,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export type LineHeightKey = keyof typeof lineHeights;

/**
 * Letter spacing values in logical pixels.
 */
export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  extraWide: 1.2,
} as const;

export type LetterSpacingKey = keyof typeof letterSpacing;

// ─── Spacing Scale ──────────────────────────────────────────────────

/**
 * 4px-based spacing scale. Reference values for 390pt-wide devices.
 * Scaled dynamically in `useTheme`.
 */
export const spacing = {
  /** 2px — hairline separators */
  '0.5': 2,
  /** 4px — micro padding */
  '1': 4,
  /** 6px */
  '1.5': 6,
  /** 8px — tight inner padding */
  '2': 8,
  /** 12px — standard inner padding */
  '3': 12,
  /** 16px — standard card padding */
  '4': 16,
  /** 20px */
  '5': 20,
  /** 24px — section gaps */
  '6': 24,
  /** 32px — large section gaps */
  '8': 32,
  /** 40px */
  '10': 40,
  /** 48px — screen-level padding */
  '12': 48,
  /** 64px — hero spacing */
  '16': 64,
  /** 80px */
  '20': 80,
} as const;

export type SpacingKey = keyof typeof spacing;

// ─── Border Radii ───────────────────────────────────────────────────

export const radii = {
  /** 4px — subtle rounding */
  sm: 4,
  /** 8px — standard cards */
  md: 8,
  /** 12px — prominent cards */
  lg: 12,
  /** 16px — modal sheets */
  xl: 16,
  /** 24px — pills, chips */
  pill: 24,
  /** Full circle */
  full: 9999,
} as const;

export type RadiiKey = keyof typeof radii;

// ─── Touch Targets ──────────────────────────────────────────────────

/**
 * Minimum touch target dimensions per Apple HIG (44pt)
 * and Material Design (48dp) guidelines.
 */
export const touchTargets = {
  /** Absolute minimum per Apple HIG */
  min: 44,
  /** Standard interactive element */
  standard: 48,
  /** Large buttons, workout keypad keys */
  large: 56,
  /** Extra-large — primary action buttons */
  xl: 64,
} as const;

export type TouchTargetKey = keyof typeof touchTargets;

// ─── Animation Durations ────────────────────────────────────────────

/**
 * Duration constants in milliseconds for Reanimated 3.
 * Aligned with Material Motion timing standards.
 */
export const durations = {
  /** 100ms — micro-interactions (press feedback) */
  instant: 100,
  /** 200ms — small transitions (fade, scale) */
  fast: 200,
  /** 300ms — standard transitions (slide, expand) */
  normal: 300,
  /** 450ms — large transitions (sheet, modal) */
  slow: 450,
  /** 600ms — dramatic emphasis (PR celebration) */
  emphasis: 600,
} as const;

export type DurationKey = keyof typeof durations;

// ─── Shadows ────────────────────────────────────────────────────────

/**
 * Elevation shadow presets for iOS/Android.
 * Uses platform-specific shadow properties.
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

export type ShadowKey = keyof typeof shadows;
