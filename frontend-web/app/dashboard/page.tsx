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
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Bridge The Gap</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="text-gray-600 hover:text-gray-900"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
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
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/schedule"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule</h3>
            <p className="text-gray-600">Manage your class schedule and view availability</p>
          </Link>

          <Link
            href="/travel"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Travel Plans</h3>
            <p className="text-gray-600">Search flights, trains, and buses</p>
          </Link>

          <Link
            href="/connections"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Partners</h3>
            <p className="text-gray-600">Connect with other students</p>
          </Link>
        </div>

        {/* Connections */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Your Connections</h3>
          
          {acceptedConnections.length === 0 && pendingConnections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You don't have any connections yet</p>
              <Link
                href="/connections"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Find Partners
              </Link>
            </div>
          ) : (
            <>
              {acceptedConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="border border-gray-200 rounded-lg p-4 mb-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {connection.partner.university_name}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {connection.partner.major}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {connection.partner.location_city}, {connection.partner.location_state}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/schedule/${connection.partner.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Schedule
                      </Link>
                      <Link
                        href={`/travel?partner=${connection.partner.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Plan Travel
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {pendingConnections.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Pending Requests</h4>
                  {pendingConnections.map((connection) => (
                    <div
                      key={connection.id}
                      className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 mb-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {connection.partner.university_name}
                          </h5>
                          <p className="text-gray-600 text-sm">
                            {connection.partner.major}
                          </p>
                        </div>
                        <Link
                          href="/connections"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Manage
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

