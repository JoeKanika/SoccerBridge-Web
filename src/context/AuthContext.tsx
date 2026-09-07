import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, getFirebaseErrorMessage } from '../firebase';
import { UserAccount, UserRole, PlayerProfile, RecruiterProfile, AccountMembership } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface AuthContextType {
  currentUser: User | null;
  userAccount: UserAccount | null;
  playerProfile: PlayerProfile | null;
  recruiterProfile: RecruiterProfile | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signUpWithEmail: (email: string, pass: string, fullName: string, role: UserRole) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: (roleForNewUser?: UserRole) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  reloadUserAccount: () => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
  savePlayerProfile: (data: Partial<PlayerProfile>) => Promise<void>;
  saveRecruiterProfile: (data: Partial<RecruiterProfile>) => Promise<void>;
  upgradeToProMembership: () => Promise<void>;
  // Dev Sandbox overrides
  setDevRoleOverride: (role: UserRole | null) => void;
  devRoleOverride: UserRole | null;
}

const sanitizeFirestorePayload = (data: any): any => {
  if (data === null || data === undefined) return null;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeFirestorePayload(item));
  }
  if (data.constructor && data.constructor.name !== 'Object') {
    return data;
  }
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val !== undefined) {
      if (val && typeof val === 'object' && val.constructor?.name === 'Object') {
        const cleanedSub = sanitizeFirestorePayload(val);
        if (cleanedSub !== null) {
          clean[key] = cleanedSub;
        }
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [devRoleOverride, setDevRoleOverride] = useState<UserRole | null>(null);

  const { language } = useLanguage();

  const clearError = () => setError(null);

  // Fetch or self-heal user data in Firestore
  const fetchUserData = async (uid: string, provisionalRole?: UserRole) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserAccount;
        
        // Validate and resolve role
        let role = data.role;
        if (!role || !['player', 'recruiter', 'club'].includes(role)) {
          // Self-heal missing role on existing user doc
          const pSnap = await getDoc(doc(db, 'playerProfiles', uid));
          const rSnap = await getDoc(doc(db, 'recruiterProfiles', uid));
          if (rSnap.exists()) {
            role = (rSnap.data()?.role as UserRole) || 'recruiter';
          } else if (pSnap.exists()) {
            role = 'player';
          } else if (provisionalRole) {
            role = provisionalRole;
          }

          if (role) {
            await setDoc(userDocRef, { role, updatedAt: serverTimestamp() }, { merge: true });
            data.role = role;
          }
        }

        setUserAccount(data);

        const activeRole = devRoleOverride || data.role;

        if (activeRole === 'player') {
          const playerRef = doc(db, 'playerProfiles', uid);
          const pSnap = await getDoc(playerRef);
          if (pSnap.exists()) {
            setPlayerProfile(pSnap.data() as PlayerProfile);
          } else {
            setPlayerProfile(null);
          }
          setRecruiterProfile(null);
        } else if (activeRole === 'recruiter' || activeRole === 'club') {
          const recruiterRef = doc(db, 'recruiterProfiles', uid);
          const rSnap = await getDoc(recruiterRef);
          if (rSnap.exists()) {
            setRecruiterProfile(rSnap.data() as RecruiterProfile);
          } else {
            setRecruiterProfile(null);
          }
          setPlayerProfile(null);
        }
      } else {
        // Self-healing recovery: reconstruct missing users/{uid} document
        console.warn(`[Auth Self-Healing] users/${uid} missing. Attempting profile recovery...`);
        const pSnap = await getDoc(doc(db, 'playerProfiles', uid));
        const rSnap = await getDoc(doc(db, 'recruiterProfiles', uid));

        let recoveredRole: UserRole | null = null;
        let recoveredName = auth.currentUser?.displayName || 'SoccerBridge User';
        let onboardingCompleted = false;
        let membership: AccountMembership = 'FREE';

        if (rSnap.exists()) {
          const rData = rSnap.data();
          recoveredRole = (rData?.role as UserRole) || 'recruiter';
          recoveredName = rData?.fullName || recoveredName;
          onboardingCompleted = Boolean(rData?.onboardingCompleted);
          membership = rData?.membership || 'FREE';
          setRecruiterProfile(rData as RecruiterProfile);
          setPlayerProfile(null);
        } else if (pSnap.exists()) {
          const pData = pSnap.data();
          recoveredRole = 'player';
          recoveredName = pData?.fullName || recoveredName;
          onboardingCompleted = Boolean(pData?.onboardingCompleted);
          membership = pData?.membership || 'FREE';
          setPlayerProfile(pData as PlayerProfile);
          setRecruiterProfile(null);
        } else if (provisionalRole) {
          recoveredRole = provisionalRole;
        }

        if (recoveredRole) {
          const reconstructedAccount: UserAccount = {
            uid,
            fullName: recoveredName,
            email: auth.currentUser?.email || '',
            role: recoveredRole,
            emailVerified: Boolean(auth.currentUser?.emailVerified),
            onboardingCompleted,
            membership,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            photoURL: auth.currentUser?.photoURL || undefined,
          };

          await setDoc(userDocRef, reconstructedAccount, { merge: true });
          setUserAccount(reconstructedAccount);
          console.info(`[Auth Self-Healing] Successfully reconstructed users/${uid} with role: ${recoveredRole}`);
        } else {
          // If no role could be inferred, leave userAccount null so UI prompts role selection safely
          setUserAccount(null);
          setPlayerProfile(null);
          setRecruiterProfile(null);
        }
      }
    } catch (err: any) {
      if (err?.code === 'unavailable' || err?.message?.includes('offline') || err?.message?.includes('client is offline')) {
        console.warn('Firestore connection currently offline or unavailable. Retrying on reconnection.');
      } else {
        console.error('Error fetching user data from Firestore:', err);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserAccount(null);
        setPlayerProfile(null);
        setRecruiterProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [devRoleOverride]);

  const reloadUserAccount = async () => {
    if (currentUser) {
      await fetchUserData(currentUser.uid);
    }
  };

  // Explicitly set/update role for an authenticated user
  const setUserRole = async (role: UserRole) => {
    if (!currentUser) return;
    setError(null);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updatedAccount: Partial<UserAccount> = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        fullName: userAccount?.fullName || currentUser.displayName || 'SoccerBridge Member',
        role,
        emailVerified: currentUser.emailVerified,
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, updatedAccount, { merge: true });

      // Create skeleton profile if not already present
      if (role === 'player') {
        await setDoc(
          doc(db, 'playerProfiles', currentUser.uid),
          {
            uid: currentUser.uid,
            role: 'player',
            fullName: updatedAccount.fullName,
            email: updatedAccount.email,
            membership: userAccount?.membership || 'FREE',
            onboardingCompleted: userAccount?.onboardingCompleted || false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await setDoc(
          doc(db, 'recruiterProfiles', currentUser.uid),
          {
            uid: currentUser.uid,
            role,
            fullName: updatedAccount.fullName,
            email: updatedAccount.email,
            membership: userAccount?.membership || 'FREE',
            verificationStatus: 'pending',
            onboardingCompleted: userAccount?.onboardingCompleted || false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      await fetchUserData(currentUser.uid, role);
    } catch (err: any) {
      console.error('Error setting user role:', err);
      setError(getFirebaseErrorMessage(err?.code || err?.message || '', language));
      throw err;
    }
  };

  // Sign Up
  const signUpWithEmail = async (email: string, pass: string, fullName: string, role: UserRole) => {
    setError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanFullName = fullName.trim();

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const user = userCredential.user;

      // Base user record
      const newUserAccount: UserAccount = {
        uid: user.uid,
        fullName: cleanFullName,
        email: cleanEmail,
        role: role,
        emailVerified: user.emailVerified,
        onboardingCompleted: false,
        membership: 'FREE',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        photoURL: user.photoURL || undefined,
      };

      // 1. Guarantee user document creation in Firestore FIRST
      await setDoc(doc(db, 'users', user.uid), newUserAccount, { merge: true });

      // 2. Guarantee skeleton profile document creation
      if (role === 'player') {
        await setDoc(
          doc(db, 'playerProfiles', user.uid),
          {
            uid: user.uid,
            role: 'player',
            fullName: cleanFullName,
            email: cleanEmail,
            membership: 'FREE',
            profileCompletion: 0,
            onboardingCompleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await setDoc(
          doc(db, 'recruiterProfiles', user.uid),
          {
            uid: user.uid,
            role: role,
            fullName: cleanFullName,
            email: cleanEmail,
            membership: 'FREE',
            verificationStatus: 'pending',
            onboardingCompleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // 3. Send verification email without blocking registration flow
      try {
        await sendEmailVerification(user);
      } catch (verifyErr) {
        console.warn('Verification email notice (non-fatal):', verifyErr);
      }

      // 4. Update memory state
      setUserAccount(newUserAccount);
      await fetchUserData(user.uid, role);
    } catch (err: any) {
      console.error('Registration failed:', err);
      const friendlyMessage = getFirebaseErrorMessage(err?.code || err?.message || '', language);
      setError(friendlyMessage);
      throw err;
    }
  };

  // Sign In
  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
      if (res.user) {
        await fetchUserData(res.user.uid);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      const friendlyMessage = getFirebaseErrorMessage(err?.code || err?.message || '', language);
      setError(friendlyMessage);
      throw err;
    }
  };

  // Google Sign In
  const signInWithGoogle = async (defaultRole: UserRole = 'player') => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        const newUserAccount: UserAccount = {
          uid: user.uid,
          fullName: user.displayName || 'SoccerBridge Member',
          email: user.email || '',
          role: defaultRole,
          emailVerified: user.emailVerified,
          onboardingCompleted: false,
          membership: 'FREE',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          photoURL: user.photoURL || undefined,
        };
        await setDoc(userDocRef, newUserAccount, { merge: true });

        if (defaultRole === 'player') {
          await setDoc(
            doc(db, 'playerProfiles', user.uid),
            {
              uid: user.uid,
              role: 'player',
              fullName: newUserAccount.fullName,
              email: newUserAccount.email,
              membership: 'FREE',
              profileCompletion: 0,
              onboardingCompleted: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          await setDoc(
            doc(db, 'recruiterProfiles', user.uid),
            {
              uid: user.uid,
              role: defaultRole,
              fullName: newUserAccount.fullName,
              email: newUserAccount.email,
              membership: 'FREE',
              verificationStatus: 'pending',
              onboardingCompleted: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      await fetchUserData(user.uid, defaultRole);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        console.error('Google Sign In failed:', err);
        setError(getFirebaseErrorMessage(err?.code || err?.message || '', language));
      }
    }
  };

  // Sign Out
  const signOutUser = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setUserAccount(null);
    setPlayerProfile(null);
    setRecruiterProfile(null);
    setDevRoleOverride(null);
  };

  // Password Reset
  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    } catch (err: any) {
      console.error('Password reset failed:', err);
      const friendlyMessage = getFirebaseErrorMessage(err?.code || err?.message || '', language);
      setError(friendlyMessage);
      throw err;
    }
  };

  // Resend Email Verification
  const resendVerificationEmail = async () => {
    if (currentUser) {
      try {
        await sendEmailVerification(currentUser);
      } catch (err: any) {
        console.warn('Resend verification failed:', err);
        setError(getFirebaseErrorMessage(err?.code || err?.message || '', language));
      }
    }
  };

  // Save/Update Player Profile
  const savePlayerProfile = async (data: Partial<PlayerProfile>) => {
    if (!currentUser) return;
    try {
      const ref = doc(db, 'playerProfiles', currentUser.uid);
      const updatePayload = sanitizeFirestorePayload({
        ...data,
        uid: currentUser.uid,
        role: 'player',
        updatedAt: serverTimestamp(),
      });
      await setDoc(ref, updatePayload, { merge: true });

      // Update onboarding status in user document with setDoc merge
      const userUpdates: Record<string, any> = {
        uid: currentUser.uid,
        email: currentUser.email || userAccount?.email || '',
        fullName: data.fullName || userAccount?.fullName || currentUser.displayName || 'SoccerBridge Player',
        role: 'player',
        membership: userAccount?.membership || 'FREE',
        emailVerified: Boolean(currentUser.emailVerified),
        updatedAt: serverTimestamp(),
      };

      if (!userAccount?.createdAt) {
        userUpdates.createdAt = serverTimestamp();
      }

      if (data.onboardingCompleted !== undefined) {
        userUpdates.onboardingCompleted = data.onboardingCompleted;
      }
      if (data.fullName) {
        userUpdates.fullName = data.fullName;
      }
      if (data.profilePhotoUrl) {
        userUpdates.photoURL = data.profilePhotoUrl;
      }

      await setDoc(doc(db, 'users', currentUser.uid), userUpdates, { merge: true });
      await fetchUserData(currentUser.uid, 'player');
    } catch (err: any) {
      console.error('Error saving player profile:', err);
      const friendlyMessage = getFirebaseErrorMessage(err?.code || err?.message || '', language);
      setError(friendlyMessage);
      throw err;
    }
  };

  // Save/Update Recruiter Profile
  const saveRecruiterProfile = async (data: Partial<RecruiterProfile>) => {
    if (!currentUser) return;
    try {
      const activeRole = (data.role || userAccount?.role || 'recruiter') as 'recruiter' | 'club';
      const ref = doc(db, 'recruiterProfiles', currentUser.uid);
      const updatePayload = sanitizeFirestorePayload({
        ...data,
        uid: currentUser.uid,
        role: activeRole,
        updatedAt: serverTimestamp(),
      });
      await setDoc(ref, updatePayload, { merge: true });

      // Update onboarding status in user document with setDoc merge
      const userUpdates: Record<string, any> = {
        uid: currentUser.uid,
        email: currentUser.email || userAccount?.email || '',
        fullName: data.fullName || userAccount?.fullName || currentUser.displayName || 'SoccerBridge Member',
        role: activeRole,
        membership: userAccount?.membership || 'FREE',
        emailVerified: Boolean(currentUser.emailVerified),
        updatedAt: serverTimestamp(),
      };

      if (!userAccount?.createdAt) {
        userUpdates.createdAt = serverTimestamp();
      }

      if (data.onboardingCompleted !== undefined) {
        userUpdates.onboardingCompleted = data.onboardingCompleted;
      }
      if (data.fullName) {
        userUpdates.fullName = data.fullName;
      }

      await setDoc(doc(db, 'users', currentUser.uid), userUpdates, { merge: true });
      await fetchUserData(currentUser.uid, activeRole);
    } catch (err: any) {
      console.error('Error saving recruiter profile:', err);
      const friendlyMessage = getFirebaseErrorMessage(err?.code || err?.message || '', language);
      setError(friendlyMessage);
      throw err;
    }
  };

  // Upgrade Membership
  const upgradeToProMembership = async () => {
    if (!currentUser) return;
    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          membership: 'PRO',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (userAccount?.role === 'player') {
        const pRef = doc(db, 'playerProfiles', currentUser.uid);
        await setDoc(pRef, { membership: 'PRO', updatedAt: serverTimestamp() }, { merge: true });
      } else if (userAccount?.role === 'recruiter' || userAccount?.role === 'club') {
        const rRef = doc(db, 'recruiterProfiles', currentUser.uid);
        await setDoc(rRef, { membership: 'PRO', updatedAt: serverTimestamp() }, { merge: true });
      }

      await fetchUserData(currentUser.uid);
    } catch (err: any) {
      console.error('Error upgrading to PRO:', err);
      const friendlyMessage = getFirebaseErrorMessage(err?.code || err?.message || '', language);
      setError(friendlyMessage);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userAccount,
        playerProfile,
        recruiterProfile,
        loading,
        error,
        clearError,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signOutUser,
        resetPassword,
        resendVerificationEmail,
        reloadUserAccount,
        setUserRole,
        savePlayerProfile,
        saveRecruiterProfile,
        upgradeToProMembership,
        setDevRoleOverride,
        devRoleOverride,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
