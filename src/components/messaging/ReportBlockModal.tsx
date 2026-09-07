import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, UserX, Check, Lock } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { blockUser, submitUserReport } from '../../services/collaborationService';
import { ReportReason } from '../../types';

interface ReportBlockModalProps {
  targetUserId: string;
  targetUserName: string;
  isOpen: boolean;
  onClose: () => void;
  onUserBlocked?: () => void;
}

export const ReportBlockModal: React.FC<ReportBlockModalProps> = ({
  targetUserId,
  targetUserName,
  isOpen,
  onClose,
  onUserBlocked,
}) => {
  const { t } = useLanguage();
  const { userAccount } = useAuth();

  const [activeTab, setActiveTab] = useState<'block' | 'report'>('report');
  const [reason, setReason] = useState<ReportReason>('Spam');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAccount?.uid) return;

    setLoading(true);
    try {
      await submitUserReport({
        reporterId: userAccount.uid,
        reporterName: userAccount.fullName,
        reportedId: targetUserId,
        reportedName: targetUserName,
        reason,
        details,
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockConfirm = async () => {
    if (!userAccount?.uid) return;

    setLoading(true);
    try {
      await blockUser(userAccount.uid, targetUserId, targetUserName);
      setSubmitted(true);
      if (onUserBlocked) onUserBlocked();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error blocking user:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0A0E17] border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header Tabs */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'report'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('reportUser')}
            </button>
            <button
              onClick={() => setActiveTab('block')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'block'
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('blockUser')}
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            {t('close')}
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-white">
                {activeTab === 'report' ? t('reportSubmitted') : `User ${targetUserName} Blocked`}
              </p>
            </div>
          ) : activeTab === 'report' ? (
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Report {targetUserName} for Community Violation</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Spam">Spam</option>
                  <option value="Fake recruiter">Fake Recruiter / Unverified Agent</option>
                  <option value="Fake player">Fake Player Profile</option>
                  <option value="Harassment">Harassment / Unwanted Behavior</option>
                  <option value="Inappropriate content">Inappropriate Content / Media</option>
                  <option value="Scam">Financial Scam / Suspicious Request</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Details & Evidence</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide additional context to help our moderation team review..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-2xl"
              >
                Submit Report to Safeguarding Team
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
                <UserX className="w-6 h-6" />
              </div>

              <h4 className="font-extrabold text-sm text-white">Block {targetUserName}?</h4>

              <p className="text-xs text-slate-400 leading-relaxed">
                {t('blockUserConfirm')}
              </p>

              <button
                type="button"
                onClick={handleBlockConfirm}
                disabled={loading}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-600/20"
              >
                Confirm Block User
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
