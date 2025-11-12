'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { User, Connection } from '@/types';
import Link from 'next/link';

export default function ConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [publicIdInput, setPublicIdInput] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [publicIdLoading, setPublicIdLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadConnections();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const profile = await api.getProfile();
      setCurrentUser(profile);
      
      // If profile loaded but no public_id, reload after a short delay
      // (API will auto-generate it)
      if (profile && !profile.public_id) {
        console.log('🔄 No public_id found, will reload in 2 seconds...');
        setTimeout(async () => {
          try {
            console.log('🔄 Reloading profile to get public_id...');
            const updatedProfile = await api.getProfile();
            console.log('📊 Updated profile:', updatedProfile);
            if (updatedProfile.public_id) {
              console.log('✅ Got public_id:', updatedProfile.public_id);
            } else {
              console.warn('⚠️ Still no public_id after reload');
            }
            setCurrentUser(updatedProfile);
          } catch (err) {
            console.error('❌ Error reloading profile:', err);
          }
        }, 2000); // Increased to 2 seconds
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      // Show user-friendly error message
      if (error.message?.includes('Server configuration error')) {
        alert('⚠️ Server configuration issue. Please check Vercel environment variables.');
      }
    }
  };

  const loadConnections = async () => {
    try {
      const data = await api.getConnections();
      setConnections(data);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const results = await api.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId: string) => {
    try {
      await api.requestConnection(userId);
      alert('Connection request sent!');
      loadConnections();
    } catch (error: any) {
      alert(error.message || 'Failed to send connection request');
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await api.acceptConnection(connectionId);
      loadConnections();
    } catch (error: any) {
      alert(error.message || 'Failed to accept connection');
    }
  };

  const handleDelete = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;
    try {
      await api.deleteConnection(connectionId);
      loadConnections();
    } catch (error: any) {
      alert(error.message || 'Failed to delete connection');
    }
  };

  const handleConnectByPublicId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicIdInput.trim()) return;
    
    setPublicIdLoading(true);
    try {
      const user = await api.getUserByPublicId(publicIdInput.trim().toUpperCase());
      await api.requestConnection(user.id);
      alert(`Connection request sent to ${user.university_name || 'user'}!`);
      setPublicIdInput('');
      loadConnections();
    } catch (error: any) {
      alert(error.message || 'Failed to find user with that ID');
    } finally {
      setPublicIdLoading(false);
    }
  };

  const copyPublicId = () => {
    if (currentUser?.public_id) {
      navigator.clipboard.writeText(currentUser.public_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const pendingConnections = connections.filter(c => c.status === 'pending');
  const acceptedConnections = connections.filter(c => c.status === 'accepted');

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-md border-b-2 border-white/50 shadow-lg shadow-black/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="px-4 py-2 rounded-full bg-white/80 text-blue-600 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 font-medium">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              👥 Connections
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Your Public ID */}
        {currentUser && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your Connection ID</h2>
            {currentUser.public_id ? (
              <>
                <p className="text-gray-700 mb-4">Share this ID with your partner so they can connect with you:</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white border-2 border-blue-300 rounded-lg px-6 py-4">
                    <div className="text-3xl font-bold text-blue-600 tracking-wider text-center">
                      {currentUser.public_id}
                    </div>
                  </div>
                  <button
                    onClick={copyPublicId}
                    className="bg-blue-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap"
                  >
                    {copiedId ? '✓ Copied!' : 'Copy ID'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-700 mb-4">Your connection ID is being generated...</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white border-2 border-blue-300 rounded-lg px-6 py-4">
                    <div className="text-3xl font-bold text-gray-400 tracking-wider text-center">
                      Loading...
                    </div>
                  </div>
                  <button
                    disabled
                    className="bg-gray-400 text-white px-6 py-4 rounded-lg font-medium whitespace-nowrap cursor-not-allowed"
                  >
                    Copy ID
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">Please refresh the page in a moment.</p>
              </>
            )}
          </div>
        )}

        {/* Connect by ID */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Connect by ID</h2>
          <p className="text-gray-600 mb-4">Enter your partner's connection ID to send them a request:</p>
          <form onSubmit={handleConnectByPublicId} className="flex gap-4">
            <input
              type="text"
              value={publicIdInput}
              onChange={(e) => setPublicIdInput(e.target.value.toUpperCase())}
              placeholder="Enter ID (e.g., ABCD1234)"
              maxLength={8}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-lg tracking-wider text-gray-900 bg-white placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={publicIdLoading || !publicIdInput.trim()}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
            >
              {publicIdLoading ? 'Connecting...' : 'Connect'}
            </button>
          </form>
        </div>

        {/* Search Section */}
        <div className="bg-gradient-to-br from-white/90 to-purple-50/50 backdrop-blur-sm rounded-3xl border-2 border-purple-200/50 shadow-xl shadow-black/5 p-6 mb-8 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            🔍 Or Search by University
          </h2>
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by university name..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-gray-700">Search Results</h3>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900">{user.university_name}</h4>
                    <p className="text-gray-600 text-sm">{user.major}</p>
                    <p className="text-gray-500 text-sm">
                      {user.location_city}, {user.location_state}
                    </p>
                  </div>
                  <button
                    onClick={() => handleConnect(user.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        {pendingConnections.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Requests</h2>
            <div className="space-y-3">
              {pendingConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {connection.partner.university_name}
                    </h4>
                    <p className="text-gray-600 text-sm">{connection.partner.major}</p>
                    <p className="text-gray-500 text-sm">
                      {connection.partner.location_city}, {connection.partner.location_state}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(connection.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDelete(connection.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Connections */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Connections</h2>
          {acceptedConnections.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No active connections yet</p>
          ) : (
            <div className="space-y-3">
              {acceptedConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {connection.partner.university_name}
                    </h4>
                    <p className="text-gray-600 text-sm">{connection.partner.major}</p>
                    <p className="text-gray-500 text-sm">
                      {connection.partner.location_city}, {connection.partner.location_state}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/schedule/${connection.partner.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium px-4 py-2"
                    >
                      Schedule
                    </Link>
                    <button
                      onClick={() => handleDelete(connection.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

