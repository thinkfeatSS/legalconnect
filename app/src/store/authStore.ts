import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCachedToken } from '../services/api';

export type UserRole = 'CLIENT' | 'LAWYER';

interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: async (user, token) => {
    await AsyncStorage.setItem('accessToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    setCachedToken(token);
    set({ user, token });
  },

  clearAuth: async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('user');
    setCachedToken(null);
    set({ user: null, token: null });
  },

  loadFromStorage: async () => {
    try {
      const tokenVal = await AsyncStorage.getItem('accessToken');
      const userStr = await AsyncStorage.getItem('user');
      if (tokenVal && userStr) {
        setCachedToken(tokenVal);
        set({ user: JSON.parse(userStr), token: tokenVal });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
