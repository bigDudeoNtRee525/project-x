import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for development when env vars are missing
let supabaseClient: any = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Create real Supabase client
  supabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
} else if (process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  Supabase environment variables missing. Using mock authentication for development.');
  // Create mock client that always returns a dummy user
  supabaseClient = {
    auth: {
      getUser: async (token: string) => {
        // For development, accept any token that starts with 'dev_'
        if (token.startsWith('dev_')) {
          const userId = token.substring(4) || 'dev-user-id';
          return {
            data: {
              user: {
                id: userId,
                email: 'dev@example.com',
                user_metadata: {},
              },
            },
            error: null,
          };
        }
        return { data: { user: null }, error: new Error('Invalid token') };
      },
    },
  };
} else {
  throw new Error('Missing Supabase environment variables in production');
}

export const supabase = supabaseClient;

// Verify JWT token from request
export async function verifyAuthToken(token: string) {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}