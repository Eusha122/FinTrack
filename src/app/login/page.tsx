'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'signin' | 'signup';
type SocialProvider = 'google' | 'facebook';

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signUp,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    if (oauthError) {
      let cancelled = false;
      Promise.resolve().then(() => {
        if (cancelled) return;
        setError(oauthError);
        params.delete('error');
        const next = params.toString();
        const cleanUrl = next ? `${window.location.pathname}?${next}` : window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      });
      return () => {
        cancelled = true;
      };
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    if (mode === 'signin') {
      const result = await signIn({ email: email.trim(), password });
      if (result.error) {
        setError(result.error);
      } else {
        router.replace('/');
      }
      setLoading(false);
      return;
    }

    const result = await signUp({ email: email.trim(), password });
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.requiresEmailVerification) {
      setNotice('Account created. Please verify your email, then sign in.');
      setMode('signin');
      setLoading(false);
      return;
    }

    router.replace('/');
    setLoading(false);
  };

  const handleSocialSignIn = async (provider: SocialProvider) => {
    setSocialLoading(provider);
    setError(null);
    setNotice(null);
    const result = provider === 'google'
      ? await signInWithGoogle()
      : await signInWithFacebook();
    if (result.error) {
      setError(result.error);
      setSocialLoading(null);
    }
  };

  if (authLoading) {
    return (
      <main className="auth-loading-screen">
        <div className="auth-loading-dot" />
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <div className="auth-brand-backdrop" />
        <div className="auth-brand-content">
          <div>
            <h1 className="auth-logo">FinTrack</h1>
            <p className="auth-tagline">Track your finances with clarity and control.</p>
          </div>
          <div className="auth-headline-wrap">
            <span className="auth-kicker">Security First</span>
            <h2 className="auth-headline">A private vault for your daily money decisions.</h2>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <header className="auth-card-header">
            <h2>{mode === 'signin' ? 'Welcome back' : 'Create account'}</h2>
            <p>
              {mode === 'signin'
                ? 'Sign in to access your dashboard.'
                : 'Start tracking with a secure personal workspace.'}
            </p>
          </header>

          <div className="auth-socials">
            <button
              type="button"
              className="auth-social-btn"
              onClick={() => handleSocialSignIn('google')}
              disabled={loading || Boolean(socialLoading)}
            >
              <span className="auth-google-mark" aria-hidden="true">G</span>
              {socialLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
            </button>
            <button
              type="button"
              className="auth-social-btn"
              onClick={() => handleSocialSignIn('facebook')}
              disabled={loading || Boolean(socialLoading)}
            >
              <span className="auth-facebook-mark" aria-hidden="true">f</span>
              {socialLoading === 'facebook' ? 'Connecting...' : 'Continue with Facebook'}
            </button>
          </div>

          <div className="auth-divider">or continue with email</div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field-group">
              <label className="auth-label" htmlFor="email">
                Email Address
              </label>
              <div className="auth-field">
                <Mail size={16} />
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label" htmlFor="password">
                Password
              </label>
              <div className="auth-field">
                <Lock size={16} />
                <input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}
            {notice && <p className="auth-notice">{notice}</p>}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(prev => (prev === 'signin' ? 'signup' : 'signin'));
                setError(null);
                setNotice(null);
              }}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <footer className="auth-footer">
            <ShieldCheck size={14} />
            <span>Your data is private and scoped to your account.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
