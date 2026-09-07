import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { UserRole } from '../types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Wrench, User, Briefcase, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';

interface AdminDevBarProps {
  onOpenAdmin?: () => void;
}

export const AdminDevBar: React.FC<AdminDevBarProps> = ({ onOpenAdmin }) => {
  const {
    currentUser,
    userAccount,
    recruiterProfile,
    saveRecruiterProfile,
    upgradeToProMembership,
    setDevRoleOverride,
    devRoleOverride,
  } = useAuth();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(true);

  // Render Dev Sandbox ONLY during local development, NEVER in production builds
  if (!import.meta.env.DEV || !currentUser) return null;

  const currentRole = devRoleOverride || userAccount?.role || 'player';

  const handleToggleRecruiterApproval = async () => {
    if (!recruiterProfile?.uid) return;
    const newStatus =
      recruiterProfile.verificationStatus === 'approved' ? 'pending' : 'approved';
    await saveRecruiterProfile({ verificationStatus: newStatus });
  };

  return (
    <div className="bg-slate-950/90 border-b border-blue-900/40 text-xs px-4 py-2 text-slate-300 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white">{t('devBarTitle')}</span>
          <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-800 rounded-md text-[10px] font-semibold">
            UID: {currentUser.uid.slice(0, 6)}...
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Role Switcher */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400">{t('switchUserRole')}</span>
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setDevRoleOverride('player')}
                className={`px-2 py-1 rounded text-[10px] font-bold ${
                  currentRole === 'player' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                Player
              </button>
              <button
                onClick={() => setDevRoleOverride('recruiter')}
                className={`px-2 py-1 rounded text-[10px] font-bold ${
                  currentRole === 'recruiter' || currentRole === 'club' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                Recruiter / FIFA Agent
              </button>
            </div>
          </div>

          {/* Toggle Recruiter Verification Status */}
          {(currentRole === 'recruiter' || currentRole === 'club') && recruiterProfile && (
            <button
              onClick={handleToggleRecruiterApproval}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                recruiterProfile.verificationStatus === 'approved'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950/80 text-amber-400 border-amber-800'
              }`}
            >
              Status: {recruiterProfile.verificationStatus === 'approved' ? t('approvedStatus') : t('pendingStatus')} (Click to Toggle)
            </button>
          )}

          {/* Quick PRO Toggle */}
          {currentRole === 'player' && (
            <button
              onClick={upgradeToProMembership}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] shadow"
            >
              Toggle PRO Membership
            </button>
          )}

          {/* Admin Control Center Shortcut */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] shadow flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin Portal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
