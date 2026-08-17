'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type AuthGateProps = {
  open: boolean;
  onClose: () => void;
  intent?: string;
  nextPath?: string;
};

export function AuthGate({ open, onClose, intent, nextPath }: AuthGateProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'join'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
        if (signError) throw signError;
      } else {
        if (password.length < 6) throw new Error('Use at least 6 characters');
        const { error: signError } = await supabase.auth.signUp({ email, password });
        if (signError) throw signError;
      }
      onClose();
      if (nextPath) router.push(nextPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not continue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--espresso)]/40 px-4 py-6 sm:items-center">
      <div className="w-full max-w-md border border-[var(--line-strong)] bg-[var(--paper)] p-7 shadow-2xl">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--stone-dark)]">
          Keep this
        </p>
        <h2 className="font-display mt-2 text-3xl">
          {intent || 'An account is only needed to save this.'}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--espresso-soft)]">
          Search and browse stay open. Sign in when you want the other person to see it too.
        </p>

        <div className="mt-5 flex gap-4 text-[0.72rem] uppercase tracking-[0.16em]">
          <button type="button" onClick={() => setMode('signin')} className={mode === 'signin' ? 'text-[var(--oxblood)]' : 'text-[var(--stone-dark)]'}>
            Sign in
          </button>
          <button type="button" onClick={() => setMode('join')} className={mode === 'join' ? 'text-[var(--oxblood)]' : 'text-[var(--stone-dark)]'}>
            Join
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <p className="border border-[var(--oxblood)]/40 bg-[var(--oxblood)]/8 px-3 py-2 text-sm text-[var(--oxblood)]">{error}</p>}
          <div>
            <label htmlFor="gate-email">Email</label>
            <input id="gate-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="gate-password">Password</label>
            <input id="gate-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'join' ? 'new-password' : 'current-password'} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'One moment' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-[var(--stone-dark)]">
          <button type="button" onClick={onClose}>
            Not now
          </button>
          <Link href={mode === 'signin' ? '/signup' : '/login'} className="hover:text-[var(--espresso)]">
            Full page
          </Link>
        </div>
      </div>
    </div>
  );
}
