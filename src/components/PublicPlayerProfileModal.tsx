import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PlayerProfile, VideoMetadata, PlayerPhoto } from '../types';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { FollowButton } from './FollowButton';
import { FollowersModal } from './FollowersModal';
import { SaveButton } from './SaveButton';
import { isItemSaved } from '../services/saveService';
import { getFollowCounts } from '../services/followService';
import { recordProfileViewNotification } from '../services/notificationService';

// Phase 8 Scouting Suite Components
import { PrivateNotesManager } from './scouting/PrivateNotesManager';
import { PlayerTimelineView } from './scouting/PlayerTimelineView';
import { ScoutingReportModal } from './scouting/ScoutingReportModal';

import {
  X,
  MapPin,
  Bookmark,
  MessageSquare,
  Calendar,
  Award,
  Video,
  FileText,
  Sparkles,
  Shield,
  Play,
  Check,
  Globe,
  ExternalLink,
  Image as ImageIcon,
  Film,
  Users,
  Clock,
  Printer,
} from 'lucide-react';

interface PublicPlayerProfileModalProps {
  player: PlayerProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMessage: (player: PlayerProfile) => void;
  onOpenSendTrial: (player: PlayerProfile) => void;
}

export const PublicPlayerProfileModal: React.FC<PublicPlayerProfileModalProps> = ({
  player,
  isOpen,
  onClose,
  onOpenMessage,
  onOpenSendTrial,
}) => {
  const { language, t } = useLanguage();
  const { userAccount, recruiterProfile, devRoleOverride } = useAuth();

  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [photos, setPhotos] = useState<PlayerPhoto[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);
  const [activePhotoLightbox, setActivePhotoLightbox] = useState<PlayerPhoto | null>(null);

  // Follow System state
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [showFollowersModal, setShowFollowersModal] = useState<boolean>(false);
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers');

  // Scouting Report state
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const role = devRoleOverride || userAccount?.role || 'player';
  const isRecruiterOrClub = role === 'recruiter' || role === 'club' || !!recruiterProfile;

  useEffect(() => {
    if (player?.uid) {
      // Record profile view notification with 24-hr cooldown
      if (userAccount?.uid && userAccount.uid !== player.uid) {
        recordProfileViewNotification(
          {
            uid: userAccount.uid,
            fullName: userAccount.fullName,
            role: userAccount.role,
            photoURL: userAccount.photoURL,
          },
          player.uid
        ).catch(() => {});
      }

      // Fetch follow counts
      getFollowCounts(player.uid).then((counts) => {
        setFollowersCount(counts.followersCount);
        setFollowingCount(counts.followingCount);
      });

      // 1. Fetch player highlight videos
      const fetchPlayerVideos = async () => {
        try {
          const vQ = query(collection(db, 'videos'), where('playerId', '==', player.uid));
          const vSnap = await getDocs(vQ);
          const vList: VideoMetadata[] = [];
          vSnap.forEach((d) => {
            const data = d.data() as VideoMetadata;
            // Visibility filtering
            const vis = data.visibility || 'public';
            if (vis === 'public' || (vis === 'recruitersOnly' && isRecruiterOrClub)) {
              vList.push({ id: d.id, ...data });
            }
          });
          setVideos(vList);
        } catch (err) {
          console.error('Error fetching player videos:', err);
        }
      };

      // 2. Fetch player gallery photos
      const fetchPlayerPhotos = async () => {
        try {
          const pQ = query(collection(db, 'playerProfiles', player.uid, 'photos'));
          const pSnap = await getDocs(pQ);
          const pList: PlayerPhoto[] = [];
          pSnap.forEach((d) => {
            const data = d.data() as PlayerPhoto;
            const vis = data.visibility || 'public';
            if (vis === 'public' || (vis === 'recruitersOnly' && isRecruiterOrClub)) {
              pList.push({ id: d.id, ...data });
            }
          });
          pList.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          setPhotos(pList);
        } catch (err) {
          console.error('Error fetching player photos:', err);
        }
      };

      // 3. Check if player is saved
      const checkSavedStatus = async () => {
        if (!userAccount?.uid) return;
        try {
          const saved = await isItemSaved(userAccount.uid, player.uid, 'player');
          setIsSaved(saved);
        } catch (err) {
          console.error('Error checking saved status:', err);
        }
      };

      fetchPlayerVideos();
      fetchPlayerPhotos();
      checkSavedStatus();
    }
  }, [player?.uid, userAccount?.uid, isRecruiterOrClub]);

  if (!isOpen || !player) return null;

  const isPro = player.membership === 'PRO';

  // Toggle Save Player
  const handleToggleSave = async () => {
    if (!userAccount?.uid) return;
    try {
      if (isSaved && savedDocId) {
        await deleteDoc(doc(db, 'savedPlayers', savedDocId));
        setIsSaved(false);
        setSavedDocId(null);
      } else {
        const docRef = await addDoc(collection(db, 'savedPlayers'), {
          recruiterId: userAccount.uid,
          playerId: player.uid,
          playerData: player,
          savedAt: serverTimestamp(),
        });
        setIsSaved(true);
        setSavedDocId(docRef.id);
      }
    } catch (err) {
      console.error('Error toggling save player:', err);
    }
  };

  const handleOpenFollowers = (tab: 'followers' | 'following') => {
    setFollowersModalTab(tab);
    setShowFollowersModal(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-3xl bg-[#0A0E17] border border-slate-800 rounded-3xl text-white shadow-2xl my-8 overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Hero Header */}
          <div className="relative bg-gradient-to-r from-blue-950 via-[#0B132B] to-slate-900 p-6 md:p-8 border-b border-slate-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden border-2 border-blue-500/50 shadow-xl bg-slate-900 shrink-0">
                  {player.profilePhotoUrl ? (
                    <img
                      src={player.profilePhotoUrl}
                      alt={player.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-blue-400">
                      {player.fullName?.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black">{player.fullName}</h2>
                    {isPro && (
                      <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black rounded-full text-[10px] flex items-center gap-1 shadow-md">
                        <Sparkles className="w-3 h-3 fill-current" /> PRO
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-blue-400 mt-0.5">
                    {player.primaryPosition} {player.secondaryPosition ? ` / ${player.secondaryPosition}` : ''}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {player.city}, {player.province}
                    </span>
                    <span>•</span>
                    <span>Age: {player.age || 18}</span>
                    <span>•</span>
                    <span>{player.currentOrganization}</span>
                  </div>

                  {/* Followers & Following Counts */}
                  <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-300">
                    <button
                      type="button"
                      onClick={() => handleOpenFollowers('followers')}
                      className="hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                      <span className="font-bold text-white">{followersCount}</span>
                      <span className="text-slate-400">{t('followers')}</span>
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleOpenFollowers('following')}
                      className="hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                      <span className="font-bold text-white">{followingCount}</span>
                      <span className="text-slate-400">{t('following')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {userAccount?.uid && userAccount.uid !== player.uid && (
                  <FollowButton
                    targetId={player.uid}
                    targetRole="player"
                    currentUserId={userAccount.uid}
                    currentUserRole={role}
                    onFollowChange={(isNowFollowing) => {
                      setFollowersCount((prev) => (isNowFollowing ? prev + 1 : Math.max(0, prev - 1)));
                    }}
                    variant="primary"
                    className="!px-4 !py-2.5 !rounded-2xl"
                  />
                )}

                {userAccount?.uid && (
                  <SaveButton
                    targetId={player.uid}
                    targetType="player"
                    targetOwnerId={player.uid}
                    targetData={player}
                    currentUserId={userAccount.uid}
                    isSavedInitial={isSaved}
                    onSaveChange={(nextSaved) => setIsSaved(nextSaved)}
                    variant="button"
                  />
                )}

                <button
                  onClick={() => onOpenMessage(player)}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('sendMessage')}</span>
                </button>

                {isRecruiterOrClub && (
                  <>
                    <button
                      onClick={() => onOpenSendTrial(player)}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4 text-sky-400" />
                      <span>{t('inviteToTrial')}</span>
                    </button>

                    <button
                      onClick={() => setShowReportModal(true)}
                      className="px-4 py-3 bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-700/50 rounded-2xl text-xs font-bold flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-indigo-400" />
                      <span>{t('generateReport')}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>


        {/* Details Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs">
            <div>
              <span className="text-slate-500 block">{t('preferredFoot')}</span>
              <span className="font-bold text-slate-200">{player.preferredFoot}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t('heightCm')} / {t('weightKg')}</span>
              <span className="font-bold text-slate-200">{player.heightCm} cm / {player.weightKg} kg</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t('playingLevel')}</span>
              <span className="font-bold text-blue-400">{player.playingLevel}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t('availabilityStatus')}</span>
              <span className="font-bold text-emerald-400">{player.availabilityStatus}</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
              {t('bio')}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
              {player.bio || 'No biography provided.'}
            </p>
          </div>

          {/* Photo Gallery Section */}
          {photos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>{t('playerPhotosSection')} ({photos.length})</span>
              </h3>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((ph) => (
                  <div
                    key={ph.id}
                    onClick={() => setActivePhotoLightbox(ph)}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer hover:border-blue-500/60 group transition-all"
                  >
                    <img
                      src={ph.downloadUrl}
                      alt={ph.caption || 'Player photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {ph.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-[10px] text-white truncate">{ph.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos Section */}
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Video className="w-4 h-4 text-rose-400" />
              <span>{t('uploadedVideos')} ({videos.length})</span>
            </h3>

            {videos.length === 0 ? (
              <p className="text-xs text-slate-500 italic">{t('noVideosYet')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-blue-500/50 transition-colors"
                  >
                    {vid.sourceType === 'upload' && vid.downloadUrl ? (
                      <div className="aspect-video w-full bg-slate-950 rounded-xl overflow-hidden mb-2">
                        <video src={vid.downloadUrl} controls className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{vid.title}</h4>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {vid.videoType}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
                      <span className="text-slate-400 font-medium truncate">{vid.title}</span>
                      <a
                        href={vid.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline shrink-0 flex items-center gap-1 font-bold"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Soccer CV Download */}
          {player.soccerCvUrl && (
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-bold">Soccer CV Document</span>
              </div>
              <a
                href={player.soccerCvUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <span>{t('downloadCv')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* PRIVATE SCOUTING NOTES & TAGS (Only visible to Recruiters / Clubs) */}
          {isRecruiterOrClub && userAccount?.uid && (
            <div className="pt-4 border-t border-slate-800 space-y-6">
              <PrivateNotesManager
                recruiterId={userAccount.uid}
                playerId={player.uid}
                playerName={player.fullName}
              />

              <PlayerTimelineView
                playerId={player.uid}
                recruiterId={userAccount.uid}
              />
            </div>
          )}

          {/* GUARDIAN SAFETY NOTICE */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              {t('guardianContactHidden')}
            </span>
            <span className="text-slate-600">Safety ID: {player.uid.slice(0, 8)}</span>
          </div>
        </div>
      </div>
    </div>

      {/* Scouting Report Modal */}
      {showReportModal && userAccount?.uid && (
        <ScoutingReportModal
          player={player}
          recruiterId={userAccount.uid}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Lightbox for Gallery Photos */}

      {activePhotoLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl p-4 overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setActivePhotoLightbox(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/80 rounded-full text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activePhotoLightbox.downloadUrl}
              alt="Expanded view"
              className="max-h-[75vh] object-contain rounded-2xl"
            />
            {activePhotoLightbox.caption && (
              <p className="mt-3 text-xs text-slate-300 italic text-center">
                "{activePhotoLightbox.caption}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Followers / Following Modal */}
      {showFollowersModal && (
        <FollowersModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          userId={player.uid}
          initialTab={followersModalTab}
          currentUserId={userAccount?.uid}
          currentUserRole={role}
        />
      )}
    </>
  );
};

