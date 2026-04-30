import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

function formatOAuthErrorMessage(error: any) {
  const message = String(error?.message || error?.error_description || error?.msg || 'Authentication failed.');

  if (/unsupported provider/i.test(message)) {
    return 'Google sign-in is not enabled for this production Supabase project yet.';
  }

  return message;
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
    emailRedirectTo?: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('[AuthContext] Init - supabaseUrl:', supabaseUrl?.substring(0, 30) + '...');
  console.log('[AuthContext] Init - supabaseAnonKey:', supabaseAnonKey?.substring(0, 20) + '...');

  useEffect(() => {
    console.log('[AuthContext] Getting initial session...');
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('[AuthContext] Got session:', session?.user?.email);
        setSession(session);
        setLoading(false);
      })
      .catch((error) => {
        console.error('[AuthContext] Error getting session:', error);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('[AuthContext] Auth state changed:', _event, session?.user?.email);
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] signIn called:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('[AuthContext] signInWithPassword response:', { data, error });
      if (error) {
        console.error('[AuthContext] signIn error:', error);
        throw error;
      }
      console.log('[AuthContext] signIn successful');
    } catch (err) {
      console.error('[AuthContext] signIn exception:', err);
      throw err;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
    emailRedirectTo?: string,
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...(metadata ? { data: metadata } : {}),
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
        },
      });

      if (error) {
        throw error;
      }

      return {
        requiresEmailConfirmation: !data.session,
      };
    } catch (err) {
      console.error('[AuthContext] signUp exception:', err);
      throw err;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: redirectTo
          ? {
              redirectTo,
            }
          : undefined,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      throw new Error(formatOAuthErrorMessage(error));
    }
  };

  const value: AuthContextType = {
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
