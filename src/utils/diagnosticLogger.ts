import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserAccount, UserRole, PlayerProfile, RecruiterProfile } from '../types';

export interface DiagnosticSnapshot {
  timestamp: string;
  authLoading: boolean;
  activeView: string;
  firebaseAuth: {
    isAuthenticated: boolean;
    uid: string | null;
    email: string | null;
    emailVerified: boolean | null;
    isAnonymous: boolean | null;
    creationTime: string | null;
    lastSignInTime: string | null;
    providers: string[];
  };
  firestoreUserDoc: {
    exists: boolean;
    checked: boolean;
    data: Partial<UserAccount> | null;
    error: string | null;
  };
  firestorePlayerProfileDoc: {
    exists: boolean;
    checked: boolean;
    summary: {
      fullName?: string;
      primaryPosition?: string;
      city?: string;
      province?: string;
    } | null;
    error: string | null;
  };
  firestoreRecruiterProfileDoc: {
    exists: boolean;
    checked: boolean;
    summary: {
      fullName?: string;
      organization?: string;
      jobTitle?: string;
    } | null;
    error: string | null;
  };
  roleResolution: {
    rawUserAccountRole: string | undefined;
    devRoleOverride: UserRole | null;
    resolvedRole: string | undefined;
    isRoleKnown: boolean;
    activeRole: UserRole;
    needsRoleRecovery: boolean;
    needsPlayerOnboarding: boolean;
    needsRecruiterOnboarding: boolean;
  };
  environment: {
    origin: string;
    pathname: string;
    hash: string;
    userAgent: string;
    isOnline: boolean;
  };
  recentExceptions: Array<{
    timestamp: string;
    message: string;
    stack?: string;
    type: 'error' | 'unhandledrejection';
  }>;
}

// Global exception buffer
const globalExceptions: DiagnosticSnapshot['recentExceptions'] = [];

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    globalExceptions.unshift({
      timestamp: new Date().toISOString(),
      message: event.message || 'Unknown window error',
      stack: event.error?.stack,
      type: 'error',
    });
    if (globalExceptions.length > 20) globalExceptions.pop();
    console.error('[SoccerBridge Diagnostic Watcher] Caught runtime error:', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    globalExceptions.unshift({
      timestamp: new Date().toISOString(),
      message: reason?.message || String(reason) || 'Unhandled Promise Rejection',
      stack: reason?.stack,
      type: 'unhandledrejection',
    });
    if (globalExceptions.length > 20) globalExceptions.pop();
    console.error('[SoccerBridge Diagnostic Watcher] Caught unhandled rejection:', reason);
  });
}

/**
 * Builds a comprehensive diagnostic snapshot of auth, firestore, role state, and errors.
 */
export async function collectDiagnosticSnapshot(params: {
  currentUser: User | null;
  userAccount: UserAccount | null;
  playerProfile: PlayerProfile | null;
  recruiterProfile: RecruiterProfile | null;
  loading: boolean;
  devRoleOverride: UserRole | null;
  activeView: string;
}): Promise<DiagnosticSnapshot> {
  const { currentUser, userAccount, playerProfile, recruiterProfile, loading, devRoleOverride, activeView } = params;

  const resolvedRole = devRoleOverride || userAccount?.role;
  const isRoleKnown = Boolean(resolvedRole && ['player', 'recruiter', 'club'].includes(resolvedRole));
  const activeRole: UserRole = isRoleKnown ? (resolvedRole as UserRole) : 'player';
  const needsRoleRecovery = Boolean(currentUser && !isRoleKnown);
  const needsPlayerOnboarding = Boolean(
    currentUser && isRoleKnown && activeRole === 'player' && !userAccount?.onboardingCompleted
  );
  const needsRecruiterOnboarding = Boolean(
    currentUser &&
      isRoleKnown &&
      (activeRole === 'recruiter' || activeRole === 'club') &&
      !userAccount?.onboardingCompleted
  );

  const snapshot: DiagnosticSnapshot = {
    timestamp: new Date().toISOString(),
    authLoading: loading,
    activeView,
    firebaseAuth: {
      isAuthenticated: Boolean(currentUser),
      uid: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      creationTime: currentUser?.metadata?.creationTime || null,
      lastSignInTime: currentUser?.metadata?.lastSignInTime || null,
      providers: currentUser?.providerData?.map((p) => p.providerId) || [],
    },
    firestoreUserDoc: {
      exists: Boolean(userAccount),
      checked: false,
      data: userAccount
        ? {
            uid: userAccount.uid,
            email: userAccount.email,
            role: userAccount.role,
            fullName: userAccount.fullName,
            onboardingCompleted: userAccount.onboardingCompleted,
            membership: userAccount.membership,
          }
        : null,
      error: null,
    },
    firestorePlayerProfileDoc: {
      exists: Boolean(playerProfile),
      checked: false,
      summary: playerProfile
        ? {
            fullName: playerProfile.fullName,
            primaryPosition: playerProfile.primaryPosition,
            city: playerProfile.city,
            province: playerProfile.province,
          }
        : null,
      error: null,
    },
    firestoreRecruiterProfileDoc: {
      exists: Boolean(recruiterProfile),
      checked: false,
      summary: recruiterProfile
        ? {
            fullName: recruiterProfile.fullName,
            organization: recruiterProfile.organization,
            jobTitle: recruiterProfile.jobTitle,
          }
        : null,
      error: null,
    },
    roleResolution: {
      rawUserAccountRole: userAccount?.role,
      devRoleOverride,
      resolvedRole,
      isRoleKnown,
      activeRole,
      needsRoleRecovery,
      needsPlayerOnboarding,
      needsRecruiterOnboarding,
    },
    environment: {
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      hash: typeof window !== 'undefined' ? window.location.hash : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    },
    recentExceptions: [...globalExceptions],
  };

  // If user is authenticated, query Firestore directly to independently verify doc existence
  if (currentUser?.uid) {
    try {
      const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
      snapshot.firestoreUserDoc.checked = true;
      snapshot.firestoreUserDoc.exists = userDocSnap.exists();
      if (userDocSnap.exists()) {
        snapshot.firestoreUserDoc.data = userDocSnap.data() as Partial<UserAccount>;
      }
    } catch (err: any) {
      snapshot.firestoreUserDoc.checked = true;
      snapshot.firestoreUserDoc.error = err.message || String(err);
    }

    try {
      const pSnap = await getDoc(doc(db, 'playerProfiles', currentUser.uid));
      snapshot.firestorePlayerProfileDoc.checked = true;
      snapshot.firestorePlayerProfileDoc.exists = pSnap.exists();
      if (pSnap.exists()) {
        const pData = pSnap.data() as PlayerProfile;
        snapshot.firestorePlayerProfileDoc.summary = {
          fullName: pData.fullName,
          primaryPosition: pData.primaryPosition,
          city: pData.city,
          province: pData.province,
        };
      }
    } catch (err: any) {
      snapshot.firestorePlayerProfileDoc.checked = true;
      snapshot.firestorePlayerProfileDoc.error = err.message || String(err);
    }

    try {
      const rSnap = await getDoc(doc(db, 'recruiterProfiles', currentUser.uid));
      snapshot.firestoreRecruiterProfileDoc.checked = true;
      snapshot.firestoreRecruiterProfileDoc.exists = rSnap.exists();
      if (rSnap.exists()) {
        const rData = rSnap.data() as RecruiterProfile;
        snapshot.firestoreRecruiterProfileDoc.summary = {
          fullName: rData.fullName,
          organization: rData.organization,
          jobTitle: rData.jobTitle,
        };
      }
    } catch (err: any) {
      snapshot.firestoreRecruiterProfileDoc.checked = true;
      snapshot.firestoreRecruiterProfileDoc.error = err.message || String(err);
    }
  }

  return snapshot;
}

/**
 * Pretty logs diagnostic snapshot to browser console with styled headers.
 */
export function logDiagnosticSnapshotToConsole(snapshot: DiagnosticSnapshot) {
  const isAuth = snapshot.firebaseAuth.isAuthenticated;
  const role = snapshot.roleResolution.activeRole;
  const statusColor = !isAuth
    ? '#94a3b8'
    : snapshot.roleResolution.needsRoleRecovery
    ? '#eab308'
    : '#22c55e';

  console.groupCollapsed(
    `%c[SoccerBridge Auth Diagnostics]%c ${snapshot.timestamp} | Status: %c${
      isAuth ? `Authenticated (${role})` : 'Unauthenticated'
    }%c | Loading: ${snapshot.authLoading}`,
    'background: #1e293b; color: #38bdf8; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    'color: #94a3b8;',
    `color: ${statusColor}; font-weight: bold;`,
    'color: #94a3b8;'
  );

  console.table({
    'Auth Loading': snapshot.authLoading,
    'Is Authenticated': snapshot.firebaseAuth.isAuthenticated,
    'User UID': snapshot.firebaseAuth.uid || 'None',
    'Email': snapshot.firebaseAuth.email || 'None',
    'Email Verified': snapshot.firebaseAuth.emailVerified ?? 'N/A',
    'Firestore users/{uid} Exists': snapshot.firestoreUserDoc.exists,
    'Firestore playerProfiles/{uid} Exists': snapshot.firestorePlayerProfileDoc.exists,
    'Firestore recruiterProfiles/{uid} Exists': snapshot.firestoreRecruiterProfileDoc.exists,
    'Raw Account Role': snapshot.roleResolution.rawUserAccountRole || 'None',
    'Resolved Role': snapshot.roleResolution.resolvedRole || 'Unresolved',
    'Active Role': snapshot.roleResolution.activeRole,
    'Needs Role Recovery': snapshot.roleResolution.needsRoleRecovery,
    'Needs Player Onboarding': snapshot.roleResolution.needsPlayerOnboarding,
    'Needs Recruiter Onboarding': snapshot.roleResolution.needsRecruiterOnboarding,
    'Active View': snapshot.activeView,
  });

  console.log('%cDetailed Diagnostic Payload:', 'font-weight: bold; color: #38bdf8;', snapshot);

  if (snapshot.recentExceptions.length > 0) {
    console.warn('%cRecent Recorded Exceptions / Crashes (%d):', 'font-weight: bold; color: #ef4444;', snapshot.recentExceptions.length, snapshot.recentExceptions);
  }

  console.groupEnd();
}
