/**
 * @module app/index
 * @description Root index redirect.
 * Redirects to the Dashboard if authenticated, else Onboarding.
 */

import { Redirect } from 'expo-router';
import { useAuthStore } from '@core/auth/authStore';

export default function Index(): React.ReactElement | null {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return null; // Or a loading splash screen
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/onboarding" />;
}
