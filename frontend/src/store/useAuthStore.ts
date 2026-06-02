import { create } from 'zustand';
import type { UserPlatformPreferences } from '../modules/auth/api';
import { hasAuthSessionHint } from '../core/auth/clientSession';

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

export function hasAuthSession(): boolean {
  return hasAuthSessionHint();
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userInfo: UserInfo | null;
  setTokens: (token: string, refreshToken: string) => void;
  setUserInfo: (userInfo: UserInfo) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  refreshToken: null,
  userInfo: null,
  setTokens: (token, refreshToken) => set({ token, refreshToken }),
  setUserInfo: (userInfo) => set({ userInfo }),
  clearAuth: () => set({ token: null, refreshToken: null, userInfo: null }),
}));
