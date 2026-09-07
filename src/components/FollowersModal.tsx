import React, { useState, useEffect } from 'react';
import { X, Users, UserCheck, Loader2 } from 'lucide-react';
import { getFollowersList, getFollowingList } from '../services/followService';
import { FollowUserSummary, UserRole } from '../types';
import { FollowButton } from './FollowButton';
import { useLanguage } from '../i18n/LanguageContext';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialTab?: 'followers' | 'following';
  currentUserId?: string;
  currentUserRole?: UserRole;
  onNavigateProfile?: (profileUid: string, role: UserRole) => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  userId,
  initialTab = 'followers',
  currentUserId,
  currentUserRole,
  onNavigateProfile,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [list, setList] = useState<FollowUserSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    setLoading(true);

    const fetchList = async () => {
      try {
        if (activeTab === 'followers') {
          const res = await getFollowersList(userId);
          if (isMounted) setList(res);
        } else {
          const res = await getFollowingList(userId);
          if (isMounted) setList(res);
        }
      } catch (err) {
        console.warn('Error loading follow list:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchList();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Tabs */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex gap-2 p-1 bg-slate-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('followers')}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'followers'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('followers')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('following')}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'following'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('following')}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="p-4 overflow-y-auto flex-1 min-h-[250px]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-medium">{t('loading')}</span>
            </div>
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Users className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-medium">
                {activeTab === 'followers' ? t('noFollowersYet') : t('notFollowingAnyone')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((item) => (
                <div
                  key={item.uid}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                  onClick={() => {
                    if (onNavigateProfile) {
                      onNavigateProfile(item.uid, item.role);
                      onClose();
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        item.profilePhotoUrl ||
                        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`
                      }
                      alt={item.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {item.fullName}
                        </h4>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-600">
                          {item.role === 'player' ? t('playerRole') : t('recruiterRole')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {item.primaryPosition || item.organization || item.location || 'SoccerBridge'}
                      </p>
                    </div>
                  </div>

                  {currentUserId && currentUserId !== item.uid && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <FollowButton
                        targetId={item.uid}
                        targetRole={item.role}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                        variant="compact"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
