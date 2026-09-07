export type UserRole = 'player' | 'recruiter' | 'club';

export type AccountMembership = 'FREE' | 'PRO';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface UserAccount {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  membership: AccountMembership;
  createdAt: any;
  updatedAt: any;
  photoURL?: string;
}

export type PrimaryPosition =
  | 'Goalkeeper'
  | 'Right back'
  | 'Centre back'
  | 'Left back'
  | 'Defensive midfielder'
  | 'Central midfielder'
  | 'Attacking midfielder'
  | 'Right winger'
  | 'Left winger'
  | 'Striker';

export type PlayingLevel =
  | 'Recreational'
  | 'School'
  | 'Academy'
  | 'District'
  | 'Provincial'
  | 'College'
  | 'University'
  | 'Semi-professional'
  | 'Professional'
  | 'Free agent';

export type AvailabilityStatus =
  | 'Actively looking'
  | 'Open to opportunities'
  | 'Available for trials'
  | 'Currently unavailable';

export interface GuardianInfo {
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardianRelationship?: string;
  guardianConsent: boolean;
}

export interface PlayerProfile {
  uid: string;
  role: 'player';
  fullName: string;
  email: string;
  dateOfBirth: string;
  age: number;
  nationality: string;
  city: string;
  province: string;
  country: string;
  primaryPosition: PrimaryPosition;
  secondaryPosition?: PrimaryPosition | '';
  preferredFoot: 'Right' | 'Left' | 'Both';
  heightCm: number;
  weightKg: number;
  currentOrganization: string;
  playingLevel: PlayingLevel;
  availabilityStatus: AvailabilityStatus;
  
  geographicAvailability: string[] | string;
  geographicAvailabilityOther?: string | null;
  shortTermGoals: string[] | string;
  shortTermGoalsOther?: string | null;
  longTermGoals: string[] | string;
  longTermGoalsOther?: string | null;

  willingToRelocate: boolean;
  openToTrials: boolean;
  bio: string;

  profilePhotoUrl?: string;
  profilePhotoStoragePath?: string;
  profilePhotoFileName?: string;
  profilePhotoContentType?: string;
  profilePhotoSource?: 'google' | 'camera' | 'gallery' | 'file' | 'existing';
  profilePhotoUploadedAt?: any;

  soccerCvUrl?: string;
  soccerCvStoragePath?: string;
  soccerCvFileName?: string;
  soccerCvContentType?: string;
  soccerCvUploadedAt?: any;

  guardian?: GuardianInfo;
  membership: AccountMembership;
  profileCompletion: number;
  onboardingCompleted: boolean;
  profileViewsCount?: number;
  savesCount?: number;
  lastActiveAt?: any;
  createdAt: any;
  updatedAt: any;
}

export type MediaVisibility = 'public' | 'recruitersOnly' | 'private';

export interface PlayerPhoto {
  id: string;
  playerId: string;
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  caption?: string;
  displayOrder: number;
  isPrimary: boolean;
  visibility: MediaVisibility;
  createdAt: any;
  updatedAt: any;
}

export type VideoType = 'highlight' | 'fullMatch' | 'full_match' | 'training' | 'skills' | 'trial';
export type VideoSourceType = 'upload' | 'youtube' | 'vimeo';
export type VideoProcessingStatus = 'uploading' | 'uploaded' | 'processing' | 'ready' | 'failed';

export interface VideoMetadata {
  id: string;
  playerId: string;
  title: string;
  description: string;
  videoType: VideoType;
  sourceType: VideoSourceType;
  provider?: 'youtube' | 'vimeo';
  externalUrl?: string;
  storagePath?: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  duration?: string;
  visibility: MediaVisibility;
  processingStatus?: VideoProcessingStatus;
  createdAt: any;
  updatedAt?: any;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  participantRoles: Record<string, string>;
  participantPhotos: Record<string, string>;
  lastMessage: string;
  lastMessageTimestamp: any;
  unreadCount: Record<string, number>;
  pinnedBy?: string[];
  archivedBy?: string[];
  mutedBy?: string[];
  favoritedBy?: string[];
  deletedBy?: string[];
  typingUsers?: Record<string, boolean>;
  createdAt: any;
  updatedAt: any;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  read: boolean;
  status?: 'sent' | 'delivered' | 'seen';
  attachments?: MessageAttachment[];
  meetingInviteId?: string;
}

export interface SavedPlayer {
  id: string;
  recruiterId: string;
  playerId: string;
  playerData: Partial<PlayerProfile>;
  savedAt: any;
}

export interface TrialInvitation {
  id: string;
  recruiterId: string;
  recruiterName: string;
  recruiterOrg: string;
  playerId: string;
  playerName: string;
  eventTitle: string;
  eventDate: string;
  location: string;
  details: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}

export interface PlayerSearchFilters {
  searchTerm: string;
  position: string;
  secondaryPosition: string;
  minAge: number;
  maxAge: number;
  city: string;
  province: string;
  location?: string;
  preferredFoot: string;
  minHeight: number;
  maxHeight: number;
  playingLevel: string;
  availabilityStatus: string;
  openToTrialsOnly: boolean;
  willingToRelocateOnly: boolean;
  proOnly: boolean;
  currentOrganization: string;
}

export type SearchFilters = Partial<PlayerSearchFilters>;

export type RecruiterOrgType =
  | 'FIFA Agent'
  | 'Independent Recruiter'
  | 'Professional Club'
  | 'Semi-Pro Club'
  | 'Academy'
  | 'College / University';

export interface RecruiterProfile {
  uid: string;
  role: 'recruiter' | 'club';
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  orgType: RecruiterOrgType;
  jobTitle: string;
  city?: string;
  province?: string;
  country?: string;
  verificationStatus: VerificationStatus;
  credentialsDocUrl?: string;
  credentialsDocStoragePath?: string;
  membership: AccountMembership;
  onboardingCompleted: boolean;
  lastActiveAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface FollowRelationship {
  id: string;
  followerId: string;
  followerRole: UserRole;
  targetId: string;
  targetRole: UserRole;
  createdAt: any;
}

export interface FollowUserSummary {
  uid: string;
  fullName: string;
  role: UserRole;
  profilePhotoUrl?: string;
  location?: string;
  organization?: string;
  primaryPosition?: string;
  verificationStatus?: VerificationStatus;
}

export type LikeTargetType = 'photo' | 'video';

export interface LikeItem {
  id: string;
  userId: string;
  targetId: string;
  targetType: LikeTargetType;
  ownerId?: string;
  createdAt: any;
}

export type SavedTargetType = 'player' | 'recruiter' | 'agent' | 'club' | 'opportunity' | 'video';

export interface SavedItem {
  id: string;
  userId: string;
  targetId: string;
  targetType: SavedTargetType;
  targetOwnerId?: string;
  createdAt: any;
  targetData?: any;
}

export type FeedbackType = 'notInterested' | 'dismissed';

export interface RecommendationFeedback {
  id: string;
  userId: string;
  targetId: string;
  targetType: SavedTargetType;
  feedbackType: FeedbackType;
  createdAt: any;
}

export type MatchLabelKey = 'matchExcellent' | 'matchStrong' | 'matchGood' | 'matchPossible';

export interface MatchOptions {
  isFollowing?: boolean;
  isSaved?: boolean;
  hasLikedMedia?: boolean;
  blockedTargetIds?: Set<string> | string[];
}

export interface MatchedSignals {
  positionMatch?: boolean;
  locationMatch?: boolean;
  levelMatch?: boolean;
  trialsMatch?: boolean;
  goalsMatch?: boolean;
  relocationMatch?: boolean;
  verificationMatch?: boolean;
  activeMatch?: boolean;
  socialMatch?: boolean;
}

export interface MatchResult {
  targetId: string;
  targetType: SavedTargetType;
  targetData: any;
  matchScore: number; // 0 - 100
  matchLabelKey: MatchLabelKey;
  reasons: string[]; // translation keys
  matchedSignals: MatchedSignals;
}

// Notification System Types (Phase 6)
export type NotificationType =
  | 'follow'
  | 'like'
  | 'save'
  | 'profileView'
  | 'message'
  | 'trialInvite'
  | 'recruiterInterest'
  | 'opportunity'
  | 'recommendation'
  | 'verification'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high';

export interface AppNotification {
  id: string;
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
  isRead: boolean;
  createdAt: any;
  readAt?: any;
  actionUrl?: string;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  follows: boolean;
  likes: boolean;
  profileViews: boolean;
  saves: boolean;
  messages: boolean;
  trialInvites: boolean;
  opportunities: boolean;
  recommendations: boolean;
}

// Scouting Suite Types (Phase 8)
export interface PlayerShortlist {
  id: string;
  recruiterId: string;
  title: string;
  description?: string;
  playerIds: string[];
  createdAt: any;
  updatedAt: any;
}

export type RecruiterTag =
  | 'Fast'
  | 'Technical'
  | 'Leadership'
  | 'Needs Development'
  | 'Potential Pro'
  | 'Excellent Attitude'
  | 'Watch Again'
  | 'Trial Candidate'
  | 'Priority'
  | 'Medical Review'
  | string;

export interface ScoutingNote {
  id: string;
  recruiterId: string;
  playerId: string;
  title: string;
  body: string;
  tags: string[];
  authorName?: string;
  createdAt: any;
  updatedAt: any;
}

export type PipelineStage =
  | 'Discovered'
  | 'Watching'
  | 'Interested'
  | 'Contacted'
  | 'Trial Scheduled'
  | 'Offer Made'
  | 'Signed'
  | 'Archived';

export interface PipelineItem {
  id: string;
  recruiterId: string;
  playerId: string;
  stage: PipelineStage;
  playerName?: string;
  playerPos?: string;
  playerClub?: string;
  playerPhotoUrl?: string;
  updatedAt: any;
  notes?: string;
}

export interface SavedSearch {
  id: string;
  recruiterId: string;
  title: string;
  filters: Record<string, any>;
  createdAt: any;
}

export type ScoutingEventType =
  | 'trial'
  | 'meeting'
  | 'scouting_trip'
  | 'video_review'
  | 'follow_up'
  | 'interview'
  | 'offer_deadline';

export interface ScoutingEvent {
  id: string;
  recruiterId: string;
  type: ScoutingEventType;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  playerId?: string;
  playerName?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: any;
}

export type ApplicationStatus =
  | 'Pending'
  | 'Reviewed'
  | 'Interview'
  | 'Trial'
  | 'Accepted'
  | 'Rejected'
  | 'Archived'
  | 'declined'
  | 'accepted'
  | 'trial_scheduled';

export interface PlayerApplication {
  id: string;
  recruiterId: string;
  playerId: string;
  trialId?: string;
  trialTitle?: string;
  playerName: string;
  playerPosition?: string;
  playerPhotoUrl?: string;
  playerClub?: string;
  status: ApplicationStatus;
  appliedAt: any;
  updatedAt: any;
  notes?: string;
}

export interface ScoutingAnalyticsData {
  profilesViewed: number;
  profilesSaved: number;
  messagesSent: number;
  repliesReceived: number;
  trialsScheduled: number;
  trialsAccepted: number;
  applicationsCount: number;
  funnelData: { stage: string; count: number }[];
  weeklyActivity: { day: string; views: number; saves: number; contacts: number }[];
}

// Phase 9: Communication & Collaboration Types
export type AttachmentType =
  | 'photo'
  | 'video'
  | 'pdf'
  | 'soccer_cv'
  | 'document'
  | 'audio'
  | 'location';

export interface MessageAttachment {
  id: string;
  type: AttachmentType;
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  duration?: number; // Voice note duration in seconds
  locationData?: {
    lat: number;
    lng: number;
    name: string;
  };
}

export interface MeetingInvitation {
  id: string;
  hostId: string;
  hostName: string;
  hostRole: string;
  inviteeId: string;
  inviteeName: string;
  type: 'Meeting' | 'Interview' | 'Trial' | 'Virtual Call' | 'Scouting Review';
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  locationOrLink: string;
  agenda?: string;
  provider: 'Google Meet' | 'Zoom' | 'Daily' | 'Agora' | 'Twilio';
  status: 'pending' | 'accepted' | 'declined' | 'reschedule_requested';
  requestedTime?: string;
  createdAt: any;
}

export type OrgRole = 'Owner' | 'Admin' | 'Scout' | 'Assistant Scout' | 'Viewer';

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  photoUrl?: string;
  addedAt: any;
}

export interface OrgComment {
  id: string;
  orgId: string;
  playerId: string;
  authorId: string;
  authorName: string;
  comment: string;
  mentions?: string[];
  createdAt: any;
}

export type TaskCategory =
  | 'Watch highlights'
  | 'Contact player'
  | 'Review CV'
  | 'Schedule trial'
  | 'Call family'
  | 'Prepare contract'
  | 'Other';

export interface RecruiterTask {
  id: string;
  orgId?: string;
  createdBy: string;
  createdByName: string;
  assigneeId?: string;
  assigneeName?: string;
  playerId?: string;
  playerName?: string;
  title: string;
  category: TaskCategory;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'completed';
  createdAt: any;
}

export interface OrgActivity {
  id: string;
  orgId: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  createdAt: any;
}

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedId: string;
  blockedName: string;
  createdAt: any;
}

export type ReportReason =
  | 'Spam'
  | 'Fake recruiter'
  | 'Fake player'
  | 'Harassment'
  | 'Inappropriate content'
  | 'Scam';

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedId: string;
  reportedName: string;
  reason: ReportReason;
  details: string;
  status: 'pending' | 'reviewed';
  createdAt: any;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'idle' | 'offline';
  showOnlineStatus: boolean;
  isTyping?: boolean;
  isRecordingAudio?: boolean;
  lastSeen: any;
}





