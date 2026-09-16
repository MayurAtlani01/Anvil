import { create } from 'zustand';
import { storage } from '@/services/storage/storage';
import { apiFetch } from '@/services/api/apiClient';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at?: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AUTH_TOKEN_KEY = 'anvil_auth_token';
const AUTH_USER_KEY = 'anvil_user_profile';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    try {
      const [token, user] = await Promise.all([
        storage.get<string>(AUTH_TOKEN_KEY, ''),
        storage.get<UserProfile | null>(AUTH_USER_KEY, null),
      ]);

      if (token && user) {
        set({ token, user, isAuthenticated: true });

        // Verify/refresh profile in the background
        const profile = await apiFetch<UserProfile>('/api/auth/me');
        if (profile) {
          set({ user: profile });
          await storage.set(AUTH_USER_KEY, profile);
          if (profile.full_name) {
            await storage.set('anvil_user_name', profile.full_name);
          }
        }
      }
    } catch (err) {
      console.debug('[AuthStore] Hydration error:', err);
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res || !res.access_token) {
        throw new Error('Invalid username/email or password.');
      }

      await Promise.all([
        storage.set(AUTH_TOKEN_KEY, res.access_token),
        storage.set(AUTH_USER_KEY, res.user),
        storage.set('anvil_user_name', res.user.full_name || res.user.email),
      ]);

      set({
        token: res.access_token,
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  register: async (fullName: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Register
      const reg = await apiFetch<UserProfile>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      if (!reg) {
        throw new Error('Registration failed. Username/email may already be in use.');
      }

      // 2. Immediately log in
      return await get().login(email, password);
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please try again.';
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  logout: async () => {
    await Promise.all([
      storage.remove(AUTH_TOKEN_KEY),
      storage.remove(AUTH_USER_KEY),
    ]);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
