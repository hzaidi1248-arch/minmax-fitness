/**
 * @module store/workoutStore
 * @description Zustand store for transient active-workout UI state.
 *
 * CRITICAL ARCHITECTURAL BOUNDARY: This store manages ONLY ephemeral
 * session state that exists while a workout is in progress. It does NOT
 * store any persistent data — all durable records are written to
 * WatermelonDB via the database layer.
 *
 * This store tracks:
 * - Which workout session is currently active
 * - Which sets have been completed (for UI rendering)
 * - The rest timer countdown between sets
 * - Transient input buffer for the numeric keypad
 *
 * Uses the slice pattern for modularity and testability.
 */

import { create } from 'zustand';

// ─── Slice: Active Workout ──────────────────────────────────────────

interface ActiveWorkoutState {
  /** UUID of the active WorkoutSession, or null if no workout is in progress. */
  readonly currentSessionId: string | null;
  /** Global user preference for metric vs imperial units. */
  readonly isMetric: boolean;
  /** Ordered array of SetLog UUIDs that have been completed in this session. */
  readonly completedSetIds: readonly string[];
  /** Rest timer in seconds. 0 = timer not running. */
  readonly restTimerSeconds: number;
  /** Whether the rest timer is actively counting down. */
  readonly isRestTimerActive: boolean;
  /** Absolute UNIX timestamp (ms) when the timer should end. Resilient to backgrounding. */
  readonly restTimerEndTime: number | null;
  /** Queue of exercise IDs that have triggered a PR, waiting to be celebrated in UI. */
  readonly prCelebrationQueue: readonly string[];
}

interface ActiveWorkoutActions {
  /**
   * Begins a new workout session.
   * Resets all transient state and sets the active session ID.
   *
   * @param sessionId - UUID of the WorkoutSession being started.
   */
  readonly startWorkout: (sessionId: string) => void;

  /**
   * Records a completed set in the transient UI state.
   * The actual SetLog record must be written to WatermelonDB separately.
   *
   * @param setId - UUID of the SetLog that was just completed.
   */
  readonly logSet: (setId: string) => void;

  /**
   * Starts the rest timer countdown.
   *
   * @param durationSeconds - Total rest duration in seconds.
   * @param endTimeMs - Absolute timestamp in milliseconds when the timer expires.
   */
  readonly startRestTimer: (durationSeconds: number, endTimeMs: number) => void;

  /**
   * Synchronizes the UI timer display with the actual remaining time.
   */
  readonly syncRestTimer: (remainingSeconds: number) => void;

  /**
   * Decrements the rest timer by 1 second. Called by an interval.
   * Automatically stops the timer when it reaches 0.
   */
  readonly tickRestTimer: () => void;

  /**
   * Stops the rest timer immediately (e.g., user skips rest).
   */
  readonly cancelRestTimer: () => void;

  /**
   * Ends the current workout session and resets all transient state.
   */
  readonly finishWorkout: () => void;

  /**
   * Pushes an exercise ID into the PR celebration queue.
   */
  readonly enqueuePRCelebration: (exerciseId: string) => void;

  /**
   * Removes the first exercise ID from the PR celebration queue.
   */
  readonly dequeuePRCelebration: () => void;

  /**
   * Toggles the global unit preference between KG and LBS.
   */
  readonly toggleMetric: () => void;
}

type ActiveWorkoutSlice = ActiveWorkoutState & ActiveWorkoutActions;

// ─── Slice: Input Buffer ────────────────────────────────────────────

interface InputBufferState {
  /** Current weight value being entered via the numeric keypad. */
  readonly weightInput: string;
  /** Current reps value being entered via the numeric keypad. */
  readonly repsInput: string;
  /** Current RIR value being entered. */
  readonly rirInput: string;
  /** Which input field the keypad is currently targeting. */
  readonly activeField: 'weight' | 'reps' | 'rir' | null;
}

interface InputBufferActions {
  /**
   * Sets which input field the numeric keypad feeds into.
   *
   * @param field - The field to target, or null to deactivate the keypad.
   */
  readonly setActiveField: (field: InputBufferState['activeField']) => void;

  /**
   * Appends a digit or decimal point to the currently active input.
   *
   * @param char - A single character: '0'-'9' or '.'
   */
  readonly appendToInput: (char: string) => void;

  /**
   * Removes the last character from the currently active input.
   */
  readonly backspaceInput: () => void;

  /**
   * Clears the currently active input field.
   */
  readonly clearInput: () => void;

  /**
   * Resets all input buffers to empty strings.
   */
  readonly resetAllInputs: () => void;
}

type InputBufferSlice = InputBufferState & InputBufferActions;

// ─── Combined Store ─────────────────────────────────────────────────

type WorkoutStore = ActiveWorkoutSlice & InputBufferSlice;

// ─── Initial States ─────────────────────────────────────────────────

const initialActiveWorkoutState: ActiveWorkoutState = {
  currentSessionId: null,
  isMetric: false,
  completedSetIds: [],
  restTimerSeconds: 0,
  isRestTimerActive: false,
  restTimerEndTime: null,
  prCelebrationQueue: [],
};

const initialInputBufferState: InputBufferState = {
  weightInput: '',
  repsInput: '',
  rirInput: '',
  activeField: null,
};

// ─── Validation Helpers ─────────────────────────────────────────────

/** Maximum character length for input fields to prevent overflow. */
const MAX_INPUT_LENGTH: number = 7;

/**
 * Validates that a character is a legal keypad input.
 * Only digits 0-9 and a single decimal point are allowed.
 */
function isValidInputChar(
  char: string,
  currentValue: string,
  field: InputBufferState['activeField']
): boolean {
  if (char.length !== 1) return false;
  if (currentValue.length >= MAX_INPUT_LENGTH) return false;

  // Digits always valid
  if (char >= '0' && char <= '9') return true;

  // Decimal only valid for weight, and only once
  if (char === '.' && field === 'weight' && !currentValue.includes('.')) {
    return true;
  }

  return false;
}

// ─── Store Definition ───────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutStore>()((set) => ({
  // ── Active Workout State ─────────────────────────────────
  ...initialActiveWorkoutState,

  startWorkout: (sessionId: string): void => {
    set({
      ...initialActiveWorkoutState,
      ...initialInputBufferState,
      currentSessionId: sessionId,
    });
  },

  logSet: (setId: string): void => {
    set((state: WorkoutStore) => ({
      completedSetIds: [...state.completedSetIds, setId],
    }));
  },

  startRestTimer: (durationSeconds: number, endTimeMs: number): void => {
    if (durationSeconds <= 0) return;
    set({
      restTimerSeconds: Math.round(durationSeconds),
      isRestTimerActive: true,
      restTimerEndTime: endTimeMs,
    });
  },

  syncRestTimer: (remainingSeconds: number): void => {
    set({
      restTimerSeconds: Math.max(0, remainingSeconds),
    });
  },

  tickRestTimer: (): void => {
    set((state: WorkoutStore) => {
      if (!state.isRestTimerActive || state.restTimerSeconds <= 0) {
        return { restTimerSeconds: 0, isRestTimerActive: false, restTimerEndTime: null };
      }
      const next: number = state.restTimerSeconds - 1;
      return {
        restTimerSeconds: next,
        isRestTimerActive: next > 0,
        restTimerEndTime: next > 0 ? state.restTimerEndTime : null,
      };
    });
  },

  cancelRestTimer: (): void => {
    set({ restTimerSeconds: 0, isRestTimerActive: false, restTimerEndTime: null });
  },

  finishWorkout: (): void => {
    set({
      ...initialActiveWorkoutState,
      ...initialInputBufferState,
    });
  },

  enqueuePRCelebration: (exerciseId: string): void => {
    set((state: WorkoutStore) => ({
      prCelebrationQueue: [...state.prCelebrationQueue, exerciseId],
    }));
  },

  dequeuePRCelebration: (): void => {
    set((state: WorkoutStore) => ({
      prCelebrationQueue: state.prCelebrationQueue.slice(1),
    }));
  },

  toggleMetric: (): void => {
    set((state: WorkoutStore) => ({
      isMetric: !state.isMetric,
    }));
  },

  // ── Input Buffer State ───────────────────────────────────
  ...initialInputBufferState,

  setActiveField: (field: InputBufferState['activeField']): void => {
    set({ activeField: field });
  },

  appendToInput: (char: string): void => {
    set((state: WorkoutStore) => {
      const { activeField } = state;
      if (activeField === null) return state;

      const fieldKey: keyof Pick<
        InputBufferState,
        'weightInput' | 'repsInput' | 'rirInput'
      > = `${activeField}Input` as const;
      const currentValue: string = state[fieldKey];

      if (!isValidInputChar(char, currentValue, activeField)) {
        return state;
      }

      return { [fieldKey]: currentValue + char };
    });
  },

  backspaceInput: (): void => {
    set((state: WorkoutStore) => {
      const { activeField } = state;
      if (activeField === null) return state;

      const fieldKey: keyof Pick<
        InputBufferState,
        'weightInput' | 'repsInput' | 'rirInput'
      > = `${activeField}Input` as const;
      const currentValue: string = state[fieldKey];

      if (currentValue.length === 0) return state;

      return { [fieldKey]: currentValue.slice(0, -1) };
    });
  },

  clearInput: (): void => {
    set((state: WorkoutStore) => {
      const { activeField } = state;
      if (activeField === null) return state;

      const fieldKey: string = `${activeField}Input`;
      return { [fieldKey]: '' };
    });
  },

  resetAllInputs: (): void => {
    set(initialInputBufferState);
  },
}));

// ─── Selector Exports ───────────────────────────────────────────────

/**
 * Selector: Is a workout currently in progress?
 * Use this to conditionally render the active workout overlay.
 */
export const selectIsWorkoutActive = (state: WorkoutStore): boolean =>
  state.currentSessionId !== null;

/**
 * Selector: Number of sets completed in the current session.
 */
export const selectCompletedSetCount = (state: WorkoutStore): number =>
  state.completedSetIds.length;

/**
 * Selector: Formatted rest timer string (MM:SS).
 */
export const selectFormattedRestTimer = (state: WorkoutStore): string => {
  const minutes: number = Math.floor(state.restTimerSeconds / 60);
  const seconds: number = state.restTimerSeconds % 60;
  const paddedMinutes: string = String(minutes).padStart(2, '0');
  const paddedSeconds: string = String(seconds).padStart(2, '0');
  return `${paddedMinutes}:${paddedSeconds}`;
};

/**
 * Selector: Parsed numeric value of the current weight input.
 * Returns null if the input is empty or invalid.
 */
export const selectParsedWeight = (state: WorkoutStore): number | null => {
  if (state.weightInput === '' || state.weightInput === '.') return null;
  const parsed: number = parseFloat(state.weightInput);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Selector: Parsed numeric value of the current reps input.
 * Returns null if the input is empty or invalid.
 */
export const selectParsedReps = (state: WorkoutStore): number | null => {
  if (state.repsInput === '') return null;
  const parsed: number = parseInt(state.repsInput, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Selector: Parsed numeric value of the current RIR input.
 * Returns null if the input is empty.
 */
export const selectParsedRir = (state: WorkoutStore): number | null => {
  if (state.rirInput === '') return null;
  const parsed: number = parseInt(state.rirInput, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
