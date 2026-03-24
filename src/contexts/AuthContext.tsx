'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type SignInParams = {
  email: string;
  password: string;
};

type SignUpParams = {
  email: string;
  password: string;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (params: SignInParams) => Promise<{ error: string | null }>;
  signUp: (params: SignUpParams) => Promise<{ error: string | null; requiresEmailVerification: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithFacebook: () => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Salary', 'Others'];

async function ensureUserProfile(user: User) {
  const email = user.email || null;

  await supabase.from('profiles').upsert(
    {
      id: user.id,
      email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  const categoryRows = DEFAULT_CATEGORIES.map(name => ({
    user_id: user.id,
    name,
  }));
  await supabase.from('categories').upsert(categoryRows, { onConflict: 'user_id,name' });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        void ensureUserProfile(data.session.user);
      }
      setLoading(false);
    };

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      if (
        nextSession?.user &&
        (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
      ) {
        void ensureUserProfile(nextSession.user);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    loading,
    signIn: async ({ email, password }) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message || null };
    },
    signUp: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return { error: error.message, requiresEmailVerification: false };
      }

      if (data.session?.user) {
        await ensureUserProfile(data.session.user);
      }

      return {
        error: null,
        requiresEmailVerification: !Boolean(data.session),
      };
    },
    signInWithGoogle: async () => {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      return { error: error?.message || null };
    },
    signInWithFacebook: async () => {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo },
      });
      return { error: error?.message || null };
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    },
  }), [loading, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
