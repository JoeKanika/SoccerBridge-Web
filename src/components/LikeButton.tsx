import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { likeItem, unlikeItem, getItemLikeCount } from '../services/likeService';
import { LikeTargetType } from '../types';

interface LikeButtonProps {
  targetId: string;
  targetType: LikeTargetType;
  ownerId?: string;
  currentUserId?: string;
  isLikedInitial?: boolean;
  initialCount?: number;
  onLikeChange?: (isNowLiked: boolean, newCount: number) => void;
  variant?: 'icon' | 'pill' | 'compact';
  showCount?: boolean;
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  targetId,
  targetType,
  ownerId,
  currentUserId,
  isLikedInitial = false,
  initialCount,
  onLikeChange,
  variant = 'pill',
  showCount = true,
  className = '',
}) => {
  const { t } = useLanguage();
  const [isLiked, setIsLiked] = useState<boolean>(isLikedInitial);
  const [likeCount, setLikeCount] = useState<number>(initialCount ?? 0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsLiked(isLikedInitial);
  }, [isLikedInitial]);

  useEffect(() => {
    if (initialCount !== undefined) {
      setLikeCount(initialCount);
    } else {
      getItemLikeCount(targetId).then((cnt) => setLikeCount(cnt));
    }
  }, [targetId, initialCount]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!currentUserId) {
      alert(t('login'));
      return;
    }

    if (loading) return;

    const previousLiked = isLiked;
    const previousCount = likeCount;

    const nextLiked = !previousLiked;
    const nextCount = nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

    // Optimistic update
    setIsLiked(nextLiked);
    setLikeCount(nextCount);
    if (onLikeChange) {
      onLikeChange(nextLiked, nextCount);
    }

    setLoading(true);

    try {
      if (nextLiked) {
        await likeItem(currentUserId, targetId, targetType, ownerId);
      } else {
        await unlikeItem(currentUserId, targetId, targetType);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Rollback on failure
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      if (onLikeChange) {
        onLikeChange(previousLiked, previousCount);
      }
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={loading}
        title={isLiked ? t('unlike') : t('like')}
        className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
          isLiked
            ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'
            : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
        } ${className}`}
      >
        <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
        {showCount && likeCount > 0 && (
          <span className="ml-1 text-xs font-bold">{likeCount}</span>
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={loading}
        title={isLiked ? t('unlike') : t('like')}
        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
          isLiked ? 'text-rose-400 hover:text-rose-300' : 'text-slate-400 hover:text-slate-200'
        } ${className}`}
      >
        <Heart className={`w-3.5 h-3.5 transition-transform active:scale-125 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
        <span>{isLiked ? t('liked') : t('like')}</span>
        {showCount && likeCount > 0 && <span className="opacity-80">({likeCount})</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggleLike}
      disabled={loading}
      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
        isLiked
          ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
          : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600'
      } ${className}`}
    >
      <Heart className={`w-3.5 h-3.5 transition-transform active:scale-125 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
      <span>{isLiked ? t('liked') : t('like')}</span>
      {showCount && likeCount > 0 && (
        <span className="ml-0.5 px-1.5 py-0.2 bg-slate-900/60 rounded-full text-[10px] font-black">
          {likeCount}
        </span>
      )}
    </button>
  );
};
