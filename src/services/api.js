import { supabase } from '../lib/supabase';
import { findMatchesForReport } from './matchingEngine';
import { generateVerificationChallenge, evaluateVerificationAnswers } from './verificationEngine';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const fileToDataUrl = (file) => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof Blob)) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

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
    try {
      let query = supabase.from('reports').select('*');
      
      if (filters.type && filters.type !== 'all') query = query.eq('type', filters.type);
      if (filters.category && filters.category !== 'All') query = query.eq('category', filters.category);
      if (filters.status && filters.status !== 'All') query = query.eq('status', filters.status);
      if (filters.userId) query = query.eq('user_id', filters.userId);
      
      if (filters.building && filters.building !== 'All') {
        query = query.or(`building.eq.${filters.building},location.ilike.%${filters.building}%`);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('timestamp', { ascending: false });
      if (error) throw error;
      
      const localItems = JSON.parse(localStorage.getItem('traceit_pending_reports') || '[]');
      const filteredLocal = filters.userId
        ? localItems.filter(r => r.user_id === filters.userId)
        : localItems;

      const seenIds = new Set((data || []).map(r => r.id));
      const newLocal = filteredLocal.filter(r => !seenIds.has(r.id));
      const combined = [...(data || []), ...newLocal];

      return combined.map(r => ({
        ...r,
        user_name: r.user_name || 'Campus Member',
        user_email: r.user_email || 'student@campus.edu',
        user_avatar: r.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(r.user_name || r.title || 'Campus')}`
      }));
    } catch (err) {
      console.warn('Supabase DB fetch fallback:', err.message);
      const localItems = JSON.parse(localStorage.getItem('traceit_pending_reports') || '[]');
      const filteredLocal = filters.userId
        ? localItems.filter(r => r.user_id === filters.userId)
        : localItems;
      return filteredLocal.map(r => ({
        ...r,
        user_name: r.user_name || 'Campus Member',
        user_email: r.user_email || 'student@campus.edu',
        user_avatar: r.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(r.user_name || r.title || 'Campus')}`
      }));
    }
  },
  getReportById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      return {
        ...data,
        user_name: data.user_name || 'Campus Member',
        user_email: data.user_email || 'student@campus.edu',
        user_avatar: data.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.title || 'Report')}`
      };
    } catch (err) {
      const localItems = JSON.parse(localStorage.getItem('traceit_pending_reports') || '[]');
      const found = localItems.find(r => r.id === id);
      if (found) return found;
      throw err;
    }
  },
  createReport: async (formData) => {
    // 1. Get current authenticated user session
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const userId = user?.id || null;
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Campus User';
    const userEmail = user?.email || 'user@campus.edu';

    // 2. Ensure user record exists in public.users to fulfill foreign key constraint
    if (user?.id) {
      try {
        await supabase.from('users').upsert({
          id: user.id,
          name: userName,
          email: userEmail,
          role: 'student',
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName)}`
        });
      } catch (uErr) {
        console.warn('User upsert notice:', uErr);
      }
    }

    // 3. Extract payload data (FormData or JS Object)
    let photoFile = null;
    let photo_url = null;
    let payload = {};

    if (formData instanceof FormData) {
      photoFile = formData.get('photo');
      photo_url = formData.get('photo_url') || null;
      for (let [key, value] of formData.entries()) {
        if (key !== 'photo' && key !== 'photo_url') payload[key] = value;
      }
    } else {
      payload = { ...formData };
      photo_url = payload.photo_url || null;
      photoFile = payload.photo || null;
    }

    // 4. Preserve real uploaded photo: upload to Supabase Storage or encode as data URL
    if (photoFile && photoFile instanceof File && photoFile.size > 0) {
      try {
        const fileExt = photoFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = `photos/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(filePath, photoFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('item-images')
            .getPublicUrl(filePath);
          photo_url = publicUrl;
        } else {
          // If storage bucket is not configured, encode the real uploaded file as optimized data URL
          const dataUrl = await fileToDataUrl(photoFile);
          if (dataUrl) photo_url = dataUrl;
        }
      } catch {
        const dataUrl = await fileToDataUrl(photoFile);
        if (dataUrl) photo_url = dataUrl;
      }
    } else if (!photo_url && payload.photoUrl) {
      photo_url = payload.photoUrl;
    }

    // If no photo was uploaded or provided, leave as empty string — DO NOT fake demo photos!
    if (!photo_url) {
      photo_url = '';
    }

    // Safe JSON parse for auto_tags
    let parsedTags = [];
    if (payload.auto_tags) {
      try {
        parsedTags = typeof payload.auto_tags === 'string' ? JSON.parse(payload.auto_tags) : payload.auto_tags;
      } catch (e) {
        parsedTags = [];
      }
    }

    const reportId = `rep-${payload.type || 'lost'}-${Date.now()}`;
    const reportRecord = {
      id: reportId,
      user_id: userId,
      type: payload.type || 'lost',
      title: payload.title || 'Reported Item',
      description: payload.description || '',
      category: payload.category || 'Other',
      photo_url: photo_url,
      location: payload.location || payload.building || 'Campus',
      building: payload.building || 'Main Campus',
      lat: parseFloat(payload.lat) || 37.4275,
      lng: parseFloat(payload.lng) || -122.1697,
      timestamp: payload.timestamp || new Date().toISOString(),
      status: 'active',
      auto_tags: parsedTags,
      visual_color: payload.visual_color || 'Standard',
      visual_brand: payload.visual_brand || 'Generic',
      serial_number: payload.serial_number || '',
      is_high_value: parseInt(payload.is_high_value) || 0,
      item_details_hidden: payload.item_details_hidden || ''
    };

    // 5. Insert directly into Supabase PostgreSQL Database (with fail-safe fallback)
    try {
      const { data: insertedData, error: dbError } = await supabase
        .from('reports')
        .insert([reportRecord])
        .select()
        .single();

      if (dbError) throw dbError;

      const finalReport = {
        ...(insertedData || reportRecord),
        user_name: userName,
        user_email: userEmail,
        user_avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName)}`
      };

      return {
        message: 'Report submitted successfully! Stored permanently in Supabase.',
        report: finalReport,
        matchCount: 0,
        topMatches: []
      };
    } catch (dbError) {
      console.warn('Supabase DB Insert note (using fail-safe store):', dbError.message);
      
      const fallbackReport = {
        ...reportRecord,
        user_name: userName,
        user_email: userEmail,
        user_avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName)}`
      };

      const existing = JSON.parse(localStorage.getItem('traceit_pending_reports') || '[]');
      existing.unshift(fallbackReport);
      localStorage.setItem('traceit_pending_reports', JSON.stringify(existing));

      return {
        message: 'Report filed successfully!',
        report: fallbackReport,
        matchCount: 0,
        topMatches: []
      };
    }
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
  deleteReport: async (id) => {
    try {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) console.warn('Supabase delete notice:', error.message);
      const local = JSON.parse(localStorage.getItem('traceit_pending_reports') || '[]');
      localStorage.setItem('traceit_pending_reports', JSON.stringify(local.filter(r => r.id !== id)));
      return { success: true };
    } catch (err) {
      console.error('Delete report error:', err);
      return { success: false, error: err.message };
    }
  },

  // Matches
  getAllMatches: async () => {
    try {
      const res = await fetch(`${BASE_URL}/matches`);
      if (!res.ok) return [];
      const contentType = res.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  getMatchesForReport: async (reportId, allReports = null) => {
    // 1. Try querying backend matches API if available
    try {
      const res = await fetch(`${BASE_URL}/matches/report/${reportId}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      }
    } catch {
      // Backend not running, proceed to client-side Multimodal Fusion Matching Engine
    }

    // 2. Multimodal Fusion Matching Engine comparing real lost & found reports
    try {
      const reports = Array.isArray(allReports) && allReports.length > 0
        ? allReports
        : await api.getReports();
      const target = reports.find(r => r.id === reportId);
      if (!target) return [];
      return findMatchesForReport(target, reports);
    } catch (err) {
      console.warn('Matching engine execution warning:', err);
      return [];
    }
  },
  getMatchById: async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/matches/${id}`);
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Verification
  getVerificationChallenge: async (matchOrId) => {
    const matchId = typeof matchOrId === 'string' ? matchOrId : matchOrId?.id;
    let matchObj = typeof matchOrId === 'object' ? matchOrId : null;

    // 1. If backend API is reachable and returns a valid challenge, use it
    if (matchId) {
      try {
        const res = await fetch(`${BASE_URL}/verification/challenge/${matchId}`);
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            if (data && (data.question_1 || data.hasPrivateDetails === false || (data.questions && data.questions.length > 0))) {
              return data;
            }
          }
        }
      } catch {
        // Backend not available (e.g. static Vercel or offline), fall through to deterministic engine
      }
    }

    // 2. Extract or fetch the lost and found reports
    let lostReport = matchObj?.lost_report;
    let foundReport = matchObj?.found_report;

    if (!lostReport && matchObj?.lost_report_id) {
      try {
        lostReport = await api.getReportById(matchObj.lost_report_id);
      } catch (e) {
        console.warn('Could not fetch lost report by ID:', e);
      }
    }
    if (!foundReport && matchObj?.found_report_id) {
      try {
        foundReport = await api.getReportById(matchObj.found_report_id);
      } catch (e) {
        console.warn('Could not fetch found report by ID:', e);
      }
    }

    // If only matchId string was provided (e.g. `match-{lostId}-{foundId}`):
    if (!lostReport && typeof matchId === 'string' && matchId.startsWith('match-')) {
      const parts = matchId.split('-');
      if (parts.length >= 3) {
        try {
          lostReport = await api.getReportById(parts[1]);
          foundReport = await api.getReportById(parts.slice(2).join('-'));
        } catch (e) {}
      }
    }

    // 3. Formulate challenge strictly using verificationEngine
    return generateVerificationChallenge(lostReport, foundReport);
  },
  submitVerification: async ({ matchId, match, answer1, answer2, userId, challenge }) => {
    // 1. Try backend submission if available
    try {
      const res = await fetch(`${BASE_URL}/verification/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, answer1, answer2, userId })
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && typeof data.passed === 'boolean') {
            return data;
          }
        }
      }
    } catch {
      // Fall through to client evaluation
    }

    // 2. Client-side evaluation using verificationEngine
    const questions = challenge?.questions || [];
    const evalResult = evaluateVerificationAnswers(questions, [answer1, answer2]);

    if (evalResult.passed) {
      const lostId = match?.lost_report_id || match?.lost_report?.id;
      const foundId = match?.found_report_id || match?.found_report?.id;
      const matchId = match?.id;

      try {
        if (matchId) {
          await supabase.from('matches').update({ status: 'verified' }).eq('id', matchId);
        }
        const idsToUpdate = [lostId, foundId].filter(Boolean);
        if (idsToUpdate.length > 0) {
          await supabase.from('reports').update({ status: 'verified' }).in('id', idsToUpdate);
        }
      } catch (e) {
        console.warn('Supabase status update error:', e);
      }
    }

    return {
      ...evalResult,
      matchStatus: evalResult.passed ? 'verified' : 'rejected'
    };
  },

  // ── Ensure match exists in Supabase before chat operations ──
  ensureMatchInDb: async (match) => {
    if (!match?.id) return;
    try {
      const { data: existing } = await supabase
        .from('matches')
        .select('id')
        .eq('id', match.id)
        .maybeSingle();
      if (existing) return; // already persisted

      await supabase.from('matches').insert([{
        id: match.id,
        lost_report_id: match.lost_report_id,
        found_report_id: match.found_report_id,
        confidence_score: match.confidence_score || 0,
        visual_score: match.visual_score || 0,
        text_score: match.text_score || 0,
        location_score: match.location_score || 0,
        time_score: match.time_score || 0,
        explanation: match.explanation || '',
        status: match.status || 'pending'
      }]);
    } catch (e) {
      console.warn('ensureMatchInDb:', e.message);
    }
  },

  // Chat & Resolution (Supabase-direct — no Express backend needed)
  getChat: async (matchId) => {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getChat error:', error);
      return { messages: [], match: null };
    }

    // Also fetch match status
    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .maybeSingle();

    return { messages: messages || [], match: match || null };
  },
  sendMessage: async (matchId, data) => {
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const row = {
      id: msgId,
      match_id: matchId,
      sender_id: data.senderId,
      receiver_id: data.receiverId,
      sender_name: data.senderName || 'Campus User',
      text: data.text,
      is_location_share: data.isLocationShare ? 1 : 0
    };

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('sendMessage Supabase error:', error);
      throw new Error(error.message);
    }
    return inserted;
  },
  markReunited: async (matchId, data) => {
    // Update match status
    await supabase
      .from('matches')
      .update({ status: 'reunited' })
      .eq('id', matchId);

    // Update both reports to reunited
    const { data: match } = await supabase
      .from('matches')
      .select('lost_report_id, found_report_id')
      .eq('id', matchId)
      .maybeSingle();

    if (match) {
      await supabase
        .from('reports')
        .update({ status: 'reunited' })
        .in('id', [match.lost_report_id, match.found_report_id].filter(Boolean));
    }

    // Insert system message
    const msgId = `msg-${Date.now()}`;
    await supabase.from('messages').insert([{
      id: msgId,
      match_id: matchId,
      sender_id: 'system',
      sender_name: 'TraceIt Assistant',
      text: `🎉 Item marked as successfully REUNITED by ${data.userName || 'Campus User'}! +100 Hero Points awarded.`,
      is_location_share: 0
    }]);

    return { message: 'Item successfully marked as reunited!', matchStatus: 'reunited' };
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
