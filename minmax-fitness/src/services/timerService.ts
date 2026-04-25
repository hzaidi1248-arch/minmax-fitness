/**
 * @module services/timerService
 * @description Bulletproof background-resilient rest timer.
 * 
 * Uses AppState listeners and absolute timestamps to ensure the timer
 * remains perfectly accurate even if the OS suspends the app.
 * Utilizes expo-notifications for background alerts and expo-haptics
 * for tactile feedback upon completion.
 */

import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useWorkoutStore } from '@store/workoutStore';

let timerInterval: NodeJS.Timeout | null = null;
let lastAppState: AppStateStatus = AppState.currentState;

/**
 * Initializes the global timer service. Should be called once at app boot.
 * 
 * - Subscribes to AppState changes to resync the timer when returning to foreground.
 * - Starts the ticking interval if a timer is active.
 */
export function initTimerService(): () => void {
  // Request notification permissions
  void Notifications.requestPermissionsAsync();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
  
  // Start the heartbeat interval that ticks the store
  timerInterval = setInterval(tickTimer, 1000);

  return () => {
    appStateSubscription.remove();
    if (timerInterval) clearInterval(timerInterval);
  };
}

/**
 * Starts a new rest timer with background resiliency.
 * @param durationSeconds Duration of the rest period.
 */
export async function startResilientRestTimer(durationSeconds: number): Promise<void> {
  if (durationSeconds <= 0) return;

  const endTime = Date.now() + durationSeconds * 1000;
  
  // 1. Update Zustand store with the absolute end time
  useWorkoutStore.getState().startRestTimer(durationSeconds, endTime);

  // 2. Schedule local notification for when the timer expires
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rest Complete ⏳',
      body: "Time's up! Let's get back to work.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: durationSeconds,
    },
  });
}

/**
 * Cancels the active rest timer and pending notifications.
 */
export async function cancelResilientRestTimer(): Promise<void> {
  useWorkoutStore.getState().cancelRestTimer();
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Internal Handlers ────────────────────────────────────────────────

function tickTimer(): void {
  const state = useWorkoutStore.getState();
  
  if (!state.isRestTimerActive || !state.restTimerEndTime) return;

  const now = Date.now();
  const remainingMs = state.restTimerEndTime - now;

  if (remainingMs <= 0) {
    // Timer finished
    useWorkoutStore.getState().cancelRestTimer(); // Stop the active state
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    // Timer ticking
    useWorkoutStore.getState().syncRestTimer(Math.ceil(remainingMs / 1000));
  }
}

/**
 * Handles AppState changes (Foreground <-> Background).
 * When returning to foreground, we recalculate the remaining time
 * immediately so the UI snaps to the correct value without waiting for the next tick.
 */
function handleAppStateChange(nextAppState: AppStateStatus): void {
  if (lastAppState.match(/inactive|background/) && nextAppState === 'active') {
    // App has come to the foreground! Resync the timer immediately.
    tickTimer();
  }
  lastAppState = nextAppState;
}
