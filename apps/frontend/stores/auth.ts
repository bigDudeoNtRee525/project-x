import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { authApi } from '@/lib/api';
import type { User } from '@meeting-task-tool/shared';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  checkAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      }),

      setLoading: (isLoading) => set({ isLoading }),

      checkAuth: async () => {
        try {
          const { setUser } = get();

          // Check if we have a Supabase session
          const supabaseUser = await getCurrentUser();

          if (!supabaseUser) {
            setUser(null);
            return;
          }

          // Get or create user profile from our backend
          try {
            const response = await authApi.getMe();
            setUser(response.user);
          } catch (error) {
            console.error('Failed to get user profile:', error);
            // If backend fails but Supabase auth succeeded,
            // create a minimal user object from Supabase data
            setUser({
              id: supabaseUser.id,
              email: supabaseUser.email!,
              name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      signIn: async (email: string, password: string) => {
        const { setLoading } = get();
        setLoading(true);
        try {
          await supabase.auth.signInWithPassword({ email, password });
          await get().checkAuth();
        } finally {
          setLoading(false);
        }
      },

      signUp: async (email: string, password: string, name?: string) => {
        const { setLoading } = get();
        setLoading(true);
        try {
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name || email.split('@')[0],
              },
            },
          });
          // Note: User won't be immediately authenticated if email confirmation is required
          set({ user: null, isAuthenticated: false, isLoading: false });
        } finally {
          setLoading(false);
        }
      },

      signOut: async () => {
        const { setLoading } = get();
        setLoading(true);
        try {
          await supabase.auth.signOut();
          get().clearAuth();
        } finally {
          setLoading(false);
        }
      },

      clearAuth: () => set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);