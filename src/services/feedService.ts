import {
  collection,
  getDocs,
  query,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  PlayerProfile,
  RecruiterProfile,
  VideoMetadata,
  TrialInvitation,
  AccountMembership,
  VerificationStatus,
  UserRole,
  MatchResult,
} from '../types';
import {
  getUserFeedbackMap,
  calculatePlayerRecruiterMatch,
  calculateRecruiterPlayerMatch,
  calculatePlayerOpportunityMatch,
} from './recommendationService';

export type FeedCategory =
  | 'all'
  | 'following'
  | 'players'
  | 'recruiters'
  | 'agents'
  | 'clubs'
  | 'videos'
  | 'opportunities';

export interface BaseFeedItem {
  id: string;
  kind: 'player' | 'recruiter' | 'club' | 'video' | 'opportunity';
  ownerId: string;
  displayName: string;
  profilePhotoUrl?: string;
  location: string;
  verificationStatus?: VerificationStatus;
  membership?: AccountMembership;
  score: number;
  relevanceReasons: string[];
  matchResult?: MatchResult;
  createdAt?: any;
  updatedAt?: any;
}

export interface PlayerFeedItem extends BaseFeedItem {
  kind: 'player';
  data: PlayerProfile;
}

export interface RecruiterFeedItem extends BaseFeedItem {
  kind: 'recruiter';
  data: RecruiterProfile;
}

export interface ClubFeedItem extends BaseFeedItem {
  kind: 'club';
  data: {
    id: string;
    name: string;
    logoUrl?: string;
    city: string;
    province: string;
    country: string;
    level: string;
    description: string;
    isVerified?: boolean;
  };
}

export interface VideoFeedItem extends BaseFeedItem {
  kind: 'video';
  data: VideoMetadata;
  playerProfile?: PlayerProfile;
}

export interface OpportunityFeedItem extends BaseFeedItem {
  kind: 'opportunity';
  data: TrialInvitation;
}

export type FeedItem =
  | PlayerFeedItem
  | RecruiterFeedItem
  | ClubFeedItem
  | VideoFeedItem
  | OpportunityFeedItem;

export interface FeedQueryOptions {
  viewerUid?: string;
  viewerRole?: UserRole;
  viewerPlayerProfile?: PlayerProfile | null;
  viewerRecruiterProfile?: RecruiterProfile | null;
  followingIds?: Set<string>;
  likedItemIds?: Set<string>;
  savedItemIds?: Set<string>;
  category?: FeedCategory;
  limitCount?: number;
  lastDocSnapshots?: Record<string, DocumentSnapshot | null>;
  bypassCache?: boolean;
}


export interface FeedFetchResult {
  items: FeedItem[];
  hasMore: boolean;
  lastDocSnapshots: Record<string, DocumentSnapshot | null>;
}

// In-Memory Cache for Feed results
const feedCache = new Map<string, { timestamp: number; result: FeedFetchResult }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Calculates recency score bonus and returns localized reason key if recent.
 */
function getRecencyScore(dateVal: any): { scoreBonus: number; reasonKey?: string } {
  if (!dateVal) return { scoreBonus: 0 };
  let timeMs = 0;

  if (typeof dateVal?.toMillis === 'function') {
    timeMs = dateVal.toMillis();
  } else if (dateVal instanceof Date) {
    timeMs = dateVal.getTime();
  } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    timeMs = new Date(dateVal).getTime();
  }

  if (!timeMs || isNaN(timeMs)) return { scoreBonus: 0 };

  const diffHours = (Date.now() - timeMs) / (1000 * 60 * 60);

  if (diffHours <= 24) {
    return { scoreBonus: 15, reasonKey: 'reasonRecentlyActive' };
  } else if (diffHours <= 168) { // 7 days
    return { scoreBonus: 10, reasonKey: 'reasonRecentlyActive' };
  } else if (diffHours <= 720) { // 30 days
    return { scoreBonus: 5 };
  }
  return { scoreBonus: 0 };
}

/**
 * Strips private guardian and sensitive contact info for privacy compliance
 */
function sanitizePlayerProfileForFeed(p: PlayerProfile): PlayerProfile {
  const sanitized = { ...p };
  // Remove private contact fields
  delete sanitized.guardian;
  delete sanitized.email;
  return sanitized;
}

/**
 * Interleaves items to ensure feed diversity (max 3 consecutive items of same kind)
 */
function applyFeedDiversity(items: FeedItem[]): FeedItem[] {
  if (items.length <= 3) return items;

  const result: FeedItem[] = [];
  const pool = [...items];

  while (pool.length > 0) {
    let pickIndex = 0;

    if (result.length >= 3) {
      const lastKind = result[result.length - 1].kind;
      const secondLastKind = result[result.length - 2].kind;
      const thirdLastKind = result[result.length - 3].kind;

      if (lastKind === secondLastKind && secondLastKind === thirdLastKind) {
        // Find first item with a different kind
        const diffIndex = pool.findIndex((item) => item.kind !== lastKind);
        if (diffIndex !== -1) {
          pickIndex = diffIndex;
        }
      }
    }

    result.push(pool.splice(pickIndex, 1)[0]);
  }

  return result;
}

/**
 * Main Feed Data Fetching and Ranking Service
 */
export async function fetchHomeFeed(options: FeedQueryOptions): Promise<FeedFetchResult> {
  const {
    viewerUid,
    viewerRole = 'player',
    viewerPlayerProfile,
    viewerRecruiterProfile,
    followingIds = new Set<string>(),
    likedItemIds = new Set<string>(),
    savedItemIds = new Set<string>(),
    category = 'all',
    limitCount = 20,
    bypassCache = false,
  } = options;

  const cacheKey = `${viewerUid || 'anon'}_${viewerRole}_${category}_${limitCount}_${followingIds.size}_${likedItemIds.size}_${savedItemIds.size}`;

  if (!bypassCache) {
    const cached = feedCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }
  }

  // Fetch recommendation feedback (Not Interested / Dismissed)
  let feedbackMap = { notInterested: new Set<string>(), dismissed: new Set<string>() };
  if (viewerUid) {
    feedbackMap = await getUserFeedbackMap(viewerUid);
  }

  const items: FeedItem[] = [];
  const seenIds = new Set<string>();
  const nextSnapshots: Record<string, DocumentSnapshot | null> = {};

  const viewerProvince = viewerPlayerProfile?.province || viewerRecruiterProfile?.organization || '';
  const viewerCity = viewerPlayerProfile?.city || '';
  const viewerCountry = viewerPlayerProfile?.country || 'Canada';
  const viewerPos = viewerPlayerProfile?.primaryPosition;

  // Helper to apply follow, save, and like boosts
  const applyEngagementBoost = (
    ownerId: string,
    targetId: string | undefined,
    currentScore: number,
    reasons: string[]
  ) => {
    let score = currentScore;
    let nextReasons = [...reasons];

    if (followingIds.has(ownerId)) {
      score += 50;
      if (!nextReasons.includes('reasonFollowedUser')) {
        nextReasons.unshift('reasonFollowedUser');
      }
    }

    if (savedItemIds.has(ownerId) || (targetId && savedItemIds.has(targetId))) {
      score += 20;
      if (!nextReasons.includes('reasonSavedProfile')) {
        nextReasons.push('reasonSavedProfile');
      }
    }

    if (likedItemIds.has(ownerId) || (targetId && likedItemIds.has(targetId))) {
      score += 8;
      if (!nextReasons.includes('reasonLikedContent')) {
        nextReasons.push('reasonLikedContent');
      }
    }

    return { score, reasons: nextReasons };
  };

  // -------------------------------------------------------------
  // 1. FETCH PLAYERS
  // -------------------------------------------------------------
  const playerMap: Record<string, PlayerProfile> = {};

  if (category === 'all' || category === 'following' || category === 'players') {
    try {
      const pConstraints: QueryConstraint[] = [limit(limitCount)];
      const pQuery = query(collection(db, 'playerProfiles'), ...pConstraints);
      const pSnap = await getDocs(pQuery);

      pSnap.forEach((docSnap) => {
        const rawP = docSnap.data() as PlayerProfile;
        if (rawP.uid !== viewerUid) {
          const p = sanitizePlayerProfileForFeed(rawP);
          playerMap[p.uid] = p;

          let score = 50;
          let reasons: string[] = [];

          // Location matching
          if (viewerProvince && p.province === viewerProvince) {
            score += 30;
            reasons.push('reasonSameProvince');
          } else if (viewerCountry && p.country === viewerCountry) {
            score += 10;
            reasons.push('reasonSameCountry');
          }

          if (viewerCity && p.city === viewerCity) {
            score += 20;
            reasons.push('reasonSameCity');
          }

          // Recruiter / Agent viewing player
          if (viewerRole === 'recruiter' || viewerRole === 'club') {
            if (p.openToTrials || p.availabilityStatus === 'Available for trials') {
              score += 25;
              reasons.push('reasonAvailableForTrials');
            }
            if (p.willingToRelocate) {
              score += 15;
              reasons.push('reasonWillingToRelocate');
            }
            if (p.profileCompletion && p.profileCompletion >= 80) {
              score += 10;
              reasons.push('reasonHighCompletion');
            }
          }

          // Recency
          const recency = getRecencyScore(p.lastActiveAt || p.updatedAt || p.createdAt);
          score += recency.scoreBonus;
          if (recency.reasonKey && !reasons.includes(recency.reasonKey)) {
            reasons.push(recency.reasonKey);
          }

          // Follow & Engagement boost
          const boosted = applyEngagementBoost(p.uid, `player-${p.uid}`, score, reasons);
          score = boosted.score;
          reasons = boosted.reasons;

          const itemId = `player-${p.uid}`;
          if (!seenIds.has(itemId)) {
            seenIds.add(itemId);

            // Compute matchResult if viewer is recruiter/club or has recruiter profile
            let matchResult: MatchResult | undefined;
            if (viewerRecruiterProfile) {
              matchResult = calculateRecruiterPlayerMatch(viewerRecruiterProfile, p, {
                isFollowing: followingIds.has(p.uid),
                isSaved: savedItemIds.has(p.uid),
                hasLikedMedia: likedItemIds.has(p.uid),
              });
            } else if (viewerPlayerProfile) {
              // Teammate/Peer match estimation
              matchResult = calculateRecruiterPlayerMatch(
                { city: viewerPlayerProfile.city, province: viewerPlayerProfile.province } as any,
                p,
                {
                  isFollowing: followingIds.has(p.uid),
                  isSaved: savedItemIds.has(p.uid),
                }
              );
            }

            items.push({
              id: itemId,
              kind: 'player',
              ownerId: p.uid,
              displayName: p.fullName,
              profilePhotoUrl: p.profilePhotoUrl,
              location: [p.city, p.province, p.country].filter(Boolean).join(', '),
              membership: p.membership,
              score,
              relevanceReasons: reasons,
              matchResult,
              data: p,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            });
          }
        }
      });
    } catch (err) {
      console.warn('feedService: Error fetching playerProfiles:', err);
    }
  }

  // -------------------------------------------------------------
  // 2. FETCH RECRUITERS & AGENTS
  // -------------------------------------------------------------
  if (category === 'all' || category === 'following' || category === 'recruiters' || category === 'agents') {
    try {
      const rConstraints: QueryConstraint[] = [limit(limitCount)];
      const rQuery = query(collection(db, 'recruiterProfiles'), ...rConstraints);
      const rSnap = await getDocs(rQuery);

      rSnap.forEach((docSnap) => {
        const r = docSnap.data() as RecruiterProfile;
        if (r.uid !== viewerUid) {
          const isAgent = r.orgType === 'FIFA Agent' || r.orgType === 'Independent Recruiter';
          if (category === 'agents' && !isAgent) return;

          let score = 40;
          let reasons: string[] = [];

          if (r.verificationStatus === 'approved') {
            score += 20;
            reasons.push(isAgent ? 'reasonVerifiedAgent' : 'reasonVerifiedRecruiter');
          }

          if (viewerProvince && r.organization?.includes(viewerProvince)) {
            score += 25;
            reasons.push('reasonSameProvince');
          }

          // Recency
          const recency = getRecencyScore(r.updatedAt || r.createdAt);
          score += recency.scoreBonus;
          if (recency.reasonKey) reasons.push(recency.reasonKey);

          // Follow & Engagement boost
          const boosted = applyEngagementBoost(r.uid, `recruiter-${r.uid}`, score, reasons);
          score = boosted.score;
          reasons = boosted.reasons;

          const itemId = `recruiter-${r.uid}`;
          if (!seenIds.has(itemId)) {
            seenIds.add(itemId);

            let matchResult: MatchResult | undefined;
            if (viewerPlayerProfile) {
              matchResult = calculatePlayerRecruiterMatch(viewerPlayerProfile, r, {
                isFollowing: followingIds.has(r.uid),
                isSaved: savedItemIds.has(r.uid),
              });
            }

            items.push({
              id: itemId,
              kind: 'recruiter',
              ownerId: r.uid,
              displayName: r.fullName,
              location: r.organization || 'SoccerBridge Recruiter',
              verificationStatus: r.verificationStatus,
              membership: r.membership,
              score,
              relevanceReasons: reasons,
              matchResult,
              data: { ...r, email: '' }, // Sanitize email
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
            });
          }
        }
      });
    } catch (err) {
      console.warn('feedService: Error fetching recruiterProfiles:', err);
    }
  }

  // -------------------------------------------------------------
  // 3. FETCH VIDEOS
  // -------------------------------------------------------------
  if (category === 'all' || category === 'following' || category === 'videos') {
    try {
      const vConstraints: QueryConstraint[] = [limit(limitCount)];
      const vQuery = query(collection(db, 'videos'), ...vConstraints);
      const vSnap = await getDocs(vQuery);

      vSnap.forEach((docSnap) => {
        const v = docSnap.data() as VideoMetadata;
        const visibility = v.visibility || 'public';

        // Privacy check
        const isRecruiterOrClub = viewerRole === 'recruiter' || viewerRole === 'club';
        const canView =
          visibility === 'public' ||
          (visibility === 'recruitersOnly' && isRecruiterOrClub) ||
          v.playerId === viewerUid;

        if (canView) {
          const linkedPlayer = playerMap[v.playerId] || (v.playerId === viewerPlayerProfile?.uid ? viewerPlayerProfile : undefined);

          let score = 45;
          let reasons: string[] = ['reasonNewHighlight'];

          if (linkedPlayer?.province && viewerProvince && linkedPlayer.province === viewerProvince) {
            score += 15;
            reasons.push('reasonSameProvince');
          }

          const recency = getRecencyScore(v.createdAt || v.updatedAt);
          score += recency.scoreBonus;

          // Follow & Engagement boost
          const boosted = applyEngagementBoost(v.playerId, docSnap.id, score, reasons);
          score = boosted.score;
          reasons = boosted.reasons;

          const itemId = `video-${docSnap.id}`;
          if (!seenIds.has(itemId)) {
            seenIds.add(itemId);
            items.push({
              id: itemId,
              kind: 'video',
              ownerId: v.playerId,
              displayName: v.title,
              profilePhotoUrl: linkedPlayer?.profilePhotoUrl,
              location: linkedPlayer ? [linkedPlayer.city, linkedPlayer.province].filter(Boolean).join(', ') : '',
              score,
              relevanceReasons: reasons,
              data: { id: docSnap.id, ...v },
              playerProfile: linkedPlayer ? sanitizePlayerProfileForFeed(linkedPlayer) : undefined,
              createdAt: v.createdAt,
              updatedAt: v.updatedAt,
            });
          }
        }
      });
    } catch (err) {
      console.warn('feedService: Error fetching videos:', err);
    }
  }

  // -------------------------------------------------------------
  // 4. FETCH OPPORTUNITIES
  // -------------------------------------------------------------
  if (category === 'all' || category === 'following' || category === 'opportunities') {
    try {
      const oppQuery = query(collection(db, 'trialInvitations'), limit(limitCount));
      const oppSnap = await getDocs(oppQuery);

      oppSnap.forEach((docSnap) => {
        const opp = docSnap.data() as TrialInvitation;
        let score = 55;
        let reasons: string[] = ['reasonOpenOpportunity'];

        if (viewerProvince && opp.location?.includes(viewerProvince)) {
          score += 20;
          reasons.push('reasonSameProvince');
        }

        // Follow & Engagement boost
        const boosted = applyEngagementBoost(opp.recruiterId, docSnap.id, score, reasons);
        score = boosted.score;
        reasons = boosted.reasons;

        const itemId = `opp-${docSnap.id}`;
        if (!seenIds.has(itemId)) {
          seenIds.add(itemId);

          let matchResult: MatchResult | undefined;
          if (viewerPlayerProfile) {
            matchResult = calculatePlayerOpportunityMatch(viewerPlayerProfile, docSnap.data() as TrialInvitation, undefined, {
              isSaved: savedItemIds.has(docSnap.id),
            });
          }

          items.push({
            id: itemId,
            kind: 'opportunity',
            ownerId: opp.recruiterId,
            displayName: opp.eventTitle,
            location: opp.location,
            score,
            relevanceReasons: reasons,
            matchResult,
            data: { id: docSnap.id, ...opp },
            createdAt: opp.createdAt,
          });
        }
      });
    } catch (err) {
      console.warn('feedService: Error fetching trialInvitations:', err);
    }
  }

  // -------------------------------------------------------------
  // 5. FILTER FOR FEEDBACK, FOLLOWING CATEGORY & SORT BY RELEVANCE
  // -------------------------------------------------------------
  let candidateItems = items.filter((item) => {
    // Exclude if user marked owner or target as not interested or dismissed
    if (feedbackMap.notInterested.has(item.ownerId) || feedbackMap.dismissed.has(item.ownerId)) {
      return false;
    }
    const targetDataId = (item.data as any)?.id || (item.data as any)?.uid;
    if (targetDataId && (feedbackMap.notInterested.has(targetDataId) || feedbackMap.dismissed.has(targetDataId))) {
      return false;
    }
    return true;
  });

  if (category === 'following') {
    candidateItems = candidateItems.filter((item) => followingIds.has(item.ownerId));
  }

  candidateItems.sort((a, b) => b.score - a.score);

  // Apply feed diversity if category is 'all'
  const finalItems = category === 'all' ? applyFeedDiversity(candidateItems) : candidateItems;

  const result: FeedFetchResult = {
    items: finalItems,
    hasMore: finalItems.length >= limitCount,
    lastDocSnapshots: nextSnapshots,
  };

  // Cache result
  feedCache.set(cacheKey, { timestamp: Date.now(), result });

  return result;
}


/**
 * Clears in-memory feed cache (e.g., when user pulls to refresh)
 */
export function clearFeedCache(): void {
  feedCache.clear();
}
