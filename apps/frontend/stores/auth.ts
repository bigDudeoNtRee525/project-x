import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { authApi } from '@/lib/api';
import type { User, TeamWithMembers } from '@meeting-task-tool/shared';

interface AuthState {
  user: User | null;
  team: TeamWithMembers | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasTeam: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTeam: (team: TeamWithMembers | null) => void;
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
      team: null,
      isLoading: false,
      isAuthenticated: false,
      hasTeam: false,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      }),

      setTeam: (team) => set({
        team,
        hasTeam: !!team,
      }),

      setLoading: (isLoading) => set({ isLoading }),

      checkAuth: async () => {
        try {
          const { setUser, setTeam } = get();

          // Check if we have a Supabase session
          const supabaseUser = await getCurrentUser();

          if (!supabaseUser) {
            setUser(null);
            setTeam(null);
            return;
          }

          // Get or create user profile from our backend (now includes team)
          try {
            const response = await authApi.getMe();
            const data = response as any;
            setUser(data.user);
            setTeam(data.team || null);
          } catch (error) {
            console.error('Failed to get user profile:', error);
            // If backend fails but Supabase auth succeeded,
            // create a minimal user object from Supabase data
            setUser({
              id: supabaseUser.id,
              email: supabaseUser.email!,
              name: (supabaseUser.user_metadata as any)?.name || supabaseUser.email?.split('@')[0] || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            setTeam(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ user: null, team: null, isAuthenticated: false, hasTeam: false, isLoading: false });
        }
      },

      signIn: async (email: string, password: string) => {
        const { setLoading } = get();
        setLoading(true);
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            throw new Error(error.message);
          }
          // Supabase returns null session (no error) when email is not confirmed
          if (!data.session) {
            throw new Error('Please confirm your email address before signing in. Check your inbox for the confirmation link.');
          }
          await get().checkAuth();
        } finally {
          setLoading(false);
        }
      },

      signUp: async (email: string, password: string, name?: string) => {
        const { setLoading } = get();
        setLoading(true);
        try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name || email.split('@')[0],
              },
            },
          });
          if (error) {
            throw new Error(error.message);
          }
          // User needs to confirm email before being authenticated
          set({ user: null, isAuthenticated: false, isLoading: false });
        } finally {
          setLoading(false);
        }
      },

      signOut: async () => {
        const { setLoading } = get();
        setLoading(true);
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('Sign out error:', error.message);
          }
          // Always clear local auth state even if API call fails
          get().clearAuth();
        } finally {
          setLoading(false);
        }
      },

      clearAuth: () => set({
        user: null,
        team: null,
        isAuthenticated: false,
        hasTeam: false,
        isLoading: false
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        team: state.team,
        isAuthenticated: state.isAuthenticated,
        hasTeam: state.hasTeam,
      }),
    }
  )
);