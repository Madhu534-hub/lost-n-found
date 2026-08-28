const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Auth
  getUsers: async () => {
    const res = await fetch(`${BASE_URL}/auth/users`);
    return res.json();
  },
  login: async (data) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  register: async (data) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Reports
  getReports: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.building && filters.building !== 'All') params.append('building', filters.building);
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.userId) params.append('userId', filters.userId);

    const res = await fetch(`${BASE_URL}/reports?${params.toString()}`);
    return res.json();
  },
  getReportById: async (id) => {
    const res = await fetch(`${BASE_URL}/reports/${id}`);
    return res.json();
  },
  createReport: async (formData) => {
    const isMultipart = formData instanceof FormData;
    const res = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: isMultipart ? {} : { 'Content-Type': 'application/json' },
      body: isMultipart ? formData : JSON.stringify(formData)
    });
    return res.json();
  },
  getSmartIntake: async (data) => {
    const res = await fetch(`${BASE_URL}/reports/smart-intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  analyzePhoto: async (formData) => {
    const isMultipart = formData instanceof FormData;
    const res = await fetch(`${BASE_URL}/reports/analyze-photo`, {
      method: 'POST',
      headers: isMultipart ? {} : { 'Content-Type': 'application/json' },
      body: isMultipart ? formData : JSON.stringify(formData)
    });
    return res.json();
  },
  updateReportStatus: async (id, status) => {
    const res = await fetch(`${BASE_URL}/reports/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Matches
  getAllMatches: async () => {
    const res = await fetch(`${BASE_URL}/matches`);
    return res.json();
  },
  getMatchesForReport: async (reportId) => {
    const res = await fetch(`${BASE_URL}/matches/report/${reportId}`);
    return res.json();
  },
  getMatchById: async (id) => {
    const res = await fetch(`${BASE_URL}/matches/${id}`);
    return res.json();
  },

  // Verification
  getVerificationChallenge: async (matchId) => {
    const res = await fetch(`${BASE_URL}/verification/challenge/${matchId}`);
    return res.json();
  },
  submitVerification: async (data) => {
    const res = await fetch(`${BASE_URL}/verification/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Chat & Resolution
  getChat: async (matchId) => {
    const res = await fetch(`${BASE_URL}/chat/${matchId}`);
    return res.json();
  },
  sendMessage: async (matchId, data) => {
    const res = await fetch(`${BASE_URL}/chat/${matchId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  markReunited: async (matchId, data) => {
    const res = await fetch(`${BASE_URL}/chat/${matchId}/reunited`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Reverse Image Search (Prompt A)
  reverseSearch: async (formData) => {
    const isMultipart = formData instanceof FormData;
    const res = await fetch(`${BASE_URL}/reports/reverse-search`, {
      method: 'POST',
      headers: isMultipart ? {} : { 'Content-Type': 'application/json' },
      body: isMultipart ? formData : JSON.stringify(formData)
    });
    return res.json();
  },

  // Duplicate Check (Prompt D)
  checkDuplicate: async (data) => {
    const res = await fetch(`${BASE_URL}/reports/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // On-Demand Translation (Prompt F)
  translate: async (text, targetLang) => {
    const res = await fetch(`${BASE_URL}/reports/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang })
    });
    return res.json();
  },

  // Leaderboard (Prompt C)
  getLeaderboard: async () => {
    const res = await fetch(`${BASE_URL}/leaderboard`);
    return res.json();
  },

  // QR Handover (Prompt E)
  getHandover: async (matchId) => {
    const res = await fetch(`${BASE_URL}/chat/${matchId}/handover`);
    return res.json();
  },
  generateQR: async (matchId) => {
    const res = await fetch(`${BASE_URL}/chat/${matchId}/generate-qr`, {
      method: 'POST'
    });
    return res.json();
  },
  confirmQR: async (matchId, data) => {
    const res = await fetch(`${BASE_URL}/chat/${matchId}/confirm-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Admin Analytics & Moderation
  getAdminAnalytics: async () => {
    const res = await fetch(`${BASE_URL}/admin/analytics`);
    return res.json();
  },
  getAdminCategories: async () => {
    const res = await fetch(`${BASE_URL}/admin/categories`);
    return res.json();
  },
  getAdminHotspots: async () => {
    const res = await fetch(`${BASE_URL}/admin/hotspots`);
    return res.json();
  },
  getAdminAuditLog: async () => {
    const res = await fetch(`${BASE_URL}/admin/audit-log`);
    return res.json();
  },
  moderateReport: async (data) => {
    const res = await fetch(`${BASE_URL}/admin/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
