import { supabase } from './supabase';

async function getAuthHeaders(required = true) {
  const { data: { session } } = await supabase.auth.getSession();
  if (required && !session?.access_token) {
    throw new Error('AUTH_REQUIRED');
  }
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

async function readError(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || fallback);
}

export const api = {
  async getProfile() {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/users/profile`, { headers });
    if (!res.ok) await readError(res, `Failed to fetch profile (${res.status})`);
    return res.json();
  },

  async updateProfile(data: Record<string, unknown>) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/users/profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) await readError(res, 'Failed to update profile');
    return res.json();
  },

  async searchUsers(university?: string) {
    const headers = await getAuthHeaders();
    const url = university
      ? `/api/users/search?university=${encodeURIComponent(university)}`
      : `/api/users/search`;
    const res = await fetch(url, { headers });
    if (!res.ok) await readError(res, 'Failed to search users');
    return res.json();
  },

  async getUser(id: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/users/${id}`, { headers });
    if (!res.ok) await readError(res, 'Failed to fetch user');
    return res.json();
  },

  async getUserByPublicId(publicId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/users/by-public-id/${publicId}`, { headers });
    if (!res.ok) await readError(res, 'No one found with that code');
    return res.json();
  },

  async getConnections() {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/connections`, { headers });
    if (!res.ok) await readError(res, 'Failed to fetch connections');
    return res.json();
  },

  async requestConnection(targetUserId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/connections/request`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
    if (!res.ok) await readError(res, 'Failed to send the code');
    return res.json();
  },

  async acceptConnection(connectionId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/connections/${connectionId}/accept`, {
      method: 'PUT',
      headers,
    });
    if (!res.ok) await readError(res, 'Failed to accept');
    return res.json();
  },

  async deleteConnection(connectionId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/connections/${connectionId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) await readError(res, 'Failed to remove connection');
    return res.json();
  },

  async getSchedule() {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule`, { headers });
    if (!res.ok) await readError(res, 'Failed to fetch schedule');
    return res.json();
  },

  async getUserSchedule(userId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule/user/${userId}`, { headers });
    if (!res.ok) await readError(res, 'Failed to fetch user schedule');
    return res.json();
  },

  async createScheduleEntry(data: Record<string, unknown>) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) await readError(res, 'Failed to create schedule entry');
    return res.json();
  },

  async createScheduleEntriesBatch(entries: unknown[]) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule`, {
      method: 'POST',
      headers,
      body: JSON.stringify(entries),
    });
    if (!res.ok) await readError(res, 'Failed to create schedule entries');
    return res.json();
  },

  async updateScheduleEntry(id: string, data: Record<string, unknown>) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) await readError(res, 'Failed to update schedule entry');
    return res.json();
  },

  async deleteScheduleEntry(id: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) await readError(res, 'Failed to delete schedule entry');
    return res.json();
  },

  async getMutualAvailability(partnerId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule/mutual/${partnerId}`, { headers });
    if (!res.ok) await readError(res, 'Failed to fetch mutual availability');
    return res.json();
  },

  async getWindows(partnerId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/schedule/windows/${partnerId}`, { headers });
    if (!res.ok) await readError(res, 'Failed to fetch free windows');
    return res.json();
  },

  async searchTravel(data: Record<string, unknown>) {
    const headers = await getAuthHeaders(false);
    const res = await fetch(`/api/travel/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) await readError(res, 'Failed to search travel');
    return res.json();
  },

  async getTravelPlans() {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/travel/plans`, { headers });
    if (!res.ok) await readError(res, 'Failed to fetch travel plans');
    return res.json();
  },

  async saveTravelPlan(data: Record<string, unknown>) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/travel/plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) await readError(res, 'Failed to save travel plan');
    return res.json();
  },

  async deleteTravelPlan(id: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/travel/plans/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) await readError(res, 'Failed to delete travel plan');
    return res.json();
  },

  async getOccasions() {
    const res = await fetch('/api/occasions');
    if (!res.ok) await readError(res, 'Failed to load occasions');
    return res.json();
  },

  async getInvitations() {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/invitations', { headers });
    if (!res.ok) await readError(res, 'Failed to load letters');
    return res.json();
  },

  async sendInvitation(data: Record<string, unknown>) {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) await readError(res, 'Failed to send letter');
    return res.json();
  },

  async updateInvitation(id: string, data: Record<string, unknown>) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/invitations/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) await readError(res, 'Failed to update letter');
    return res.json();
  },

  async getVisits() {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/visits', { headers });
    if (!res.ok) await readError(res, 'Failed to load visits');
    return res.json();
  },

  async createVisit(data: Record<string, unknown>) {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) await readError(res, 'Failed to create visit');
    return res.json();
  },

  async updateVisit(id: string, data: Record<string, unknown>) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/visits/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) await readError(res, 'Failed to update visit');
    return res.json();
  },

  async deleteVisit(id: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/visits/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) await readError(res, 'Failed to delete visit');
    return res.json();
  },
};
