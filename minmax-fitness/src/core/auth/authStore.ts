/**
 * @module core/auth/authStore
 * @description Secure token management and auth state.
 * Uses expo-secure-store for storing JWTs securely.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'MINMAX_AUTH_TOKEN';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setToken: async (token: string) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      set({ token, isAuthenticated: true });
    } catch (error) {
      console.error('Failed to securely store the token', error);
    }
  },

  clearToken: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      set({ token: null, isAuthenticated: false });
    } catch (error) {
      console.error('Failed to remove the secure token', error);
    }
  },

  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        set({ token, isAuthenticated: true, isLoading: false });
      } else {
        set({ token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load the secure token', error);
      set({ token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
