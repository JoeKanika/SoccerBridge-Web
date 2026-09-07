import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole, FollowUserSummary, VerificationStatus } from '../types';
import { createNotification } from './notificationService';

/**
 * Follow a user/club/recruiter with deterministic ID: `${followerId}_${targetId}`
 */
export async function followUser(
  followerId: string,
  followerRole: UserRole,
  targetId: string,
  targetRole: UserRole,
  followerName?: string,
  followerPhotoUrl?: string
): Promise<void> {
  if (!followerId || !targetId) {
    throw new Error('Follower and Target IDs are required.');
  }

  if (followerId === targetId) {
    throw new Error('You cannot follow yourself.');
  }

  const followId = `${followerId}_${targetId}`;
  const followRef = doc(db, 'follows', followId);

  await setDoc(followRef, {
    id: followId,
    followerId,
    followerRole,
    targetId,
    targetRole,
    createdAt: serverTimestamp(),
  });

  // Trigger notification for recipient
  try {
    const actorName = followerName || 'SoccerBridge User';
    await createNotification({
      recipientId: targetId,
      actorId: followerId,
      actorName,
      actorRole: followerRole,
      actorPhotoUrl: followerPhotoUrl || '',
      type: 'follow',
      targetId: followerId,
      targetType: followerRole === 'player' ? 'player' : 'recruiter',
      titleKey: 'notifFollowTitle',
      bodyKey: 'notifFollowBody',
      translationParams: { name: actorName },
      priority: 'normal',
    });
  } catch (err) {
    console.warn('followService: Notification trigger warning:', err);
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, targetId: string): Promise<void> {
  if (!followerId || !targetId) return;

  const followId = `${followerId}_${targetId}`;
  const followRef = doc(db, 'follows', followId);
  await deleteDoc(followRef);
}

/**
 * Check if follower is following target
 */
export async function isFollowing(followerId: string, targetId: string): Promise<boolean> {
  if (!followerId || !targetId) return false;

  const followId = `${followerId}_${targetId}`;
  const followRef = doc(db, 'follows', followId);
  const snap = await getDoc(followRef);
  return snap.exists();
}

/**
 * Get Set of all targetIds that followerId is following
 */
export async function getFollowingIds(followerId: string): Promise<Set<string>> {
  const followingSet = new Set<string>();
  if (!followerId) return followingSet;

  try {
    const q = query(collection(db, 'follows'), where('followerId', '==', followerId));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data();
      if (data.targetId) {
        followingSet.add(data.targetId);
      }
    });
  } catch (err) {
    console.warn('followService: Error fetching following IDs:', err);
  }

  return followingSet;
}

/**
 * Get total counts for Followers & Following
 */
export async function getFollowCounts(userId: string): Promise<{ followersCount: number; followingCount: number }> {
  if (!userId) return { followersCount: 0, followingCount: 0 };

  try {
    const followersQ = query(collection(db, 'follows'), where('targetId', '==', userId));
    const followingQ = query(collection(db, 'follows'), where('followerId', '==', userId));

    const [followersSnap, followingSnap] = await Promise.all([
      getCountFromServer(followersQ),
      getCountFromServer(followingQ),
    ]);

    return {
      followersCount: followersSnap.data().count,
      followingCount: followingSnap.data().count,
    };
  } catch (err) {
    console.warn('followService: Error fetching counts:', err);
    return { followersCount: 0, followingCount: 0 };
  }
}

/**
 * Get list of profiles who follow targetId
 */
export async function getFollowersList(
  targetId: string,
  maxLimit = 20
): Promise<FollowUserSummary[]> {
  if (!targetId) return [];

  const summaries: FollowUserSummary[] = [];
  try {
    const q = query(
      collection(db, 'follows'),
      where('targetId', '==', targetId),
      limit(maxLimit)
    );
    const snap = await getDocs(q);

    const followerPromises = snap.docs.map(async (docSnap) => {
      const fData = docSnap.data();
      const followerId = fData.followerId;
      const followerRole = fData.followerRole as UserRole;

      return fetchUserSummary(followerId, followerRole);
    });

    const results = await Promise.all(followerPromises);
    return results.filter((item): item is FollowUserSummary => item !== null);
  } catch (err) {
    console.warn('followService: Error getting followers list:', err);
    return summaries;
  }
}

/**
 * Get list of profiles that followerId follows
 */
export async function getFollowingList(
  followerId: string,
  maxLimit = 20
): Promise<FollowUserSummary[]> {
  if (!followerId) return [];

  try {
    const q = query(
      collection(db, 'follows'),
      where('followerId', '==', followerId),
      limit(maxLimit)
    );
    const snap = await getDocs(q);

    const followingPromises = snap.docs.map(async (docSnap) => {
      const fData = docSnap.data();
      const targetId = fData.targetId;
      const targetRole = fData.targetRole as UserRole;

      return fetchUserSummary(targetId, targetRole);
    });

    const results = await Promise.all(followingPromises);
    return results.filter((item): item is FollowUserSummary => item !== null);
  } catch (err) {
    console.warn('followService: Error getting following list:', err);
    return [];
  }
}

/**
 * Helper to fetch public summary data for a user
 */
async function fetchUserSummary(uid: string, role: UserRole): Promise<FollowUserSummary | null> {
  try {
    if (role === 'player') {
      const pSnap = await getDoc(doc(db, 'playerProfiles', uid));
      if (pSnap.exists()) {
        const p = pSnap.data();
        return {
          uid,
          fullName: p.fullName || 'Player',
          role: 'player',
          profilePhotoUrl: p.profilePhotoUrl,
          location: [p.city, p.province].filter(Boolean).join(', '),
          primaryPosition: p.primaryPosition,
        };
      }
    } else {
      const rSnap = await getDoc(doc(db, 'recruiterProfiles', uid));
      if (rSnap.exists()) {
        const r = rSnap.data();
        return {
          uid,
          fullName: r.fullName || 'Recruiter',
          role: r.role || 'recruiter',
          organization: r.organization,
          location: r.organization,
          verificationStatus: r.verificationStatus as VerificationStatus,
        };
      }
    }

    // Fallback to general user document
    const uSnap = await getDoc(doc(db, 'users', uid));
    if (uSnap.exists()) {
      const u = uSnap.data();
      return {
        uid,
        fullName: u.fullName || 'User',
        role: u.role || 'player',
        profilePhotoUrl: u.photoURL,
      };
    }
  } catch (err) {
    console.warn(`followService: Error fetching summary for ${uid}:`, err);
  }

  return null;
}
