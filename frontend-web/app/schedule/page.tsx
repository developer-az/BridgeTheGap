'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { ScheduleEntry } from '@/types';
import { parseScheduleFromText } from '@/lib/openrouter';
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
  
  // AI parsing state
  const [useAI, setUseAI] = useState(false);
  const [aiText, setAiText] = useState('');
  const [parsedEntries, setParsedEntries] = useState<Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    title: string;
    type: 'class' | 'work' | 'other';
  }>>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  
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

  const handleAIParse = async () => {
    if (!aiText.trim()) {
      setParseError('Please enter your schedule description');
      return;
    }

    setParsing(true);
    setParseError('');

    try {
      const entries = await parseScheduleFromText(aiText);
      if (entries && entries.length > 0) {
        setParsedEntries(entries);
      } else {
        setParseError('No schedule entries found. Please try rephrasing your description.');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to parse schedule';
      if (errorMessage.includes('Rate limit') || errorMessage.includes('429') || errorMessage.includes('rate-limited')) {
        setParseError('⚠️ The free AI model is temporarily rate-limited. Please wait a few minutes and try again, or use the manual form to add your schedule.');
      } else if (errorMessage.includes('API key') || errorMessage.includes('not configured') || errorMessage.includes('GEMINI_API_KEY')) {
        setParseError('⚠️ Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file and restart the server.');
      } else if (errorMessage.includes('logged in')) {
        setParseError('Please log in to use AI features.');
      } else if (errorMessage.includes('JSON') || errorMessage.includes('format')) {
        setParseError('Failed to parse the AI response. Please try rephrasing your schedule description or use the manual form.');
      } else {
        setParseError(errorMessage);
      }
      setParsedEntries([]);
    } finally {
      setParsing(false);
    }
  };

  const handleSaveParsedEntries = async () => {
    if (parsedEntries.length === 0) return;

    try {
      await api.createScheduleEntriesBatch(parsedEntries);
      setAiText('');
      setParsedEntries([]);
      setUseAI(false);
      loadSchedule();
    } catch (error: any) {
      alert(error.message || 'Failed to save schedule entries');
    }
  };

  const formatTime = (time: string) => {
    // Convert 24-hour format (HH:MM:SS or HH:MM) to 12-hour format
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return time;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setUseAI(!useAI);
                  setShowModal(true);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  useAI 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {useAI ? '🤖 AI Mode' : '✨ Use AI'}
              </button>
              <button
                onClick={() => {
                  setUseAI(false);
                  setShowModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Add Entry
              </button>
            </div>
          </div>
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
                          className="bg-gradient-to-br from-blue-100/80 to-blue-50/50 backdrop-blur-sm border-2 border-blue-300/50 rounded-2xl p-3 text-sm cursor-pointer hover:bg-blue-200/80 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105"
                          onClick={() => handleEdit(entry)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-white/95 to-blue-50/50 backdrop-blur-md rounded-3xl border-2 border-blue-200/50 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto text-gray-900">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                {editingEntry ? '✏️ Edit Entry' : useAI ? '🤖 Add Schedule with AI' : '➕ Add Schedule Entry'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingEntry(null);
                  setUseAI(false);
                  setAiText('');
                  setParsedEntries([]);
                  setParseError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {useAI && !editingEntry ? (
              // AI Input Mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your schedule in natural language
                  </label>
                  <textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="Example: CS 101 on Monday and Wednesday from 9am to 10:30am. Math 201 Tuesday and Thursday 2pm-3:30pm. Work Monday, Wednesday, Friday 5pm-8pm"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 resize-none text-gray-900 bg-white placeholder:text-gray-400"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    💡 Tip: Describe your classes, work, or activities with days and times. The AI will parse them automatically.
                  </p>
                </div>

                {parseError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {parseError}
                  </div>
                )}

                <button
                  onClick={handleAIParse}
                  disabled={parsing || !aiText.trim()}
                  className="w-full bg-gradient-to-r from-purple-400 to-pink-500 text-white py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {parsing ? '⏳ Parsing...' : '🤖 Parse Schedule'}
                </button>

                {parsedEntries.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Preview ({parsedEntries.length} entries found):
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {parsedEntries.map((entry, index) => (
                        <div
                          key={index}
                          className="bg-blue-50 border border-blue-200 rounded p-3 text-sm"
                        >
                          <div className="font-semibold text-gray-900">{entry.title}</div>
                          <div className="text-gray-600">
                            {DAYS[entry.day_of_week]} • {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                          </div>
                          <div className="text-gray-500 text-xs capitalize mt-1">{entry.type}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => {
                          setParsedEntries([]);
                          setAiText('');
                        }}
                        className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      >
                        🗑️ Clear
                      </button>
                      <button
                        onClick={handleSaveParsedEntries}
                        className="flex-1 bg-gradient-to-r from-green-400 to-green-500 text-white py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        ✅ Save All Entries
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Manual Input Mode
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week
                </label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                    className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    🗑️ Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEntry(null);
                    setUseAI(false);
                    setAiText('');
                    setParsedEntries([]);
                    setParseError('');
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {editingEntry ? '✨ Update' : '➕ Add'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

