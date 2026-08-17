'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Button, Kicker, RoomGate } from '@/components/ui';
import { api } from '@/lib/api';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [form, setForm] = useState({
    name: '',
    university_name: '',
    major: '',
    location_city: '',
    location_state: '',
    bio: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !session) router.replace('/login?next=/profile/setup');
  }, [loading, session, router]);

  if (!loading && !session) {
    return <RoomGate title="Finish this after you join." body="A name and a city are enough to make travel useful." />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.updateProfile(form);
      router.push('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-5 py-12 md:py-16">
      <Kicker>First things</Kicker>
      <h1 className="font-display mt-3 text-4xl md:text-5xl">A name and a city</h1>
      <p className="mt-3 text-[var(--espresso-soft)]">University helps people find you. City is what travel uses.</p>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        {error && <p className="text-sm text-[var(--oxblood)]">{error}</p>}
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="university">University</label>
          <input id="university" value={form.university_name} onChange={(e) => setForm({ ...form, university_name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="major">Major</label>
          <input id="major" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city">City</label>
            <input id="city" required value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} />
          </div>
          <div>
            <label htmlFor="state">State</label>
            <input id="state" required maxLength={2} value={form.location_state} onChange={(e) => setForm({ ...form, location_state: e.target.value })} />
          </div>
        </div>
        <div>
          <label htmlFor="bio">Optional line</label>
          <textarea id="bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving' : 'Enter the house'}
        </Button>
      </form>
    </div>
  );
}
