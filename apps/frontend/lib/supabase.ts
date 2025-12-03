import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client for browser environment
// Check if using placeholder values
const isMock = process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') ||
               process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon-key');

export const supabase = isMock ? createMockClient() : createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    },
  }
);

function createMockClient() {
  return {
    auth: {
      getSession: async () => ({
        data: {
          session: {
            access_token: 'dev_mock_user',
            token_type: 'bearer',
            user: {
              id: 'dev-user-id',
              email: 'dev@example.com',
              user_metadata: {}
            }
          }
        },
        error: null
      }),
      getUser: async () => ({
        data: {
          user: {
            id: 'dev-user-id',
            email: 'dev@example.com',
            user_metadata: {}
          }
        },
        error: null
      }),
      signInWithPassword: async () => ({ data: null, error: null }),
      signUp: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
    },
  };
}

// Helper to get current session
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// Helper to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Sign in with email/password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// Sign up with email/password
export async function signUp(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split('@')[0],
      },
    },
  });
  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Reset password
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
}