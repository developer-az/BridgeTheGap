'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, EmptyState, Kicker, RoomGate } from '@/components/ui';
import { api } from '@/lib/api';
import { Connection, User } from '@/types';

export default function ConnectPage() {
  const { session, profile, loading, refreshProfile } = useAuth();
  const [code, setCode] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [found, setFound] = useState<User | null>(null);
  const [university, setUniversity] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const load = async () => {
    const [conns] = await Promise.all([api.getConnections()]);
    setConnections(conns);
    await refreshProfile();
    setLoaded(true);
  };

  useEffect(() => {
    if (!session || loading) return;
    load().catch(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, loading]);

  if (loading) {
    return <div className="px-5 py-32 text-center text-[var(--stone-dark)]">Finding the door…</div>;
  }

  if (!session) {
    return (
      <RoomGate
        title="A partner is a code, not a feed."
        body="Give them eight letters. They enter yours. That is the introduction — no browsing strangers required."
      />
    );
  }

  if (!loaded) {
    return <div className="px-5 py-32 text-center text-[var(--stone-dark)]">Finding the door…</div>;
  }

  const accepted = connections.filter((c) => c.status === 'accepted');
  const pending = connections.filter((c) => c.status === 'pending');

  const lookup = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setFound(null);
    try {
      const user = await api.getUserByPublicId(code.trim().toUpperCase());
      setFound(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Not found');
    }
  };

  const connectTo = async (id: string) => {
    try {
      await api.requestConnection(id);
      setFound(null);
      setCode('');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send');
    }
  };

  const copy = async () => {
    if (!profile?.public_id) return;
    await navigator.clipboard.writeText(profile.public_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <Kicker>Partner</Kicker>
      <h1 className="font-display mt-3 text-4xl md:text-6xl">Give them this</h1>
      <p className="mt-4 text-[var(--espresso-soft)]">
        One code. No directory of everyone in the house. University search is still here if you need it — folded away.
      </p>

      <div className="mt-10 border border-[var(--line-strong)] bg-[var(--paper)] px-6 py-10 text-center">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--stone-dark)]">Your code</p>
        <p className="font-display mt-3 text-5xl tracking-[0.18em]">{profile?.public_id || '········'}</p>
        <button type="button" onClick={copy} className="mt-5 text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <form onSubmit={lookup} className="mt-10 space-y-4">
        <label htmlFor="their-code">Their code</label>
        <div className="flex gap-3">
          <input
            id="their-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD1234"
            className="tracking-[0.2em]"
          />
          <Button type="submit">Find</Button>
        </div>
      </form>
      {error && <p className="mt-3 text-sm text-[var(--oxblood)]">{error}</p>}

      {found && (
        <div className="mt-6 border border-[var(--line)] p-5">
          <p className="font-display text-3xl">{found.name || found.email}</p>
          <p className="mt-1 text-sm text-[var(--stone-dark)]">
            {[found.university_name, found.location_city].filter(Boolean).join(' · ')}
          </p>
          <Button className="mt-5" onClick={() => connectTo(found.id)}>
            Send a link request
          </Button>
        </div>
      )}

      {pending.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-3xl">Waiting</h2>
          <ul className="mt-5 space-y-3">
            {pending.map((item) => (
              <li key={item.id} className="flex items-center justify-between border border-[var(--line)] px-4 py-4">
                <span className="font-display text-xl">{item.partner?.name || 'Pending'}</span>
                <div className="flex gap-4 text-[0.7rem] uppercase tracking-[0.14em]">
                  <button type="button" onClick={() => api.acceptConnection(item.id).then(load)}>Accept</button>
                  <button type="button" className="text-[var(--stone-dark)]" onClick={() => api.deleteConnection(item.id).then(load)}>
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {accepted.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-3xl">Linked</h2>
          <ul className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {accepted.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-display text-2xl">{item.partner?.name}</p>
                  <p className="text-sm text-[var(--stone-dark)]">{item.partner?.university_name}</p>
                </div>
                <button
                  type="button"
                  className="text-[0.7rem] uppercase tracking-[0.14em] text-[var(--stone-dark)]"
                  onClick={() => api.deleteConnection(item.id).then(load)}
                >
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-16">
        <button
          type="button"
          onClick={() => setShowSearch((v) => !v)}
          className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--stone-dark)] hover:text-[var(--espresso)]"
        >
          {showSearch ? 'Hide university search' : 'Need to search by school instead'}
        </button>
        {showSearch && (
          <form
            className="mt-5 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setResults(await api.searchUsers(university));
            }}
          >
            <label htmlFor="uni">University</label>
            <input id="uni" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Boston University" />
            <Button type="submit" variant="line">Search</Button>
            {results.length === 0 ? null : (
              <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {results.map((user) => (
                  <li key={user.id} className="flex items-center justify-between py-3">
                    <span>{user.name || user.email}</span>
                    <button type="button" className="text-[0.7rem] uppercase tracking-[0.14em]" onClick={() => connectTo(user.id)}>
                      Request
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {results.length === 0 && university && (
              <EmptyState title="No one listed there yet" body="The code is faster, if they already have an account." />
            )}
          </form>
        )}
      </div>
    </div>
  );
}
