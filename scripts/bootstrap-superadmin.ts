/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SoccerBridge — Secure First Superadmin Bootstrapping Script
 * 
 * Usage:
 *   npx tsx scripts/bootstrap-superadmin.ts --email=eloge.kanika10@gmail.com
 *   OR
 *   npx tsx scripts/bootstrap-superadmin.ts --uid=<FIREBASE_AUTH_UID>
 * 
 * What this script does:
 * 1. Initializes Firebase Admin SDK with project `soccerbridge` and named database `ai-studio-39df9771-15ed-4a07-8424-f739e09696b2`.
 * 2. Fetches the Firebase Auth user by email or UID.
 * 3. Assigns trusted custom claims: { admin: true, adminRole: "superadmin" }.
 * 4. Merges/creates document `admins/{uid}` with role="superadmin", active=true, timestamps.
 * 5. Appends an immutable audit log in `adminAuditLogs`.
 * 6. Instructs the user on how to force a token refresh on the client (sign out and back in or getIdToken(true)).
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import * as fs from 'fs';
import configData from '../firebase-applet-config.json' with { type: 'json' };

async function bootstrapSuperadmin() {
  const args = process.argv.slice(2);
  let targetEmail = '';
  let targetUid = '';
  let keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

  for (const arg of args) {
    if (arg.startsWith('--email=')) {
      targetEmail = arg.replace('--email=', '').trim();
    } else if (arg.startsWith('--uid=')) {
      targetUid = arg.replace('--uid=', '').trim();
    } else if (arg.startsWith('--key=')) {
      keyPath = arg.replace('--key=', '').trim();
    }
  }

  if (!targetEmail && !targetUid) {
    console.error(`\n❌ Error: Missing required arguments.\n`);
    console.log(`Usage:`);
    console.log(`  npx tsx scripts/bootstrap-superadmin.ts --email=eloge.kanika10@gmail.com`);
    console.log(`  npx tsx scripts/bootstrap-superadmin.ts --uid=<FIREBASE_AUTH_UID>\n`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`🔐 SOCCERBRIDGE — FIRST SUPERADMIN BOOTSTRAP UTILITY`);
  console.log(`======================================================`);
  console.log(`Project ID: ${configData.projectId}`);
  console.log(`Firestore Database ID: ${configData.firestoreDatabaseId}`);

  // Initialize Firebase Admin SDK
  if (getApps().length === 0) {
    if (keyPath && fs.existsSync(keyPath)) {
      console.log(`🔑 Using service account key from: ${keyPath}`);
      initializeApp({
        credential: cert(keyPath),
        projectId: configData.projectId,
      });
    } else {
      initializeApp({
        projectId: configData.projectId,
      });
    }
  }

  const auth = getAuth();
  const db = getFirestore(configData.firestoreDatabaseId);

  // 1. Locate the Firebase Auth User
  let authUser: UserRecord;
  try {
    if (targetUid) {
      console.log(`🔍 Looking up Auth user by UID: ${targetUid}...`);
      authUser = await auth.getUser(targetUid);
    } else {
      console.log(`🔍 Looking up Auth user by email: ${targetEmail}...`);
      authUser = await auth.getUserByEmail(targetEmail);
    }
  } catch (err: any) {
    console.error(`\n❌ Failed to find Firebase Auth user:`, err.message || err);
    console.error(`\nEnsure the user account has already registered or signed in at https://soccerbridge.org before running this bootstrap.\n`);
    process.exit(1);
  }

  console.log(`✅ Found Auth User:`);
  console.log(`   - UID:   ${authUser.uid}`);
  console.log(`   - Email: ${authUser.email}`);
  console.log(`   - Display Name: ${authUser.displayName || '(none)'}`);

  // 2. Set Trusted Custom Claims
  const claims = {
    admin: true,
    adminRole: 'superadmin',
  };

  console.log(`\n🔒 Setting custom claims on Firebase Auth token:`, JSON.stringify(claims, null, 2));
  await auth.setCustomUserClaims(authUser.uid, claims);
  console.log(`✅ Custom claims successfully written to Auth record.`);

  // 3. Create or Merge document in `admins/{uid}`
  console.log(`\n📝 Writing superadmin document in collection 'admins/${authUser.uid}'...`);
  const adminDocRef = db.collection('admins').doc(authUser.uid);
  const adminDocSnap = await adminDocRef.get();

  const now = FieldValue.serverTimestamp();
  const adminDocData = {
    uid: authUser.uid,
    email: authUser.email || '',
    role: 'superadmin',
    active: true,
    fullName: authUser.displayName || 'Super Administrator',
    createdAt: adminDocSnap.exists ? (adminDocSnap.data()?.createdAt || now) : now,
    updatedAt: now,
  };

  await adminDocRef.set(adminDocData, { merge: true });
  console.log(`✅ 'admins/${authUser.uid}' document successfully saved.`);

  // 4. Write immutable audit log
  const auditId = `audit_bootstrap_${Date.now()}`;
  console.log(`\n📜 Writing audit trail entry: adminAuditLogs/${auditId}...`);
  const auditDocRef = db.collection('adminAuditLogs').doc(auditId);
  await auditDocRef.set({
    id: auditId,
    adminUid: 'system_bootstrap',
    adminEmail: 'bootstrap_cli_utility',
    adminRole: 'superadmin',
    action: 'bootstrap_superadmin',
    targetType: 'admin',
    targetId: authUser.uid,
    targetName: authUser.email || authUser.uid,
    newValue: {
      role: 'superadmin',
      active: true,
      claims,
    },
    reason: 'One-time initial superadmin account bootstrapping via trusted CLI utility',
    timestamp: now,
  });
  console.log(`✅ Audit log successfully written.`);

  console.log(`\n======================================================`);
  console.log(`🎉 SUPERADMIN BOOTSTRAP COMPLETED SUCCESSFULLY!`);
  console.log(`======================================================`);
  console.log(`User: ${authUser.email} (${authUser.uid}) is now active SUPERADMIN.`);
  console.log(`\nIMPORTANT — CLIENT TOKEN REFRESH:`);
  console.log(`Because Firebase Auth tokens are cached in the browser for up to 1 hour,`);
  console.log(`the user must refresh their token to receive the new custom claims.`);
  console.log(`Option A: Sign out of SoccerBridge and sign back in.`);
  console.log(`Option B: In browser console: await firebase.auth().currentUser.getIdToken(true);`);
  console.log(`Option C: The application automatically refreshes claims on the /admin portal entry.\n`);
}

bootstrapSuperadmin().catch((e) => {
  console.error('\n❌ Bootstrap error:', e);
  process.exit(1);
});
