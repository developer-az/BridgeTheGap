'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { TravelSearchResults, User } from '@/types';
import Link from 'next/link';
import { generateSimpleGoogleFlightsUrl } from '@/lib/google-flights';
import { estimateTravelCosts, getTimeUntilNextCall } from '@/lib/travel-ai';

function TravelPageContent() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [modes, setModes] = useState<string[]>(['flight', 'train', 'bus']);
  const [results, setResults] = useState<TravelSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [costEstimates, setCostEstimates] = useState<any>(null);
  const [estimatingCosts, setEstimatingCosts] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string>('');
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
    setCostEstimates(null);
    setRateLimitMessage('');
    try {
      const data = await api.searchTravel({
        origin,
        destination,
        date,
        returnDate: returnDate || undefined,
        modes
      });
      setResults(data);
      
      // Automatically estimate costs after search
      handleEstimateCosts();
    } catch (error: any) {
      alert(error.message || 'Failed to search travel options');
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateCosts = async () => {
    if (!origin || !destination || !date) return;
    
    setEstimatingCosts(true);
    setRateLimitMessage('');
    
    try {
      // Build requests for each selected mode
      const requests = modes.map(mode => ({
        origin,
        destination,
        date,
        returnDate: returnDate || undefined,
        mode: mode as 'flight' | 'train' | 'bus',
      }));

      const estimates = await estimateTravelCosts(requests);
      
      // Convert to map for easy lookup
      const estimatesMap: any = {};
      estimates.forEach(est => {
        estimatesMap[est.mode] = est;
      });
      
      setCostEstimates(estimatesMap);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to estimate costs';
      
      if (errorMsg.includes('Rate limit')) {
        const seconds = getTimeUntilNextCall();
        setRateLimitMessage(`⏱️ ${errorMsg}`);
      } else if (errorMsg.includes('overloaded') || errorMsg.includes('503')) {
        setRateLimitMessage('⚠️ The AI service is temporarily busy. Please try again in a few moments.');
      } else if (errorMsg.includes('quota')) {
        setRateLimitMessage('⚠️ Daily limit reached. Please try again tomorrow.');
      } else {
        setRateLimitMessage('❌ ' + errorMsg);
      }
    } finally {
      setEstimatingCosts(false);
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

    const estimate = costEstimates?.flight;

    return (
      <div className="space-y-3">
        {estimate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2">
              <span className="text-blue-600">🤖</span>
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-900 mb-1">AI Cost Estimate</div>
                <div className="text-sm text-gray-700">
                  Estimated: ${estimate.estimatedCost.min} - ${estimate.estimatedCost.max} 
                  (Avg: ${estimate.estimatedCost.average})
                </div>
                {estimate.notes && (
                  <div className="text-xs text-gray-600 mt-1">{estimate.notes}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: <span className="capitalize">{estimate.confidence}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {results.flights.map((flight) => (
          <div key={flight.id} className="bg-gradient-to-br from-white/80 to-blue-50/30 backdrop-blur-sm border-2 border-blue-200/50 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-lg text-gray-900">
                  ${flight.price.total} {flight.price.currency}
                </div>
                <div className="text-gray-600 text-sm">
                  Duration: {flight.itineraries[0].duration}
                </div>
              </div>
              <span className="bg-gradient-to-r from-blue-200 to-blue-300 text-blue-800 px-4 py-1 rounded-full text-sm font-bold shadow-md">
                ✈️ Flight
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

    const estimate = costEstimates?.[type];

    return (
      <div className="space-y-3">
        {estimate && (
          <div className={`backdrop-blur-sm rounded-2xl border-2 p-4 mb-3 shadow-md ${
            type === 'train' ? 'bg-gradient-to-br from-green-100/80 to-green-50/50 border-green-300/50' : 'bg-gradient-to-br from-purple-100/80 to-purple-50/50 border-purple-300/50'
          }`}>
            <div className="flex items-start gap-2">
              <span className={type === 'train' ? 'text-green-600' : 'text-purple-600'}>🤖</span>
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-900 mb-1">AI Cost Estimate</div>
                <div className="text-sm text-gray-700">
                  Estimated: ${estimate.estimatedCost.min} - ${estimate.estimatedCost.max} 
                  (Avg: ${estimate.estimatedCost.average})
                </div>
                {estimate.notes && (
                  <div className="text-xs text-gray-600 mt-1">{estimate.notes}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: <span className="capitalize">{estimate.confidence}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className={`backdrop-blur-sm border-2 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
            type === 'train' ? 'bg-gradient-to-br from-white/80 to-green-50/30 border-green-200/50' : 'bg-gradient-to-br from-white/80 to-purple-50/30 border-purple-200/50'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-lg text-gray-900">
                  ${item.price.total} {item.price.currency}
                </div>
                <div className="text-gray-600 text-sm">
                  Duration: {item.duration} • Distance: {item.distance}
                </div>
              </div>
              <span className={`px-4 py-1 rounded-full text-sm font-bold shadow-md ${
                type === 'train' ? 'bg-gradient-to-r from-green-200 to-green-300 text-green-800' : 'bg-gradient-to-r from-purple-200 to-purple-300 text-purple-800'
              }`}>
                {type === 'train' ? '🚂 Train' : '🚌 Bus'}
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
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-md border-b-2 border-white/50 shadow-lg shadow-black/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="px-4 py-2 rounded-full bg-white/80 text-blue-600 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 font-medium">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
              ✈️ Travel Planning
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-gradient-to-br from-white/90 to-purple-50/50 backdrop-blur-sm rounded-3xl border-2 border-purple-200/50 shadow-xl shadow-black/5 p-6 mb-8 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            🔍 Search Travel Options
          </h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origin (City or Airport Code)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    required
                    placeholder="e.g., Boston or BOS"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  />
                  {origin && destination && date && (
                    <a
                      href={generateSimpleGoogleFlightsUrl(origin, destination, date, returnDate || undefined)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
                      title="Search on Google Flights"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Search Flights
                    </a>
                  )}
                </div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Date
                  {origin && destination && date && (
                    <a
                      href={generateSimpleGoogleFlightsUrl(origin, destination, date, returnDate || undefined)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-700 text-xs font-normal"
                      title="Click to search on Google Flights"
                    >
                      🔗 Search on Google Flights
                    </a>
                  )}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
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
              className="w-full bg-gradient-to-r from-blue-400 to-blue-500 text-white py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? '🔍 Searching...' : '✨ Search Travel Options'}
            </button>
          </form>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-sm rounded-3xl border-2 border-blue-200/50 shadow-xl shadow-black/5 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                ✨ Search Results
              </h2>
              <button
                onClick={handleSavePlan}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 font-semibold"
              >
                💾 Save Plan
              </button>
            </div>

            {rateLimitMessage && (
              <div className="mb-4 p-4 bg-gradient-to-br from-yellow-100/80 to-yellow-50/50 backdrop-blur-sm border-2 border-yellow-300/50 rounded-2xl shadow-md">
                <p className="text-sm text-yellow-800 font-medium">⏱️ {rateLimitMessage}</p>
              </div>
            )}

            {estimatingCosts && (
              <div className="mb-4 p-4 bg-gradient-to-br from-blue-100/80 to-blue-50/50 backdrop-blur-sm border-2 border-blue-300/50 rounded-2xl shadow-md">
                <p className="text-sm text-blue-800 flex items-center gap-2 font-medium">
                  <span className="animate-spin">⏳</span>
                  AI is estimating costs...
                </p>
              </div>
            )}

            {modes.includes('flight') && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Flights</h3>
                  <div className="flex gap-2">
                    {!costEstimates && !estimatingCosts && results && (
                      <button
                        onClick={handleEstimateCosts}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 border border-blue-600 rounded hover:bg-blue-50"
                      >
                        🤖 Estimate Costs
                      </button>
                    )}
                    {origin && destination && date && (
                      <a
                        href={generateSimpleGoogleFlightsUrl(origin, destination, date, returnDate || undefined)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View on Google Flights
                      </a>
                    )}
                  </div>
                </div>
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
          <div className="bg-gradient-to-br from-white/90 to-yellow-50/50 backdrop-blur-sm rounded-3xl border-2 border-yellow-200/50 shadow-xl shadow-black/5 p-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-4">
              ⭐ Saved Travel Plans
            </h2>
            <div className="space-y-3">
              {savedPlans.map((plan) => {
                const googleFlightsUrl = generateSimpleGoogleFlightsUrl(
                  plan.origin,
                  plan.destination,
                  plan.travel_date,
                  plan.return_date || undefined
                );
                return (
                  <div key={plan.id} className="bg-gradient-to-br from-white/80 to-yellow-50/30 backdrop-blur-sm border-2 border-yellow-200/50 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {plan.origin} → {plan.destination}
                        </div>
                        <div className="text-gray-600 text-sm">
                          <a
                            href={googleFlightsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {new Date(plan.travel_date).toLocaleDateString()}
                            {plan.return_date && ` - ${new Date(plan.return_date).toLocaleDateString()}`}
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={googleFlightsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm px-4 py-2 rounded-full bg-blue-100 hover:bg-blue-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 font-semibold"
                          title="Search on Google Flights"
                        >
                          🔗 Search
                        </a>
                        <button
                          onClick={async () => {
                            await api.deleteTravelPlan(plan.id);
                            loadSavedPlans();
                          }}
                          className="text-red-600 hover:text-red-700 text-sm px-4 py-2 rounded-full bg-red-100 hover:bg-red-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 font-semibold"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
