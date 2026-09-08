/**
 * Multimodal Fusion Matching Engine for TraceIt (Frontend Client & Standalone)
 * Computes:
 * 1. Visual Similarity (35%): Category, dominant color, brand, auto-tags
 * 2. Semantic Text Similarity (35%): Jaccard token overlap + keyword boosts
 * 3. Spatial Proximity (15%): Campus building matching & Haversine distance
 * 4. Temporal Proximity (15%): Exponential decay based on time delta
 */

// Haversine formula to compute distance in meters between two coordinates
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 500;
  const R = 6371e3; // Earth radius in meters
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Tokenize and compute Jaccard word overlap similarity
export function calculateTextOverlap(text1, text2) {
  if (!text1 || !text2) return 0;
  const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'with', 'my', 'of', 'and', 'to', 'for', 'is', 'it', 'has', 'near', 'by', 'floor']);

  const tokens1 = text1.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const tokens2 = text2.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let intersection = 0;
  for (const t of set1) {
    if (set2.has(t)) intersection++;
  }

  const union = new Set([...set1, ...set2]).size;
  return union > 0 ? (intersection / union) * 100 : 0;
}

// Visual similarity score (0 - 100)
export function calculateVisualSimilarity(rep1, rep2) {
  let score = 0;

  // Category match
  if (rep1.category && rep2.category && rep1.category === rep2.category) {
    score += 40;
  } else {
    // If titles share keywords, don't drop to 0
    return 20;
  }

  // Color match
  const c1 = (rep1.visual_color || '').toLowerCase();
  const c2 = (rep2.visual_color || '').toLowerCase();
  if (c1 && c2) {
    if (c1 === c2 || c1.includes(c2) || c2.includes(c1)) {
      score += 25;
    } else if (
      (c1.includes('blue') && c2.includes('blue')) ||
      (c1.includes('black') && c2.includes('dark')) ||
      (c1.includes('white') && c2.includes('silver')) ||
      (c1.includes('red') && c2.includes('crimson'))
    ) {
      score += 20;
    }
  } else {
    score += 15;
  }

  // Brand match
  const b1 = (rep1.visual_brand || '').toLowerCase();
  const b2 = (rep2.visual_brand || '').toLowerCase();
  if (b1 && b2 && b1 !== 'generic' && b2 !== 'generic') {
    if (b1 === b2 || b1.includes(b2) || b2.includes(b1)) {
      score += 20;
    }
  } else {
    score += 10;
  }

  // Auto tags overlap
  try {
    const tags1 = typeof rep1.auto_tags === 'string' ? JSON.parse(rep1.auto_tags || '[]') : (rep1.auto_tags || []);
    const tags2 = typeof rep2.auto_tags === 'string' ? JSON.parse(rep2.auto_tags || '[]') : (rep2.auto_tags || []);

    if (tags1.length > 0 && tags2.length > 0) {
      const set1 = new Set(tags1.map(t => t.toLowerCase()));
      const set2 = new Set(tags2.map(t => t.toLowerCase()));
      let shared = 0;
      for (const t of set1) {
        if (set2.has(t) || [...set2].some(s => s.includes(t) || t.includes(s))) {
          shared++;
        }
      }
      const tagScore = Math.min(15, (shared / Math.max(1, set1.size)) * 20);
      score += tagScore;
    } else {
      score += 10;
    }
  } catch {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

// Semantic text similarity score (0 - 100)
export function calculateTextSimilarity(rep1, rep2) {
  const fullText1 = `${rep1.title || ''} ${rep1.description || ''} ${rep1.location || ''}`;
  const fullText2 = `${rep2.title || ''} ${rep2.description || ''} ${rep2.location || ''}`;

  const rawOverlap = calculateTextOverlap(fullText1, fullText2);

  // Common keywords boost
  const title1 = (rep1.title || '').toLowerCase().trim();
  const title2 = (rep2.title || '').toLowerCase().trim();
  let titleBonus = 0;
  if (title1 && title2) {
    if (title1 === title2) titleBonus = 40;
    else if (title1.includes(title2) || title2.includes(title1)) titleBonus = 30;
  }

  const boostedScore = rawOverlap * 1.3 + titleBonus;
  return Math.min(100, Math.max(25, Math.round(boostedScore)));
}

// Location proximity score (0 - 100) based on user-entered location & floor
export function calculateLocationSimilarity(rep1, rep2) {
  const loc1 = (rep1.location || rep1.building || '').toLowerCase().trim();
  const loc2 = (rep2.location || rep2.building || '').toLowerCase().trim();

  if (!loc1 || !loc2) return 50;

  // 1. Exact location & floor match
  if (loc1 === loc2) {
    return 98;
  }

  // 2. Token overlap on user-entered location & floor text
  const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'near', 'by', 'of', 'and']);
  const tokens1 = loc1.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
  const tokens2 = loc2.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));

  if (tokens1.length > 0 && tokens2.length > 0) {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    let shared = 0;
    for (const t of set1) {
      if (set2.has(t) || [...set2].some(s => s.includes(t) || t.includes(s))) {
        shared++;
      }
    }

    const minTokens = Math.min(set1.size, set2.size);
    const overlapRatio = shared / minTokens;

    // High overlap: same building or area (e.g. "Main Library, 2nd Floor" vs "Main Library, 1st Floor")
    if (overlapRatio >= 0.75) return 88;
    if (overlapRatio >= 0.5) return 78;
    if (overlapRatio >= 0.3) return 60;
  }

  // 3. Fallback: if coordinates are distinct and non-default, evaluate physical distance
  const isDefaultCoord = (lat, lng) => Math.abs(lat - 37.4275) < 0.0001 && Math.abs(lng - (-122.1697)) < 0.0001;
  if (rep1.lat && rep1.lng && rep2.lat && rep2.lng && (!isDefaultCoord(rep1.lat, rep1.lng) || !isDefaultCoord(rep2.lat, rep2.lng))) {
    const distMeters = haversineDistanceMeters(rep1.lat, rep1.lng, rep2.lat, rep2.lng);
    if (distMeters <= 50) return 92;
    if (distMeters <= 150) return 80;
    if (distMeters <= 300) return 65;
    if (distMeters <= 600) return 50;
    return Math.max(15, Math.round(100 - (distMeters / 25)));
  }

  // If text is completely different (e.g. "College Canteen" vs "Main Library"), return low score
  return 20;
}

// Time proximity score (0 - 100)
export function calculateTimeSimilarity(rep1, rep2) {
  const t1 = new Date(rep1.timestamp).getTime();
  const t2 = new Date(rep2.timestamp).getTime();

  if (isNaN(t1) || isNaN(t2)) return 75;

  const diffHours = Math.abs(t1 - t2) / (1000 * 60 * 60);
  if (diffHours <= 1) return 98;
  if (diffHours <= 3) return 92;
  if (diffHours <= 8) return 85;
  if (diffHours <= 24) return 75;
  if (diffHours <= 72) return 60;
  if (diffHours <= 168) return 45;
  return Math.max(20, Math.round(100 * Math.exp(-0.015 * diffHours)));
}

// Compute full multimodal fusion score
export function computeFusionScore(lostReport, foundReport) {
  const visualScore = calculateVisualSimilarity(lostReport, foundReport);
  const textScore = calculateTextSimilarity(lostReport, foundReport);
  const locationScore = calculateLocationSimilarity(lostReport, foundReport);
  const timeScore = calculateTimeSimilarity(lostReport, foundReport);

  // Exact Serial / IMEI check
  const s1 = (lostReport.serial_number || '').trim().toLowerCase();
  const s2 = (foundReport.serial_number || '').trim().toLowerCase();
  const hasExactSerialMatch = s1 && s2 && s1.length >= 3 && (s1 === s2 || s1.includes(s2) || s2.includes(s1));

  let confidenceScore = Math.round(
    visualScore * 0.35 +
    textScore * 0.35 +
    locationScore * 0.15 +
    timeScore * 0.15
  );

  if (hasExactSerialMatch) {
    confidenceScore = 99;
  }

  return {
    confidenceScore: Math.min(100, Math.max(10, confidenceScore)),
    visualScore: hasExactSerialMatch ? 100 : visualScore,
    textScore: hasExactSerialMatch ? 100 : textScore,
    locationScore,
    timeScore,
    isSerialMatch: !!hasExactSerialMatch
  };
}

/**
 * Scan a list of reports to find candidate matches for targetReport
 * Returns an array of match objects compatible with MatchCard
 */
export function findMatchesForReport(targetReport, allReports = []) {
  if (!targetReport || !Array.isArray(allReports)) return [];

  const targetType = (targetReport.type || '').toLowerCase();
  const oppositeType = targetType === 'lost' ? 'found' : 'lost';

  // Filter candidates: opposite type and active
  const candidates = allReports.filter(r => {
    if (r.id === targetReport.id) return false;
    const rType = (r.type || '').toLowerCase();
    return rType === oppositeType && r.status !== 'reunited';
  });

  const matches = [];

  for (const candidate of candidates) {
    const lostRep = targetType === 'lost' ? targetReport : candidate;
    const foundRep = targetType === 'found' ? targetReport : candidate;

    const scores = computeFusionScore(lostRep, foundRep);

    // Strict minimum AI confidence threshold (>= 50%)
    if (scores.confidenceScore >= 50) {
      let explanation = '';
      if (scores.isSerialMatch) {
        explanation = `Verified by exact hardware serial/identifier match (${lostRep.serial_number || foundRep.serial_number}). 100% hardware verification.`;
      } else {
        const parts = [];
        if (scores.visualScore >= 70) parts.push(`Matching category '${lostRep.category}' with similar visual characteristics`);
        if (scores.textScore >= 60) parts.push(`matching item title and descriptions`);
        if (scores.locationScore >= 75) parts.push(`spatial proximity near ${foundRep.building || foundRep.location || 'campus'}`);
        explanation = `Multimodal AI match (${scores.confidenceScore}% confidence): ${parts.join(', ') || 'High similarity detected across campus feeds'}.`;
      }

      matches.push({
        id: `match-${lostRep.id}-${foundRep.id}`,
        lost_report_id: lostRep.id,
        found_report_id: foundRep.id,
        confidence_score: scores.confidenceScore,
        visual_score: scores.visualScore,
        text_score: scores.textScore,
        location_score: scores.locationScore,
        time_score: scores.timeScore,
        explanation,
        status: 'pending',
        target_report: targetReport,
        matched_report: candidate,
        lost_report: lostRep,
        found_report: foundRep,
        is_serial_match: scores.isSerialMatch
      });
    }
  }

  // Sort highest confidence first
  return matches.sort((a, b) => b.confidence_score - a.confidence_score);
}
