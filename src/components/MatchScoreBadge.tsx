import React, { useState } from 'react';
import { Sparkles, Info, EyeOff, ThumbsDown, X, Check } from 'lucide-react';
import { MatchResult, FeedbackType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface MatchScoreBadgeProps {
  matchResult: MatchResult;
  currentUserId?: string;
  onFeedback?: (targetId: string, feedbackType: FeedbackType) => void;
  compact?: boolean;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  matchResult,
  currentUserId,
  onFeedback,
  compact = false,
}) => {
  const { t } = useLanguage();
  const [showReasonsModal, setShowReasonsModal] = useState(false);
  const [feedbackApplied, setFeedbackApplied] = useState<FeedbackType | null>(null);

  if (matchResult.matchScore <= 0 || feedbackApplied === 'dismissed') {
    return null;
  }

  const getBadgeStyle = (score: number) => {
    if (score >= 90) {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30';
    }
    if (score >= 75) {
      return 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30';
    }
    if (score >= 60) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700';
  };

  const handleFeedbackClick = (e: React.MouseEvent, type: FeedbackType) => {
    e.stopPropagation();
    setFeedbackApplied(type);
    if (onFeedback) {
      onFeedback(matchResult.targetId, type);
    }
  };

  if (feedbackApplied === 'notInterested') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 text-xs border border-slate-700">
        <Check className="w-3 h-3 text-emerald-400" />
        <span>{t('recommendationDismissed')}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowReasonsModal(!showReasonsModal);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-all shadow-sm ${getBadgeStyle(
          matchResult.matchScore
        )}`}
        title={t('whyThisMatch')}
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
        <span>{matchResult.matchScore}%</span>
        {!compact && (
          <span className="hidden sm:inline font-medium text-[11px] opacity-90">
            • {t(matchResult.matchLabelKey)}
          </span>
        )}
        <Info className="w-3 h-3 opacity-70 ml-0.5 shrink-0" />
      </button>

      {/* Reasons Tooltip / Dropdown Modal */}
      {showReasonsModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full left-0 mt-2 w-72 p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 text-left animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">
                {matchResult.matchScore}% {t(matchResult.matchLabelKey)}
              </span>
            </div>
            <button
              onClick={() => setShowReasonsModal(false)}
              className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            {t('whyThisMatch')}
          </div>

          <ul className="space-y-1.5 mb-3">
            {matchResult.reasons.length > 0 ? (
              matchResult.reasons.map((reasonKey, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>{t(reasonKey)}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-400 italic">
                General relevance match
              </li>
            )}
          </ul>

          {currentUserId && onFeedback && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => handleFeedbackClick(e, 'notInterested')}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-red-950/40 hover:text-red-300 text-slate-300 rounded-xl text-[11px] font-medium transition-all flex items-center justify-center gap-1 border border-slate-700/80 hover:border-red-800/50"
              >
                <ThumbsDown className="w-3 h-3 text-red-400" />
                {t('notInterested')}
              </button>
              <button
                type="button"
                onClick={(e) => handleFeedbackClick(e, 'dismissed')}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-medium transition-all flex items-center justify-center gap-1 border border-slate-700/80"
              >
                <EyeOff className="w-3 h-3 text-slate-400" />
                {t('dismiss')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
