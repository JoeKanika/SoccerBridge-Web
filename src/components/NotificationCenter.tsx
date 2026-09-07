import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  AppNotification,
  NotificationType,
  NotificationPreferences,
  PlayerProfile,
  RecruiterProfile,
} from '../types';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  subscribeToRecentNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../services/notificationService';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  X,
  UserPlus,
  Heart,
  Bookmark,
  Eye,
  MessageSquare,
  Award,
  Sparkles,
  ShieldAlert,
  Info,
  Check,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMessage?: () => void;
  onOpenPlayerProfile?: (player: PlayerProfile) => void;
  onOpenRecruiterProfile?: (recruiter: RecruiterProfile) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateToMessage,
  onOpenPlayerProfile,
  onOpenRecruiterProfile,
}) => {
  const { t } = useLanguage();
  const { userAccount } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filterUnread, setFilterUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    follows: true,
    likes: true,
    profileViews: true,
    saves: true,
    messages: true,
    trialInvites: true,
    opportunities: true,
    recommendations: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Subscribe to real-time notification updates when open
  useEffect(() => {
    if (!isOpen || !userAccount?.uid) return;

    setLoading(true);
    const unsubscribe = subscribeToRecentNotifications(
      userAccount.uid,
      30,
      (list) => {
        setNotifications(list);
        setLoading(false);
      }
    );

    getNotificationPreferences(userAccount.uid).then((prefs) => {
      setPreferences(prefs);
    });

    return () => unsubscribe();
  }, [isOpen, userAccount?.uid]);

  if (!isOpen) return null;

  const filteredNotifications = filterUnread
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const handleMarkAllRead = async () => {
    if (!userAccount?.uid) return;
    await markAllNotificationsRead(userAccount.uid);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationRead(notif.id);
    }

    // Deep link action
    try {
      if (
        (notif.type === 'follow' ||
          notif.type === 'profileView' ||
          notif.type === 'save' ||
          notif.type === 'recruiterInterest' ||
          notif.type === 'recommendation') &&
        notif.actorId
      ) {
        if (notif.actorRole === 'player') {
          const pSnap = await getDoc(doc(db, 'playerProfiles', notif.actorId));
          if (pSnap.exists() && onOpenPlayerProfile) {
            onOpenPlayerProfile({ uid: pSnap.id, ...(pSnap.data() as any) });
            onClose();
            return;
          }
        } else if (notif.actorRole === 'recruiter' || notif.actorRole === 'club') {
          const rSnap = await getDoc(doc(db, 'recruiterProfiles', notif.actorId));
          if (rSnap.exists() && onOpenRecruiterProfile) {
            onOpenRecruiterProfile({ uid: rSnap.id, ...(rSnap.data() as any) });
            onClose();
            return;
          }
        }
      }

      if (notif.type === 'message' && onNavigateToMessage) {
        onNavigateToMessage();
        onClose();
        return;
      }
    } catch (err) {
      console.warn('Error executing notification deep link:', err);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSavePreferences = async () => {
    if (!userAccount?.uid) return;
    setSavingPrefs(true);
    try {
      await updateNotificationPreferences(userAccount.uid, preferences);
      setPrefSuccess(true);
      setTimeout(() => {
        setPrefSuccess(false);
        setShowSettings(false);
      }, 1200);
    } catch (err) {
      console.error('Error saving notification preferences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const formatRelativeTime = (createdAt: any): string => {
    if (!createdAt) return t('recently');
    let date: Date;
    try {
      if (typeof createdAt?.toDate === 'function') {
        date = createdAt.toDate();
      } else if (typeof createdAt?.seconds === 'number') {
        date = new Date(createdAt.seconds * 1000);
      } else if (createdAt instanceof Date) {
        date = createdAt;
      } else {
        date = new Date(createdAt);
      }
      if (isNaN(date.getTime())) return t('recently');
    } catch {
      return t('recently');
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('recently');
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return t('yesterday');
    return `${diffDays}d`;
  };

  const renderIcon = (type: NotificationType) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'like':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'save':
      case 'recruiterInterest':
        return <Bookmark className="w-4 h-4 text-amber-400" />;
      case 'profileView':
        return <Eye className="w-4 h-4 text-blue-400" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'trialInvite':
        return <Award className="w-4 h-4 text-yellow-400" />;
      case 'opportunity':
      case 'recommendation':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'verification':
      case 'system':
        return <ShieldAlert className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const renderTitle = (notif: AppNotification) => {
    const fallbackTitle = t(notif.titleKey as any) || 'Notification';
    return fallbackTitle;
  };

  const renderBody = (notif: AppNotification) => {
    let template = t(notif.bodyKey as any);
    if (!template) return notif.bodyKey;

    if (notif.translationParams) {
      Object.entries(notif.translationParams).forEach(([key, val]) => {
        template = template.replace(`{${key}}`, val);
      });
    }

    return template;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full sm:max-w-md bg-[#0A0E17] border border-slate-800 rounded-none sm:rounded-3xl shadow-2xl h-full sm:h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <h3 className="font-extrabold text-base text-white">{t('notificationsTitle')}</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
              title={t('notificationSettings')}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {!showSettings && (
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setFilterUnread(false)}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  !filterUnread ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('allNotifications')}
              </button>
              <button
                onClick={() => setFilterUnread(true)}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  filterUnread ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('unreadOnly')}
              </button>
            </div>

            <button
              onClick={handleMarkAllRead}
              className="text-slate-400 hover:text-blue-400 flex items-center gap-1 font-medium hover:underline text-[11px]"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{t('markAllRead')}</span>
            </button>
          </div>
        )}

        {/* Settings Subpanel */}
        {showSettings ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <h4 className="font-bold text-sm text-white mb-1">{t('notificationSettings')}</h4>
              <p className="text-xs text-slate-400">{t('notificationPreferencesDesc')}</p>
            </div>

            {prefSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{t('preferencesSaved')}</span>
              </div>
            )}

            <div className="space-y-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
              {[
                { key: 'follows', label: t('prefFollows') },
                { key: 'likes', label: t('prefLikes') },
                { key: 'saves', label: t('prefSaves') },
                { key: 'profileViews', label: t('prefProfileViews') },
                { key: 'messages', label: t('prefMessages') },
                { key: 'trialInvites', label: t('prefTrialInvites') },
                { key: 'opportunities', label: t('prefOpportunities') },
                { key: 'recommendations', label: t('prefRecommendations') },
              ].map(({ key, label }) => {
                const isChecked = preferences[key as keyof NotificationPreferences];
                return (
                  <label key={key} className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-xs font-semibold text-slate-300">{label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setPreferences({ ...preferences, [key]: e.target.checked })
                      }
                      className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                );
              })}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
              >
                {savingPrefs ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{t('savePreferences')}</span>
                )}
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          /* Notifications List */
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">{t('loading')}</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400">
                  {filterUnread ? t('noUnreadNotifications') : t('noNotificationsYet')}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 hover:bg-slate-900/80 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                    !notif.isRead ? 'bg-blue-950/20' : ''
                  }`}
                >
                  {/* Unread indicator dot */}
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 absolute top-4 left-2" />
                  )}

                  {/* Actor Avatar & Type Icon */}
                  <div className="relative shrink-0 ml-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden border border-slate-700">
                      {notif.actorPhotoUrl ? (
                        <img
                          src={notif.actorPhotoUrl}
                          alt={notif.actorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                          {notif.actorName ? notif.actorName.charAt(0) : 'S'}
                        </div>
                      )}
                    </div>

                    <div className="absolute -bottom-1 -right-1 p-1 bg-[#0A0E17] border border-slate-700 rounded-full shadow">
                      {renderIcon(notif.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="font-bold text-xs text-white truncate">{renderTitle(notif)}</h4>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {renderBody(notif)}
                    </p>
                  </div>

                  {/* Action / Delete */}
                  <button
                    onClick={(e) => handleDeleteItem(e, notif.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    title={t('delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
