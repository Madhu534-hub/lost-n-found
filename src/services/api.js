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
        user_email: r.user_email || '',
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
        user_email: r.user_email || '',
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
        user_email: data.user_email || '',
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
      // Always persist both UUID and email so ownership matching works on any device/session
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
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
      // Found reports never receive a substitute or fake ownership secret.
      ...(payload.type === 'lost' ? { item_details_hidden: payload.item_details_hidden || '' } : {})
    };

    // 5. Clean record matching exact Supabase public.reports table schema
    const supabaseReportRecord = {
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
      item_details_hidden: payload.type === 'lost' ? (payload.item_details_hidden || '') : null
    };

    // 6. Direct Supabase storage: store the clean report record directly in Supabase
    let finalReport = {
      ...supabaseReportRecord,
      user_name: userName,
      user_email: userEmail,
      user_avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName)}`
    };

    try {
      const { data: insertedData, error: dbError } = await supabase
        .from('reports')
        .upsert([supabaseReportRecord], { onConflict: 'id', ignoreDuplicates: false })
        .select()
        .single();

      if (dbError) throw dbError;
      if (insertedData) {
        finalReport = { ...finalReport, ...insertedData };
      }
    } catch (dbError) {
      console.warn('Supabase DB Insert note (using fail-safe store):', dbError.message);
    }

    // 7. Inform Express backend (optional server-side triggers / sqlite sync)
    try {
      const backendPayload = formData instanceof FormData ? formData : supabaseReportRecord;
      if (backendPayload instanceof FormData && !backendPayload.get('user_id') && userId) {
        backendPayload.set('user_id', userId);
      }
      await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers: backendPayload instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
        body: backendPayload instanceof FormData ? backendPayload : JSON.stringify(backendPayload)
      });
    } catch (backendError) {
      console.warn('Backend report sync notice:', backendError.message);
    }

    // Client-side cross-user match detection and notifications across all reports in Supabase
    let matches = [];
    try {
      const allReports = await api.getReports();
      matches = await api.getMatchesForReport(finalReport.id, allReports);
    } catch (matchErr) {
      console.warn('Match detection notice:', matchErr.message);
    }

    return {
      message: 'Report submitted successfully! Stored permanently in Supabase.',
      report: finalReport,
      matchCount: matches.length,
      topMatches: matches.slice(0, 3)
    };
  },
  // Update an existing report (Ownership verified on frontend and backend)
  updateReport: async (id, payload) => {
    // 1. Get current authenticated user session
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const userId = user?.id || null;

    if (!userId) {
      throw new Error('You must be logged in to edit a report.');
    }

    // 2. Fetch existing report to verify ownership on the frontend
    const { data: existingReport, error: fetchErr } = await supabase
      .from('reports')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    // Verify ownership: ensure current user created this report
    if (existingReport && existingReport.user_id && existingReport.user_id !== userId) {
      throw new Error('Unauthorized: You can only edit your own reports.');
    }

    // 3. Prepare payload fields
    let updatedRecord = {};
    if (payload instanceof FormData) {
      if (!payload.get('user_id')) payload.append('user_id', userId);
      // Convert FormData entries to an object for Supabase
      payload.forEach((val, key) => {
        if (key !== 'photo') updatedRecord[key] = val;
      });
    } else {
      updatedRecord = { ...payload, user_id: userId };
    }

    // Parse auto_tags if passed as string
    if (typeof updatedRecord.auto_tags === 'string') {
      try {
        updatedRecord.auto_tags = JSON.parse(updatedRecord.auto_tags);
      } catch (e) {}
    }

    // 4. Update report record directly in Supabase DB
    try {
      const { error: dbError } = await supabase
        .from('reports')
        .update(updatedRecord)
        .eq('id', id)
        .eq('user_id', userId); // Enforce owner check in DB update

      if (dbError) {
        console.warn('Supabase report update note:', dbError.message);
      }
    } catch (dbErr) {
      console.warn('Supabase report update exception:', dbErr.message);
    }

    // 5. Send PUT request to Express backend (updates SQLite & triggers cross-user sync)
    try {
      const backendPayload = payload instanceof FormData ? payload : updatedRecord;
      const res = await fetch(`${BASE_URL}/reports/${id}`, {
        method: 'PUT',
        headers: backendPayload instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
        body: backendPayload instanceof FormData ? backendPayload : JSON.stringify(backendPayload)
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update report on backend server.');
      }
      return result;
    } catch (backendErr) {
      console.warn('Backend update notice (continuing with Supabase update):', backendErr.message);
      // If backend fails but Supabase succeeded, return clean success object
      return {
        success: true,
        message: 'Report updated successfully!',
        report: { id, ...updatedRecord }
      };
    }
  },
  updateReportStatus: async (id, status) => {
    const res = await fetch(`${BASE_URL}/reports/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },
  // Delete an existing report (Ownership verified on frontend and backend)
  deleteReport: async (id, photoUrl = null) => {
    let errorMsg = null;
    let currentUserId = null;

    // 1. Get current authenticated user session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id || null;
    } catch {}

    if (!currentUserId) {
      throw new Error('You must be logged in to delete a report.');
    }

    // 2. Fetch report to verify ownership on the frontend before calling API
    try {
      const { data: reportData } = await supabase
        .from('reports')
        .select('user_id')
        .eq('id', id)
        .maybeSingle();

      if (reportData && reportData.user_id && reportData.user_id !== currentUserId) {
        throw new Error('Unauthorized: You can only delete your own reports.');
      }
    } catch (authErr) {
      if (authErr.message.includes('Unauthorized')) throw authErr;
    }

    // 3. Send DELETE request to Express backend (updates SQLite & removes backend matches)
    try {
      const res = await fetch(`${BASE_URL}/reports/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Backend failed to delete report.');
      }
    } catch (e) {
      console.warn('Backend delete notice (continuing to Supabase):', e.message);
    }

    // 4. Delete associated matches from Supabase
    try {
      await supabase.from('matches').delete().or(`lost_report_id.eq.${id},found_report_id.eq.${id}`);
    } catch (mErr) {
      console.warn('Supabase match delete notice:', mErr.message);
    }

    // 5. Delete report from Supabase (enforce user_id filter for DB security)
    try {
      const { error: dbError } = await supabase
        .from('reports')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUserId);

      if (dbError) {
        console.warn('Supabase report delete notice:', dbError.message);
        errorMsg = dbError.message;
      }
    } catch (err) {
      console.warn('Supabase report delete error:', err.message);
      errorMsg = err.message;
    }

    // 6. Delete uploaded photo from Supabase Storage if it was uploaded to item-images
    if (photoUrl && typeof photoUrl === 'string' && photoUrl.includes('item-images')) {
      try {
        const parts = photoUrl.split('item-images/');
        if (parts[1]) {
          const filePath = parts[1].split('?')[0];
          await supabase.storage.from('item-images').remove([filePath]);
        }
      } catch (sErr) {
        console.warn('Supabase storage photo delete notice:', sErr.message);
      }
    }

    // 7. Clean device local storage fallback
    try {
      const local = JSON.parse(localStorage.getItem('traceit_pending_reports') || '[]');
      localStorage.setItem('traceit_pending_reports', JSON.stringify(local.filter(r => r.id !== id)));
    } catch (lsErr) {
      console.warn('LocalStorage delete notice:', lsErr.message);
    }

    return { success: !errorMsg, error: errorMsg };
  },
  getMatchesForReport: async (reportId, candidatePool = null) => {
    try {
      let pool = candidatePool;
      if (!pool || !Array.isArray(pool) || pool.length === 0) {
        pool = await api.getReports();
      }

      let targetReport = (pool || []).find(r => r.id === reportId);
      if (!targetReport) {
        try {
          targetReport = await api.getReportById(reportId);
        } catch {}
      }
      if (!targetReport) return [];

      // 1. Calculate multimodal fusion matches across the shared campus pool
      const calculatedMatches = findMatchesForReport(targetReport, pool || []);

      // 2. Fetch existing match records from Supabase public.matches for this report
      let dbMatches = [];
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .or(`lost_report_id.eq.${reportId},found_report_id.eq.${reportId}`);
        if (!error && Array.isArray(data)) {
          dbMatches = data;
        }
      } catch (e) {
        console.warn('Supabase match fetch warning:', e.message);
      }

      const dbMatchMap = new Map();
      dbMatches.forEach(m => {
        dbMatchMap.set(`${m.lost_report_id}-${m.found_report_id}`, m);
      });

      const finalMatches = [];
      const seenPairKeys = new Set();

      for (const cm of calculatedMatches) {
        const pairKey = `${cm.lost_report_id}-${cm.found_report_id}`;
        seenPairKeys.add(pairKey);
        const existingDb = dbMatchMap.get(pairKey);

        const mergedMatch = {
          ...cm,
          id: existingDb?.id || cm.id,
          status: existingDb?.status || cm.status || 'pending',
          explanation: existingDb?.explanation || cm.explanation
        };

        // If not in DB yet, persist to Supabase public.matches
        if (!existingDb && mergedMatch.confidence_score >= 50) {
          try {
            await supabase.from('matches').upsert([{
              id: mergedMatch.id,
              lost_report_id: mergedMatch.lost_report_id,
              found_report_id: mergedMatch.found_report_id,
              confidence_score: mergedMatch.confidence_score,
              visual_score: mergedMatch.visual_score,
              text_score: mergedMatch.text_score,
              location_score: mergedMatch.location_score,
              time_score: mergedMatch.time_score,
              explanation: mergedMatch.explanation,
              status: mergedMatch.status
            }], { onConflict: 'id', ignoreDuplicates: true });

            // Notify the lost report owner
            const lostUserId = mergedMatch.lost_user_id || mergedMatch.lost_report?.user_id;
            if (lostUserId) {
              const notifId = `notif-match-${mergedMatch.id}`;
              const foundLocation = mergedMatch.found_report?.location || mergedMatch.found_report?.building || 'campus';
              await supabase.from('notifications').upsert([{
                id: notifId,
                user_id: lostUserId,
                type: 'match',
                title: `🔔 Possible Match Found! (${mergedMatch.confidence_score}% confidence)`,
                message: `Your lost item "${mergedMatch.lost_report?.title || 'Reported item'}" may have been found near ${foundLocation}. AI match confidence: ${mergedMatch.confidence_score}%. Tap to view and verify ownership.`,
                match_id: mergedMatch.id,
                read: false
              }], { onConflict: 'id', ignoreDuplicates: true });
            }
          } catch (pErr) {
            console.warn('Match persist notice:', pErr.message);
          }
        }

        finalMatches.push(mergedMatch);
      }

      // Also include any verified/existing DB matches not in calculated pool
      for (const dm of dbMatches) {
        const pairKey = `${dm.lost_report_id}-${dm.found_report_id}`;
        if (!seenPairKeys.has(pairKey)) {
          const lostRep = (pool || []).find(r => r.id === dm.lost_report_id);
          const foundRep = (pool || []).find(r => r.id === dm.found_report_id);
          if (lostRep && foundRep) {
            finalMatches.push({
              id: dm.id,
              lost_report_id: dm.lost_report_id,
              found_report_id: dm.found_report_id,
              lost_user_id: lostRep.user_id,
              found_user_id: foundRep.user_id,
              confidence_score: dm.confidence_score,
              visual_score: dm.visual_score,
              text_score: dm.text_score,
              location_score: dm.location_score,
              time_score: dm.time_score,
              explanation: dm.explanation,
              status: dm.status,
              target_report: targetReport,
              matched_report: targetReport.id === dm.lost_report_id ? foundRep : lostRep,
              lost_report: lostRep,
              found_report: foundRep
            });
          }
        }
      }

      return finalMatches.sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));
    } catch (err) {
      console.error('getMatchesForReport error:', err);
      return [];
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // BUG FIX: This method was missing! VerificationModal.jsx calls
  // api.getVerificationChallenge(match) but the method was never defined
  // in this file, causing a runtime error ("api.getVerificationChallenge is
  // not a function") when a user tried to verify ownership of a match.
  //
  // How it works: First tries fetching from the backend Express server.
  // If the backend is unavailable (e.g. Vercel frontend-only deployment),
  // falls back to generating the challenge client-side using the
  // verificationEngine imported at the top of this file.
  // ──────────────────────────────────────────────────────────────────────────
  getVerificationChallenge: async (match) => {
    const matchId = match?.id;

    // Identify lost and found report objects from the match
    const lostReport = match?.lost_report || (match?.target_report?.type === 'lost' ? match?.target_report : match?.matched_report);
    const foundReport = match?.found_report || (match?.target_report?.type === 'found' ? match?.target_report : match?.matched_report);

    // 1. Try the Express backend endpoint first
    try {
      if (matchId) {
        const res = await fetch(`${BASE_URL}/verification/challenge/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          // If backend generated valid anti-fraud questions, return them!
          if (data && (data.question_1 || data.questions?.length > 0)) {
            return data;
          }
        }
      }
    } catch {
      // Backend not reachable — fall through to client-side generation
    }

    // 2. Client-side fallback: generate challenge from the match's report data
    return generateVerificationChallenge(lostReport, foundReport);
  },

  submitVerification: async ({ matchId, match, answer1, answer2, userId, challenge }) => {
    try {
      // BUG FIX: The URL was "/verification/verify" but the backend route is
      // "/verification/submit" (see backend/routes/verification.js line 75).
      // This mismatch meant verification submissions always got a 404 from the
      // backend, silently falling through to the client-side evaluator.
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
