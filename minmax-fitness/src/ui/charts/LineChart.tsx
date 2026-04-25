/**
 * @module ui/charts/LineChart
 * @description Hardware-accelerated line chart for E1RM progression.
 * 
 * Supports multiple series (different exercises) on the same axes.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

import { useTheme } from '@ui/theme';
import type { E1RMDataPoint } from '@features/analytics/analyticsService';
import { Typography } from '@ui/primitives';

interface LineChartProps {
  readonly data: readonly E1RMDataPoint[];
  readonly width: number;
  readonly height: number;
}

export default function LineChart({ data, width, height }: LineChartProps): React.ReactElement {
  const theme = useTheme();

  // Group by exercise
  const groupedData = useMemo(() => {
    const groups = new Map<string, E1RMDataPoint[]>();
    for (const d of data) {
      const g = groups.get(d.exerciseId) || [];
      g.push(d);
      groups.set(d.exerciseId, g);
    }
    return Array.from(groups.values());
  }, [data]);

  const paths = useMemo(() => {
    if (data.length === 0) return [];

    const minX = Math.min(...data.map(d => d.week));
    const maxX = Math.max(...data.map(d => d.week));
    const minY = Math.min(...data.map(d => d.maxE1RM), 0);
    const maxY = Math.max(...data.map(d => d.maxE1RM), 100);
    
    const rangeX = Math.max(maxX - minX, 1);
    const rangeY = Math.max(maxY - minY, 1);

    const getPoint = (d: E1RMDataPoint) => ({
      x: ((d.week - minX) / rangeX) * width,
      // Provide some padding so lines don't hit the absolute edges
      y: (height * 0.9) - (((d.maxE1RM - minY) / rangeY) * (height * 0.8)),
    });

    return groupedData.map(group => {
      const skPath = Skia.Path.Make();
      const pts = group.map(getPoint);
      const firstPt = pts[0];
      if (firstPt) {
        skPath.moveTo(firstPt.x, firstPt.y);
        for (let i = 1; i < pts.length; i++) {
          const pt = pts[i];
          if (pt) skPath.lineTo(pt.x, pt.y);
        }
      }
      return skPath;
    });

  }, [data, groupedData, width, height]);

  // Color palette for different series
  const lineColors = [
    theme.colors.accentPR,
    theme.colors.statusSuccess,
    theme.colors.statusWarning,
    theme.colors.interactivePrimary,
  ];

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { width, height, backgroundColor: theme.colors.backgroundSecondary }]}>
        <Typography variant="body" color="tertiary">No E1RM data yet.</Typography>
      </View>
    );
  }

  const containerStyle: ViewStyle = {
    width,
    height,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  };

  return (
    <View style={containerStyle}>
      <Canvas style={{ flex: 1 }}>
        {paths.map((p, index) => (
          <Path 
            key={index}
            path={p} 
            style="stroke" 
            strokeWidth={3} 
            color={lineColors[index % lineColors.length] || theme.colors.interactivePrimary} 
            strokeJoin="round"
            strokeCap="round"
          />
        ))}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});
