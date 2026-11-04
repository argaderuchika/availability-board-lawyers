const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem('user');

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      removeStoredUser();
      window.dispatchEvent(new Event('auth-logout'));
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request('/auth/me'),
  getTeamUsers: () => request('/auth/users'),
  createTeamUser: (userData) =>
    request('/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getOfficials: (includeArchived = false) =>
    request(`/officials${includeArchived ? '?includeArchived=true' : ''}`),
  createOfficial: (officialData) =>
    request('/officials', {
      method: 'POST',
      body: JSON.stringify(officialData),
    }),
  bulkCreateOfficials: (officials) =>
    request('/officials/bulk', {
      method: 'POST',
      body: JSON.stringify({ officials }),
    }),
  updateOfficial: (id, officialData) =>
    request(`/officials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(officialData),
    }),
  archiveOfficial: (id) =>
    request(`/officials/${id}`, {
      method: 'DELETE',
    }),

  getTodayBoard: () => request('/statuses/today'),
  updateStatus: ({ officialId, state, note, leaveEndDate }) =>
    request('/statuses/update', {
      method: 'POST',
      body: JSON.stringify({ officialId, state, note, leaveEndDate }),
    }),
  getStatusHistory: (officialId) => request(`/statuses/history/${officialId}`),

  // Legacy status requests, retained for viewing older submissions.
  getPendingRequests: () => request('/requests/pending'),
  getMyRequests: () => request('/requests/my'),
  submitChangeRequest: ({ officialId, state, note, leaveEndDate }) =>
    request('/requests', {
      method: 'POST',
      body: JSON.stringify({ officialId, state, note, leaveEndDate }),
    }),
  confirmRequest: (id) =>
    request(`/requests/${id}/confirm`, {
      method: 'PUT',
    }),
  rejectRequest: (id, reviewNote) =>
    request(`/requests/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reviewNote }),
    }),
  cancelRequest: (id) =>
    request(`/requests/${id}`, {
      method: 'DELETE',
    }),

  // Badges & Leaderboard
  getLeaderboard: () => request('/auth/leaderboard'),

  getWhatsAppSummary: () => request('/summary/whatsapp'),
};
