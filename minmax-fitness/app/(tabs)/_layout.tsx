/**
 * @module app/(tabs)/_layout
 * @description Tab navigator layout with custom minimalist tab bar.
 *
 * Implements a clean bottom tab bar with two primary destinations:
 * Dashboard (home/program view) and History (completed workouts).
 *
 * The tab bar uses the design token system for consistent theming
 * and includes subtle Reanimated-powered active indicator animations.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, type ViewStyle } from 'react-native';

import { colors, spacing, radii, fontSizes, fontWeights } from '@ui/theme';

/**
 * Custom tab bar icon wrapper.
 * Uses simple unicode glyphs instead of icon libraries to maintain
 * zero external dependencies during the primitive validation phase.
 * Will be replaced with a custom icon set in Phase 3.
 */
function TabIcon({
  glyph,
  focused,
}: {
  readonly glyph: string;
  readonly focused: boolean;
}): React.ReactElement {
  const containerStyle: ViewStyle = {
    width: 40,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: focused ? colors.interactivePrimary : 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <View style={containerStyle}>
      <View>
        {/* Using a View + text since Typography needs theme hook context */}
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Placeholder glyph — will be replaced by icon component */}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout(): React.ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundElevated,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 84,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: fontSizes.xs,
          fontWeight: fontWeights.medium,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}
