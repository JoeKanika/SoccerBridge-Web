/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole, AccountMembership, VerificationStatus } from './index';

export type AdminRole = 'superadmin' | 'moderator' | 'verifier' | 'support' | 'analyst';

export interface AdminClaims {
  admin: boolean;
  adminRole: AdminRole;
  mfaEnrolled?: boolean;
  permissions?: string[];
}

export type AdminPermission =
  | 'manage_users'
  | 'view_users'
  | 'suspend_users'
  | 'verify_recruiters'
  | 'verify_clubs'
  | 'moderate_content'
  | 'manage_reports'
  | 'access_safeguarding'
  | 'manage_subscriptions'
  | 'manage_opportunities'
  | 'view_analytics'
  | 'view_system_health'
  | 'manage_support'
  | 'manage_announcements'
  | 'manage_feature_flags'
  | 'view_audit_logs'
  | 'manage_data_requests'
  | 'manage_admins';

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  superadmin: [
    'manage_users',
    'view_users',
    'suspend_users',
    'verify_recruiters',
    'verify_clubs',
    'moderate_content',
    'manage_reports',
    'access_safeguarding',
    'manage_subscriptions',
    'manage_opportunities',
    'view_analytics',
    'view_system_health',
    'manage_support',
    'manage_announcements',
    'manage_feature_flags',
    'view_audit_logs',
    'manage_data_requests',
    'manage_admins',
  ],
  moderator: [
    'view_users',
    'moderate_content',
    'manage_reports',
    'manage_opportunities',
    'view_audit_logs',
  ],
  verifier: [
    'view_users',
    'verify_recruiters',
    'verify_clubs',
    'view_audit_logs',
  ],
  support: [
    'view_users',
    'manage_support',
    'view_system_health',
    'view_audit_logs',
  ],
  analyst: [
    'view_users',
    'view_analytics',
    'view_system_health',
  ],
};

export type AccountStatus = 'active' | 'suspended' | 'deactivated' | 'flagged_for_review';

export interface AdminUserRecord {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  membership: AccountMembership;
  accountStatus: AccountStatus;
  onboardingCompleted: boolean;
  verificationStatus?: VerificationStatus | 'underReview' | 'needsMoreInformation';
  emailVerified: boolean;
  city?: string;
  province?: string;
  country?: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
  fifaLicenceNumber?: string;
  createdAt: any;
  updatedAt: any;
  lastActiveAt?: any;
  photoURL?: string;
  isMinor?: boolean;
  age?: number;
  hasGuardianConsent?: boolean;
  photosCount?: number;
  videosCount?: number;
  reportsCount?: number;
  notesCount?: number;
}

export type VerificationQueueStatus = 'pending' | 'underReview' | 'verified' | 'rejected' | 'needsMoreInformation';

export interface VerificationRequest {
  id: string;
  userId: string;
  userType: 'recruiter' | 'club';
  applicantName: string;
  organizationName: string;
  orgType: string;
  jobTitle?: string;
  email: string;
  phone?: string;
  country: string;
  city?: string;
  province?: string;
  website?: string;
  fifaLicenceNumber?: string;
  documentUrls: string[];
  submittedAt: any;
  status: VerificationQueueStatus;
  reviewerUid?: string;
  reviewerName?: string;
  reviewedAt?: any;
  reviewerNotes?: string;
  rejectionReason?: string;
}

export type ModerationTargetType = 'player_photo' | 'gallery_photo' | 'video' | 'profile_bio' | 'opportunity' | 'post';
export type ModerationStatus = 'pending' | 'approved' | 'hidden' | 'flagged' | 'removed';

export interface ModerationItem {
  id: string;
  targetType: ModerationTargetType;
  targetId: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorRole: UserRole;
  title?: string;
  description?: string;
  contentUrl?: string;
  thumbnailUrl?: string;
  status: ModerationStatus;
  flagReason?: string;
  moderatorNotes?: string;
  moderatedByUid?: string;
  moderatedAt?: any;
  createdAt: any;
}

export type SafetyReportCategory =
  | 'spam'
  | 'scam'
  | 'fake_recruiter'
  | 'fake_player'
  | 'harassment'
  | 'inappropriate_content'
  | 'impersonation'
  | 'safeguarding_concern'
  | 'other';

export type SafetyReportStatus = 'open' | 'investigating' | 'actionTaken' | 'dismissed';

export interface SafetyReportItem {
  id: string;
  reporterId: string;
  reporterName?: string;
  reporterEmail?: string;
  targetUserId: string;
  targetUserName?: string;
  targetUserRole?: UserRole;
  targetContentId?: string;
  targetContentType?: string;
  category: SafetyReportCategory;
  description: string;
  evidenceUrls?: string[];
  status: SafetyReportStatus;
  assignedModeratorId?: string;
  moderatorNotes?: string;
  actionTakenDetails?: string;
  createdAt: any;
  resolvedAt?: any;
}

export interface SafeguardingRecord {
  id: string;
  playerUid: string;
  playerName: string;
  age: number;
  dateOfBirth: string;
  hasGuardianConsent: boolean;
  guardianName?: string; // Tightly restricted, never in public analytics
  guardianEmail?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  safeguardingFlagsCount: number;
  recruiterInteractionsCount: number;
  lastReviewedAt?: any;
  reviewedByUid?: string;
  safeguardingNotes?: string;
  status: 'compliant' | 'missing_consent' | 'under_review' | 'flagged';
}

export interface SubscriptionAdminRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  tier: 'FREE' | 'PLAYER_PRO' | 'RECRUITER_PRO' | 'CLUB_PRO';
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  provider: 'stripe' | 'manual_admin' | 'promotional_grant';
  subscriptionId?: string;
  startDate: any;
  renewalDate?: any;
  expirationDate?: any;
  grantedByUid?: string;
  grantReason?: string;
}

export interface SupportCaseItem {
  id: string;
  ticketNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  category: 'account_access' | 'billing' | 'onboarding_error' | 'verification' | 'bug_report' | 'general';
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved';
  internalNotes: Array<{
    authorUid: string;
    authorName: string;
    text: string;
    timestamp: any;
  }>;
  createdAt: any;
  updatedAt: any;
  resolvedAt?: any;
  assignedStaffUid?: string;
}

export type PlatformAnnouncement = {
  id: string;
  titleEn: string;
  titleFr: string;
  bodyEn: string;
  bodyFr: string;
  targetAudience: 'everyone' | 'players' | 'recruiters' | 'clubs';
  targetRegion?: string; // 'all' | 'ON' | 'QC' | 'BC' | 'AB' etc.
  priority: 'info' | 'important' | 'critical';
  published: boolean;
  publishedAt?: any;
  expiresAt?: any;
  createdByName: string;
  createdByUid: string;
  createdAt: any;
};

export type SystemAnnouncementItem = PlatformAnnouncement;

export interface FeatureFlagItem {
  id: string;
  key: string;
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  enabled: boolean;
  category: 'onboarding' | 'recruitment' | 'subscriptions' | 'media' | 'security';
  updatedByUid?: string;
  updatedByName?: string;
  updatedAt: any;
}

export type SystemFeatureFlag = FeatureFlagItem;

export interface SystemHealthMetric {
  id: string;
  type: 'auth_error' | 'firestore_error' | 'storage_error' | 'signup_failure' | 'role_resolution_failure' | 'client_crash';
  service: 'Auth' | 'Firestore' | 'Storage' | 'Hosting' | 'Client';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  timestamp: any;
}

export interface AdminStaffMember {
  uid: string;
  email: string;
  role: AdminRole;
  active: boolean;
  fullName?: string;
  assignedByUid?: string;
  assignedByName?: string;
  createdAt: any;
  updatedAt: any;
  lastActiveAt?: any;
}

export interface AdminAuditLogEntry {
  id: string;
  adminUid: string;
  adminEmail: string;
  adminRole: AdminRole;
  action:
    | 'suspend_user'
    | 'restore_user'
    | 'correct_user_role'
    | 'reset_onboarding'
    | 'verify_recruiter'
    | 'reject_recruiter'
    | 'verify_club'
    | 'reject_club'
    | 'moderate_content'
    | 'resolve_safety_report'
    | 'update_safeguarding'
    | 'grant_membership'
    | 'cancel_membership'
    | 'toggle_feature_flag'
    | 'publish_announcement'
    | 'update_support_case'
    | 'process_data_request'
    | 'grant_admin_role'
    | 'revoke_admin_role'
    | 'bootstrap_superadmin';
  targetType:
    | 'user'
    | 'recruiter'
    | 'club'
    | 'media'
    | 'report'
    | 'safeguarding'
    | 'subscription'
    | 'feature_flag'
    | 'announcement'
    | 'support_case'
    | 'data_request'
    | 'admin'
    | 'staff';
  targetId: string;
  targetName?: string;
  previousValue?: any;
  newValue?: any;
  reason?: string;
  metadata?: Record<string, any>;
  timestamp: any;
}

export interface DataPrivacyRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  requestType: 'export_data' | 'delete_account';
  status: 'requested' | 'processing' | 'completed' | 'rejected';
  rejectionReason?: string;
  exportDownloadUrl?: string;
  requestedAt: any;
  processedAt?: any;
  processedByUid?: string;
}

export type DataPrivacyRequestItem = DataPrivacyRequest;

export interface AdminDashboardOverviewMetrics {
  totalUsers: number;
  totalPlayers: number;
  totalRecruiters: number;
  totalClubs: number;
  newRegistrationsToday: number;
  newRegistrationsThisWeek: number;
  activeUsers24h: number;
  completedProfiles: number;
  incompleteOnboarding: number;
  freeUsersCount: number;
  proUsersCount: number;
  uploadedVideosCount: number;
  uploadedPhotosCount: number;
  conversationsCount: number;
  trialInvitationsCount: number;
  opportunitiesCount: number;
  pendingRecruiterVerificationsCount: number;
  openAbuseReportsCount: number;
  suspendedAccountsCount: number;
  safeguardingReviewsCount: number;
  systemErrors24hCount: number;
}
