/**
 * @module features/workout/components/ExercisePicker
 * @description High-performance bottom-sheet modal for selecting exercises.
 * 
 * Uses @gorhom/bottom-sheet for native 120Hz gesture animations.
 * Implements a debounced fuzzy-search query directly against the 
 * WatermelonDB exercises table, rendering results categorized by
 * MuscleGroup via an optimized BottomSheetSectionList.
 */

import { useMemo, useCallback, useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, TextInput, Pressable, type ViewStyle } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetSectionList } from '@gorhom/bottom-sheet';
import { Q } from '@nozbe/watermelondb';

import database from '@core/database';
import { TableName } from '@core/types';
import type { Exercise } from '@core/database/models';
import { useTheme } from '@ui/theme';
import { Typography } from '@ui/primitives';

// ─── Types ──────────────────────────────────────────────────────────

interface Section {
  readonly title: string;
  readonly data: readonly Exercise[];
}

export interface ExercisePickerRef {
  /** Opens the bottom sheet. */
  readonly present: () => void;
  /** Closes the bottom sheet. */
  readonly dismiss: () => void;
}

interface ExercisePickerProps {
  /** Callback fired when an exercise is selected. */
  readonly onSelectExercise: (exerciseId: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────

const ExercisePicker = forwardRef<ExercisePickerRef, ExercisePickerProps>(
  function ExercisePicker({ onSelectExercise }, ref) {
    const theme = useTheme();
    const sheetRef = useRef<BottomSheet>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [sections, setSections] = useState<readonly Section[]>([]);

    // ─── Debounce Search ────────────────────────────────────────────

    useEffect(() => {
      const handler = setTimeout(() => setDebouncedQuery(searchQuery), 250);
      return () => clearTimeout(handler);
    }, [searchQuery]);

    // ─── Database Query ─────────────────────────────────────────────

    useEffect(() => {
      let isMounted = true;

      async function fetchExercises() {
        const collection = database.get<Exercise>(TableName.EXERCISES);
        let query;

        if (debouncedQuery.trim().length > 0) {
          // Fuzzy search on name
          query = collection.query(
            Q.where('name', Q.like(`%${Q.sanitizeLikeString(debouncedQuery)}%`))
          );
        } else {
          query = collection.query();
        }

        const exercises = await query.fetch();

        if (!isMounted) return;

        // Group by muscle group
        const grouped = exercises.reduce((acc, exercise) => {
          const group = exercise.muscleGroup;
          const currentGroup = acc[group] ?? [];
          currentGroup.push(exercise);
          acc[group] = currentGroup;
          return acc;
        }, {} as Record<string, Exercise[]>);

        // Map to SectionList format and sort alphabetically
        const sectionData: Section[] = Object.keys(grouped).sort().map((key) => ({
          title: key,
          data: (grouped[key] ?? []).sort((a, b) => a.name.localeCompare(b.name)),
        }));

        setSections(sectionData);
      }

      void fetchExercises();

      return () => {
        isMounted = false;
      };
    }, [debouncedQuery]);

    // ─── API Exposure ───────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      present: () => {
        setSearchQuery(''); // Reset search on open
        sheetRef.current?.expand();
      },
      dismiss: () => sheetRef.current?.close(),
    }));

    // ─── Bottom Sheet Config ────────────────────────────────────────

    const snapPoints = useMemo(() => ['50%', '90%'], []);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
      ),
      []
    );

    // ─── Render Items ───────────────────────────────────────────────

    const renderItem = useCallback(
      ({ item }: { item: Exercise }) => (
        <Pressable
          style={({ pressed }) => [
            styles.itemContainer,
            {
              backgroundColor: pressed ? theme.colors.backgroundPressed : 'transparent',
              borderBottomColor: theme.colors.borderSubtle,
            },
          ]}
          onPress={() => {
            onSelectExercise(item.id);
            sheetRef.current?.close();
          }}
        >
          <Typography variant="bodyStrong">{item.name}</Typography>
          {item.isCompound && (
            <View style={[styles.compoundBadge, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Typography variant="micro" color="secondary">COMPOUND</Typography>
            </View>
          )}
        </Pressable>
      ),
      [theme, onSelectExercise]
    );

    const renderSectionHeader = useCallback(
      ({ section }: { section: Section }) => (
        <View style={[styles.sectionHeader, { backgroundColor: theme.colors.backgroundElevated }]}>
          <Typography variant="labelSmall" color="accent">
            {section.title.toUpperCase()}
          </Typography>
        </View>
      ),
      [theme]
    );

    // ─── Render ─────────────────────────────────────────────────────

    const searchContainerStyle: ViewStyle = {
      paddingHorizontal: theme.spacing['4'],
      paddingBottom: theme.spacing['3'],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.borderSubtle,
    };

    const searchInputStyle: import('react-native').TextStyle = {
      height: 44,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing['3'],
      color: theme.colors.textPrimary,
      fontSize: theme.fontSizes.md,
    };

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.colors.backgroundElevated }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
        keyboardBehavior="extend"
      >
        <View style={searchContainerStyle}>
          <TextInput
            style={searchInputStyle}
            placeholder="Search exercises..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <BottomSheetSectionList
          sections={sections as any}
          keyExtractor={(item: Exercise) => item.id}
          renderItem={renderItem as any}
          renderSectionHeader={renderSectionHeader as any}
          contentContainerStyle={{ paddingBottom: theme.spacing['8'] }}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheet>
    );
  }
);

ExercisePicker.displayName = 'ExercisePicker';

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  compoundBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

export default ExercisePicker;
