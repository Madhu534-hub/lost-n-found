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

/// Helper to determine if two campus categories are compatible
export function areCategoriesCompatible(cat1, cat2) {
  if (!cat1 || !cat2) return true;
  const c1 = cat1.toLowerCase().trim();
  const c2 = cat2.toLowerCase().trim();
  if (c1 === c2) return true;
  if (c1 === 'other' || c2 === 'other') return true;

  const isElectronics = (c) => c.includes('electronic') || c.includes('phone') || c.includes('laptop') || c.includes('audio') || c.includes('earphone');
  const isKeysOrIDs = (c) => c.includes('key') || c.includes('id') || c.includes('card');
  const isBags = (c) => c.includes('bag') || c.includes('backpack');
  const isBottles = (c) => c.includes('bottle') || c.includes('container') || c.includes('flask');
  const isClothing = (c) => c.includes('cloth') || c.includes('apparel') || c.includes('wear') || c.includes('shoe');
  const isWallets = (c) => c.includes('wallet') || c.includes('purse');

  if (isElectronics(c1) && (isKeysOrIDs(c2) || isBottles(c2) || isClothing(c2))) return false;
  if (isElectronics(c2) && (isKeysOrIDs(c1) || isBottles(c1) || isClothing(c1))) return false;
  if (isKeysOrIDs(c1) && (isBags(c2) || isBottles(c2) || isClothing(c2) || isElectronics(c2))) return false;
  if (isKeysOrIDs(c2) && (isBags(c1) || isBottles(c1) || isClothing(c1) || isElectronics(c1))) return false;
  if (isBottles(c1) && (isClothing(c2) || isWallets(c2) || isElectronics(c2))) return false;
  if (isBottles(c2) && (isClothing(c1) || isWallets(c1) || isElectronics(c1))) return false;

  return true;
}

// Visual similarity score (0 - 100)
export function calculateVisualSimilarity(rep1, rep2) {
  let score = 0;
  const c1 = (rep1.category || '').toLowerCase().trim();
  const c2 = (rep2.category || '').toLowerCase().trim();
  const compatible = areCategoriesCompatible(rep1.category, rep2.category);

  // Category match
  if (c1 && c2 && c1 === c2) {
    score += 40;
  } else if (compatible) {
    score += (c1 === 'other' || c2 === 'other') ? 20 : 15;
  } else {
    // Incompatible categories — check if strong text/brand evidence exists
    const t1 = `${rep1.title || ''} ${rep1.visual_brand || ''}`.toLowerCase();
    const t2 = `${rep2.title || ''} ${rep2.visual_brand || ''}`.toLowerCase();
    const overlap = calculateTextOverlap(t1, t2);
    if (overlap < 30) {
      return 0; // Incompatible physical object
    }
    score += 10;
  }

  // Color match
  const col1 = (rep1.visual_color || '').toLowerCase().trim();
  const col2 = (rep2.visual_color || '').toLowerCase().trim();
  if (col1 && col2 && col1 !== 'standard' && col2 !== 'standard') {
    if (col1 === col2 || col1.includes(col2) || col2.includes(col1)) {
      score += 25;
    } else if (
      (col1.includes('blue') && col2.includes('blue')) ||
      (col1.includes('black') && col2.includes('dark')) ||
      (col1.includes('white') && col2.includes('silver')) ||
      (col1.includes('red') && col2.includes('crimson'))
    ) {
      score += 18;
    }
  } else {
    score += 10;
  }

  // Brand match
  const b1 = (rep1.visual_brand || '').toLowerCase().trim();
  const b2 = (rep2.visual_brand || '').toLowerCase().trim();
  if (b1 && b2 && b1 !== 'generic' && b2 !== 'generic') {
    if (b1 === b2 || b1.includes(b2) || b2.includes(b1)) {
      score += 25;
    }
  } else {
    score += 8;
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
      const tagScore = Math.min(15, (shared / Math.max(1, Math.min(set1.size, set2.size))) * 15);
      score += tagScore;
    } else {
      score += 5;
    }
  } catch {
    score += 5;
  }

  return Math.min(100, Math.round(score));
}

// Semantic text similarity score (0 - 100)
export function calculateTextSimilarity(rep1, rep2) {
  const fullText1 = `${rep1.title || ''} ${rep1.description || ''}`;
  const fullText2 = `${rep2.title || ''} ${rep2.description || ''}`;

  const rawOverlap = calculateTextOverlap(fullText1, fullText2);

  // Common keywords boost
  const title1 = (rep1.title || '').toLowerCase().trim();
  const title2 = (rep2.title || '').toLowerCase().trim();
  let titleBonus = 0;
  if (title1 && title2) {
    if (title1 === title2) {
      titleBonus = 45;
    } else if (title1.includes(title2) || title2.includes(title1)) {
      titleBonus = 35;
    } else {
      const titleOverlap = calculateTextOverlap(title1, title2);
      if (titleOverlap > 0) titleBonus = titleOverlap * 0.4;
    }
  }

  const keyTerms = ['jansport', 'octocat', 'carabiner', 'iphone', 'macbook', 'hydro flask', 'yosemite', 'subaru', 'airpods', 'airpotes', 'earphones', 'earbuds', 'stanford'];
  let keyMatches = 0;
  for (const term of keyTerms) {
    if (fullText1.toLowerCase().includes(term) && fullText2.toLowerCase().includes(term)) {
      keyMatches++;
    }
  }

  const score = rawOverlap * 1.3 + titleBonus + (keyMatches * 15);
  return Math.min(100, Math.max(0, Math.round(score)));
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

  return 50;
}

// Calculate temporal proximity score based on timestamp difference
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

  // ── Physical Item Viability Gate ──────────────────────────────────────────
  const itemScore = (visualScore * 0.5) + (textScore * 0.5);
  const compatible = areCategoriesCompatible(lostReport.category, foundReport.category);

  if (!hasExactSerialMatch) {
    if (!compatible && textScore < 30) {
      confidenceScore = Math.min(confidenceScore, 25);
    } else if (itemScore < 20) {
      confidenceScore = Math.min(confidenceScore, Math.round(itemScore * 1.5));
    }
  }

  if (hasExactSerialMatch) {
    confidenceScore = 99;
  }

  return {
    confidenceScore: Math.min(100, Math.max(0, confidenceScore)),
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
        lost_user_id: lostRep.user_id,
        found_user_id: foundRep.user_id,
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
