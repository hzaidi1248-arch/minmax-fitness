/**
 * @module app/_layout
 * @description Root layout for Expo Router.
 *
 * Configures the application-wide navigation stack, hides the native
 * header in favor of custom breadcrumb navigation, applies the dark
 * theme globally, and wraps the tree with required gesture/reanimated
 * providers.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { colors } from '@ui/theme';
import { BreadcrumbHeader } from '@ui/components';
import { registerBackgroundSync } from '@services/backgroundSync';
import { useAuthStore } from '@core/auth/authStore';

/**
 * Root layout component.
 * Wraps the entire app in GestureHandlerRootView (required for
 * Reanimated gesture handler) and configures the Stack navigator
 * with hidden native headers and dark background.
 */
export default function RootLayout(): React.ReactElement {
  const loadToken = useAuthStore((s) => s.loadToken);

  useEffect(() => {
    void loadToken();
    void registerBackgroundSync();
  }, [loadToken]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          header: () => <BreadcrumbHeader />,
          headerShown: true,
          contentStyle: { backgroundColor: colors.backgroundPrimary },
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      >
        {/* Tab navigator group */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: true,
          }}
        />

        {/* Workout session screen — full screen modal push */}
        <Stack.Screen
          name="workout/[id]"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            gestureEnabled: false,
          }}
        />

        {/* Profile screen */}
        <Stack.Screen
          name="profile"
          options={{
            headerShown: true,
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
});
