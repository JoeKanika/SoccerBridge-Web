import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { followUser, unfollowUser, isFollowing as checkIsFollowing } from '../services/followService';
import { clearFeedCache } from '../services/feedService';
import { UserRole } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface FollowButtonProps {
  targetId: string;
  targetRole: UserRole | string;
  currentUserId?: string;
  currentUserRole?: UserRole | string;
  isFollowingInitial?: boolean;
  onFollowChange?: (isNowFollowing: boolean) => void;
  variant?: 'primary' | 'outline' | 'compact' | 'pill';
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetId,
  targetRole,
  currentUserId,
  currentUserRole = 'player',
  isFollowingInitial,
  onFollowChange,
  variant = 'outline',
  className = '',
}) => {
  const { t } = useLanguage();
  const [following, setFollowing] = useState<boolean>(isFollowingInitial || false);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialChecked, setInitialChecked] = useState<boolean>(isFollowingInitial !== undefined);

  // If initial status was not provided, fetch it asynchronously
  useEffect(() => {
    if (isFollowingInitial !== undefined) {
      setFollowing(isFollowingInitial);
      setInitialChecked(true);
      return;
    }

    if (!currentUserId || !targetId || currentUserId === targetId) {
      return;
    }

    let isMounted = true;
    checkIsFollowing(currentUserId, targetId)
      .then((res) => {
        if (isMounted) {
          setFollowing(res);
          setInitialChecked(true);
        }
      })
      .catch((err) => {
        console.warn('FollowButton check failed:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUserId, targetId, isFollowingInitial]);

  // Cannot follow self or unauthenticated
  if (!currentUserId || currentUserId === targetId) {
    return null;
  }

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering parent card click
    if (loading) return;

    const previousState = following;
    const nextState = !following;

    // Optimistic UI update
    setFollowing(nextState);
    if (onFollowChange) {
      onFollowChange(nextState);
    }
    setLoading(true);

    try {
      if (previousState) {
        await unfollowUser(currentUserId, targetId);
      } else {
        await followUser(currentUserId, currentUserRole as UserRole, targetId, targetRole as UserRole);
      }
      clearFeedCache();
    } catch (err) {
      console.error('Error updating follow status:', err);
      // Rollback optimistic state
      setFollowing(previousState);
      if (onFollowChange) {
        onFollowChange(previousState);
      }
    } finally {
      setLoading(false);
    }
  };

  // Base style depending on variant
  let buttonStyle = '';
  if (variant === 'primary') {
    buttonStyle = following
      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300'
      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm';
  } else if (variant === 'pill') {
    buttonStyle = following
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
      : 'bg-emerald-600 text-white hover:bg-emerald-700 rounded-full shadow-sm';
  } else if (variant === 'compact') {
    buttonStyle = following
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs py-1 px-2.5'
      : 'bg-emerald-600 text-white hover:bg-emerald-700 text-xs py-1 px-2.5';
  } else {
    // Default 'outline'
    buttonStyle = following
      ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
      : 'bg-white text-emerald-700 border border-emerald-600 hover:bg-emerald-50';
  }

  return (
    <button
      type="button"
      onClick={handleToggleFollow}
      disabled={loading || !initialChecked}
      className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors px-3 py-1.5 text-xs sm:text-sm ${buttonStyle} ${className}`}
      title={following ? t('unfollow') : t('follow')}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : following ? (
        <>
          <UserCheck className="w-3.5 h-3.5" />
          <span>{t('following')}</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t('follow')}</span>
        </>
      )}
    </button>
  );
};
