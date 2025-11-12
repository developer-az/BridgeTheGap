'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { User } from '@/types';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    university_name: '',
    major: '',
    location_city: '',
    location_state: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const profile = await api.getProfile();
      console.log('📊 Profile data received:', profile);
      console.log('👤 Name field:', profile.name);
      setUser(profile);
      setFormData({
        name: profile.name || '',
        university_name: profile.university_name || '',
        major: profile.major || '',
        location_city: profile.location_city || '',
        location_state: profile.location_state || '',
        bio: profile.bio || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await api.updateProfile(formData);
      alert('Profile updated successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-md border-b-2 border-white/50 shadow-lg shadow-black/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="px-4 py-2 rounded-full bg-white/80 text-blue-600 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 font-medium">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              ✏️ Edit Profile
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-gray-500 text-sm mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                placeholder="e.g., Sarah Johnson"
              />
            </div>

            <div>
              <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-2">
                University Name
              </label>
              <input
                id="university"
                type="text"
                value={formData.university_name}
                onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                placeholder="e.g., Boston University"
              />
            </div>

            <div>
              <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-2">
                Major
              </label>
              <input
                id="major"
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                placeholder="e.g., Computer Science"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.location_city}
                  onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="Boston"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  value={formData.location_state}
                  onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="MA"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                placeholder="Tell us a bit about yourself..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

