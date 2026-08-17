'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Kicker } from '@/components/ui';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Use at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error: signError } = await supabase.auth.signUp({ email, password });
      if (signError) throw signError;
      router.push('/profile/setup');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create the account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <Kicker>Join</Kicker>
      <h1 className="font-display mt-3 text-5xl">A name on the door</h1>
      <p className="mt-3 text-sm text-[var(--espresso-soft)]">
        Only needed to save a trip, send a letter, or link a partner. You can still look around first.
      </p>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        {error && <p className="border border-[var(--oxblood)]/30 px-3 py-2 text-sm text-[var(--oxblood)]">{error}</p>}
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label htmlFor="confirm">Confirm</label>
          <input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'One moment' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-[var(--stone-dark)]">
        Already here? <Link href="/login" className="text-[var(--espresso)] underline underline-offset-4">Sign in</Link>
      </p>
    </div>
  );
}
