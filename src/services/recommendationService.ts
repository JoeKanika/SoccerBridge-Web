import {
  db,
  auth,
} from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  PlayerProfile,
  RecruiterProfile,
  TrialInvitation,
  MatchResult,
  MatchOptions,
  MatchLabelKey,
  SavedTargetType,
  FeedbackType,
  MatchedSignals,
} from '../types';

/**
 * Pure helper to convert numerical match score (0-100) to translation key label
 */
export function getMatchLabelKey(score: number): MatchLabelKey {
  if (score >= 90) return 'matchExcellent';
  if (score >= 75) return 'matchStrong';
  if (score >= 60) return 'matchGood';
  return 'matchPossible';
}

/**
 * Clamp score strictly between 0 and 100
 */
export function normalizeScore(rawScore: number): number {
  if (isNaN(rawScore) || !isFinite(rawScore)) return 0;
  return Math.min(100, Math.max(0, Math.round(rawScore)));
}

/**
 * Calculate match score for Player viewing Recruiter / Agent
 */
export function calculatePlayerRecruiterMatch(
  player: Partial<PlayerProfile>,
  recruiter: Partial<RecruiterProfile>,
  options?: MatchOptions
): MatchResult {
  const targetId = recruiter.uid || '';
  const blockedIds = options?.blockedTargetIds
    ? options.blockedTargetIds instanceof Set
      ? options.blockedTargetIds
      : new Set(options.blockedTargetIds)
    : new Set<string>();

  // HARD FILTERS
  if (
    !targetId ||
    targetId === player.uid ||
    blockedIds.has(targetId) ||
    recruiter.verificationStatus === 'rejected'
  ) {
    return {
      targetId,
      targetType: (recruiter.role === 'club' ? 'club' : recruiter.orgType === 'FIFA Agent' ? 'agent' : 'recruiter') as SavedTargetType,
      targetData: recruiter,
      matchScore: 0,
      matchLabelKey: 'matchPossible',
      reasons: [],
      matchedSignals: {},
    };
  }

  let rawScore = 0;
  const reasons: string[] = [];
  const signals: MatchedSignals = {};

  // 1. Position Match (0 - 25 pts)
  // Check if recruiter job title / org / preferred positions mention player primary or secondary position
  const recruiterContext = `${recruiter.jobTitle || ''} ${recruiter.organization || ''} ${recruiter.orgType || ''}`.toLowerCase();
  const primaryPos = player.primaryPosition || '';
  const secondaryPos = player.secondaryPosition || '';

  if (primaryPos && recruiterContext.includes(primaryPos.toLowerCase())) {
    rawScore += 25;
    signals.positionMatch = true;
    reasons.push('reasonPositionMatch');
  } else if (secondaryPos && recruiterContext.includes(secondaryPos.toLowerCase())) {
    rawScore += 18;
    signals.positionMatch = true;
    reasons.push('reasonPositionMatch');
  } else {
    // General fit
    rawScore += 15;
  }

  // 2. Geographic Match (0 - 20 pts)
  if (player.city && recruiter.city && player.city.toLowerCase() === recruiter.city.toLowerCase()) {
    rawScore += 20;
    signals.locationMatch = true;
    reasons.push('reasonSameCity');
  } else if (
    player.province &&
    recruiter.province &&
    player.province.toLowerCase() === recruiter.province.toLowerCase()
  ) {
    rawScore += 18;
    signals.locationMatch = true;
    reasons.push('reasonSameProvince');
  } else if (
    player.country &&
    recruiter.country &&
    player.country.toLowerCase() === recruiter.country.toLowerCase()
  ) {
    rawScore += 12;
    signals.locationMatch = true;
    reasons.push('reasonSameCountry');
  } else if (player.willingToRelocate) {
    rawScore += 10;
    signals.relocationMatch = true;
    reasons.push('reasonOpenToRelocate');
  } else {
    rawScore += 5;
  }

  // 3. Playing Level / Org Fit (0 - 15 pts)
  if (recruiter.orgType === 'FIFA Agent') {
    rawScore += 15;
    signals.verificationMatch = true;
    reasons.push('reasonVerifiedAgent');
  } else if (recruiter.verificationStatus === 'approved') {
    rawScore += 15;
    signals.verificationMatch = true;
    reasons.push('reasonVerifiedRecruiter');
  } else {
    rawScore += 10;
  }

  // 4. Availability Fit (0 - 10 pts)
  if (player.availabilityStatus === 'Actively looking' || player.availabilityStatus === 'Available for trials') {
    rawScore += 10;
    signals.trialsMatch = true;
    reasons.push('reasonAvailableForTrials');
  } else if (player.availabilityStatus === 'Open to opportunities') {
    rawScore += 8;
  } else {
    rawScore += 5;
  }

  // 5. Career Goal Fit (0 - 10 pts)
  const goalsStr = Array.isArray(player.shortTermGoals)
    ? player.shortTermGoals.join(' ')
    : player.shortTermGoals || '';
  const longGoalsStr = Array.isArray(player.longTermGoals)
    ? player.longTermGoals.join(' ')
    : player.longTermGoals || '';

  if (
    recruiter.orgType === 'College / University' &&
    (goalsStr.includes('College') || longGoalsStr.includes('NCAA') || longGoalsStr.includes('Usports'))
  ) {
    rawScore += 10;
    signals.goalsMatch = true;
    reasons.push('reasonGoalCollegeSoccer');
  } else if (goalsStr.length > 0 || longGoalsStr.length > 0) {
    rawScore += 8;
    signals.goalsMatch = true;
    reasons.push('reasonCareerGoalsMatch');
  } else {
    rawScore += 5;
  }

  // 6. Recent Activity (0 - 10 pts)
  if (player.lastActiveAt || recruiter.lastActiveAt) {
    rawScore += 8;
    signals.activeMatch = true;
    reasons.push('reasonRecentlyActive');
  } else {
    rawScore += 5;
  }

  // 7. Interaction Boosts (Phase 3 & 4)
  if (options?.isFollowing) {
    rawScore += 5;
    signals.socialMatch = true;
    reasons.push('reasonFollowedUser');
  }
  if (options?.isSaved) {
    rawScore += 5;
    signals.socialMatch = true;
    reasons.push('reasonSavedProfile');
  }
  if (options?.hasLikedMedia) {
    rawScore += 3;
    signals.socialMatch = true;
    reasons.push('reasonLikedContent');
  }

  const matchScore = normalizeScore(rawScore);
  const targetType: SavedTargetType = recruiter.role === 'club' ? 'club' : recruiter.orgType === 'FIFA Agent' ? 'agent' : 'recruiter';

  return {
    targetId,
    targetType,
    targetData: recruiter,
    matchScore,
    matchLabelKey: getMatchLabelKey(matchScore),
    reasons: Array.from(new Set(reasons)),
    matchedSignals: signals,
  };
}

/**
 * Calculate match score for Recruiter viewing Player
 */
export function calculateRecruiterPlayerMatch(
  recruiter: Partial<RecruiterProfile>,
  player: Partial<PlayerProfile>,
  options?: MatchOptions
): MatchResult {
  const targetId = player.uid || '';
  const blockedIds = options?.blockedTargetIds
    ? options.blockedTargetIds instanceof Set
      ? options.blockedTargetIds
      : new Set(options.blockedTargetIds)
    : new Set<string>();

  // HARD FILTERS
  if (!targetId || targetId === recruiter.uid || blockedIds.has(targetId)) {
    return {
      targetId,
      targetType: 'player',
      targetData: player,
      matchScore: 0,
      matchLabelKey: 'matchPossible',
      reasons: [],
      matchedSignals: {},
    };
  }

  let rawScore = 0;
  const reasons: string[] = [];
  const signals: MatchedSignals = {};

  // 1. Primary & Secondary Position Match (0 - 30 pts)
  const recruiterContext = `${recruiter.jobTitle || ''} ${recruiter.organization || ''} ${recruiter.orgType || ''}`.toLowerCase();
  const primaryPos = player.primaryPosition || '';
  const secondaryPos = player.secondaryPosition || '';

  if (primaryPos && recruiterContext.includes(primaryPos.toLowerCase())) {
    rawScore += 25;
    signals.positionMatch = true;
    reasons.push('reasonPositionMatch');
  } else if (secondaryPos && recruiterContext.includes(secondaryPos.toLowerCase())) {
    rawScore += 18;
    signals.positionMatch = true;
    reasons.push('reasonPositionMatch');
  } else {
    rawScore += 15; // default position relevance
  }

  // Special Striker match check
  if (primaryPos === 'Striker' || secondaryPos === 'Striker') {
    signals.positionMatch = true;
  }

  // 2. Geography (0 - 20 pts)
  if (player.city && recruiter.city && player.city.toLowerCase() === recruiter.city.toLowerCase()) {
    rawScore += 20;
    signals.locationMatch = true;
    reasons.push('reasonSameCity');
  } else if (
    player.province &&
    recruiter.province &&
    player.province.toLowerCase() === recruiter.province.toLowerCase()
  ) {
    rawScore += 18;
    signals.locationMatch = true;
    reasons.push('reasonSameProvince');
  } else if (
    player.country &&
    recruiter.country &&
    player.country.toLowerCase() === recruiter.country.toLowerCase()
  ) {
    rawScore += 12;
    signals.locationMatch = true;
    reasons.push('reasonSameCountry');
  } else {
    rawScore += 5;
  }

  // 3. Playing Level & Age Fit (0 - 15 pts)
  if (player.playingLevel) {
    rawScore += 10;
    signals.levelMatch = true;
    reasons.push('reasonPlayingLevelMatch');
  } else {
    rawScore += 5;
  }

  // 4. Availability & Trials (0 - 15 pts)
  if (player.openToTrials || player.availabilityStatus === 'Available for trials') {
    rawScore += 10;
    signals.trialsMatch = true;
    reasons.push('reasonAvailableForTrials');
  } else if (player.availabilityStatus === 'Actively looking') {
    rawScore += 8;
  } else {
    rawScore += 5;
  }

  if (player.willingToRelocate) {
    rawScore += 5;
    signals.relocationMatch = true;
    reasons.push('reasonOpenToRelocate');
  }

  // 5. Profile Completion & Highlights (0 - 10 pts)
  const completion = player.profileCompletion || 50;
  if (completion >= 80) {
    rawScore += 5;
    reasons.push('reasonHighProfileCompletion');
  } else {
    rawScore += Math.round((completion / 100) * 5);
  }

  // 6. Interaction Boosts
  if (options?.isFollowing) {
    rawScore += 5;
    signals.socialMatch = true;
    reasons.push('reasonFollowedUser');
  }
  if (options?.isSaved) {
    rawScore += 5;
    signals.socialMatch = true;
    reasons.push('reasonSavedProfile');
  }
  if (options?.hasLikedMedia) {
    rawScore += 3;
    signals.socialMatch = true;
    reasons.push('reasonLikedContent');
  }

  const matchScore = normalizeScore(rawScore);

  return {
    targetId,
    targetType: 'player',
    targetData: player,
    matchScore,
    matchLabelKey: getMatchLabelKey(matchScore),
    reasons: Array.from(new Set(reasons)),
    matchedSignals: signals,
  };
}

/**
 * Calculate match score for Player viewing Trial Opportunity
 */
export function calculatePlayerOpportunityMatch(
  player: Partial<PlayerProfile>,
  opportunity: Partial<TrialInvitation>,
  recruiter?: Partial<RecruiterProfile>,
  options?: MatchOptions
): MatchResult {
  const targetId = opportunity.id || '';
  const blockedIds = options?.blockedTargetIds
    ? options.blockedTargetIds instanceof Set
      ? options.blockedTargetIds
      : new Set(options.blockedTargetIds)
    : new Set<string>();

  // HARD FILTERS
  const isExpired = opportunity.eventDate
    ? new Date(opportunity.eventDate).getTime() < Date.now() - 24 * 3600 * 1000
    : false;

  if (
    !targetId ||
    blockedIds.has(targetId) ||
    isExpired ||
    (opportunity.status && opportunity.status !== 'pending')
  ) {
    return {
      targetId,
      targetType: 'opportunity',
      targetData: opportunity,
      matchScore: 0,
      matchLabelKey: 'matchPossible',
      reasons: [],
      matchedSignals: {},
    };
  }

  let rawScore = 30; // base relevance for active opportunities
  const reasons: string[] = ['reasonOpenOpportunity'];
  const signals: MatchedSignals = { trialsMatch: true };

  // Location match
  if (opportunity.location) {
    const locLower = opportunity.location.toLowerCase();
    if (player.city && locLower.includes(player.city.toLowerCase())) {
      rawScore += 25;
      signals.locationMatch = true;
      reasons.push('reasonSameCity');
    } else if (player.province && locLower.includes(player.province.toLowerCase())) {
      rawScore += 20;
      signals.locationMatch = true;
      reasons.push('reasonSameProvince');
    } else if (player.country && locLower.includes(player.country.toLowerCase())) {
      rawScore += 15;
      signals.locationMatch = true;
      reasons.push('reasonSameCountry');
    } else if (player.willingToRelocate) {
      rawScore += 15;
      signals.relocationMatch = true;
      reasons.push('reasonOpenToRelocate');
    }
  }

  // Player willingness
  if (player.openToTrials || player.availabilityStatus === 'Available for trials') {
    rawScore += 20;
    signals.trialsMatch = true;
    reasons.push('reasonAvailableForTrials');
  }

  // Interaction boosts
  if (options?.isSaved) {
    rawScore += 10;
    signals.socialMatch = true;
    reasons.push('reasonSavedProfile');
  }

  const matchScore = normalizeScore(rawScore);

  return {
    targetId,
    targetType: 'opportunity',
    targetData: opportunity,
    matchScore,
    matchLabelKey: getMatchLabelKey(matchScore),
    reasons: Array.from(new Set(reasons)),
    matchedSignals: signals,
  };
}

/**
 * Save user feedback (Not Interested / Dismissed) to Firestore
 */
export async function saveRecommendationFeedback(
  userId: string,
  targetId: string,
  targetType: SavedTargetType,
  feedbackType: FeedbackType
): Promise<void> {
  if (!userId || !targetId) return;

  const docId = `${userId}_${targetId}_${feedbackType}`;
  const ref = doc(db, 'recommendationFeedback', docId);

  await setDoc(ref, {
    userId,
    targetId,
    targetType,
    feedbackType,
    createdAt: serverTimestamp(),
  });
}

/**
 * Fetch map/set of blocked or dismissed targetIds for a user
 */
export async function getUserFeedbackMap(
  userId: string
): Promise<{ notInterested: Set<string>; dismissed: Set<string> }> {
  const notInterested = new Set<string>();
  const dismissed = new Set<string>();

  if (!userId) return { notInterested, dismissed };

  try {
    const q = query(
      collection(db, 'recommendationFeedback'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);

    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.feedbackType === 'notInterested') {
        notInterested.add(data.targetId);
      } else if (data.feedbackType === 'dismissed') {
        dismissed.add(data.targetId);
      }
    });
  } catch (err) {
    console.warn('Could not fetch recommendation feedback:', err);
  }

  return { notInterested, dismissed };
}
