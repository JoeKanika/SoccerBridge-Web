import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import {
  BlockedUser,
  UserReport,
  MeetingInvitation,
  RecruiterTask,
  OrgComment,
  OrgMember,
  OrgActivity,
  UserPresence,
  OrgRole,
} from '../types';
import { createNotification } from './notificationService';

// Block User
export async function blockUser(blockerId: string, blockedId: string, blockedName: string): Promise<string> {
  const ref = await addDoc(collection(db, 'blockedUsers'), {
    blockerId,
    blockedId,
    blockedName,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function unblockUser(blockId: string): Promise<void> {
  await deleteDoc(doc(db, 'blockedUsers', blockId));
}

export async function fetchBlockedUsers(blockerId: string): Promise<BlockedUser[]> {
  const q = query(collection(db, 'blockedUsers'), where('blockerId', '==', blockerId));
  const snap = await getDocs(q);
  const list: BlockedUser[] = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() } as BlockedUser));
  return list;
}

// User Reports
export async function submitUserReport(
  report: Omit<UserReport, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'reports'), {
    ...report,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Meetings & Invitations
export async function scheduleMeeting(
  meeting: Omit<MeetingInvitation, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'meetings'), {
    ...meeting,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  // Trigger Notification
  await createNotification({
    recipientId: meeting.inviteeId,
    actorId: meeting.hostId,
    actorName: meeting.hostName,
    actorRole: meeting.hostRole as any,
    type: 'trialInvite',
    targetId: ref.id,
    targetType: 'opportunity',
    titleKey: 'meetingInvitationTitle',
    bodyKey: 'meetingInvitationBody',
    translationParams: { host: meeting.hostName, title: meeting.title, date: meeting.date, time: meeting.time },
    priority: 'high',
    actionUrl: '/messages',
  });

  return ref.id;
}

export async function updateMeetingStatus(
  meetingId: string,
  status: MeetingInvitation['status'],
  requestedTime?: string
): Promise<void> {
  const ref = doc(db, 'meetings', meetingId);
  const updateData: any = { status };
  if (requestedTime) updateData.requestedTime = requestedTime;
  await setDoc(ref, updateData, { merge: true });
}

export async function fetchMeetings(userId: string): Promise<MeetingInvitation[]> {
  const q1 = query(collection(db, 'meetings'), where('hostId', '==', userId));
  const q2 = query(collection(db, 'meetings'), where('inviteeId', '==', userId));

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const map = new Map<string, MeetingInvitation>();

  snap1.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as MeetingInvitation));
  snap2.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as MeetingInvitation));

  return Array.from(map.values()).sort(
    (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  );
}

// Recruiter & Org Tasks
export async function createRecruiterTask(
  task: Omit<RecruiterTask, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'tasks'), {
    ...task,
    createdAt: serverTimestamp(),
  });

  if (task.assigneeId) {
    await createNotification({
      recipientId: task.assigneeId,
      actorId: task.createdBy,
      actorName: task.createdByName,
      type: 'system',
      targetId: ref.id,
      targetType: 'opportunity',
      titleKey: 'taskAssignedTitle',
      bodyKey: 'taskAssignedBody',
      translationParams: { creator: task.createdByName, title: task.title },
      priority: 'normal',
      actionUrl: '/scouting',
    });
  }

  return ref.id;
}

export async function updateTaskStatus(taskId: string, status: RecruiterTask['status']): Promise<void> {
  await setDoc(doc(db, 'tasks', taskId), { status }, { merge: true });
}

export async function fetchRecruiterTasks(userIdOrOrgId: string): Promise<RecruiterTask[]> {
  const q1 = query(collection(db, 'tasks'), where('createdBy', '==', userIdOrOrgId));
  const q2 = query(collection(db, 'tasks'), where('assigneeId', '==', userIdOrOrgId));
  const q3 = query(collection(db, 'tasks'), where('orgId', '==', userIdOrOrgId));

  const [snap1, snap2, snap3] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)]);
  const map = new Map<string, RecruiterTask>();

  snap1.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as RecruiterTask));
  snap2.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as RecruiterTask));
  snap3.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as RecruiterTask));

  return Array.from(map.values());
}

// Org Comments & Collaboration
export async function addOrgComment(comment: Omit<OrgComment, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'orgComments'), {
    ...comment,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function fetchOrgComments(orgId: string, playerId: string): Promise<OrgComment[]> {
  const q = query(
    collection(db, 'orgComments'),
    where('orgId', '==', orgId),
    where('playerId', '==', playerId)
  );
  const snap = await getDocs(q);
  const list: OrgComment[] = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() } as OrgComment));
  return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

// Org Members & Permissions
export async function addOrgMember(member: Omit<OrgMember, 'id' | 'addedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'orgMembers'), {
    ...member,
    addedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function fetchOrgMembers(orgId: string): Promise<OrgMember[]> {
  const q = query(collection(db, 'orgMembers'), where('orgId', '==', orgId));
  const snap = await getDocs(q);
  const list: OrgMember[] = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() } as OrgMember));
  return list;
}

// Org Activity Log
export async function logOrgActivity(
  orgId: string,
  actorId: string,
  actorName: string,
  action: string,
  targetType?: string,
  targetId?: string
): Promise<string> {
  const ref = await addDoc(collection(db, 'orgActivity'), {
    orgId,
    actorId,
    actorName,
    action,
    targetType,
    targetId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function fetchOrgActivities(orgId: string): Promise<OrgActivity[]> {
  const q = query(collection(db, 'orgActivity'), where('orgId', '==', orgId));
  const snap = await getDocs(q);
  const list: OrgActivity[] = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() } as OrgActivity));
  return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

// Presence System
export async function updateUserPresence(
  userId: string,
  status: 'online' | 'idle' | 'offline',
  showOnlineStatus: boolean = true,
  isTyping: boolean = false,
  isRecordingAudio: boolean = false
): Promise<void> {
  const ref = doc(db, 'userPresence', userId);
  await setDoc(
    ref,
    {
      userId,
      status,
      showOnlineStatus,
      isTyping,
      isRecordingAudio,
      lastSeen: serverTimestamp(),
    },
    { merge: true }
  );
}

// Calendar Export Helpers
export function generateGoogleCalendarUrl(
  title: string,
  details: string,
  location: string,
  dateStr: string,
  timeStr: string,
  durationMins: number = 60
): string {
  const startIso = new Date(`${dateStr}T${timeStr || '10:00'}:00`).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endIso = new Date(new Date(`${dateStr}T${timeStr || '10:00'}:00`).getTime() + durationMins * 60000)
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&dates=${startIso}/${endIso}`;
}

export function downloadIcsFile(
  title: string,
  details: string,
  location: string,
  dateStr: string,
  timeStr: string
): void {
  const startDate = new Date(`${dateStr}T${timeStr || '10:00'}:00`);
  const endDate = new Date(startDate.getTime() + 60 * 60000);

  const formatIcsDate = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const csContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SoccerBridge//Recruitment Calendar//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    `LOCATION:${location}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');

  const blob = new Blob([csContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_event.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
