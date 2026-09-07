import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { saveItem, unsaveItem } from '../services/saveService';
import { SavedTargetType } from '../types';

interface SaveButtonProps {
  targetId: string;
  targetType: SavedTargetType;
  targetOwnerId?: string;
  targetData?: any;
  currentUserId?: string;
  isSavedInitial?: boolean;
  onSaveChange?: (isNowSaved: boolean) => void;
  variant?: 'button' | 'icon' | 'outline' | 'compact';
  className?: string;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  targetId,
  targetType,
  targetOwnerId,
  targetData,
  currentUserId,
  isSavedInitial = false,
  onSaveChange,
  variant = 'button',
  className = '',
}) => {
  const { t } = useLanguage();
  const [isSaved, setIsSaved] = useState<boolean>(isSavedInitial);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsSaved(isSavedInitial);
  }, [isSavedInitial]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!currentUserId) {
      alert(t('login'));
      return;
    }

    if (loading) return;

    const previousSaved = isSaved;
    const nextSaved = !previousSaved;

    // Optimistic UI update
    setIsSaved(nextSaved);
    if (onSaveChange) {
      onSaveChange(nextSaved);
    }

    setLoading(true);

    try {
      if (nextSaved) {
        await saveItem(currentUserId, targetId, targetType, targetOwnerId, targetData);
      } else {
        await unsaveItem(currentUserId, targetId, targetType);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      // Rollback
      setIsSaved(previousSaved);
      if (onSaveChange) {
        onSaveChange(previousSaved);
      }
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleToggleSave}
        disabled={loading}
        title={isSaved ? t('removeFromSaved') : t('save')}
        className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
          isSaved
            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
            : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
        } ${className}`}
      >
        <Bookmark className={`w-4 h-4 transition-transform active:scale-125 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleToggleSave}
        disabled={loading}
        title={isSaved ? t('removeFromSaved') : t('save')}
        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
          isSaved ? 'text-amber-400 hover:text-amber-300' : 'text-slate-400 hover:text-slate-200'
        } ${className}`}
      >
        <Bookmark className={`w-3.5 h-3.5 transition-transform active:scale-125 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
        <span>{isSaved ? t('saved') : t('save')}</span>
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        type="button"
        onClick={handleToggleSave}
        disabled={loading}
        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
          isSaved
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
            : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600'
        } ${className}`}
      >
        <Bookmark className={`w-3.5 h-3.5 transition-transform active:scale-125 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
        <span>{isSaved ? t('saved') : t('save')}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggleSave}
      disabled={loading}
      className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
        isSaved
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/10'
          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
      } ${className}`}
    >
      <Bookmark className={`w-4 h-4 transition-transform active:scale-125 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
      <span>{isSaved ? t('saved') : t('save')}</span>
    </button>
  );
};
