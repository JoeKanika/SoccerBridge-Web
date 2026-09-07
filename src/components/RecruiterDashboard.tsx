import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PlayerProfile, SearchFilters } from '../types';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { SaveButton } from './SaveButton';
import { MatchScoreBadge } from './MatchScoreBadge';
import { calculateRecruiterPlayerMatch, saveRecommendationFeedback } from '../services/recommendationService';
import { FeedbackType } from '../types';

// Phase 8 Scouting Suite Components
import { ShortlistManager } from './scouting/ShortlistManager';
import { PipelineKanban } from './scouting/PipelineKanban';
import { PlayerComparisonModal } from './scouting/PlayerComparisonModal';
import { ScoutingCalendarView } from './scouting/ScoutingCalendarView';
import { ScoutingReportModal } from './scouting/ScoutingReportModal';
import { ScoutingAnalyticsView } from './scouting/ScoutingAnalyticsView';
import { SavedSearchesManager } from './scouting/SavedSearchesManager';
import { PlayerApplicationsView } from './scouting/PlayerApplicationsView';
import { TeamWorkspaceView } from './collaboration/TeamWorkspaceView';

import {
  Search,
  Filter,
  Bookmark,
  MessageSquare,
  Calendar,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  User,
  X,
  RotateCcw,
  ShieldAlert,
  Layers,
  Kanban,
  BarChart2,
  Inbox,
  FileText,
  Sliders,
} from 'lucide-react';

interface RecruiterDashboardProps {
  onSelectPlayer: (player: PlayerProfile) => void;
  onOpenMessage: (player: PlayerProfile) => void;
  onOpenSendTrial: (player: PlayerProfile) => void;
}

const POSITIONS = [
  'Goalkeeper',
  'Right back',
  'Centre back',
  'Left back',
  'Defensive midfielder',
  'Central midfielder',
  'Attacking midfielder',
  'Right winger',
  'Left winger',
  'Striker',
];

const PLAYING_LEVELS = [
  'Recreational',
  'School',
  'Academy',
  'District',
  'Provincial',
  'College',
  'University',
  'Semi-professional',
  'Professional',
  'Free agent',
];

const PROVINCES = [
  'Ontario (ON)',
  'Quebec (QC)',
  'British Columbia (BC)',
  'Alberta (AB)',
  'Manitoba (MB)',
  'Nova Scotia (NS)',
];

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({
  onSelectPlayer,
  onOpenMessage,
  onOpenSendTrial,
}) => {
  const { language, t } = useLanguage();
  const { recruiterProfile, userAccount } = useAuth();

  const [activeSuiteTab, setActiveSuiteTab] = useState<
    'search' | 'shortlists' | 'pipeline' | 'calendar' | 'applications' | 'analytics' | 'workspace'
  >('search');

  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [savedPlayersList, setSavedPlayersList] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [reportPlayer, setReportPlayer] = useState<PlayerProfile | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [minAge, setMinAge] = useState<number>(14);
  const [maxAge, setMaxAge] = useState<number>(28);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedFoot, setSelectedFoot] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [proOnly, setProOnly] = useState(false);
  const [openToTrialsOnly, setOpenToTrialsOnly] = useState(false);
  const [willingToRelocateOnly, setWillingToRelocateOnly] = useState(false);

  // Verification status
  const isApproved = recruiterProfile?.verificationStatus === 'approved';

  // Fetch all player profiles from Firestore
  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'playerProfiles'));
      const snap = await getDocs(q);
      const list: PlayerProfile[] = [];
      snap.forEach((d) => {
        list.push({ uid: d.id, ...d.data() } as PlayerProfile);
      });
      setPlayers(list);
    } catch (err) {
      console.error('Error fetching players:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Saved Players
  const fetchSavedPlayers = async () => {
    if (!userAccount?.uid) return;
    try {
      const q = query(
        collection(db, 'savedPlayers'),
        where('recruiterId', '==', userAccount.uid)
      );
      const snap = await getDocs(q);
      const savedList: PlayerProfile[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.playerData) {
          savedList.push(data.playerData as PlayerProfile);
        }
      });
      setSavedPlayersList(savedList);
    } catch (err) {
      console.error('Error fetching saved players:', err);
    }
  };

  useEffect(() => {
    if (userAccount?.uid) {
      fetchPlayers();
      fetchSavedPlayers();
    }
  }, [userAccount?.uid]);

  // Apply filters and calculate match results
  const playersWithMatches = players
    .filter((p) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = (p.fullName || '').toLowerCase().includes(term);
        const matchClub = (p.currentOrganization || '').toLowerCase().includes(term);
        const matchCity = (p.city || '').toLowerCase().includes(term);
        if (!matchName && !matchClub && !matchCity) return false;
      }

      if (selectedPosition && p.primaryPosition !== selectedPosition && p.secondaryPosition !== selectedPosition) {
        return false;
      }

      if (p.age && (p.age < minAge || p.age > maxAge)) {
        return false;
      }

      if (selectedProvince && p.province !== selectedProvince) {
        return false;
      }

      if (selectedCity && !(p.city || '').toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }

      if (selectedFoot && p.preferredFoot !== selectedFoot) {
        return false;
      }

      if (selectedLevel && p.playingLevel !== selectedLevel) {
        return false;
      }

      if (proOnly && p.membership !== 'PRO') {
        return false;
      }

      if (openToTrialsOnly && !p.openToTrials) {
        return false;
      }

      if (willingToRelocateOnly && !p.willingToRelocate) {
        return false;
      }

      return true;
    })
    .map((p) => {
      const matchResult = recruiterProfile
        ? calculateRecruiterPlayerMatch(recruiterProfile, p)
        : undefined;
      return { player: p, matchResult };
    })
    .sort((a, b) => (b.matchResult?.matchScore || 0) - (a.matchResult?.matchScore || 0));

  const currentFilterObject: SearchFilters = {
    position: selectedPosition,
    location: selectedProvince,
    playingLevel: selectedLevel,
    preferredFoot: selectedFoot,
    minAge,
    maxAge,
  };

  const applySavedFilters = (filters: SearchFilters) => {
    if (filters.position) setSelectedPosition(filters.position);
    if (filters.location) setSelectedProvince(filters.location);
    if (filters.playingLevel) setSelectedLevel(filters.playingLevel);
    if (filters.preferredFoot) setSelectedFoot(filters.preferredFoot);
    if (filters.minAge) setMinAge(filters.minAge);
    if (filters.maxAge) setMaxAge(filters.maxAge);
  };

  const handleFeedback = async (targetId: string, feedbackType: FeedbackType) => {
    if (!userAccount?.uid) return;
    try {
      await saveRecommendationFeedback(userAccount.uid, targetId, 'player', feedbackType);
      if (feedbackType === 'dismissed' || feedbackType === 'notInterested') {
        setPlayers((prev) => prev.filter((p) => p.uid !== targetId));
      }
    } catch (err) {
      console.warn('Feedback save warning:', err);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedPosition('');
    setMinAge(14);
    setMaxAge(28);
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedFoot('');
    setSelectedLevel('');
    setProOnly(false);
    setOpenToTrialsOnly(false);
    setWillingToRelocateOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white">
      {/* Verification Status Banner */}
      {!isApproved && (
        <div className="p-4 bg-amber-950/60 border border-amber-800/80 rounded-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-2xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">
                {language === 'fr'
                  ? 'Compte Recruteur en attente d’examen'
                  : 'Recruiter Account Pending Review'}
              </p>
              <p className="text-[11px] text-amber-200/80">{t('pendingApprovalNotice')}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold uppercase shrink-0">
            {t('pendingStatus')}
          </span>
        </div>
      )}

      {/* Primary Scouting Suite Navigation Bar */}
      <div className="bg-[#0A0E17] border border-slate-800 p-3 rounded-3xl space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2 pt-1">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span>{t('clubScoutingTitle')}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Professional scouting workspace: discover candidates, organize shortlists, manage pipeline stages & schedule trials.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Sliders className="w-4 h-4" />
              <span>{t('compareTab')}</span>
            </button>
          </div>
        </div>

        {/* Suite Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSuiteTab('search')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSuiteTab === 'search'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search & Watchlist</span>
          </button>

          <button
            onClick={() => setActiveSuiteTab('shortlists')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSuiteTab === 'shortlists'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('shortlistsTab')}</span>
          </button>

          <button
            onClick={() => setActiveSuiteTab('pipeline')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSuiteTab === 'pipeline'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>{t('scoutingPipelineTab')}</span>
          </button>

          <button
            onClick={() => setActiveSuiteTab('calendar')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSuiteTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('calendarTab')}</span>
          </button>

          <button
            onClick={() => setActiveSuiteTab('applications')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSuiteTab === 'applications'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>{t('applications')}</span>
          </button>

          <button
            onClick={() => setActiveSuiteTab('analytics')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSuiteTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>{t('analyticsTab')}</span>
          </button>

          <button
            onClick={() => setActiveSuiteTab('workspace')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSuiteTab === 'workspace'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>{t('teamWorkspace')}</span>
          </button>
        </div>
      </div>

      {/* SUITE CONTENT SECTIONS */}

      {/* 0. TEAM WORKSPACE TAB */}
      {activeSuiteTab === 'workspace' && (
        <TeamWorkspaceView />
      )}

      {/* 1. SHORTLISTS SUITE TAB */}
      {activeSuiteTab === 'shortlists' && userAccount?.uid && (
        <ShortlistManager
          recruiterId={userAccount.uid}
          allPlayers={players}
          onSelectPlayer={onSelectPlayer}
        />
      )}

      {/* 2. PIPELINE KANBAN SUITE TAB */}
      {activeSuiteTab === 'pipeline' && userAccount?.uid && (
        <PipelineKanban
          recruiterId={userAccount.uid}
          allPlayers={players}
          onSelectPlayer={onSelectPlayer}
          onOpenMessage={onOpenMessage}
          onOpenSendTrial={onOpenSendTrial}
        />
      )}

      {/* 3. CALENDAR & TRIALS SUITE TAB */}
      {activeSuiteTab === 'calendar' && userAccount?.uid && (
        <ScoutingCalendarView
          recruiterId={userAccount.uid}
          allPlayers={players}
        />
      )}

      {/* 4. APPLICATIONS SUITE TAB */}
      {activeSuiteTab === 'applications' && userAccount?.uid && (
        <PlayerApplicationsView
          recruiterId={userAccount.uid}
          allPlayers={players}
          onSelectPlayer={onSelectPlayer}
          onOpenMessage={onOpenMessage}
          onOpenSendTrial={onOpenSendTrial}
        />
      )}

      {/* 5. ANALYTICS SUITE TAB */}
      {activeSuiteTab === 'analytics' && userAccount?.uid && (
        <ScoutingAnalyticsView recruiterId={userAccount.uid} />
      )}

      {/* 6. SEARCH & WATCHLIST TAB (Original Search with Saved Presets Integration) */}
      {activeSuiteTab === 'search' && (
        <div className="space-y-6">
          {userAccount?.uid && (
            <SavedSearchesManager
              recruiterId={userAccount.uid}
              currentFilters={currentFilterObject}
              onApplyFilters={applySavedFilters}
            />
          )}

          {/* Sub Tab Switcher */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-slate-400">
              Talent Directory ({playersWithMatches.length} candidates match criteria)
            </span>

            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-1.5 rounded-xl transition-all ${
                  activeTab === 'search' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('players')} ({playersWithMatches.length})
              </button>

              <button
                onClick={() => {
                  setActiveTab('saved');
                  fetchSavedPlayers();
                }}
                className={`px-4 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'saved' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {t('savedPlayers')} ({savedPlayersList.length})
              </button>
            </div>
          </div>

          {activeTab === 'search' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Col: Multi-faceted Search Filters */}
              <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-5 space-y-4 h-fit">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-bold text-xs flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-400" />
                    <span>{t('filter')}</span>
                  </span>
                  <button
                    onClick={resetFilters}
                    className="text-[11px] text-blue-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('clearFilters')}
                  </button>
                </div>

                {/* Keyword Search */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Search Keyword</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Player name, club, city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">{t('primaryPosition')}</label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="">All Positions</option>
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Age Range Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>{t('ageRange')}</span>
                    <span className="text-blue-400">{minAge} - {maxAge} yrs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={14}
                      max={30}
                      value={minAge}
                      onChange={(e) => setMinAge(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <input
                      type="range"
                      min={14}
                      max={30}
                      value={maxAge}
                      onChange={(e) => setMaxAge(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>

                {/* Province */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">{t('province')}</label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="">All Provinces</option>
                    {PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Playing Level */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">{t('playingLevel')}</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="">All Playing Levels</option>
                    {PLAYING_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Checkbox Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proOnly}
                      onChange={(e) => setProOnly(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600"
                    />
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 fill-current" /> {t('proOnly')}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={openToTrialsOnly}
                      onChange={(e) => setOpenToTrialsOnly(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600"
                    />
                    <span>{t('openToTrialsOnly')}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={willingToRelocateOnly}
                      onChange={(e) => setWillingToRelocateOnly(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600"
                    />
                    <span>{t('relocateOnly')}</span>
                  </label>
                </div>
              </div>

              {/* Right 3 Cols: Player Search Results Grid */}
              <div className="lg:col-span-3">
                {loading ? (
                  <div className="text-center py-12 text-slate-400 text-xs">{t('loading')}</div>
                ) : playersWithMatches.length === 0 ? (
                  <div className="text-center py-16 bg-[#0A0E17] border border-slate-800 rounded-3xl p-8">
                    <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-300">{t('noPlayersFound')}</p>
                    <button
                      onClick={resetFilters}
                      className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl text-xs font-bold"
                    >
                      {t('clearFilters')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playersWithMatches.map(({ player, matchResult }) => {
                      const isPro = player.membership === 'PRO';
                      return (
                        <div
                          key={player.uid}
                          className="bg-[#0A0E17] border border-slate-800 hover:border-blue-500/60 rounded-3xl p-5 flex flex-col justify-between transition-all group"
                        >
                          <div>
                            {/* Header Badge & Match Score */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                                {player.profilePhotoUrl ? (
                                  <img
                                    src={player.profilePhotoUrl}
                                    alt={player.fullName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-bold text-blue-400">
                                    {player.fullName?.charAt(0)}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    isPro
                                      ? 'bg-amber-500 text-slate-950'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {isPro ? t('proBadge') : t('freeBadge')}
                                </span>
                                {matchResult && matchResult.matchScore > 0 && (
                                  <MatchScoreBadge
                                    matchResult={matchResult}
                                    currentUserId={userAccount?.uid}
                                    onFeedback={handleFeedback}
                                    compact
                                  />
                                )}
                              </div>
                            </div>

                            {/* Player Details */}
                            <h3 className="font-extrabold text-base text-white group-hover:text-blue-400 transition-colors">
                              {player.fullName}
                            </h3>

                            <p className="text-xs font-bold text-blue-400 mt-0.5">
                              {player.primaryPosition}
                            </p>

                            <div className="text-xs text-slate-400 space-y-1 mt-2">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                <span>{player.city}, {player.province}</span>
                              </div>
                              <div>Club: <strong className="text-slate-300">{player.currentOrganization || 'Free Agent'}</strong></div>
                              <div>Age: <strong className="text-slate-300">{player.age || 18} yrs</strong> • Foot: <strong className="text-slate-300">{player.preferredFoot || 'Right'}</strong></div>
                            </div>
                          </div>

                          {/* Card Bottom CTA */}
                          <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onSelectPlayer(player)}
                                className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-bold border border-blue-500/30 transition-all text-center"
                              >
                                {t('viewProfile')}
                              </button>

                              {userAccount?.uid && (
                                <SaveButton
                                  targetId={player.uid}
                                  targetType="player"
                                  targetOwnerId={player.uid}
                                  targetData={player}
                                  currentUserId={userAccount.uid}
                                  variant="icon"
                                />
                              )}

                              <button
                                onClick={() => onOpenMessage(player)}
                                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800"
                                title="Message Player"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => setReportPlayer(player)}
                              className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-1.5 transition-all"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              <span>{t('generateReport')}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Saved Players View */}
          {activeTab === 'saved' && (
            <div>
              {savedPlayersList.length === 0 ? (
                <div className="text-center py-16 bg-[#0A0E17] border border-slate-800 rounded-3xl p-8">
                  <Bookmark className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-300">No saved players yet.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click the Save button on any player profile to add them to your recruitment watchlist.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedPlayersList.map((player) => (
                    <div
                      key={player.uid}
                      className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                          {player.profilePhotoUrl ? (
                            <img
                              src={player.profilePhotoUrl}
                              alt={player.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-blue-400">
                              {player.fullName?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-white">{player.fullName}</h3>
                          <p className="text-xs font-bold text-blue-400">{player.primaryPosition}</p>
                          <p className="text-xs text-slate-400">{player.city}, {player.province}</p>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-800 flex gap-2">
                        <button
                          onClick={() => onSelectPlayer(player)}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                        >
                          {t('viewProfile')}
                        </button>
                        <button
                          onClick={() => setReportPlayer(player)}
                          className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Report</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Comparison Modal Overlay */}
      {showCompareModal && (
        <PlayerComparisonModal
          allPlayers={players}
          onClose={() => setShowCompareModal(false)}
          onSelectPlayer={onSelectPlayer}
        />
      )}

      {/* Printable Report Modal Overlay */}
      {reportPlayer && userAccount?.uid && (
        <ScoutingReportModal
          player={reportPlayer}
          recruiterId={userAccount.uid}
          onClose={() => setReportPlayer(null)}
        />
      )}
    </div>
  );
};

