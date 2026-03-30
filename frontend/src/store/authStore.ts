import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

export type { User };

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('token', accessToken);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },
      
      setUser: (user) => set({ user }),
      
      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('token', accessToken);
        set({ accessToken, refreshToken });
      },
      
      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
      
      hasRole: (role) => {
        const { user } = get();
        return user?.roles?.includes(role) ?? false;
      },
    }),
    {
      name: 'kumashaurma-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);