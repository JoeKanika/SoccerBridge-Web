/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SoccerBridge — Admin Staff CLI Management Utility
 * 
 * Usage:
 *   Grant/Update Role:
 *     npx tsx scripts/manage-admin-staff.ts --action=grant --email=staff@soccerbridge.org --role=moderator
 * 
 *   Revoke Admin Access:
 *     npx tsx scripts/manage-admin-staff.ts --action=revoke --email=staff@soccerbridge.org --reason="Contract ended"
 * 
 *   List All Admins:
 *     npx tsx scripts/manage-admin-staff.ts --action=list
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import * as fs from 'fs';
import configData from '../firebase-applet-config.json' with { type: 'json' };

async function manageAdminStaff() {
  const args = process.argv.slice(2);
  let action = 'list';
  let email = '';
  let uid = '';
  let role: 'superadmin' | 'moderator' | 'verifier' | 'support' | 'analyst' = 'moderator';
  let reason = 'Staff role updated via CLI';
  let keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

  for (const arg of args) {
    if (arg.startsWith('--action=')) action = arg.replace('--action=', '').trim();
    if (arg.startsWith('--email=')) email = arg.replace('--email=', '').trim();
    if (arg.startsWith('--uid=')) uid = arg.replace('--uid=', '').trim();
    if (arg.startsWith('--role=')) role = arg.replace('--role=', '').trim() as any;
    if (arg.startsWith('--reason=')) reason = arg.replace('--reason=', '').trim();
    if (arg.startsWith('--key=')) keyPath = arg.replace('--key=', '').trim();
  }

  if (getApps().length === 0) {
    if (keyPath && fs.existsSync(keyPath)) {
      initializeApp({ credential: cert(keyPath), projectId: configData.projectId });
    } else {
      initializeApp({ projectId: configData.projectId });
    }
  }

  const auth = getAuth();
  const db = getFirestore(configData.firestoreDatabaseId);

  if (action === 'list') {
    console.log(`\n📋 Listing all SoccerBridge Admin Staff in 'admins' collection...\n`);
    const snap = await db.collection('admins').get();
    if (snap.empty) {
      console.log(`No admin staff members found.`);
      return;
    }

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      console.log(`- [${d.active ? 'ACTIVE' : 'DEACTIVATED'}] ${d.email} (${d.uid}) -> Role: ${d.role.toUpperCase()}`);
    });
    console.log(``);
    return;
  }

  if (!email && !uid) {
    console.error(`\n❌ Error: --email or --uid is required for action '${action}'.\n`);
    process.exit(1);
  }

  // Look up user
  let authUser: UserRecord;
  try {
    authUser = uid ? await auth.getUser(uid) : await auth.getUserByEmail(email);
  } catch (err: any) {
    console.error(`\n❌ User not found in Firebase Auth:`, err.message || err);
    process.exit(1);
  }

  const now = FieldValue.serverTimestamp();

  if (action === 'grant') {
    console.log(`\nGranting ${role.toUpperCase()} to ${authUser.email}...`);
    // Custom claims
    await auth.setCustomUserClaims(authUser.uid, {
      admin: true,
      adminRole: role,
    });

    // Firestore record
    await db.collection('admins').doc(authUser.uid).set(
      {
        uid: authUser.uid,
        email: authUser.email || '',
        role,
        active: true,
        fullName: authUser.displayName || 'SoccerBridge Staff',
        updatedAt: now,
      },
      { merge: true }
    );

    // Audit log
    const auditId = `audit_grant_${Date.now()}`;
    await db.collection('adminAuditLogs').doc(auditId).set({
      id: auditId,
      adminUid: 'cli_admin',
      adminEmail: 'cli_admin_staff_tool',
      adminRole: 'superadmin',
      action: 'grant_admin_role',
      targetType: 'admin',
      targetId: authUser.uid,
      targetName: authUser.email || authUser.uid,
      newValue: { role, active: true },
      reason,
      timestamp: now,
    });

    console.log(`✅ Successfully assigned ${role.toUpperCase()} to ${authUser.email}.`);
  } else if (action === 'revoke') {
    console.log(`\nRevoking admin access from ${authUser.email}...`);
    // Clear custom claims
    await auth.setCustomUserClaims(authUser.uid, {
      admin: false,
      adminRole: null,
    });

    // Mark inactive in Firestore
    await db.collection('admins').doc(authUser.uid).set(
      {
        active: false,
        updatedAt: now,
      },
      { merge: true }
    );

    // Audit log
    const auditId = `audit_revoke_${Date.now()}`;
    await db.collection('adminAuditLogs').doc(auditId).set({
      id: auditId,
      adminUid: 'cli_admin',
      adminEmail: 'cli_admin_staff_tool',
      adminRole: 'superadmin',
      action: 'revoke_admin_role',
      targetType: 'admin',
      targetId: authUser.uid,
      targetName: authUser.email || authUser.uid,
      newValue: { active: false, role: null },
      reason,
      timestamp: now,
    });

    console.log(`✅ Successfully revoked admin privileges from ${authUser.email}.`);
  }
}

manageAdminStaff().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
