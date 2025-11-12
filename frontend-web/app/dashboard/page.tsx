'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { User, Connection } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const [profileData, connectionsData] = await Promise.all([
        api.getProfile(),
        api.getConnections(),
      ]);

      setUser(profileData);
      setConnections(connectionsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const acceptedConnections = connections.filter(c => c.status === 'accepted');
  const pendingConnections = connections.filter(c => c.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">☁️</div>
          <div className="text-xl text-gray-600 font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b-2 border-white/50 shadow-lg shadow-black/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              ☁️ Bridge The Gap
            </h1>
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="px-4 py-2 rounded-full bg-white/80 text-blue-600 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 font-medium"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-sm rounded-3xl border-2 border-blue-200/50 shadow-xl shadow-black/5 p-6 mb-8 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {user?.university_name || 'University Not Set'}
              </h2>
              <p className="text-gray-600 mb-1">Major: {user?.major || 'Not set'}</p>
              <p className="text-gray-600">
                Location: {user?.location_city}, {user?.location_state}
              </p>
              {user?.bio && (
                <p className="text-gray-700 mt-3">{user.bio}</p>
              )}
            </div>
            <Link
              href="/profile"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 font-medium"
            >
              ✏️ Edit Profile
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/schedule"
            className="bg-gradient-to-br from-blue-100/80 to-blue-50/50 backdrop-blur-sm rounded-3xl border-2 border-blue-200/50 shadow-xl shadow-black/5 p-6 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 hover:-translate-y-2 group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">📅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule</h3>
            <p className="text-gray-600">Manage your class schedule and view availability</p>
          </Link>

          <Link
            href="/travel"
            className="bg-gradient-to-br from-purple-100/80 to-purple-50/50 backdrop-blur-sm rounded-3xl border-2 border-purple-200/50 shadow-xl shadow-black/5 p-6 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 hover:-translate-y-2 group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">✈️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Travel Plans</h3>
            <p className="text-gray-600">Search flights, trains, and buses</p>
          </Link>

          <Link
            href="/connections"
            className="bg-gradient-to-br from-pink-100/80 to-pink-50/50 backdrop-blur-sm rounded-3xl border-2 border-pink-200/50 shadow-xl shadow-black/5 p-6 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 hover:-translate-y-2 group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Find Partners</h3>
            <p className="text-gray-600">Connect with other students</p>
          </Link>
        </div>

        {/* Connections */}
        <div className="bg-gradient-to-br from-white/90 to-pink-50/50 backdrop-blur-sm rounded-3xl border-2 border-pink-200/50 shadow-xl shadow-black/5 p-6 mb-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-6">
            💕 Your Connections
          </h3>
          
          {acceptedConnections.length === 0 && pendingConnections.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">☁️</div>
              <p className="text-gray-600 mb-6 text-lg">You don't have any connections yet</p>
              <Link
                href="/connections"
                className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 font-semibold"
              >
                🌟 Find Partners
              </Link>
            </div>
          ) : (
            <>
              {acceptedConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="bg-gradient-to-br from-white/80 to-blue-50/30 backdrop-blur-sm rounded-2xl border-2 border-blue-200/50 p-5 mb-4 hover:border-blue-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 mb-1">
                        {connection.partner.university_name}
                      </h4>
                      <p className="text-gray-600 text-sm mb-1">
                        📚 {connection.partner.major}
                      </p>
                      <p className="text-gray-500 text-sm">
                        📍 {connection.partner.location_city}, {connection.partner.location_state}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/schedule/${connection.partner.id}`}
                        className="px-4 py-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-sm font-medium"
                      >
                        📅 Schedule
                      </Link>
                      <Link
                        href={`/travel?partner=${connection.partner.id}`}
                        className="px-4 py-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-sm font-medium"
                      >
                        ✈️ Travel
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {pendingConnections.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-bold text-lg text-gray-700 mb-4">⏳ Pending Requests</h4>
                  {pendingConnections.map((connection) => (
                    <div
                      key={connection.id}
                      className="bg-gradient-to-br from-yellow-100/80 to-yellow-50/50 backdrop-blur-sm rounded-2xl border-2 border-yellow-300/50 p-5 mb-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-1">
                            {connection.partner.university_name}
                          </h5>
                          <p className="text-gray-600 text-sm">
                            📚 {connection.partner.major}
                          </p>
                        </div>
                        <Link
                          href="/connections"
                          className="px-4 py-2 rounded-full bg-yellow-200 text-yellow-700 hover:bg-yellow-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-sm font-medium"
                        >
                          ✨ Manage
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

