/**
 * TraceIt Ownership Verification Engine
 * STRICT RULES:
 * 1. ONLY generate questions from real "Private Ownership Details" entered by the owner.
 * 2. NEVER invent carabiners, notebooks, stationery, stickers, scratches, or accessories.
 * 3. If private details are empty, do NOT hallucinate or generate questions.
 * 4. Questions are uniquely formulated per report based strictly on the owner's text.
 * 5. Claimant sees ONLY the question, NEVER the private detail or expected answer.
 */

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'with', 'my', 'of', 'and', 'to', 'for',
  'is', 'it', 'has', 'near', 'by', 'floor', 'there', 'some', 'also', 'that',
  'this', 'from', 'item', 'details', 'detail', 'private', 'what', 'which', 'where'
]);

// Extract significant tokens from a phrase
export function extractKeywords(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Generate ownership verification questions strictly from the owner's private details.
 * @param {Object} lostReport
 * @param {Object} foundReport
 * @returns {Object} challenge object with questions array or empty notice
 */
export function generateVerificationChallenge(lostReport, foundReport) {
  // Identify the private details provided by the owner (check lost report first, then found report)
  const rawDetails = (
    lostReport?.item_details_hidden ||
    foundReport?.item_details_hidden ||
    ''
  ).trim();

  // If no private details were provided, STRICT RULE: do NOT invent questions!
  if (!rawDetails) {
    return {
      hasPrivateDetails: false,
      message: 'No private ownership details were provided for this item, so private-question verification is unavailable.',
      questions: []
    };
  }

  // Split multi-clause private details by period, comma, semicolon, newline or 'and'
  const rawClauses = rawDetails
    .split(/[.;\n]+|\band\b/i)
    .map(c => c.trim().replace(/^\W+|\W+$/g, ''))
    .filter(c => c.length >= 3);

  const clauses = rawClauses.length > 0 ? rawClauses : [rawDetails];
  const itemTitle = (lostReport?.title || foundReport?.title || '').trim();
  const questions = [];

  // Helper to formulate a question from a single clause strictly without revealing private details
  const formulateQuestion = (clause, title, qIndex) => {
    const lower = clause.toLowerCase();
    const clauseKeywords = extractKeywords(clause);

    // 1. Check for location / attachment details on a specific part of the item
    // Examples: "attached to the left strap", "in the front pocket", "on the bottom", "near the left corner"
    const locationMatch = lower.match(/\b(?:on|at|attached to|near|in|under|behind|inside|along)\s+(?:the\s+)?([a-z0-9\s]+(?:strap|pocket|bottom|corner|side|handle|zipper|back|front|compartment|lid|base|screen|cover|body|edge))/i);
    
    // 2. Check for sticker / decal
    if (lower.includes('sticker') || lower.includes('decal')) {
      const locText = locationMatch && locationMatch[1] ? ` on the ${locationMatch[1].trim().replace(/^the\s+/i, '')}` : '';
      const targetQuestion = `What specific sticker or decal is${locText} of the ${title || 'item'}, and what does it depict?`;
      const qWords = new Set(extractKeywords(targetQuestion));
      const targetKeywords = clauseKeywords.filter(k => !qWords.has(k) || k === 'sticker' || k === 'decal');
      return {
        id: `q_${qIndex}`,
        question: targetQuestion,
        expectedHint: clause,
        keywords: targetKeywords.length > 0 ? targetKeywords : clauseKeywords
      };
    }

    // 3. Check for scratch / mark / dent / damage
    if (lower.includes('scratch') || lower.includes('mark') || lower.includes('dent') || lower.includes('damage')) {
      const locText = locationMatch && locationMatch[1] ? ` near or on the ${locationMatch[1].trim().replace(/^the\s+/i, '')}` : '';
      const targetQuestion = `What distinctive scratch, mark, or physical feature is located${locText} of the ${title || 'item'}?`;
      const qWords = new Set(extractKeywords(targetQuestion));
      const targetKeywords = clauseKeywords.filter(k => !qWords.has(k) || k === 'scratch' || k === 'mark');
      return {
        id: `q_${qIndex}`,
        question: targetQuestion,
        expectedHint: clause,
        keywords: targetKeywords.length > 0 ? targetKeywords : clauseKeywords
      };
    }

    // 4. Check for keychain / charm / lanyard / attachment
    if (lower.includes('keychain') || lower.includes('charm') || lower.includes('lanyard') || lower.includes('clip') || lower.includes('attached')) {
      const locText = locationMatch && locationMatch[1] ? ` to the ${locationMatch[1].trim().replace(/^the\s+/i, '')}` : '';
      const targetQuestion = `What specific item, accessory, or feature is attached${locText} of the ${title || 'item'}?`;
      const qWords = new Set(extractKeywords(targetQuestion));
      const targetKeywords = clauseKeywords.filter(k => !qWords.has(k) || k === 'keychain' || k === 'charm');
      return {
        id: `q_${qIndex}`,
        question: targetQuestion,
        expectedHint: clause,
        keywords: targetKeywords.length > 0 ? targetKeywords : clauseKeywords
      };
    }

    // 5. Check for inside contents / paperwork / cards / items inside
    if (lower.includes('inside') || lower.includes('contents') || lower.includes('compartment') || lower.includes('contains') || lower.includes('pocket')) {
      const locText = locationMatch && locationMatch[1] ? ` inside the ${locationMatch[1].trim().replace(/^the\s+/i, '')}` : ` inside this ${title || 'item'}`;
      const targetQuestion = `What specific item, content, or paperwork is located${locText}?`;
      const qWords = new Set(extractKeywords(targetQuestion));
      const targetKeywords = clauseKeywords.filter(k => !qWords.has(k));
      return {
        id: `q_${qIndex}`,
        question: targetQuestion,
        expectedHint: clause,
        keywords: targetKeywords.length > 0 ? targetKeywords : clauseKeywords
      };
    }

    // 6. Check for serial number / IMEI / code / initials / engraving
    if (lower.includes('serial') || lower.includes('imei') || lower.includes('code') || lower.includes('number') || lower.includes('engrav') || lower.includes('initial')) {
      const targetQuestion = `What unique serial number, identifier, initials, or code is on the ${title || 'item'}?`;
      const qWords = new Set(extractKeywords(targetQuestion));
      const targetKeywords = clauseKeywords.filter(k => !qWords.has(k));
      return {
        id: `q_${qIndex}`,
        question: targetQuestion,
        expectedHint: clause,
        keywords: targetKeywords.length > 0 ? targetKeywords : clauseKeywords
      };
    }

    // 7. If location was matched but no specific type, ask about that location
    if (locationMatch && locationMatch[1]) {
      const locationName = locationMatch[1].trim().replace(/^the\s+/i, '');
      const targetQuestion = `What is located on, in, or attached to the ${locationName} of the ${title || 'item'}?`;
      const qWords = new Set(extractKeywords(targetQuestion));
      const targetKeywords = clauseKeywords.filter(k => !qWords.has(k));
      return {
        id: `q_${qIndex}`,
        question: targetQuestion,
        expectedHint: clause,
        keywords: targetKeywords.length > 0 ? targetKeywords : clauseKeywords
      };
    }

    // 8. General fallback strictly derived from the owner's actual clause
    const targetQuestion = `According to the owner's private verification record, describe the specific private detail or identifying feature of this ${title || 'item'}.`;
    return {
      id: `q_${qIndex}`,
      question: targetQuestion,
      expectedHint: clause,
      keywords: clauseKeywords
    };
  };

  if (clauses.length <= 1) {
    // Exactly 1 question for 1 detail
    questions.push(formulateQuestion(clauses[0], itemTitle, 1));
  } else {
    // 2 questions max, one per clause
    questions.push(formulateQuestion(clauses[0], itemTitle, 1));
    questions.push(formulateQuestion(clauses[1], itemTitle, 2));
  }

  return {
    hasPrivateDetails: true,
    message: null,
    questions,
    question_1: questions[0]?.question || null,
    question_2: questions[1]?.question || null
  };
}

/**
 * Evaluate claimant answers against the true private details
 * @param {Array} questions generated questions
 * @param {Array} answers claimant answers
 * @returns {Object} evaluation result
 */
export function evaluateVerificationAnswers(questions, answers) {
  if (!questions || questions.length === 0) {
    return {
      passed: false,
      score: 0,
      feedback: 'No verification questions were configured for this item.'
    };
  }

  let totalScore = 0;
  let matchesCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const ans = (answers[i] || '').trim().toLowerCase();
    if (!ans) continue;

    const answerTokens = new Set(extractKeywords(ans));
    const expectedKeywords = (q.keywords && q.keywords.length > 0)
      ? q.keywords
      : extractKeywords(q.expectedHint);

    if (expectedKeywords.length === 0) {
      // Fallback substring check
      const rawLower = (q.expectedHint || '').toLowerCase();
      if (rawLower.includes(ans) || ans.includes(rawLower)) {
        totalScore += 100;
        matchesCount++;
      }
      continue;
    }

    // Count how many expected keywords are present in the claimant's answer
    let matchedWords = 0;
    for (const kw of expectedKeywords) {
      if (answerTokens.has(kw) || [...answerTokens].some(t => t.includes(kw) || kw.includes(t)) || ans.includes(kw)) {
        matchedWords++;
      }
    }

    const ratio = matchedWords / expectedKeywords.length;
    let questionScore = 0;
    if (ratio >= 0.5 || matchedWords >= 2 || (expectedKeywords.length === 1 && matchedWords >= 1)) {
      questionScore = 100;
      matchesCount++;
    } else if (ratio >= 0.3 || matchedWords >= 1) {
      questionScore = 75;
      matchesCount++;
    } else {
      questionScore = Math.round(ratio * 100);
    }

    totalScore += questionScore;
  }

  const averageScore = Math.round(totalScore / questions.length);
  const passed = matchesCount >= Math.min(1, questions.length) && averageScore >= 50;

  return {
    passed,
    score: averageScore,
    feedback: passed
      ? 'Ownership successfully verified! Your details matched the owner\'s private verification record.'
      : 'Verification failed. Your answer did not match the owner\'s private verification details.'
  };
}
