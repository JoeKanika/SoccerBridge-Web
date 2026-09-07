import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  AppNotification,
  NotificationType,
  NotificationPriority,
  NotificationPreferences,
  UserRole,
  SavedTargetType,
} from '../types';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  follows: true,
  likes: true,
  profileViews: true,
  saves: true,
  messages: true,
  trialInvites: true,
  opportunities: true,
  recommendations: true,
};

export interface CreateNotificationInput {
  recipientId: string;
  actorId: string;
  actorName?: string;
  actorRole?: UserRole;
  actorPhotoUrl?: string;
  type: NotificationType;
  targetId: string;
  targetType: SavedTargetType;
  titleKey: string;
  bodyKey: string;
  translationParams?: Record<string, string>;
  actionUrl?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  customDocId?: string;
}

export interface PaginatedNotificationsResult {
  notifications: AppNotification[];
  lastDocSnap: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Fetch notification preferences for a user
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  if (!userId) return DEFAULT_NOTIFICATION_PREFERENCES;

  try {
    const prefsRef = doc(db, 'users', userId, 'settings', 'notifications');
    const snap = await getDoc(prefsRef);
    if (snap.exists()) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(snap.data() as Partial<NotificationPreferences>) };
    }
  } catch (err) {
    console.warn('notificationService: Error fetching preferences:', err);
  }

  return DEFAULT_NOTIFICATION_PREFERENCES;
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  if (!userId) return;

  const prefsRef = doc(db, 'users', userId, 'settings', 'notifications');
  await setDoc(prefsRef, preferences, { merge: true });
}

/**
 * Create an in-app notification with deduplication and preference checks
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<string | null> {
  const {
    recipientId,
    actorId,
    actorName = 'SoccerBridge User',
    actorRole = 'player',
    actorPhotoUrl = '',
    type,
    targetId,
    targetType,
    titleKey,
    bodyKey,
    translationParams = {},
    actionUrl = '',
    priority = 'normal',
    metadata = {},
    customDocId,
  } = input;

  // 1. HARD FILTERS: Do not notify oneself or invalid recipients
  if (!recipientId || !actorId || recipientId === actorId) {
    return null;
  }

  // 2. CHECK RECIPIENT PREFERENCES (High-priority security/system notices bypass preferences)
  if (priority !== 'high') {
    const prefs = await getNotificationPreferences(recipientId);
    const prefKeyMap: Record<NotificationType, keyof NotificationPreferences | null> = {
      follow: 'follows',
      like: 'likes',
      save: 'saves',
      profileView: 'profileViews',
      message: 'messages',
      trialInvite: 'trialInvites',
      recruiterInterest: 'saves',
      opportunity: 'opportunities',
      recommendation: 'recommendations',
      verification: null,
      system: null,
    };

    const prefKey = prefKeyMap[type];
    if (prefKey && prefs[prefKey] === false) {
      // User opted out of this notification type
      return null;
    }
  }

  // 3. DETERMINISTIC ID / DEDUPLICATION
  let docId = customDocId;
  if (!docId) {
    if (type === 'follow') {
      docId = `${actorId}_follow_${recipientId}`;
    } else if (type === 'save') {
      docId = `${actorId}_save_${targetType}_${targetId}`;
    } else if (type === 'like') {
      docId = `${actorId}_like_${targetType}_${targetId}`;
    } else if (type === 'profileView') {
      // 24-hour cooldown per viewer/profile
      const todayDate = new Date().toISOString().slice(0, 10);
      docId = `${actorId}_profileView_${recipientId}_${todayDate}`;
    }
  }

  const notifRef = docId ? doc(db, 'notifications', docId) : doc(collection(db, 'notifications'));

  // Sanitize metadata to avoid leaking sensitive fields
  const safeMetadata = { ...metadata };
  delete safeMetadata.guardianEmail;
  delete safeMetadata.guardianPhone;
  delete safeMetadata.password;

  const notifData: Omit<AppNotification, 'id'> = {
    recipientId,
    actorId,
    actorName,
    actorRole,
    actorPhotoUrl,
    type,
    targetId,
    targetType,
    titleKey,
    bodyKey,
    translationParams,
    isRead: false,
    createdAt: serverTimestamp(),
    actionUrl,
    priority,
    metadata: safeMetadata,
  };

  try {
    await setDoc(notifRef, { id: notifRef.id, ...notifData }, { merge: true });
    return notifRef.id;
  } catch (err) {
    console.error('notificationService: Failed to create notification:', err);
    return null;
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  if (!notificationId) return;
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await setDoc(
      notifRef,
      {
        isRead: true,
        readAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`notificationService: Error marking notification ${notificationId} read:`, err);
  }
}

/**
 * Mark all unread notifications as read for a recipient
 */
export async function markAllNotificationsRead(recipientId: string): Promise<void> {
  if (!recipientId) return;

  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', recipientId),
      where('isRead', '==', false)
    );
    const snap = await getDocs(q);

    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isRead: true,
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (err) {
    console.error('notificationService: Error marking all read:', err);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  if (!notificationId) return;
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (err) {
    console.warn(`notificationService: Error deleting notification ${notificationId}:`, err);
  }
}

/**
 * Fetch paginated notifications for a recipient
 */
export async function getNotifications(
  recipientId: string,
  limitCount = 20,
  lastDocSnap: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<PaginatedNotificationsResult> {
  if (!recipientId) {
    return { notifications: [], lastDocSnap: null, hasMore: false };
  }

  try {
    let q;
    if (lastDocSnap) {
      q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', recipientId),
        orderBy('createdAt', 'desc'),
        startAfter(lastDocSnap),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', recipientId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snap = await getDocs(q);
    const docs = snap.docs;
    const hasMore = docs.length === limitCount;
    const newLastDocSnap = docs.length > 0 ? docs[docs.length - 1] : null;

    const notifications: AppNotification[] = docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AppNotification, 'id'>),
    }));

    return { notifications, lastDocSnap: newLastDocSnap, hasMore };
  } catch (err) {
    console.error('notificationService: Error fetching notifications:', err);
    return { notifications: [], lastDocSnap: null, hasMore: false };
  }
}

/**
 * Real-time listener for unread count
 */
export function subscribeToUnreadCount(
  recipientId: string,
  callback: (count: number) => void
): () => void {
  if (!recipientId) {
    callback(0);
    return () => {};
  }

  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', recipientId),
      where('isRead', '==', false)
    );

    return onSnapshot(
      q,
      (snap) => {
        callback(snap.size);
      },
      (err) => {
        console.warn('notificationService: Unread count listener error:', err);
        callback(0);
      }
    );
  } catch (err) {
    console.warn('notificationService: Failed to subscribe to unread count:', err);
    return () => {};
  }
}

/**
 * Real-time listener for recent notifications
 */
export function subscribeToRecentNotifications(
  recipientId: string,
  limitCount = 20,
  callback: (notifications: AppNotification[]) => void
): () => void {
  if (!recipientId) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', recipientId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(
      q,
      (snap) => {
        const list: AppNotification[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AppNotification, 'id'>),
        }));
        callback(list);
      },
      (err) => {
        console.warn('notificationService: Recent notifications listener error:', err);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('notificationService: Failed to subscribe to recent notifications:', err);
    return () => {};
  }
}

/**
 * Record a profile view event with a 24-hour cooldown
 */
export async function recordProfileViewNotification(
  actor: { uid: string; fullName: string; role?: UserRole; photoURL?: string },
  recipientId: string
): Promise<void> {
  if (!actor?.uid || !recipientId || actor.uid === recipientId) return;

  await createNotification({
    recipientId,
    actorId: actor.uid,
    actorName: actor.fullName || 'SoccerBridge User',
    actorRole: actor.role || 'player',
    actorPhotoUrl: actor.photoURL || '',
    type: 'profileView',
    targetId: recipientId,
    targetType: actor.role === 'recruiter' || actor.role === 'club' ? 'recruiter' : 'player',
    titleKey: 'notifProfileViewTitle',
    bodyKey: 'notifProfileViewBody',
    translationParams: { name: actor.fullName || 'A user' },
    priority: 'low',
  });
}
