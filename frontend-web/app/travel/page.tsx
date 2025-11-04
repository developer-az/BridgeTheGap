'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { TravelSearchResults, User } from '@/types';
import Link from 'next/link';

function TravelPageContent() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [modes, setModes] = useState<string[]>(['flight', 'train', 'bus']);
  const [results, setResults] = useState<TravelSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadSavedPlans();
    
    // Pre-fill partner destination if coming from dashboard
    const partnerId = searchParams.get('partner');
    if (partnerId) {
      loadPartnerLocation(partnerId);
    }
  }, [searchParams]);

  const loadSavedPlans = async () => {
    try {
      const plans = await api.getTravelPlans();
      setSavedPlans(plans);
    } catch (error) {
      console.error('Error loading travel plans:', error);
    }
  };

  const loadPartnerLocation = async (partnerId: string) => {
    try {
      const partner: User = await api.getUser(partnerId);
      if (partner.location_city && partner.location_state) {
        setDestination(`${partner.location_city}, ${partner.location_state}`);
      }
    } catch (error) {
      console.error('Error loading partner location:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.searchTravel({
        origin,
        destination,
        date,
        returnDate: returnDate || undefined,
        modes
      });
      setResults(data);
    } catch (error: any) {
      alert(error.message || 'Failed to search travel options');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!results) return;
    try {
      await api.saveTravelPlan({
        origin,
        destination,
        travel_date: date,
        return_date: returnDate || undefined,
        saved_routes: results
      });
      alert('Travel plan saved!');
      loadSavedPlans();
    } catch (error: any) {
      alert(error.message || 'Failed to save travel plan');
    }
  };

  const toggleMode = (mode: string) => {
    if (modes.includes(mode)) {
      setModes(modes.filter(m => m !== mode));
    } else {
      setModes([...modes, mode]);
    }
  };

  const renderFlights = () => {
    if (!results?.flights || 'error' in results.flights) return null;
    if (results.flights.length === 0) return <p className="text-gray-600">No flights found</p>;

    return (
      <div className="space-y-3">
        {results.flights.map((flight) => (
          <div key={flight.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-lg text-gray-900">
                  ${flight.price.total} {flight.price.currency}
                </div>
                <div className="text-gray-600 text-sm">
                  Duration: {flight.itineraries[0].duration}
                </div>
              </div>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Flight
              </span>
            </div>
            {flight.itineraries[0].segments.map((segment, idx) => (
              <div key={idx} className="text-sm text-gray-700 mt-1">
                {segment.carrier}{segment.flightNumber}: {segment.departure.airport} → {segment.arrival.airport}
                <div className="text-gray-500 text-xs">
                  {new Date(segment.departure.time).toLocaleTimeString()} - {new Date(segment.arrival.time).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderGroundTransport = (items: any[], type: string) => {
    if (!items || 'error' in items) return null;
    if (items.length === 0) return <p className="text-gray-600">No {type}s found</p>;

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-lg text-gray-900">
                  ${item.price.total} {item.price.currency}
                </div>
                <div className="text-gray-600 text-sm">
                  Duration: {item.duration} • Distance: {item.distance}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                type === 'train' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {type === 'train' ? 'Train' : 'Bus'}
              </span>
            </div>
            {item.transitDetails.map((detail: any, idx: number) => (
              <div key={idx} className="text-sm text-gray-700 mt-1">
                {detail.line}: {detail.departure.stop} → {detail.arrival.stop}
                <div className="text-gray-500 text-xs">
                  {detail.departure.time} - {detail.arrival.time} • {detail.numStops} stops
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Travel Planning</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Search Travel Options</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origin (City or Airport Code)
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  required
                  placeholder="e.g., Boston or BOS"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination (City or Airport Code)
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  placeholder="e.g., College Park or DCA"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Date (Optional)
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={date}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Travel Modes
              </label>
              <div className="flex gap-4">
                {['flight', 'train', 'bus'].map((mode) => (
                  <label key={mode} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={modes.includes(mode)}
                      onChange={() => toggleMode(mode)}
                      className="mr-2"
                    />
                    <span className="capitalize">{mode}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || modes.length === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Searching...' : 'Search Travel Options'}
            </button>
          </form>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Search Results</h2>
              <button
                onClick={handleSavePlan}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
              >
                Save Plan
              </button>
            </div>

            {modes.includes('flight') && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Flights</h3>
                {renderFlights()}
              </div>
            )}

            {modes.includes('train') && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Trains</h3>
                {renderGroundTransport(results.trains as any[], 'train')}
              </div>
            )}

            {modes.includes('bus') && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Buses</h3>
                {renderGroundTransport(results.buses as any[], 'bus')}
              </div>
            )}
          </div>
        )}

        {/* Saved Plans */}
        {savedPlans.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Saved Travel Plans</h2>
            <div className="space-y-3">
              {savedPlans.map((plan) => (
                <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {plan.origin} → {plan.destination}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {new Date(plan.travel_date).toLocaleDateString()}
                        {plan.return_date && ` - ${new Date(plan.return_date).toLocaleDateString()}`}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await api.deleteTravelPlan(plan.id);
                        loadSavedPlans();
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TravelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    }>
      <TravelPageContent />
    </Suspense>
  );
}
