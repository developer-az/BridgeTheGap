'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { PlaceInput } from '@/components/PlaceInput';
import { Button, Kicker, RoomGate } from '@/components/ui';
import { api } from '@/lib/api';
import { PlaceLocation } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { session, profile, loading, refreshProfile, signOut } = useAuth();
  const [form, setForm] = useState({
    name: '',
    university_name: '',
    major: '',
    location_city: '',
    location_state: '',
    bio: '',
  });
  const [schoolPlace, setSchoolPlace] = useState<PlaceLocation | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || '',
      university_name: profile.university_name || '',
      major: profile.major || '',
      location_city: profile.location_city || '',
      location_state: profile.location_state || '',
      bio: profile.bio || '',
    });
    if (profile.university_name) {
      setSchoolPlace({
        label: profile.university_name,
        query: [profile.location_city, profile.location_state].filter(Boolean).join(', '),
        city: profile.location_city,
        state: profile.location_state,
        kind: 'university',
        universityName: profile.university_name,
        confidence: 'approximate',
      });
    }
  }, [profile]);

  if (!loading && !session) {
    return <RoomGate title="Account is a quiet room." body="Sign in to change your name, city, or school." />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.updateProfile({
        ...form,
        university_name: schoolPlace?.universityName || form.university_name,
        location_city: schoolPlace?.city || form.location_city,
        location_state: schoolPlace?.state || form.location_state,
      });
      await refreshProfile();
      router.push('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-5 py-12 md:py-16">
      <Kicker>Account</Kicker>
      <h1 className="font-display mt-3 text-4xl md:text-5xl">How you appear</h1>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        {error && <p className="text-sm text-[var(--oxblood)]">{error}</p>}
        <div>
          <label>Email</label>
          <input value={profile?.email || ''} disabled />
        </div>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <PlaceInput
          id="university"
          label="University"
          value={form.university_name}
          place={schoolPlace}
          prefer="schools"
          placeholder="Start typing your school"
          helper="Official U.S. colleges — city updates with the campus"
          onValueChange={(value) => setForm((current) => ({ ...current, university_name: value }))}
          onPlaceChange={(place) => {
            setSchoolPlace(place);
            if (place?.universityName) {
              setForm((current) => ({
                ...current,
                university_name: place.universityName || place.label,
                location_city: place.city || current.location_city,
                location_state: place.state || current.location_state,
              }));
            }
          }}
        />
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
            <input
              id="state"
              required
              maxLength={2}
              value={form.location_state}
              onChange={(e) => setForm({ ...form, location_state: e.target.value.toUpperCase() })}
            />
          </div>
        </div>
        <div>
          <label htmlFor="bio">A line about you</label>
          <textarea id="bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="line" onClick={() => router.push('/home')}>
            Back
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving' : 'Save'}
          </Button>
        </div>
      </form>
      <button type="button" onClick={() => signOut().then(() => router.push('/'))} className="mt-10 text-[0.72rem] uppercase tracking-[0.16em] text-[var(--stone-dark)]">
        Sign out
      </button>
    </div>
  );
}
