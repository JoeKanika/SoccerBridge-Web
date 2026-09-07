import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PlayerProfile, RecruiterProfile, VideoMetadata, TrialInvitation } from '../types';
import {
  fetchHomeFeed,
  clearFeedCache,
  FeedCategory,
  FeedItem,
} from '../services/feedService';
import { getFollowingIds } from '../services/followService';
import { getUserLikedIds } from '../services/likeService';
import { getUserSavedIds } from '../services/saveService';
import { saveRecommendationFeedback } from '../services/recommendationService';
import { MatchScoreBadge } from './MatchScoreBadge';
import { FeedbackType } from '../types';
import { FollowButton } from './FollowButton';
import { LikeButton } from './LikeButton';
import { SaveButton } from './SaveButton';
import {
  Sparkles,
  User,
  ShieldCheck,
  Award,
  Video as VideoIcon,
  MessageSquare,
  Calendar,
  MapPin,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Building2,
  Compass,
  AlertCircle,
  Briefcase,
  Globe,
  Tag,
  UserCheck,
} from 'lucide-react';

interface HomeFeedProps {
  onSelectPlayer: (player: PlayerProfile) => void;
  onOpenMessage: (player: PlayerProfile) => void;
  onOpenSendTrial: (player: PlayerProfile) => void;
  onOpenProModal: () => void;
  onNavigate: (view: string) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  onSelectPlayer,
  onOpenMessage,
  onOpenSendTrial,
  onOpenProModal,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const { currentUser, userAccount, playerProfile, recruiterProfile, devRoleOverride } = useAuth();

  const [activeCategory, setActiveCategory] = useState<FeedCategory>('all');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLimit, setFetchLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);

  const role = devRoleOverride || userAccount?.role || 'player';
  const isRecruiterOrClub = role === 'recruiter' || role === 'club' || !!recruiterProfile;
  const isPro = userAccount?.membership === 'PRO' || playerProfile?.membership === 'PRO';

  // Load following, liked, saved sets for current user
  useEffect(() => {
    if (!currentUser?.uid) return;
    Promise.all([
      getFollowingIds(currentUser.uid),
      getUserLikedIds(currentUser.uid),
      getUserSavedIds(currentUser.uid),
    ]).then(([fSet, lCache, sCache]) => {
      setFollowingIds(fSet);
      setLikedIds(lCache.targetIds);
      setSavedIds(sCache.targetIds);
    });
  }, [currentUser?.uid]);

  const handleFollowToggle = (targetId: string, isNowFollowing: boolean) => {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (isNowFollowing) next.add(targetId);
      else next.delete(targetId);
      return next;
    });
  };

  const handleSaveToggle = (targetId: string, isNowSaved: boolean) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isNowSaved) next.add(targetId);
      else next.delete(targetId);
      return next;
    });
  };

  const handleLikeToggle = (targetId: string, isNowLiked: boolean) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (isNowLiked) next.add(targetId);
      else next.delete(targetId);
      return next;
    });
  };

  const handleRecommendationFeedback = async (targetId: string, feedbackType: FeedbackType) => {
    if (!currentUser?.uid) return;
    try {
      await saveRecommendationFeedback(currentUser.uid, targetId, 'player', feedbackType);
      if (feedbackType === 'dismissed' || feedbackType === 'notInterested') {
        setFeedItems((prev) =>
          prev.filter((item) => item.ownerId !== targetId && (item.data as any)?.id !== targetId)
        );
      }
    } catch (err) {
      console.warn('Feedback save warning:', err);
    }
  };

  const loadFeed = async (bypassCache = false) => {
    if (bypassCache) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (bypassCache) {
        clearFeedCache();
      }

      // Refresh following, liked, and saved IDs
      let currentFollowing = followingIds;
      let currentLiked = likedIds;
      let currentSaved = savedIds;

      if (currentUser?.uid) {
        const [fSet, lCache, sCache] = await Promise.all([
          getFollowingIds(currentUser.uid),
          getUserLikedIds(currentUser.uid),
          getUserSavedIds(currentUser.uid),
        ]);
        currentFollowing = fSet;
        currentLiked = lCache.targetIds;
        currentSaved = sCache.targetIds;

        setFollowingIds(fSet);
        setLikedIds(currentLiked);
        setSavedIds(currentSaved);
      }

      const result = await fetchHomeFeed({
        viewerUid: currentUser?.uid,
        viewerRole: role,
        viewerPlayerProfile: playerProfile,
        viewerRecruiterProfile: recruiterProfile,
        followingIds: currentFollowing,
        likedItemIds: currentLiked,
        savedItemIds: currentSaved,
        category: activeCategory,
        limitCount: fetchLimit,
        bypassCache,
      });

      setFeedItems(result.items);
      setHasMore(result.hasMore);
    } catch (err: any) {
      console.error('HomeFeed error:', err);
      setError(err?.message || 'Could not load feed items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed(false);
  }, [activeCategory, fetchLimit, role, currentUser?.uid]);

  const handleRefresh = () => {
    loadFeed(true);
  };

  // Helper for rendering embed video URL for YouTube / Vimeo
  const getEmbedVideoUrl = (url?: string): string | null => {
    if (!url) return null;
    try {
      if (url.includes('youtube.com/watch')) {
        const vId = new URL(url).searchParams.get('v');
        return vId ? `https://www.youtube.com/embed/${vId}` : null;
      }
      if (url.includes('youtu.be/')) {
        const parts = url.split('youtu.be/');
        const vId = parts[1]?.split('?')[0];
        return vId ? `https://www.youtube.com/embed/${vId}` : null;
      }
      if (url.includes('vimeo.com/')) {
        const parts = url.split('vimeo.com/');
        const vId = parts[1]?.split('?')[0];
        return vId ? `https://player.vimeo.com/video/${vId}` : null;
      }
    } catch {
      return null;
    }
    return null;
  };

  const firstName =
    userAccount?.fullName?.split(' ')[0] ||
    playerProfile?.fullName?.split(' ')[0] ||
    recruiterProfile?.fullName?.split(' ')[0] ||
    'Member';

  const categories: { id: FeedCategory; labelKey: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', labelKey: 'forYou', icon: Compass },
    { id: 'following', labelKey: 'followingFeed', icon: UserCheck },
    { id: 'players', labelKey: 'players', icon: User },
    { id: 'recruiters', labelKey: 'recruiterRole', icon: Briefcase },
    { id: 'agents', labelKey: 'agents', icon: ShieldCheck },
    { id: 'clubs', labelKey: 'clubs', icon: Building2 },
    { id: 'videos', labelKey: 'videos', icon: VideoIcon },
    { id: 'opportunities', labelKey: 'opportunities', icon: Award },
  ];


  return (
    <div className="min-h-screen bg-[#020617] text-white py-6 px-4 lg:px-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ================= HEADER / WELCOME SECTION ================= */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-2xl overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/30">
                  {userAccount?.photoURL || playerProfile?.profilePhotoUrl ? (
                    <img
                      src={userAccount?.photoURL || playerProfile?.profilePhotoUrl}
                      alt={firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    firstName.charAt(0)
                  )}
                </div>
                {isPro && (
                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full uppercase border border-slate-900 shadow-md">
                    PRO
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                    {t('welcomePlayer')}, {firstName}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-blue-950/80 text-blue-400 border border-blue-800/50 rounded-full text-xs font-bold uppercase tracking-wider">
                    {role === 'player' ? t('playerRole') : role === 'recruiter' ? t('recruiterRole') : t('clubRole')}
                  </span>
                  {isPro && (
                    <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs rounded-full uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 fill-current" />
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs lg:text-sm mt-1 max-w-xl">
                  {role === 'player' ? t('feedWelcomePlayer') : t('feedWelcomeRecruiter')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all"
                title={t('refresh')}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              </button>

              {role === 'player' && !isPro && (
                <button
                  onClick={onOpenProModal}
                  className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  {t('upgradeToPro')}
                </button>
              )}
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full md:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                {t('dashboard')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= CATEGORY BAR ================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {t(cat.labelKey as any) || cat.id}
              </button>
            );
          })}
        </div>

        {/* ================= ERROR STATE ================= */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-4 text-rose-300 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadFeed(true)}
              className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 border border-rose-700 rounded-lg font-bold text-white uppercase tracking-wider text-[10px] shrink-0"
            >
              {t('tryAgain')}
            </button>
          </div>
        )}

        {/* ================= LOADING SKELETONS ================= */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-800 rounded w-2/3" />
                    <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-slate-800/40 rounded w-full" />
                <div className="h-3 bg-slate-800/40 rounded w-4/5" />
                <div className="h-8 bg-slate-800/80 rounded-xl w-full" />
              </div>
            ))}
          </div>
        )}

        {/* ================= EMPTY STATE ================= */}
        {!loading && feedItems.length === 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 my-8">
            <div className="w-16 h-16 bg-blue-950/80 border border-blue-800/50 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {activeCategory === 'players'
                ? t('noPlayersFoundFeed')
                : activeCategory === 'recruiters'
                ? t('noRecruitersFoundFeed')
                : activeCategory === 'agents'
                ? t('noAgentsFoundFeed')
                : activeCategory === 'clubs'
                ? t('noClubsFoundFeed')
                : activeCategory === 'videos'
                ? t('noVideosFoundFeed')
                : activeCategory === 'opportunities'
                ? t('noOpportunitiesFoundFeed')
                : t('noResultsFeed')}
            </h3>
            <p className="text-slate-400 text-xs">
              Check back soon as new players, recruiters, and opportunities join SoccerBridge daily.
            </p>
            <button
              onClick={() => setActiveCategory('all')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              View All Discovery Cards
            </button>
          </div>
        )}

        {/* ================= FEED ITEMS GRID ================= */}
        {!loading && feedItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {feedItems.map((item) => {
              if (item.kind === 'player') {
                const player = item.data;
                const isPlayerPro = player.membership === 'PRO';

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800/80 hover:border-blue-900/60 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      {/* Top Bar: Role badge, Match Score & PRO badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-blue-950/80 text-blue-400 border border-blue-800/50 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {t('playerRole')}
                          </span>
                          {item.matchResult && item.matchResult.matchScore > 0 && (
                            <MatchScoreBadge
                              matchResult={item.matchResult}
                              currentUserId={currentUser?.uid}
                              onFeedback={handleRecommendationFeedback}
                            />
                          )}
                        </div>
                        {isPlayerPro && (
                          <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-[10px] rounded-full uppercase flex items-center gap-1">
                            <Sparkles className="w-3 h-3 fill-current" />
                            PRO
                          </span>
                        )}
                      </div>

                      {/* Header Avatar & Name */}
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shrink-0 overflow-hidden border border-blue-500/30 shadow-md">
                          {player.profilePhotoUrl ? (
                            <img
                              src={player.profilePhotoUrl}
                              alt={player.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            player.fullName?.charAt(0) || 'P'
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-white text-base truncate group-hover:text-blue-400 transition-colors">
                            {player.fullName}
                          </h3>
                          <p className="text-slate-400 text-xs truncate">
                            {player.primaryPosition}
                            {player.secondaryPosition ? ` / ${player.secondaryPosition}` : ''}
                          </p>
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Relevance Reasons / Why Am I Seeing This? */}
                      {item.relevanceReasons && item.relevanceReasons.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          {item.relevanceReasons.slice(0, 2).map((reasonKey) => (
                            <span
                              key={reasonKey}
                              className="px-2 py-0.5 bg-blue-950/60 border border-blue-800/40 text-blue-300 font-medium text-[10px] rounded-md flex items-center gap-1"
                            >
                              <Tag className="w-2.5 h-2.5 text-blue-400" />
                              {t(reasonKey as any) || reasonKey}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats & Details */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        <div>
                          <span className="text-slate-500 block uppercase font-bold text-[9px]">
                            {t('currentOrg')}
                          </span>
                          <span className="text-slate-200 font-semibold truncate block">
                            {player.currentOrganization || 'Free Agent'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase font-bold text-[9px]">
                            {t('playingLevel')}
                          </span>
                          <span className="text-slate-200 font-semibold truncate block">
                            {player.playingLevel || 'Provincial'}
                          </span>
                        </div>
                      </div>

                      {/* Bio snippet */}
                      {player.bio && (
                        <p className="text-slate-300 text-xs mt-3 line-clamp-2 leading-relaxed italic">
                          "{player.bio}"
                        </p>
                      )}

                      {/* Availability status tag */}
                      {player.availabilityStatus && (
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{player.availabilityStatus}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center gap-2 border-t border-slate-800/60">
                      <button
                        onClick={() => onSelectPlayer(player)}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-1.5"
                      >
                        <User className="w-3.5 h-3.5" />
                        {t('viewPlayerProfile')}
                      </button>

                      {currentUser?.uid && currentUser.uid !== player.uid && (
                        <FollowButton
                          targetId={player.uid}
                          targetRole="player"
                          currentUserId={currentUser.uid}
                          currentUserRole={role}
                          isFollowingInitial={followingIds.has(player.uid)}
                          onFollowChange={(isNowFollowing) => handleFollowToggle(player.uid, isNowFollowing)}
                          variant="outline"
                          className="!bg-slate-800 !text-slate-200 !border-slate-700 hover:!bg-slate-700"
                        />
                      )}

                      {currentUser?.uid && (
                        <SaveButton
                          targetId={player.uid}
                          targetType="player"
                          targetOwnerId={player.uid}
                          targetData={player}
                          currentUserId={currentUser.uid}
                          isSavedInitial={savedIds.has(player.uid)}
                          onSaveChange={(isNowSaved) => handleSaveToggle(player.uid, isNowSaved)}
                          variant="icon"
                        />
                      )}

                      {isRecruiterOrClub && (
                        <button
                          onClick={() => onOpenSendTrial(player)}
                          className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all text-center flex items-center justify-center"
                          title={t('inviteToTrial')}
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onOpenMessage(player)}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all text-center flex items-center justify-center"
                        title={t('sendMessage')}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              }

              if (item.kind === 'recruiter') {
                const recruiter = item.data;
                const isApproved = recruiter.verificationStatus === 'approved';
                const isFifa = recruiter.orgType === 'FIFA Agent';

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800/80 hover:border-blue-900/60 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      {/* Badge bar */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {recruiter.orgType || t('recruiterRole')}
                          </span>
                          {item.matchResult && item.matchResult.matchScore > 0 && (
                            <MatchScoreBadge
                              matchResult={item.matchResult}
                              currentUserId={currentUser?.uid}
                              onFeedback={handleRecommendationFeedback}
                            />
                          )}
                        </div>
                        {isFifa && (
                          <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-[10px] rounded-full uppercase flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {t('verifiedAgent')}
                          </span>
                        )}
                        {!isFifa && isApproved && (
                          <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] rounded-full uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('verifiedRecruiter')}
                          </span>
                        )}
                      </div>

                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-400 font-black text-xl shrink-0 border border-slate-700 shadow-md">
                          <Briefcase className="w-7 h-7" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-white text-base truncate group-hover:text-blue-400 transition-colors">
                            {recruiter.fullName}
                          </h3>
                          <p className="text-slate-400 text-xs truncate">
                            {recruiter.jobTitle || recruiter.orgType}
                          </p>
                          <p className="text-blue-400 text-xs font-semibold truncate mt-0.5">
                            {recruiter.organization}
                          </p>
                        </div>
                      </div>

                      {/* Relevance Reasons */}
                      {item.relevanceReasons && item.relevanceReasons.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          {item.relevanceReasons.slice(0, 2).map((reasonKey) => (
                            <span
                              key={reasonKey}
                              className="px-2 py-0.5 bg-blue-950/60 border border-blue-800/40 text-blue-300 font-medium text-[10px] rounded-md flex items-center gap-1"
                            >
                              <Tag className="w-2.5 h-2.5 text-blue-400" />
                              {t(reasonKey as any) || reasonKey}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex items-center gap-2 border-t border-slate-800/60">
                      <button
                        onClick={() => onNavigate('messages')}
                        className="flex-1 py-2 px-3 bg-slate-800 hover:bg-blue-600 text-white font-bold text-xs rounded-xl border border-slate-700 hover:border-blue-500 transition-all text-center flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {t('contact')}
                      </button>

                      {currentUser?.uid && currentUser.uid !== recruiter.uid && (
                        <FollowButton
                          targetId={recruiter.uid}
                          targetRole={recruiter.role || 'recruiter'}
                          currentUserId={currentUser.uid}
                          currentUserRole={role}
                          isFollowingInitial={followingIds.has(recruiter.uid)}
                          onFollowChange={(isNowFollowing) => handleFollowToggle(recruiter.uid, isNowFollowing)}
                          variant="outline"
                          className="!bg-slate-800 !text-slate-200 !border-slate-700 hover:!bg-slate-700"
                        />
                      )}

                      {currentUser?.uid && (
                        <SaveButton
                          targetId={recruiter.uid}
                          targetType={isFifa ? 'agent' : 'recruiter'}
                          targetOwnerId={recruiter.uid}
                          targetData={recruiter}
                          currentUserId={currentUser.uid}
                          isSavedInitial={savedIds.has(recruiter.uid)}
                          onSaveChange={(isNowSaved) => handleSaveToggle(recruiter.uid, isNowSaved)}
                          variant="icon"
                        />
                      )}
                    </div>

                  </div>
                );
              }

              if (item.kind === 'video') {
                const video = item.data;
                const player = item.playerProfile;
                const embedUrl = getEmbedVideoUrl(video.externalUrl);

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 border border-slate-800/80 hover:border-blue-900/60 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 col-span-1 md:col-span-2 lg:col-span-1"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 bg-indigo-950/80 text-indigo-400 border border-indigo-800/50 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <VideoIcon className="w-3 h-3" />
                          {video.videoType || 'Highlight'}
                        </span>
                        {player && (
                          <span className="text-slate-400 text-xs font-medium truncate">
                            {player.fullName}
                          </span>
                        )}
                      </div>

                      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 mb-3 group">
                        {embedUrl ? (
                          <iframe
                            src={embedUrl}
                            title={video.title}
                            className="w-full h-full border-0"
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : video.downloadUrl ? (
                          <video
                            src={video.downloadUrl}
                            controls
                            preload="none"
                            poster={video.thumbnailUrl}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-500">
                            <VideoIcon className="w-10 h-10 mb-2 opacity-50" />
                            <span className="text-xs">Video Preview Unavailable</span>
                          </div>
                        )}
                      </div>

                      <h4 className="font-bold text-white text-sm line-clamp-1">
                        {video.title}
                      </h4>
                      {video.description && (
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                      {player ? (
                        <button
                          onClick={() => onSelectPlayer(player)}
                          className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5" />
                          {t('viewPlayerProfile')}
                        </button>
                      ) : (
                        <div className="flex-1" />
                      )}

                      <div className="flex items-center gap-1.5 shrink-0">
                        <LikeButton
                          targetId={video.id || item.id}
                          targetType="video"
                          targetOwnerId={video.playerId}
                          currentUserId={currentUser?.uid}
                          isLikedInitial={likedIds.has(video.id || item.id)}
                          onLikeChange={(isLiked) => handleLikeToggle(video.id || item.id, isLiked)}
                          variant="pill"
                        />
                        {currentUser?.uid && (
                          <SaveButton
                            targetId={video.id || item.id}
                            targetType="video"
                            targetOwnerId={video.playerId}
                            targetData={video}
                            currentUserId={currentUser.uid}
                            isSavedInitial={savedIds.has(video.id || item.id)}
                            onSaveChange={(isSaved) => handleSaveToggle(video.id || item.id, isSaved)}
                            variant="icon"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (item.kind === 'opportunity') {
                const opp = item.data;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 border border-slate-800/80 hover:border-blue-900/60 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Trial Opportunity
                          </span>
                          {item.matchResult && item.matchResult.matchScore > 0 && (
                            <MatchScoreBadge
                              matchResult={item.matchResult}
                              currentUserId={currentUser?.uid}
                              onFeedback={handleRecommendationFeedback}
                            />
                          )}
                        </div>
                        <span className="text-slate-500 text-[10px] font-mono">
                          {opp.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-base">
                        {opp.eventTitle}
                      </h3>
                      <p className="text-blue-400 text-xs font-semibold mt-0.5">
                        {opp.recruiterOrg || opp.recruiterName}
                      </p>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{opp.eventDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{opp.location}</span>
                        </div>
                      </div>

                      {opp.details && (
                        <p className="text-slate-400 text-xs mt-3 line-clamp-3">
                          {opp.details}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onNavigate('dashboard')}
                        className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all text-center flex items-center justify-center gap-2"
                      >
                        View Opportunities
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {currentUser?.uid && (
                        <SaveButton
                          targetId={opp.id || item.id}
                          targetType="opportunity"
                          targetOwnerId={opp.recruiterId}
                          targetData={opp}
                          currentUserId={currentUser.uid}
                          isSavedInitial={savedIds.has(opp.id || item.id)}
                          onSaveChange={(isNowSaved) => handleSaveToggle(opp.id || item.id, isNowSaved)}
                          variant="icon"
                        />
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}

        {/* ================= PAGINATION BUTTON ================= */}
        {!loading && hasMore && feedItems.length > 0 && (
          <div className="text-center pt-6 pb-10">
            <button
              onClick={() => setFetchLimit((prev) => prev + 20)}
              className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-slate-800 hover:border-blue-600 transition-all shadow-xl inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('loadMore')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
