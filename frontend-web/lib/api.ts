import { supabase } from './supabase';

// No external API URL needed - using Next.js API routes
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
  };
}

export const api = {
  // Users
  async getProfile() {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/users/profile`, { headers });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateProfile(data: any) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/users/profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async searchUsers(university?: string) {
    const headers = await getAuthHeaders();
    const url = university 
      ? `/api/users/search?university=${encodeURIComponent(university)}`
      : `/api/users/search`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to search users');
    return res.json();
  },

  async getUser(id: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/users/${id}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async getUserByPublicId(publicId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/users/by-public-id/${publicId}`, { headers });
    if (!res.ok) throw new Error('User not found with that ID');
    return res.json();
  },

  // Connections
  async getConnections() {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/connections`, { headers });
    if (!res.ok) throw new Error('Failed to fetch connections');
    return res.json();
  },

  async requestConnection(targetUserId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/connections/request`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
    if (!res.ok) throw new Error('Failed to create connection');
    return res.json();
  },

  async acceptConnection(connectionId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/connections/${connectionId}/accept`, {
      method: 'PUT',
      headers,
    });
    if (!res.ok) throw new Error('Failed to accept connection');
    return res.json();
  },

  async deleteConnection(connectionId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/connections/${connectionId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to delete connection');
    return res.json();
  },

  // Schedule
  async getSchedule() {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule`, { headers });
    if (!res.ok) throw new Error('Failed to fetch schedule');
    return res.json();
  },

  async getUserSchedule(userId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule/user/${userId}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch user schedule');
    return res.json();
  },

  async createScheduleEntry(data: any) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create schedule entry');
    return res.json();
  },

  async createScheduleEntriesBatch(entries: any[]) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule`, {
      method: 'POST',
      headers,
      body: JSON.stringify(entries),
    });
    if (!res.ok) throw new Error('Failed to create schedule entries');
    return res.json();
  },

  async updateScheduleEntry(id: string, data: any) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update schedule entry');
    return res.json();
  },

  async deleteScheduleEntry(id: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to delete schedule entry');
    return res.json();
  },

  async getMutualAvailability(partnerId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule/mutual/${partnerId}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch mutual availability');
    return res.json();
  },

  // Travel
  async searchTravel(data: any) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/travel/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to search travel');
    return res.json();
  },

  async getTravelPlans() {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/travel/plans`, { headers });
    if (!res.ok) throw new Error('Failed to fetch travel plans');
    return res.json();
  },

  async saveTravelPlan(data: any) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/travel/plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save travel plan');
    return res.json();
  },

  async deleteTravelPlan(id: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/travel/plans/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to delete travel plan');
    return res.json();
  },
};

