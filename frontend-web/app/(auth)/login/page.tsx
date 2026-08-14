'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Kicker } from '@/components/ui';

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/home';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
      if (signError) throw signError;
      router.push(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <Kicker>Account</Kicker>
      <h1 className="font-display mt-3 text-5xl">Welcome back</h1>
      <p className="mt-3 text-sm text-[var(--espresso-soft)]">
        The house is still open without this. Sign in to keep a trip, send a letter, or link someone.
      </p>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        {error && <p className="border border-[var(--oxblood)]/30 px-3 py-2 text-sm text-[var(--oxblood)]">{error}</p>}
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'One moment' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-[var(--stone-dark)]">
        New here? <Link href="/signup" className="text-[var(--espresso)] underline underline-offset-4">Join</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
