import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getSavedItems, unsaveItem } from '../services/saveService';
import {
  SavedItem,
  SavedTargetType,
  PlayerProfile,
  RecruiterProfile,
  TrialInvitation,
  VideoMetadata,
} from '../types';
import {
  Bookmark,
  User,
  Briefcase,
  ShieldCheck,
  Building,
  Award,
  Film,
  Trash2,
  ExternalLink,
  MapPin,
  Calendar,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface SavedItemsViewProps {
  onSelectPlayer: (player: PlayerProfile) => void;
  onOpenMessage: (recipient: any) => void;
  onOpenSendTrial: (player: PlayerProfile) => void;
  onNavigate: (view: string) => void;
}

type FilterCategory = 'all' | SavedTargetType;

export const SavedItemsView: React.FC<SavedItemsViewProps> = ({
  onSelectPlayer,
  onOpenMessage,
  onOpenSendTrial,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [lastDocSnap, setLastDocSnap] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const categories: { id: FilterCategory; labelKey: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', labelKey: 'savedItems', icon: Bookmark },
    { id: 'player', labelKey: 'savedPlayers', icon: User },
    { id: 'recruiter', labelKey: 'savedRecruiters', icon: Briefcase },
    { id: 'agent', labelKey: 'savedAgents', icon: ShieldCheck },
    { id: 'club', labelKey: 'savedClubs', icon: Building },
    { id: 'opportunity', labelKey: 'savedOpportunities', icon: Award },
    { id: 'video', labelKey: 'savedVideos', icon: Film },
  ];

  const fetchItems = async (category: FilterCategory, isReset = true) => {
    if (!currentUser?.uid) return;

    if (isReset) {
      setLoading(true);
      setItems([]);
      setLastDocSnap(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await getSavedItems(
        currentUser.uid,
        category,
        20,
        isReset ? null : lastDocSnap
      );

      if (isReset) {
        setItems(res.items);
      } else {
        setItems((prev) => [...prev, ...res.items]);
      }

      setLastDocSnap(res.lastDocSnap);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Error loading saved items:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchItems(activeCategory, true);
  }, [currentUser?.uid, activeCategory]);

  const handleRemoveItem = async (targetId: string, targetType: SavedTargetType) => {
    if (!currentUser?.uid) return;

    // Optimistic removal
    setItems((prev) => prev.filter((i) => !(i.targetId === targetId && i.targetType === targetType)));

    try {
      await unsaveItem(currentUser.uid, targetId, targetType);
    } catch (err) {
      console.error('Error unsaving item:', err);
      // reload on error
      fetchItems(activeCategory, true);
    }
  };

  // Embed video URL resolver for YouTube/Vimeo
  const getEmbedVideoUrl = (url?: string): string | null => {
    if (!url) return null;
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      const videoId = url.includes('youtu.be/')
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : new URLSearchParams(url.split('?')[1]).get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white py-8 px-4 lg:px-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
              <Bookmark className="w-7 h-7 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black">{t('savedItems')}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {t('feedWelcomeRecruiter')}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold flex items-center gap-2 self-start md:self-auto"
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span>{t('forYou')}</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{t(cat.labelKey as any)}</span>
              </button>
            );
          })}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('loading')}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
              <Bookmark className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-300">{t('noSavedItemsYet')}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Save player profiles, recruiters, agents, clubs, or highlight videos from the home feed or public profiles to access them anytime here.
            </p>
            <button
              onClick={() => onNavigate('home')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/20 transition-all inline-flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>{t('forYou')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => {
              const data = item.targetData;

              // Render Player Card
              if (item.targetType === 'player') {
                const player = data as PlayerProfile;
                return (
                  <div
                    key={item.id}
                    className="bg-[#0A0E17] border border-slate-800 hover:border-slate-700 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-blue-400">
                          {player?.profilePhotoUrl ? (
                            <img src={player.profilePhotoUrl} alt={player.fullName} className="w-full h-full object-cover" />
                          ) : (
                            player?.fullName?.charAt(0) || 'P'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm group-hover:text-blue-400 transition-colors">
                              {player?.fullName || 'Player'}
                            </h3>
                            {player?.membership === 'PRO' && (
                              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full">
                                PRO
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-blue-400 font-medium">
                            {player?.primaryPosition} {player?.secondaryPosition ? `/ ${player.secondaryPosition}` : ''}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {player?.city || ''}, {player?.province || ''}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.targetId, item.targetType)}
                        title={t('removeFromSaved')}
                        className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                      {player && (
                        <button
                          onClick={() => onSelectPlayer(player)}
                          className="flex-1 py-2 px-3 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs rounded-xl border border-blue-500/30 transition-all text-center flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{t('viewProfile')}</span>
                        </button>
                      )}
                      {player && (
                        <button
                          onClick={() => onOpenMessage(player)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all"
                          title={t('sendMessage')}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // Render Recruiter / Agent / Club Card
              if (item.targetType === 'recruiter' || item.targetType === 'agent' || item.targetType === 'club') {
                const rec = data as RecruiterProfile;
                const isApproved = rec?.verificationStatus === 'approved';
                return (
                  <div
                    key={item.id}
                    className="bg-[#0A0E17] border border-slate-800 hover:border-slate-700 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 overflow-hidden shrink-0 flex items-center justify-center font-bold text-indigo-400">
                          {rec?.fullName?.charAt(0) || 'R'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm group-hover:text-indigo-400 transition-colors">
                              {rec?.fullName || 'Recruiter'}
                            </h3>
                            {isApproved && (
                              <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                            )}
                          </div>
                          <p className="text-xs text-indigo-300 font-medium">{rec?.jobTitle || rec?.orgType}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{rec?.organization}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.targetId, item.targetType)}
                        title={t('removeFromSaved')}
                        className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => onNavigate('messages')}
                        className="w-full py-2 px-3 bg-slate-800 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all text-center flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t('contact')}</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // Render Opportunity Card
              if (item.targetType === 'opportunity') {
                const opp = data as TrialInvitation;
                return (
                  <div
                    key={item.id}
                    className="bg-[#0A0E17] border border-slate-800 hover:border-slate-700 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
                          {t('trialInvitations')}
                        </span>
                        <h3 className="font-bold text-sm group-hover:text-amber-400 transition-colors">
                          {opp?.eventTitle || 'Trial Opportunity'}
                        </h3>
                        <p className="text-xs text-slate-300 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          {opp?.eventDate || 'TBD'}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {opp?.location || 'Canada'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.targetId, item.targetType)}
                        title={t('removeFromSaved')}
                        className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => onNavigate('messages')}
                        className="w-full py-2 px-3 bg-amber-600/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs rounded-xl border border-amber-500/30 transition-all text-center flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t('contact')}</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // Render Video Card
              if (item.targetType === 'video') {
                const video = data as VideoMetadata;
                const videoUrl = video?.externalUrl || video?.downloadUrl || '';
                const isExternal = video?.sourceType === 'youtube' || video?.sourceType === 'vimeo' || videoUrl.includes('youtube') || videoUrl.includes('vimeo');
                const embedUrl = isExternal ? getEmbedVideoUrl(videoUrl) : null;

                return (
                  <div
                    key={item.id}
                    className="bg-[#0A0E17] border border-slate-800 hover:border-slate-700 rounded-3xl p-5 flex flex-col justify-between space-y-3 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block mb-1">
                          {video?.videoType || 'Video'}
                        </span>
                        <h3 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors">
                          {video?.title || 'Highlight Reel'}
                        </h3>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.targetId, item.targetType)}
                        title={t('removeFromSaved')}
                        className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {embedUrl ? (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800">
                        <iframe
                          src={embedUrl}
                          title={video?.title}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    ) : videoUrl ? (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800">
                        <video src={videoUrl} controls className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                        <Film className="w-8 h-8" />
                      </div>
                    )}

                    {video?.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">{video.description}</p>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}

        {/* Load More Pagination */}
        {hasMore && (
          <div className="pt-6 text-center">
            <button
              onClick={() => fetchItems(activeCategory, false)}
              disabled={loadingMore}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl border border-slate-700 transition-all inline-flex items-center gap-2 shadow-lg"
            >
              {loadingMore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('loading')}</span>
                </>
              ) : (
                <span>{t('loadMore')}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
