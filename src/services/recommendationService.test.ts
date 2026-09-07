import {
  calculatePlayerRecruiterMatch,
  calculateRecruiterPlayerMatch,
  calculatePlayerOpportunityMatch,
  normalizeScore,
  getMatchLabelKey,
} from './recommendationService';
import { PlayerProfile, RecruiterProfile, TrialInvitation } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Test Failure: ${message}`);
  }
}

/**
 * Pure Unit Test suite for Phase 5 Recommendation Service scoring functions
 */
export function runRecommendationEngineTests(): { success: boolean; results: string[] } {
  const results: string[] = [];

  const mockPlayer: Partial<PlayerProfile> = {
    uid: 'player_123',
    fullName: 'Alex Morgan',
    primaryPosition: 'Striker',
    secondaryPosition: 'Right winger',
    city: 'Toronto',
    province: 'Ontario',
    country: 'Canada',
    playingLevel: 'Academy',
    availabilityStatus: 'Available for trials',
    openToTrials: true,
    willingToRelocate: true,
    shortTermGoals: ['stgCollegeRecruitment'],
    longTermGoals: ['ltgNcaaCollege'],
    profileCompletion: 90,
  };

  const mockRecruiter: Partial<RecruiterProfile> = {
    uid: 'recruiter_456',
    fullName: 'Coach John',
    organization: 'Toronto FC Academy',
    orgType: 'Academy',
    jobTitle: 'Head Scout - Strikers',
    city: 'Toronto',
    province: 'Ontario',
    country: 'Canada',
    verificationStatus: 'approved',
  };

  const mockOpportunity: Partial<TrialInvitation> = {
    id: 'trial_789',
    recruiterId: 'recruiter_456',
    eventTitle: 'U21 Open Trial Day',
    eventDate: '2026-09-15',
    location: 'Toronto, Ontario',
    status: 'pending',
  };

  // Test 1: score normalization
  assert(normalizeScore(-10) === 0, 'normalizeScore should clamp negative to 0');
  assert(normalizeScore(150) === 100, 'normalizeScore should clamp >100 to 100');
  assert(normalizeScore(85.6) === 86, 'normalizeScore should round properly');
  results.push('PASSED: score normalization and clamping');

  // Test 2: match labels
  assert(getMatchLabelKey(95) === 'matchExcellent', '95 score should be matchExcellent');
  assert(getMatchLabelKey(80) === 'matchStrong', '80 score should be matchStrong');
  assert(getMatchLabelKey(65) === 'matchGood', '65 score should be matchGood');
  assert(getMatchLabelKey(50) === 'matchPossible', '50 score should be matchPossible');
  results.push('PASSED: match labels assignment');

  // Test 3: Player - Recruiter Match
  const prResult = calculatePlayerRecruiterMatch(mockPlayer, mockRecruiter);
  assert(prResult.matchScore >= 75, 'Matching position & location should yield score >= 75');
  assert(prResult.reasons.includes('reasonPositionMatch'), 'Reasons should include position match');
  assert(prResult.reasons.includes('reasonSameCity'), 'Reasons should include same city');
  results.push('PASSED: player recruiter scoring calculation');

  // Test 4: Hard Filter for Blocked Target
  const blockedResult = calculateRecruiterPlayerMatch(mockRecruiter, mockPlayer, {
    blockedTargetIds: new Set(['player_123']),
  });
  assert(blockedResult.matchScore === 0, 'Blocked targets must receive score of 0');
  assert(blockedResult.reasons.length === 0, 'Blocked targets must have empty reasons');
  results.push('PASSED: hard filtering for blocked targets');

  // Test 5: Expired Opportunities
  const expiredOpportunity: Partial<TrialInvitation> = {
    id: 'expired_123',
    eventDate: '2020-01-01',
    status: 'pending',
  };
  const expResult = calculatePlayerOpportunityMatch(mockPlayer, expiredOpportunity);
  assert(expResult.matchScore === 0, 'Expired opportunities must receive score of 0');
  results.push('PASSED: hard filtering for expired trial opportunities');

  // Test 6: Valid Opportunity Match
  const oppResult = calculatePlayerOpportunityMatch(mockPlayer, mockOpportunity);
  assert(oppResult.matchScore >= 60, 'Matching trial opportunity should score >= 60');
  results.push('PASSED: trial opportunity matching calculation');

  return { success: true, results };
}
