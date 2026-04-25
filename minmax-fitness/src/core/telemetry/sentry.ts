/**
 * @module core/telemetry/sentry
 * @description Sentry configuration for React Native.
 */

import * as Sentry from '@sentry/react-native';

export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://placeholder-dsn@sentry.io/123',
    debug: __DEV__,
    enableAutoSessionTracking: true,
    // Offline caching of crash reports
    enableWatchdogTerminationTracking: true,
    // Add more config here as needed
  });
}

/**
 * Custom error reporting wrapper.
 */
export function reportError(error: any, context?: string) {
  console.error(`[Sentry] Reporting error: ${context}`, error);
  Sentry.captureException(error, {
    extra: { context },
  });
}
