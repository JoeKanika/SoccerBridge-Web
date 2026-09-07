import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SavedItem, SavedTargetType, PlayerProfile, RecruiterProfile, TrialInvitation, VideoMetadata, UserRole } from '../types';
import { createNotification } from './notificationService';

export interface UserSavedCache {
  targetIds: Set<string>;
  compositeKeys: Set<string>;
}

export interface PaginatedSavedItemsResult {
  items: SavedItem[];
  lastDocSnap: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Save an item (player, recruiter, agent, club, opportunity, video).
 * Uses deterministic ID: `${userId}_${targetType}_${targetId}`.
 */
export async function saveItem(
  userId: string,
  targetId: string,
  targetType: SavedTargetType,
  targetOwnerId?: string,
  targetData?: any,
  actorInfo?: { fullName?: string; role?: UserRole; photoURL?: string }
): Promise<void> {
  if (!userId || !targetId) return;
  const saveId = `${userId}_${targetType}_${targetId}`;
  const saveRef = doc(db, 'savedItems', saveId);

  await setDoc(saveRef, {
    id: saveId,
    userId,
    targetId,
    targetType,
    targetOwnerId: targetOwnerId || '',
    targetData: targetData || null,
    createdAt: serverTimestamp(),
  });

  // For backward compatibility with legacy savedPlayers queries
  if (targetType === 'player') {
    try {
      const legacyRef = doc(db, 'savedPlayers', saveId);
      await setDoc(legacyRef, {
        recruiterId: userId,
        playerId: targetId,
        playerData: targetData || null,
        savedAt: serverTimestamp(),
      });
    } catch (e) {
      // ignore non-fatal legacy sync errors
    }
  }

  // Trigger notification for target owner (e.g. player whose profile was saved by recruiter)
  const recipientId = targetType === 'player' ? targetId : (targetOwnerId || '');
  if (recipientId && recipientId !== userId) {
    try {
      const actorName = actorInfo?.fullName || 'A recruiter';
      const isRecruiterSave = actorInfo?.role === 'recruiter' || actorInfo?.role === 'club';
      await createNotification({
        recipientId,
        actorId: userId,
        actorName,
        actorRole: actorInfo?.role || 'recruiter',
        actorPhotoUrl: actorInfo?.photoURL || '',
        type: 'save',
        targetId,
        targetType,
        titleKey: 'notifSaveTitle',
        bodyKey: isRecruiterSave ? 'notifSaveBody' : 'notifSaveBodyActor',
        translationParams: { name: actorName },
        priority: 'normal',
      });
    } catch (err) {
      console.warn('saveService: Notification trigger warning:', err);
    }
  }
}

/**
 * Unsave / remove a saved item.
 */
export async function unsaveItem(
  userId: string,
  targetId: string,
  targetType: SavedTargetType
): Promise<void> {
  if (!userId || !targetId) return;
  const saveId = `${userId}_${targetType}_${targetId}`;
  const saveRef = doc(db, 'savedItems', saveId);
  await deleteDoc(saveRef);

  if (targetType === 'player') {
    try {
      const legacyRef = doc(db, 'savedPlayers', saveId);
      await deleteDoc(legacyRef);
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Check if a specific target item is saved by the current user.
 */
export async function isItemSaved(
  userId: string,
  targetId: string,
  targetType: SavedTargetType
): Promise<boolean> {
  if (!userId || !targetId) return false;
  const saveId = `${userId}_${targetType}_${targetId}`;
  const saveRef = doc(db, 'savedItems', saveId);
  const snap = await getDoc(saveRef);
  return snap.exists();
}

/**
 * Fetch all saved target IDs for a user to cache in local state and avoid N+1 queries.
 */
export async function getUserSavedIds(userId: string): Promise<UserSavedCache> {
  const result: UserSavedCache = {
    targetIds: new Set<string>(),
    compositeKeys: new Set<string>(),
  };

  if (!userId) return result;

  try {
    const q = query(collection(db, 'savedItems'), where('userId', '==', userId));
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
    console.warn('Could not fetch user saved IDs:', err);
  }

  return result;
}

/**
 * Fetch paginated saved items for the user with category filtering and entity hydration.
 */
export async function getSavedItems(
  userId: string,
  category: SavedTargetType | 'all' = 'all',
  limitCount = 20,
  lastDocSnap: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<PaginatedSavedItemsResult> {
  if (!userId) {
    return { items: [], lastDocSnap: null, hasMore: false };
  }

  try {
    let constraints: any[] = [where('userId', '==', userId)];

    if (category !== 'all') {
      constraints.push(where('targetType', '==', category));
    }

    // Try ordering by createdAt descending if index exists, fallback without orderBy
    let q;
    if (lastDocSnap) {
      q = query(collection(db, 'savedItems'), ...constraints, startAfter(lastDocSnap), limit(limitCount));
    } else {
      q = query(collection(db, 'savedItems'), ...constraints, limit(limitCount));
    }

    const snap = await getDocs(q);
    const docs = snap.docs;
    const hasMore = docs.length === limitCount;
    const newLastDocSnap = docs.length > 0 ? docs[docs.length - 1] : null;

    const rawItems: SavedItem[] = [];
    docs.forEach((d) => {
      rawItems.push({ id: d.id, ...(d.data() as Record<string, any>) } as SavedItem);
    });

    // Hydrate missing targetData if needed
    const hydratedItems: SavedItem[] = await Promise.all(
      rawItems.map(async (item) => {
        if (item.targetData) {
          return item;
        }

        try {
          if (item.targetType === 'player') {
            const pSnap = await getDoc(doc(db, 'playerProfiles', item.targetId));
            if (pSnap.exists()) {
              item.targetData = pSnap.data() as PlayerProfile;
            }
          } else if (item.targetType === 'recruiter' || item.targetType === 'agent' || item.targetType === 'club') {
            const rSnap = await getDoc(doc(db, 'recruiterProfiles', item.targetId));
            if (rSnap.exists()) {
              item.targetData = rSnap.data() as RecruiterProfile;
            }
          } else if (item.targetType === 'opportunity') {
            const tSnap = await getDoc(doc(db, 'trialInvitations', item.targetId));
            if (tSnap.exists()) {
              item.targetData = tSnap.data() as TrialInvitation;
            }
          } else if (item.targetType === 'video') {
            const vSnap = await getDoc(doc(db, 'videos', item.targetId));
            if (vSnap.exists()) {
              item.targetData = vSnap.data() as VideoMetadata;
            }
          }
        } catch (e) {
          console.warn(`Failed to hydrate saved item ${item.id}:`, e);
        }

        return item;
      })
    );

    return {
      items: hydratedItems,
      lastDocSnap: newLastDocSnap,
      hasMore,
    };
  } catch (err) {
    console.error('Error fetching saved items:', err);
    return { items: [], lastDocSnap: null, hasMore: false };
  }
}
