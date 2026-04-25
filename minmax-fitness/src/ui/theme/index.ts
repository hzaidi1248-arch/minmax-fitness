/**
 * @module ui/theme/index
 * @description Barrel export for the design token system.
 */
export { useTheme } from './useTheme';
export {
  palette,
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
} from './tokens';
export type {
  PaletteKey,
  SemanticColorKey,
  FontSizeKey,
  FontWeightKey,
  LineHeightKey,
  LetterSpacingKey,
  SpacingKey,
  RadiiKey,
  TouchTargetKey,
  DurationKey,
  ShadowKey,
} from './tokens';
