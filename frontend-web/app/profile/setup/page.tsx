'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { PlaceInput } from '@/components/PlaceInput';
import { Button, Kicker, RoomGate } from '@/components/ui';
import { api } from '@/lib/api';
import { PlaceLocation } from '@/types';

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
  const [schoolPlace, setSchoolPlace] = useState<PlaceLocation | null>(null);
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
      await api.updateProfile({
        ...form,
        university_name: schoolPlace?.universityName || form.university_name,
        location_city: schoolPlace?.city || form.location_city,
        location_state: schoolPlace?.state || form.location_state,
      });
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
      <h1 className="font-display mt-3 text-4xl md:text-5xl">A name and a school</h1>
      <p className="mt-3 text-[var(--espresso-soft)]">
        Pick your campus from the official list — city fills in for travel.
      </p>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        {error && <p className="text-sm text-[var(--oxblood)]">{error}</p>}
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
          placeholder="Start typing — UMD, Michigan, NYU…"
          helper="Official U.S. colleges and universities"
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
            <input
              id="city"
              required
              value={form.location_city}
              onChange={(e) => setForm({ ...form, location_city: e.target.value })}
            />
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
