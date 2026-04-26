/**
 * @module core/telemetry/sentry
 * @description Sentry configuration for React Native.
 * @sentry/react-native is an optional peer dependency — gracefully no-ops when absent.
 */

// Dynamic require so the build doesn't fail when @sentry/react-native isn't installed.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Sentry: {
  init?: (opts: Record<string, unknown>) => void;
  captureException?: (err: unknown, opts?: Record<string, unknown>) => void;
} = (() => {
  try { return require('@sentry/react-native'); } catch { return {}; }
})();

export function initSentry(): void {
  if (!Sentry.init) return;
  Sentry.init({
    dsn: process.env['EXPO_PUBLIC_SENTRY_DSN'] ?? '',
    debug: typeof __DEV__ !== 'undefined' && __DEV__,
    enableAutoSessionTracking: true,
    enableWatchdogTerminationTracking: true,
  });
}

export function reportError(error: unknown, context?: string): void {
  console.error(`[Sentry] Reporting error: ${context ?? ''}`, error);
  Sentry.captureException?.(error, { extra: { context } });
}
