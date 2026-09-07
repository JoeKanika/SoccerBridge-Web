/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AdminRole, AdminPermission, ADMIN_ROLE_PERMISSIONS } from '../types/admin';

interface AdminAuthContextType {
  isAdmin: boolean;
  adminRole: AdminRole | null;
  mfaEnrolled: boolean;
  adminLoading: boolean;
  hasPermission: (permission: AdminPermission) => boolean;
  refreshAdminStatus: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const VALID_ADMIN_ROLES: AdminRole[] = ['superadmin', 'moderator', 'verifier', 'support', 'analyst'];

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [mfaEnrolled, setMfaEnrolled] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState<boolean>(true);

  const checkAdminClaims = async () => {
    if (!currentUser) {
      setIsAdmin(false);
      setAdminRole(null);
      setMfaEnrolled(false);
      setAdminLoading(false);
      return;
    }

    setAdminLoading(true);

    try {
      // 1. Inspect Firebase Auth ID Token for trusted Custom Claims (force refresh to ensure latest claims)
      const idTokenResult = await currentUser.getIdTokenResult(true);
      const claims = idTokenResult.claims;

      // STRICT SECURITY RULE: User MUST possess the trusted Firebase Auth custom claim `admin === true`
      const hasAdminClaim = claims.admin === true;
      const claimRole = claims.adminRole as string;
      const isValidRole = typeof claimRole === 'string' && (VALID_ADMIN_ROLES as string[]).includes(claimRole);

      if (!hasAdminClaim || !isValidRole) {
        // Access Denied: User has no valid admin custom claims
        setIsAdmin(false);
        setAdminRole(null);
        setMfaEnrolled(false);
        return;
      }

      // 2. Verified admin claims exist. Check admins/{uid} document for active status flag
      let isActiveAdmin = true;
      try {
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        const adminDocSnap = await getDoc(adminDocRef);
        if (adminDocSnap.exists()) {
          const data = adminDocSnap.data();
          if (data.active === false) {
            isActiveAdmin = false;
          }
        }
      } catch (e) {
        // Document fetch error or restrictive rule; custom claim remains primary authority
      }

      if (!isActiveAdmin) {
        setIsAdmin(false);
        setAdminRole(null);
        setMfaEnrolled(false);
        return;
      }

      // Grant access based purely on verified Firebase Auth custom claims
      setIsAdmin(true);
      setAdminRole(claimRole as AdminRole);
      setMfaEnrolled(Boolean(claims.mfaEnrolled || currentUser.multiFactor?.enrolledFactors?.length));
    } catch (error) {
      console.error('Error verifying admin authorization claims:', error);
      setIsAdmin(false);
      setAdminRole(null);
      setMfaEnrolled(false);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    checkAdminClaims();
  }, [currentUser]);

  const hasPermission = (permission: AdminPermission): boolean => {
    if (!isAdmin || !adminRole) return false;
    const permissions = ADMIN_ROLE_PERMISSIONS[adminRole] || [];
    return permissions.includes(permission);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAdmin,
        adminRole,
        mfaEnrolled,
        adminLoading,
        hasPermission,
        refreshAdminStatus: checkAdminClaims,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
