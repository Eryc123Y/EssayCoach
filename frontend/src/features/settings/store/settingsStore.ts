import { create } from 'zustand';
import { settingsService } from '@/service/api/v2/auth';
import type {
  UserPreferences,
  UserPreferencesInput,
  SessionInfo,
  LoginHistoryItem,
} from '@/service/api/v2/types';
import { toast } from 'sonner';
import { message, type MessageId } from '@/locales';

const currentMessage = (id: MessageId) => message(id, document.documentElement.lang.startsWith('zh') ? 'zh' : 'en');

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
  social_alerts: true,
  weekly_digest: false,
  language: 'en',
  theme: 'system',
};

export const useSettingsStore = create<SettingsState>((set) => ({
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
      toast.error(currentMessage('settings.failedToLoadPreferences'));
    }
  },

  updatePreferences: async (data: UserPreferencesInput) => {
    set({ isSaving: true });
    try {
      const response = await settingsService.updatePreferences(data);
      set({ preferences: response.data, isSaving: false });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      set({ isSaving: false });
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
      toast.error(currentMessage('settings.failedToLoadSessions'));
    }
  },

  revokeSession: async (sessionKey: string) => {
    try {
      await settingsService.revokeSession(sessionKey);
      // Remove from local state
      set((state) => ({
        sessions: state.sessions.filter((s) => s.session_key !== sessionKey),
      }));
      toast.success(currentMessage('settings.sessionRevoked'));
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error(currentMessage('settings.failedToRevokeSession'));
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
      toast.error(currentMessage('settings.failedToLoadHistory'));
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
      isLoadingHistory: false,
    });
  },
}));
