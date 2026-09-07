/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import {
  Globe,
  Bell,
  Shield,
  Download,
  Trash2,
  Lock,
  UserX,
  FileText,
  Sparkles,
  Check,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Info,
  Sun,
  Moon,
} from 'lucide-react';
import { LegalModal } from './LegalModal';
import { telemetry } from '../services/telemetryService';

interface BlockedRecord {
  id: string;
  blockedId: string;
  blockedName?: string;
  blockedRole?: string;
  createdAt: string;
}

export const SettingsView: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { currentUser, userAccount, playerProfile, recruiterProfile, signOutUser } = useAuth();

  // Settings State
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'recruitersOnly' | 'private'>(
    playerProfile?.privacy?.profileVisibility || 'public'
  );
  const [allowSearchDiscovery, setAllowSearchDiscovery] = useState<boolean>(true);
  const [guardianContactPrivate, setGuardianContactPrivate] = useState<boolean>(true);

  // Notification Preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [trialNotifs, setTrialNotifs] = useState(true);
  const [messageNotifs, setMessageNotifs] = useState(true);
  const [recommendationNotifs, setRecommendationNotifs] = useState(true);

  // Blocked Users
  const [blockedList, setBlockedList] = useState<BlockedRecord[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // Modal & Action states
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy'>('terms');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Status feedback
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Load Blocked Users
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchBlocked = async () => {
      setLoadingBlocked(true);
      try {
        const q = query(collection(db, 'blockedUsers'), where('blockerId', '==', currentUser.uid));
        const snap = await getDocs(q);
        const list: BlockedRecord[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            blockedId: data.blockedId || '',
            blockedName: data.blockedName || data.blockedId || 'Blocked User',
            blockedRole: data.blockedRole || 'User',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });
        setBlockedList(list);
      } catch (err) {
        telemetry.reportError(err as Error, { context: 'fetchBlockedUsers' });
      } finally {
        setLoadingBlocked(false);
      }
    };

    fetchBlocked();
  }, [currentUser?.uid]);

  // Handle Save Settings
  const handleSaveSettings = async () => {
    if (!currentUser?.uid) return;
    setSaveStatus(null);

    try {
      // Save User Settings subdocument
      await setDoc(
        doc(db, 'users', currentUser.uid, 'settings', 'general'),
        {
          language,
          emailNotifs,
          trialNotifs,
          messageNotifs,
          recommendationNotifs,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // If player, update player profile privacy
      if (userAccount?.role === 'player') {
        await setDoc(
          doc(db, 'playerProfiles', currentUser.uid),
          {
            privacy: {
              profileVisibility,
              allowSearchDiscovery,
              guardianContactPrivate,
            },
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      telemetry.trackEvent('save_settings', 'Settings', currentUser.uid);
      setSaveStatus(t('preferencesSaved') || 'Settings saved successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      telemetry.reportError(err as Error, { context: 'saveSettings' });
      setSaveStatus('Failed to save settings. Please try again.');
    }
  };

  // Unblock user
  const handleUnblock = async (recordId: string) => {
    try {
      await deleteDoc(doc(db, 'blockedUsers', recordId));
      setBlockedList((prev) => prev.filter((item) => item.id !== recordId));
      telemetry.trackEvent('unblock_user', 'Settings', currentUser?.uid, { recordId });
    } catch (err) {
      telemetry.reportError(err as Error, { context: 'unblockUser' });
    }
  };

  // Download My Data (GDPR / PIPEDA compliance export)
  const handleDownloadMyData = async () => {
    if (!currentUser?.uid) return;
    setIsExporting(true);

    try {
      telemetry.trackEvent('export_data_requested', 'Privacy', currentUser.uid);

      const exportData: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        userAccount,
        playerProfile: playerProfile || null,
        recruiterProfile: recruiterProfile || null,
        notifications: [],
        savedItems: [],
        applications: [],
      };

      // Fetch user notifications
      const notifQ = query(
        collection(db, 'notifications'),
        where('recipientId', '==', currentUser.uid)
      );
      const notifSnap = await getDocs(notifQ);
      notifSnap.forEach((d) => exportData.notifications.push(d.data()));

      // Fetch saved items
      const saveQ = query(
        collection(db, 'savedItems'),
        where('userId', '==', currentUser.uid)
      );
      const saveSnap = await getDocs(saveQ);
      saveSnap.forEach((d) => exportData.savedItems.push(d.data()));

      // Fetch applications
      const appQ = query(
        collection(db, 'playerApplications'),
        where('playerId', '==', currentUser.uid)
      );
      const appSnap = await getDocs(appQ);
      appSnap.forEach((d) => exportData.applications.push(d.data()));

      // Trigger File Download
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `SoccerBridge_Data_Export_${currentUser.uid}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      telemetry.trackEvent('export_data_completed', 'Privacy', currentUser.uid);
    } catch (err) {
      telemetry.reportError(err as Error, { context: 'downloadMyData' });
      alert('Error exporting data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Delete Account (Cascading Cleanup)
  const handleDeleteAccount = async () => {
    if (!currentUser?.uid || deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);

    try {
      const uid = currentUser.uid;
      telemetry.trackEvent('account_deletion_initiated', 'Account', uid);

      // Clean up Firestore documents
      await deleteDoc(doc(db, 'users', uid));
      if (userAccount?.role === 'player') {
        await deleteDoc(doc(db, 'playerProfiles', uid));
      } else if (userAccount?.role === 'recruiter' || userAccount?.role === 'club') {
        await deleteDoc(doc(db, 'recruiterProfiles', uid));
      }

      // Delete Firebase Auth User
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }

      signOutUser();
    } catch (err: any) {
      telemetry.reportError(err, { context: 'deleteAccount' });
      alert(
        err?.message ||
          'Failed to delete account. For security, you may need to log out and log back in before deleting your account.'
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-slate-100 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Lock className="w-7 h-7 text-blue-500" />
            <span>{t('settingsTitle') || 'App Settings & Privacy'}</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {t('settingsSubtitle') || 'Manage language, notifications, profile discoverability, and data privacy.'}
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all uppercase tracking-wider"
        >
          <Check className="w-4 h-4" />
          <span>{t('save') || 'Save Changes'}</span>
        </button>
      </div>

      {saveStatus && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* 1. Language & Regional Settings */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>{t('language') || 'Language & Regional'}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setLanguage('en')}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                language === 'en'
                  ? 'bg-blue-950/60 border-blue-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-white">English (Canada)</p>
                <p className="text-[10px] text-slate-400">Default primary language</p>
              </div>
              {language === 'en' && <Check className="w-4 h-4 text-blue-400" />}
            </button>

            <button
              onClick={() => setLanguage('fr')}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                language === 'fr'
                  ? 'bg-blue-950/60 border-blue-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-white">Français (Canada)</p>
                <p className="text-[10px] text-slate-400">Option bilingue officielle</p>
              </div>
              {language === 'fr' && <Check className="w-4 h-4 text-blue-400" />}
            </button>
          </div>
        </section>

        {/* 2. Notification Preferences */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>{t('notificationSettings') || 'Notification Preferences'}</span>
          </h2>

          <div className="space-y-4 text-xs">
            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800/80 cursor-pointer">
              <div>
                <p className="font-bold text-white">Email Digest & Alerts</p>
                <p className="text-[10px] text-slate-400">Receive trial invites and direct recruiter messages by email</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800/80 cursor-pointer">
              <div>
                <p className="font-bold text-white">Trial Invitation Realtime Alerts</p>
                <p className="text-[10px] text-slate-400">Instant notification when a club or agent invites you to a trial</p>
              </div>
              <input
                type="checkbox"
                checked={trialNotifs}
                onChange={(e) => setTrialNotifs(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800/80 cursor-pointer">
              <div>
                <p className="font-bold text-white">Direct Messaging Notifications</p>
                <p className="text-[10px] text-slate-400">In-app notifications when new chat messages arrive</p>
              </div>
              <input
                type="checkbox"
                checked={messageNotifs}
                onChange={(e) => setMessageNotifs(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800/80 cursor-pointer">
              <div>
                <p className="font-bold text-white">Smart Match Recommendations</p>
                <p className="text-[10px] text-slate-400">Notifications when high-compatibility opportunities appear</p>
              </div>
              <input
                type="checkbox"
                checked={recommendationNotifs}
                onChange={(e) => setRecommendationNotifs(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </label>
          </div>
        </section>

        {/* 3. Privacy & Profile Discoverability */}
        {userAccount?.role === 'player' && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Profile Privacy & Discoverability</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-2">Profile Visibility Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setProfileVisibility('public')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      profileVisibility === 'public'
                        ? 'bg-emerald-950/60 border-emerald-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Public (All Users)
                  </button>
                  <button
                    onClick={() => setProfileVisibility('recruitersOnly')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      profileVisibility === 'recruitersOnly'
                        ? 'bg-blue-950/60 border-blue-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Recruiters Only
                  </button>
                  <button
                    onClick={() => setProfileVisibility('private')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      profileVisibility === 'private'
                        ? 'bg-rose-950/60 border-rose-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Private (Only Me)
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800/80 cursor-pointer">
                <div>
                  <p className="font-bold text-white">Recruiter Search Discoverability</p>
                  <p className="text-[10px] text-slate-400">Allow your profile to appear in recruiter search filters & pipelines</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowSearchDiscovery}
                  onChange={(e) => setAllowSearchDiscovery(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800/80 cursor-pointer">
                <div>
                  <p className="font-bold text-white">Keep Guardian Information Private (Minors)</p>
                  <p className="text-[10px] text-slate-400">Parent/Guardian contact details are strictly hidden on public profile</p>
                </div>
                <input
                  type="checkbox"
                  checked={guardianContactPrivate}
                  onChange={(e) => setGuardianContactPrivate(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>
            </div>
          </section>
        )}

        {/* 4. Blocked Users Manager */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <UserX className="w-4 h-4 text-rose-400" />
            <span>{t('blockedUsers') || 'Blocked Accounts'}</span>
          </h2>

          {loadingBlocked ? (
            <p className="text-xs text-slate-500">Loading blocked list...</p>
          ) : blockedList.length === 0 ? (
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/60 text-xs text-slate-500">
              {t('blockedUsersEmpty') || 'You have not blocked any accounts.'}
            </div>
          ) : (
            <div className="space-y-2">
              {blockedList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{item.blockedName}</p>
                    <p className="text-[10px] text-slate-500">Blocked on {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>

                  <button
                    onClick={() => handleUnblock(item.id)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[11px] transition-all"
                  >
                    {t('unblock') || 'Unblock'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. Data Privacy & Export (PIPEDA / GDPR) */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-400" />
            <span>{t('downloadData') || 'Download My Personal Data'}</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            {t('downloadDataDesc') || 'Export a full copy of your profile, messages, applications, and settings in JSON format.'}
          </p>

          <button
            onClick={handleDownloadMyData}
            disabled={isExporting}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>{isExporting ? 'Exporting...' : 'Generate & Download My Data (.json)'}</span>
          </button>
        </section>

        {/* 6. Legal & Terms */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Legal & App Information</span>
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              onClick={() => {
                setLegalModalType('terms');
                setLegalModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            >
              Terms of Service
            </button>

            <button
              onClick={() => {
                setLegalModalType('privacy');
                setLegalModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            >
              Privacy Policy
            </button>

            <div className="text-slate-500 text-[11px] ml-auto">
              SoccerBridge v1.0.0-production (Canadian Recruiting Engine)
            </div>
          </div>
        </section>

        {/* 7. Account Deletion Danger Zone */}
        <section className="bg-rose-950/20 border border-rose-900/40 rounded-3xl p-6">
          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{t('deleteAccount') || 'Delete Account & Erase Profile'}</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            {t('deleteAccountWarning') ||
              'Permanently remove your profile, highlight videos, messages, and applications. This action is irreversible.'}
          </p>

          <button
            onClick={() => setDeleteModalOpen(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete My Account</span>
          </button>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-rose-900/60 rounded-3xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Confirm Account Deletion</h3>
            <p className="text-xs text-slate-400 mb-4">
              Type <span className="font-mono text-rose-400 font-bold">DELETE</span> below to confirm permanent erasure of your account and data.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white mb-6 focus:outline-none focus:border-rose-500 font-mono"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        type={legalModalType}
      />
    </div>
  );
};
