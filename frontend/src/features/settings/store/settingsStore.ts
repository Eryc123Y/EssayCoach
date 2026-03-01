import { create } from 'zustand';
import { settingsService } from '@/service/api/v2/auth';
import type {
  UserPreferences,
  UserPreferencesInput,
  SessionInfo,
  LoginHistoryItem
} from '@/service/api/v2/types';
import { toast } from 'sonner';

interface SettingsState {
  // Preferences
  preferences: UserPreferences | null;
  isLoading: boolean;
  isSaving: boolean;

  // Sessions
  sessions: SessionInfo[];
  isLoadingSessions: boolean;

  // Login History
  loginHistory: LoginHistoryItem[];
  isLoadingHistory: boolean;

  // Actions
  fetchPreferences: () => Promise<void>;
  updatePreferences: (data: UserPreferencesInput) => Promise<void>;
  fetchSessions: () => Promise<void>;
  revokeSession: (sessionKey: string) => Promise<void>;
  fetchLoginHistory: () => Promise<void>;
  reset: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  email_notifications: true,
  in_app_notifications: true,
  submission_alerts: true,
  grading_alerts: false,
  weekly_digest: true,
  language: 'en',
  theme: 'system'
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state
  preferences: null,
  isLoading: false,
  isSaving: false,
  sessions: [],
  isLoadingSessions: false,
  loginHistory: [],
  isLoadingHistory: false,

  fetchPreferences: async () => {
    set({ isLoading: true });
    try {
      const response = await settingsService.getPreferences();
      set({ preferences: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      set({ preferences: DEFAULT_PREFERENCES, isLoading: false });
      toast.error('Failed to load preferences');
    }
  },

  updatePreferences: async (data: UserPreferencesInput) => {
    set({ isSaving: true });
    try {
      const response = await settingsService.updatePreferences(data);
      set({ preferences: response.data, isSaving: false });
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      set({ isSaving: false });
      toast.error('Failed to update preferences');
      throw error;
    }
  },

  fetchSessions: async () => {
    set({ isLoadingSessions: true });
    try {
      const response = await settingsService.getSessions();
      set({ sessions: response.data, isLoadingSessions: false });
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      set({ isLoadingSessions: false });
      toast.error('Failed to load active sessions');
    }
  },

  revokeSession: async (sessionKey: string) => {
    try {
      await settingsService.revokeSession(sessionKey);
      // Remove from local state
      set((state) => ({
        sessions: state.sessions.filter((s) => s.session_key !== sessionKey)
      }));
      toast.success('Session revoked successfully');
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error('Failed to revoke session');
      throw error;
    }
  },

  fetchLoginHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const response = await settingsService.getLoginHistory();
      set({ loginHistory: response.data, isLoadingHistory: false });
    } catch (error) {
      console.error('Failed to fetch login history:', error);
      set({ isLoadingHistory: false });
      toast.error('Failed to load login history');
    }
  },

  reset: () => {
    set({
      preferences: null,
      isLoading: false,
      isSaving: false,
      sessions: [],
      isLoadingSessions: false,
      loginHistory: [],
      isLoadingHistory: false
    });
  }
}));
