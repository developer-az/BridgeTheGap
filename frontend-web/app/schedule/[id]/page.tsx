'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { ScheduleEntry, User } from '@/types';
import Link from 'next/link';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function PartnerSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params?.id as string;
  
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [partner, setPartner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (partnerId) {
      loadPartnerSchedule();
      loadPartnerInfo();
    }
  }, [partnerId]);

  const loadPartnerSchedule = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const data = await api.getUserSchedule(partnerId);
      setSchedule(data);
    } catch (err: any) {
      console.error('Error loading partner schedule:', err);
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const loadPartnerInfo = async () => {
    try {
      const partnerData = await api.getUser(partnerId);
      setPartner(partnerData);
    } catch (err) {
      console.error('Error loading partner info:', err);
    }
  };

  const getEntriesForDay = (day: number) => {
    return schedule.filter(e => e.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const formatTime = (time: string) => {
    // Convert 24-hour format (HH:MM:SS or HH:MM) to 12-hour format
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return time;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ {error}</div>
          <Link href="/connections" className="text-blue-600 hover:text-blue-700">
            ← Back to Connections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/connections" className="text-blue-600 hover:text-blue-700">
              ← Back to Connections
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {partner?.name || partner?.university_name || 'Partner'}'s Schedule
            </h1>
            <div className="w-32"></div>
          </div>
          {partner && (
            <div className="mt-2 text-sm text-gray-600 text-center">
              {partner.university_name && <span>{partner.university_name}</span>}
              {partner.major && <span className="mx-2">•</span>}
              {partner.major && <span>{partner.major}</span>}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-sm rounded-3xl border-2 border-blue-200/50 shadow-xl shadow-black/5 overflow-hidden">
          <div className="grid grid-cols-7 border-b-2 border-blue-200/30 bg-gradient-to-r from-blue-100/50 to-purple-100/50">
            {DAYS.map((day) => (
              <div key={day} className="px-4 py-4 text-center font-bold text-gray-700 border-r-2 border-blue-200/30 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {DAYS.map((day, index) => {
              const entries = getEntriesForDay(index);
              return (
                <div key={day} className="border-r last:border-r-0 min-h-[400px] p-2">
                  {entries.length === 0 ? (
                    <div className="text-gray-400 text-sm text-center mt-4">☁️ No classes</div>
                  ) : (
                    <div className="space-y-2">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-gradient-to-br from-blue-100/80 to-blue-50/50 backdrop-blur-sm border-2 border-blue-300/50 rounded-2xl p-3 text-sm"
                        >
                          <div className="font-semibold text-gray-900">{entry.title || 'Untitled'}</div>
                          <div className="text-gray-600 text-xs">
                            {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                          </div>
                          <div className="text-gray-500 text-xs capitalize">{entry.type}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

