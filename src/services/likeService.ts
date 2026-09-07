import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { LikeTargetType, UserRole } from '../types';
import { createNotification } from './notificationService';

export interface UserLikedCache {
  targetIds: Set<string>;
  compositeKeys: Set<string>;
}

/**
  * Like a photo or video item. Uses deterministic doc ID: `${userId}_${targetType}_${targetId}`.
  */
export async function likeItem(
  userId: string,
  targetId: string,
  targetType: LikeTargetType,
  ownerId?: string,
  actorInfo?: { fullName?: string; role?: UserRole; photoURL?: string }
): Promise<void> {
  if (!userId || !targetId) return;
  const likeId = `${userId}_${targetType}_${targetId}`;
  const likeRef = doc(db, 'likes', likeId);
  await setDoc(likeRef, {
    id: likeId,
    userId,
    targetId,
    targetType,
    ownerId: ownerId || '',
    createdAt: serverTimestamp(),
  });

  // Notify item owner if distinct from actor
  if (ownerId && ownerId !== userId) {
    try {
      const actorName = actorInfo?.fullName || 'SoccerBridge User';
      await createNotification({
        recipientId: ownerId,
        actorId: userId,
        actorName,
        actorRole: actorInfo?.role || 'player',
        actorPhotoUrl: actorInfo?.photoURL || '',
        type: 'like',
        targetId,
        targetType: targetType === 'video' ? 'video' : 'player',
        titleKey: 'notifLikeTitle',
        bodyKey: 'notifLikeBody',
        translationParams: { name: actorName },
        priority: 'low',
      });
    } catch (err) {
      console.warn('likeService: Notification trigger warning:', err);
    }
  }
}

/**
  * Remove a like on a photo or video item.
  */
export async function unlikeItem(
  userId: string,
  targetId: string,
  targetType: LikeTargetType
): Promise<void> {
  if (!userId || !targetId) return;
  const likeId = `${userId}_${targetType}_${targetId}`;
  const likeRef = doc(db, 'likes', likeId);
  await deleteDoc(likeRef);
}

/**
  * Check if a specific item is liked by the current user.
  */
export async function isItemLiked(
  userId: string,
  targetId: string,
  targetType: LikeTargetType
): Promise<boolean> {
  if (!userId || !targetId) return false;
  const likeId = `${userId}_${targetType}_${targetId}`;
  const likeRef = doc(db, 'likes', likeId);
  const snap = await getDoc(likeRef);
  return snap.exists();
}

/**
  * Fetch all liked target IDs for a user to cache in local state and avoid N+1 queries.
  */
export async function getUserLikedIds(userId: string): Promise<UserLikedCache> {
  const result: UserLikedCache = {
    targetIds: new Set<string>(),
    compositeKeys: new Set<string>(),
  };

  if (!userId) return result;

  try {
    const q = query(collection(db, 'likes'), where('userId', '==', userId));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data();
      if (data.targetId) {
        result.targetIds.add(data.targetId);
      }
      if (data.targetType && data.targetId) {
        result.compositeKeys.add(`${data.targetType}_${data.targetId}`);
      }
    });
  } catch (err) {
    console.warn('Could not fetch user liked IDs:', err);
  }

  return result;
}

/**
  * Get count of likes for a given targetId using Firestore count query.
  */
export async function getItemLikeCount(targetId: string): Promise<number> {
  if (!targetId) return 0;
  try {
    const q = query(collection(db, 'likes'), where('targetId', '==', targetId));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (err) {
    console.error('Error getting item like count:', err);
    return 0;
  }
}
