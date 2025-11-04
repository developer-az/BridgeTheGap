'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { ScheduleEntry } from '@/types';
import Link from 'next/link';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:00',
    title: '',
    type: 'class' as 'class' | 'work' | 'other'
  });
  const router = useRouter();

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const data = await api.getSchedule();
      setSchedule(data);
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await api.updateScheduleEntry(editingEntry.id, formData);
      } else {
        await api.createScheduleEntry(formData);
      }
      setShowModal(false);
      setEditingEntry(null);
      setFormData({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '10:00',
        title: '',
        type: 'class'
      });
      loadSchedule();
    } catch (error: any) {
      alert(error.message || 'Failed to save schedule entry');
    }
  };

  const handleEdit = (entry: ScheduleEntry) => {
    setEditingEntry(entry);
    setFormData({
      day_of_week: entry.day_of_week,
      start_time: entry.start_time.substring(0, 5),
      end_time: entry.end_time.substring(0, 5),
      title: entry.title || '',
      type: entry.type
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule entry?')) return;
    try {
      await api.deleteScheduleEntry(id);
      loadSchedule();
    } catch (error: any) {
      alert(error.message || 'Failed to delete schedule entry');
    }
  };

  const getEntriesForDay = (day: number) => {
    return schedule.filter(e => e.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Add Entry
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {DAYS.map((day) => (
              <div key={day} className="px-4 py-3 text-center font-semibold text-gray-700 border-r last:border-r-0">
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
                    <div className="text-gray-400 text-sm text-center mt-4">No classes</div>
                  ) : (
                    <div className="space-y-2">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-blue-50 border border-blue-200 rounded p-2 text-sm cursor-pointer hover:bg-blue-100"
                          onClick={() => handleEdit(entry)}
                        >
                          <div className="font-semibold text-gray-900">{entry.title || 'Untitled'}</div>
                          <div className="text-gray-600 text-xs">
                            {entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingEntry ? 'Edit Entry' : 'Add Schedule Entry'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week
                </label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Computer Science 101"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="class">Class</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                {editingEntry && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingEntry.id)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEntry(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  {editingEntry ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

