/**
 * @module app/(auth)/_layout
 * @description Layout for authentication group (onboarding, login, etc).
 * Uses a plain stack with no headers.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
