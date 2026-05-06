import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserPlatformPreferences } from '../modules/auth/api';

export const ACCESS_TOKEN_KEY = 'pantheon_access_token';
export const REFRESH_TOKEN_KEY = 'pantheon_refresh_token';

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  perms?: string[];
  preferences?: UserPlatformPreferences;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userInfo: UserInfo | null;
  setTokens: (token: string, refreshToken: string) => void;
  setUserInfo: (userInfo: UserInfo) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: localStorage.getItem(ACCESS_TOKEN_KEY),
      refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
      userInfo: null,
      setTokens: (token, refreshToken) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        set({ token, refreshToken });
      },
      setUserInfo: (userInfo) => set({ userInfo }),
      clearAuth: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        set({ token: null, refreshToken: null, userInfo: null });
      },
    }),
    {
      name: 'pantheon-auth-storage',
    },
  ),
);
