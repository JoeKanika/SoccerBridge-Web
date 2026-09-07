import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { VideoMetadata, TrialInvitation, PlayerPhoto, MediaVisibility, VideoType, VideoSourceType } from '../types';
import { db, auth } from '../firebase';
import { FollowersModal } from './FollowersModal';
import { getFollowCounts } from '../services/followService';
import {
  uploadSoccerCv,
  uploadGalleryPhoto,
  uploadPlayerVideo,
  deleteStorageFile,
  getStorageErrorMessage,
} from '../utils/storageHelpers';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  doc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import {
  User,
  Eye,
  Bookmark,
  MessageSquare,
  Award,
  Video,
  Upload,
  FileText,
  Sparkles,
  Edit,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  MapPin,
  Play,
  Loader2,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  Camera,
  Star,
  ArrowUp,
  ArrowDown,
  Globe,
  Lock,
  ShieldAlert,
  X,
  RefreshCw,
  Film,
  Users,
  UserCheck,
} from 'lucide-react';

interface PlayerDashboardProps {
  onOpenProModal: () => void;
  onOpenEditProfile: () => void;
  onNavigateToMessages: () => void;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  onOpenProModal,
  onOpenEditProfile,
  onNavigateToMessages,
}) => {
  const { language, t } = useLanguage();
  const { playerProfile, userAccount, savePlayerProfile, devRoleOverride } = useAuth();

  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<PlayerPhoto[]>([]);
  const [trials, setTrials] = useState<TrialInvitation[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  // Follow System state
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [showFollowersModal, setShowFollowersModal] = useState<boolean>(false);
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers');

  const role = devRoleOverride || userAccount?.role || 'player';


  // --- Photo Gallery Modal State ---
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoVisibility, setPhotoVisibility] = useState<MediaVisibility>('public');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // --- Video Modal State ---
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoMode, setVideoMode] = useState<'upload' | 'link'>('upload');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoType, setVideoType] = useState<VideoType>('highlight');
  const [videoVisibility, setVideoVisibility] = useState<MediaVisibility>('public');
  const [videoExternalUrl, setVideoExternalUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [uploadTaskRef, setUploadTaskRef] = useState<any | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // --- CV Upload Modal State ---
  const [showCvModal, setShowCvModal] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvProgress, setCvProgress] = useState(0);
  const [cvError, setCvError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const isPro = playerProfile?.membership === 'PRO' || userAccount?.membership === 'PRO';

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    if (!userAccount?.uid) return;
    setLoadingContent(true);
    try {
      // 1. Fetch videos
      const videoQ = query(
        collection(db, 'videos'),
        where('playerId', '==', userAccount.uid)
      );
      const vSnap = await getDocs(videoQ);
      const fetchedVideos: VideoMetadata[] = [];
      vSnap.forEach((docSnap) => {
        fetchedVideos.push({ id: docSnap.id, ...docSnap.data() } as VideoMetadata);
      });
      setVideos(fetchedVideos);

      // 2. Fetch gallery photos
      try {
        const photoQ = query(
          collection(db, 'playerProfiles', userAccount.uid, 'photos')
        );
        const pSnap = await getDocs(photoQ);
        const fetchedPhotos: PlayerPhoto[] = [];
        pSnap.forEach((docSnap) => {
          fetchedPhotos.push({ id: docSnap.id, ...docSnap.data() } as PlayerPhoto);
        });
        fetchedPhotos.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setGalleryPhotos(fetchedPhotos);
      } catch (photoErr) {
        console.warn('Could not fetch gallery photos:', photoErr);
      }

      // 3. Fetch trial invitations
      const trialQ = query(
        collection(db, 'trialInvitations'),
        where('playerId', '==', userAccount.uid)
      );
      const tSnap = await getDocs(trialQ);
      const fetchedTrials: TrialInvitation[] = [];
      tSnap.forEach((docSnap) => {
        fetchedTrials.push({ id: docSnap.id, ...docSnap.data() } as TrialInvitation);
      });
      setTrials(fetchedTrials);

      // 4. Fetch follow counts
      getFollowCounts(userAccount.uid).then((counts) => {
        setFollowersCount(counts.followersCount);
        setFollowingCount(counts.followingCount);
      });
    } catch (err) {

      console.error('Error fetching dashboard content:', err);
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userAccount?.uid]);

  // --- GALLERY PHOTO HANDLERS ---
  const handleSelectGalleryPhoto = async (file: File) => {
    setPhotoError(null);
    setPhotoSuccess(null);

    // FREE plan limit: 5 photos
    if (!isPro && galleryPhotos.length >= 5) {
      setPhotoError(t('galleryLimitNotice'));
      return;
    }

    if (auth.authStateReady) {
      await auth.authStateReady();
    }
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.uid) {
      setPhotoError(
        language === 'fr'
          ? 'Vous n’êtes pas connecté. Veuillez vous connecter.'
          : 'You are not signed in. Please sign in to upload.'
      );
      return;
    }

    setPhotoUploading(true);
    setPhotoProgress(0);

    const tempPhotoId = `photo_${Date.now()}`;

    try {
      const res = await uploadGalleryPhoto(tempPhotoId, file, (progress) => {
        setPhotoProgress(progress);
      });

      const photoPayload = {
        playerId: currentUser.uid,
        downloadUrl: res.downloadUrl,
        storagePath: res.storagePath,
        fileName: res.fileName || '',
        contentType: res.contentType || 'image/jpeg',
        caption: typeof photoCaption === 'string' ? photoCaption.trim() : '',
        displayOrder: galleryPhotos.length + 1,
        isPrimary: galleryPhotos.length === 0,
        visibility: photoVisibility || 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, 'playerProfiles', currentUser.uid, 'photos'),
        photoPayload
      );

      // If first photo, set as primary automatically on profile
      if (galleryPhotos.length === 0) {
        await savePlayerProfile({
          profilePhotoUrl: res.downloadUrl,
          profilePhotoStoragePath: res.storagePath,
          profilePhotoFileName: res.fileName,
          profilePhotoContentType: res.contentType,
        });
      }

      setPhotoSuccess(t('galleryPhotoUploaded'));
      setPhotoCaption('');
      setShowPhotoModal(false);
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Error uploading gallery photo:', err);
      setPhotoError(getStorageErrorMessage(err, language));
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSetPrimaryPhoto = async (photo: PlayerPhoto) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.uid) return;

    try {
      // 1. Update primary status across gallery documents
      for (const p of galleryPhotos) {
        const isThisPrimary = p.id === photo.id;
        await setDoc(
          doc(db, 'playerProfiles', currentUser.uid, 'photos', p.id),
          {
            isPrimary: isThisPrimary,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // 2. Update player profile document
      await savePlayerProfile({
        profilePhotoUrl: photo.downloadUrl,
        profilePhotoStoragePath: photo.storagePath,
        profilePhotoFileName: photo.fileName,
        profilePhotoContentType: photo.contentType,
      });

      await fetchDashboardData();
    } catch (err) {
      console.error('Error setting primary photo:', err);
    }
  };

  const handleDeleteGalleryPhoto = async (photo: PlayerPhoto) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.uid) return;

    if (!window.confirm(t('confirmDeletePhoto'))) return;

    try {
      await deleteStorageFile(photo.storagePath);
      await deleteDoc(doc(db, 'playerProfiles', currentUser.uid, 'photos', photo.id));
      await fetchDashboardData();
    } catch (err) {
      console.error('Error deleting gallery photo:', err);
    }
  };

  // --- VIDEO HANDLERS ---
  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoError(null);

    // Check FREE vs PRO limit (1 video max for FREE)
    if (!isPro && videos.length >= 1) {
      setVideoError(
        language === 'fr'
          ? 'Le plan GRATUIT est limité à 1 vidéo. Passez à PRO pour des vidéos illimitées !'
          : 'FREE Plan is limited to 1 video. Upgrade to PRO for unlimited videos!'
      );
      return;
    }

    if (!videoTitle.trim()) {
      setVideoError(language === 'fr' ? 'Veuillez saisir un titre pour la vidéo.' : 'Please enter a video title.');
      return;
    }

    if (auth.authStateReady) {
      await auth.authStateReady();
    }
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.uid) {
      setVideoError(
        language === 'fr'
          ? 'Vous n’êtes pas connecté. Veuillez vous connecter.'
          : 'You are not signed in. Please sign in to upload.'
      );
      return;
    }

    setVideoUploading(true);
    setVideoProgress(0);

    try {
      if (videoMode === 'upload') {
        if (!videoFile) {
          setVideoError(language === 'fr' ? 'Veuillez sélectionner un fichier vidéo.' : 'Please select a video file.');
          setVideoUploading(false);
          return;
        }

        const tempVideoId = `video_${Date.now()}`;
        const res = await uploadPlayerVideo(
          tempVideoId,
          videoFile,
          (progress) => setVideoProgress(progress),
          (task) => setUploadTaskRef(task)
        );

        const videoPayload = {
          playerId: currentUser.uid,
          title: typeof videoTitle === 'string' ? videoTitle.trim() : '',
          description: typeof videoDescription === 'string' ? videoDescription.trim() : '',
          videoType: videoType || 'highlight',
          sourceType: 'upload' as VideoSourceType,
          storagePath: res.storagePath || '',
          downloadUrl: res.downloadUrl || '',
          fileName: res.fileName || '',
          contentType: res.contentType || 'video/mp4',
          visibility: videoVisibility || 'public',
          processingStatus: 'ready' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'videos'), videoPayload);
      } else {
        // External link mode (YouTube / Vimeo)
        if (!videoExternalUrl.trim()) {
          setVideoError(t('invalidVideoUrl'));
          setVideoUploading(false);
          return;
        }

        const isYoutube = /youtube\.com|youtu\.be/i.test(videoExternalUrl);
        const isVimeo = /vimeo\.com/i.test(videoExternalUrl);

        if (!isYoutube && !isVimeo) {
          setVideoError(t('invalidVideoUrl'));
          setVideoUploading(false);
          return;
        }

        const provider = isYoutube ? 'youtube' : 'vimeo';

        const videoPayload = {
          playerId: currentUser.uid,
          title: typeof videoTitle === 'string' ? videoTitle.trim() : '',
          description: typeof videoDescription === 'string' ? videoDescription.trim() : '',
          videoType: videoType || 'highlight',
          sourceType: provider as VideoSourceType,
          provider: provider || 'youtube',
          externalUrl: typeof videoExternalUrl === 'string' ? videoExternalUrl.trim() : '',
          downloadUrl: typeof videoExternalUrl === 'string' ? videoExternalUrl.trim() : '',
          storagePath: '',
          visibility: videoVisibility || 'public',
          processingStatus: 'ready' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'videos'), videoPayload);
      }

      setShowVideoModal(false);
      setVideoTitle('');
      setVideoDescription('');
      setVideoExternalUrl('');
      setVideoFile(null);
      setUploadTaskRef(null);
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Video submit error:', err);
      setVideoError(getStorageErrorMessage(err, language));
    } finally {
      setVideoUploading(false);
    }
  };

  const handleCancelVideoUpload = () => {
    if (uploadTaskRef) {
      try {
        uploadTaskRef.cancel();
      } catch (e) {
        // Ignore
      }
    }
    setVideoUploading(false);
    setVideoProgress(0);
    setUploadTaskRef(null);
  };

  const handleDeleteVideo = async (video: VideoMetadata) => {
    if (!window.confirm(language === 'fr' ? 'Supprimer cette vidéo ?' : 'Delete this video?')) return;
    try {
      if (video.storagePath) {
        await deleteStorageFile(video.storagePath);
      }
      await deleteDoc(doc(db, 'videos', video.id));
      await fetchDashboardData();
    } catch (err) {
      console.error('Error deleting video:', err);
    }
  };

  // --- CV UPLOAD HANDLER ---
  const handleDashboardCvSelect = async (file: File) => {
    setCvError(null);
    if (auth.authStateReady) {
      await auth.authStateReady();
    }
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.uid) {
      setCvError(
        language === 'fr'
          ? 'Vous n’êtes pas connecté. Veuillez vous connecter.'
          : 'You are not signed in. Please sign in to upload.'
      );
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setCvError(t('errInvalidPdfType'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCvError(t('errPdfSize'));
      return;
    }

    setCvUploading(true);
    setCvProgress(0);

    const oldCvPath = playerProfile?.soccerCvStoragePath;

    try {
      const res = await uploadSoccerCv(currentUser.uid, file, (progress) => {
        setCvProgress(progress);
      });

      await savePlayerProfile({
        soccerCvUrl: res.downloadUrl,
        soccerCvStoragePath: res.storagePath,
        soccerCvFileName: res.fileName,
        soccerCvContentType: res.contentType,
        soccerCvUploadedAt: new Date().toISOString(),
      });

      if (oldCvPath && oldCvPath !== res.storagePath) {
        await deleteStorageFile(oldCvPath);
      }

      setShowCvModal(false);
    } catch (err: any) {
      console.error('Error uploading CV:', err);
      setCvError(getStorageErrorMessage(err, language));
    } finally {
      setCvUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white">
      {/* Hidden File Inputs for Photo Gallery */}
      <input
        type="file"
        ref={photoInputRef}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleSelectGalleryPhoto(e.target.files[0]);
          }
        }}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleSelectGalleryPhoto(e.target.files[0]);
          }
        }}
      />

      {/* Hidden File Input for Video */}
      <input
        type="file"
        ref={videoFileInputRef}
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0]);
          }
        }}
      />

      {/* Profile Header Card */}
      <div className="relative bg-gradient-to-r from-blue-950 via-[#0A0E17] to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden border-2 border-blue-500/50 shadow-xl bg-slate-900">
                {playerProfile?.profilePhotoUrl ? (
                  <img
                    src={playerProfile.profilePhotoUrl}
                    alt={playerProfile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-blue-400">
                    {playerProfile?.fullName?.charAt(0) || 'P'}
                  </div>
                )}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-md ${
                  isPro
                    ? 'bg-amber-500 text-slate-950 border border-amber-300'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {isPro ? t('proBadge') : t('freeBadge')}
              </span>
            </div>

            {/* Name & Info */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold">{playerProfile?.fullName}</h1>
                {isPro && <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                <span className="font-bold text-blue-400">{playerProfile?.primaryPosition}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {playerProfile?.city}, {playerProfile?.province}
                </span>
                <span>•</span>
                <span>{playerProfile?.currentOrganization}</span>
              </div>

              {/* Completion Bar */}
              <div className="mt-3 max-w-xs">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>{t('profileCompletionRate')}</span>
                  <span className="font-bold text-blue-400">
                    {playerProfile?.profileCompletion || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${playerProfile?.profileCompletion || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={onOpenEditProfile}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Edit className="w-4 h-4 text-blue-400" />
              <span>{t('editProfile')}</span>
            </button>

            {!isPro && (
              <button
                onClick={onOpenProModal}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>{t('upgradeToPro')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analytics & Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <div
          onClick={() => {
            setFollowersModalTab('followers');
            setShowFollowersModal(true);
          }}
          className="bg-[#0A0E17] border border-slate-800 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
        >
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-black">{followersCount}</div>
          <p className="text-[11px] text-slate-400">{t('followers')}</p>
        </div>

        <div
          onClick={() => {
            setFollowersModalTab('following');
            setShowFollowersModal(true);
          }}
          className="bg-[#0A0E17] border border-slate-800 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
        >
          <UserCheck className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
          <div className="text-xl font-black">{followingCount}</div>
          <p className="text-[11px] text-slate-400">{t('following')}</p>
        </div>

        <div className="bg-[#0A0E17] border border-slate-800 rounded-2xl p-4 text-center">
          <Eye className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-black">{playerProfile?.profileViewsCount || 0}</div>
          <p className="text-[11px] text-slate-400">{t('profileViews')}</p>
        </div>

        <div className="bg-[#0A0E17] border border-slate-800 rounded-2xl p-4 text-center">
          <Bookmark className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <div className="text-xl font-black">{playerProfile?.savesCount || 0}</div>
          <p className="text-[11px] text-slate-400">{t('recruiterSaves')}</p>
        </div>

        <div
          onClick={onNavigateToMessages}
          className="bg-[#0A0E17] border border-slate-800 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
        >
          <MessageSquare className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
          <div className="text-xl font-black">{playerProfile?.unreadMessagesCount || 0}</div>
          <p className="text-[11px] text-slate-400">{t('unreadMessages')}</p>
        </div>

        <div className="bg-[#0A0E17] border border-slate-800 rounded-2xl p-4 text-center">
          <Award className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <div className="text-xl font-black">{trials.length || 0}</div>
          <p className="text-[11px] text-slate-400">{t('opportunityAlerts')}</p>
        </div>
      </div>


      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Player Gallery, Video Center & Soccer CV */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. PLAYER PHOTO GALLERY PANEL */}
          <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                  <span>{t('playerPhotosSection')}</span>
                  <span className="text-xs font-normal text-slate-400">({galleryPhotos.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('playerPhotosDesc')}
                </p>
              </div>

              <button
                onClick={() => setShowPhotoModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 self-start sm:self-auto transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addGalleryPhoto')}</span>
              </button>
            </div>

            {/* Gallery Grid */}
            {galleryPhotos.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-2xl p-6 space-y-2">
                <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No photos in gallery yet. Upload action shots to stand out!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {galleryPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div className="relative aspect-square bg-slate-950 overflow-hidden">
                      <img
                        src={photo.downloadUrl}
                        alt={photo.caption || 'Player photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />

                      {/* Primary Photo Badge */}
                      {photo.isPrimary && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-lg shadow-md flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current text-yellow-300" />
                          <span>Primary</span>
                        </span>
                      )}

                      {/* Visibility Tag */}
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-md text-slate-300 text-[10px] font-semibold rounded-md flex items-center gap-1">
                        {photo.visibility === 'public' && <Globe className="w-2.5 h-2.5 text-emerald-400" />}
                        {photo.visibility === 'recruitersOnly' && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                        {photo.visibility === 'private' && <Lock className="w-2.5 h-2.5 text-rose-400" />}
                        <span className="capitalize">{photo.visibility}</span>
                      </span>
                    </div>

                    {/* Caption & Actions */}
                    <div className="p-3 space-y-2 bg-slate-900/90">
                      {photo.caption && (
                        <p className="text-[11px] text-slate-300 line-clamp-2 italic">
                          "{photo.caption}"
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
                        {!photo.isPrimary ? (
                          <button
                            onClick={() => handleSetPrimaryPhoto(photo)}
                            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                          >
                            <Star className="w-3 h-3" />
                            <span>Set Primary</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[10px] italic">Active Profile Photo</span>
                        )}

                        <button
                          onClick={() => handleDeleteGalleryPhoto(photo)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. HIGHLIGHT VIDEOS PANEL */}
          <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Video className="w-5 h-5 text-rose-400" />
                  <span>{t('uploadedVideos')}</span>
                  <span className="text-xs font-normal text-slate-400">({videos.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {!isPro && t('freeLimitNotice')}
                </p>
              </div>

              <button
                onClick={() => setShowVideoModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 self-start sm:self-auto transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t('uploadNewVideo')}</span>
              </button>
            </div>

            {/* Video List */}
            {videos.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-2xl p-6 space-y-2">
                <Video className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">{t('noVideosYet')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center">
                      {vid.sourceType === 'upload' && vid.downloadUrl ? (
                        <video
                          src={vid.downloadUrl}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                          <Film className="w-8 h-8 text-blue-400 mb-2" />
                          <span className="text-xs font-bold text-slate-200 line-clamp-1">{vid.title}</span>
                          <a
                            href={vid.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                          >
                            <span>Watch Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 border border-slate-800 rounded-md text-[10px] font-bold uppercase text-blue-400">
                        {vid.videoType}
                      </span>
                    </div>

                    <div className="p-4 flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{vid.title}</h4>
                        {vid.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{vid.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteVideo(vid)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. SOCCER CV CARD */}
          <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-800/40 text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Soccer CV (Curriculum Vitae)</h3>
                <p className="text-xs text-slate-400 truncate max-w-xs">
                  {playerProfile?.soccerCvFileName
                    ? playerProfile.soccerCvFileName
                    : playerProfile?.soccerCvUrl
                    ? 'CV Document Uploaded'
                    : t('noCvYet')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCvModal(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('uploadCv')}</span>
            </button>
          </div>
        </div>

        {/* Right Col: Trial Invitations */}
        <div className="space-y-6">
          <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-sky-400" />
              <span>{t('trialInvitations')}</span>
            </h2>

            {trials.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl p-4">
                No trial invitations yet. Complete your profile and upload highlight videos to get discovered!
              </div>
            ) : (
              <div className="space-y-3">
                {trials.map((trial) => (
                  <div
                    key={trial.id}
                    className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-blue-400">{trial.eventTitle}</h4>
                        <p className="text-xs text-slate-300 font-medium">
                          {trial.recruiterOrg} ({trial.recruiterName})
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-800 rounded-full text-[10px] font-bold">
                        {trial.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">{trial.details}</p>

                    <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{trial.eventDate}</span>
                      <span>•</span>
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{trial.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- ADD GALLERY PHOTO MODAL --- */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 text-white space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-400" />
                <span>{t('addGalleryPhoto')}</span>
              </h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {photoError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            {photoSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{photoSuccess}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">{t('captionPlaceholder')}</label>
                <input
                  type="text"
                  placeholder="e.g. Ontario Cup Semi-Finals, July 2025"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">{t('photoVisibility')}</label>
                <select
                  value={photoVisibility}
                  onChange={(e) => setPhotoVisibility(e.target.value as MediaVisibility)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white"
                >
                  <option value="public">{t('visibilityPublic')}</option>
                  <option value="recruitersOnly">{t('visibilityRecruitersOnly')}</option>
                  <option value="private">{t('visibilityPrivate')}</option>
                </select>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{t('chooseGallery')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={photoUploading}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 text-blue-400" />
                  <span>{t('takePhotoCamera')}</span>
                </button>
              </div>

              {photoUploading && (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>Uploading photo...</span>
                    <span>{photoProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${photoProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / UPLOAD VIDEO MODAL --- */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Video className="w-5 h-5 text-rose-400" />
                <span>{t('uploadVideoSection')}</span>
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Mode Tabs */}
            <div className="flex border-b border-slate-800">
              <button
                type="button"
                onClick={() => setVideoMode('upload')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
                  videoMode === 'upload'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {t('tabUploadFile')}
              </button>
              <button
                type="button"
                onClick={() => setVideoMode('link')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
                  videoMode === 'link'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {t('tabExternalLink')}
              </button>
            </div>

            {videoError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{videoError}</span>
              </div>
            )}

            <form onSubmit={handleVideoSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">{t('videoTitleLabel')} *</label>
                <input
                  type="text"
                  required
                  placeholder={t('videoTitlePlaceholder')}
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">{t('videoTypeLabel')}</label>
                <select
                  value={videoType}
                  onChange={(e) => setVideoType(e.target.value as VideoType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white"
                >
                  <option value="highlight">{t('videoTypeHighlight')}</option>
                  <option value="fullMatch">{t('videoTypeFullMatch')}</option>
                  <option value="training">{t('videoTypeTraining')}</option>
                  <option value="skills">{t('videoTypeSkills')}</option>
                  <option value="trial">{t('videoTypeTrial')}</option>
                </select>
              </div>

              {videoMode === 'upload' ? (
                <div>
                  <label className="block font-bold mb-1">Select Video File *</label>
                  <div
                    onClick={() => videoFileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-slate-800 hover:border-blue-500 bg-slate-900/40 rounded-2xl text-center cursor-pointer transition-colors space-y-2"
                  >
                    <Upload className="w-8 h-8 text-blue-400 mx-auto" />
                    {videoFile ? (
                      <p className="text-xs font-bold text-emerald-400 truncate">{videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)</p>
                    ) : (
                      <p className="text-xs font-bold text-slate-300">{t('dropVideoHere')}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold mb-1">{t('externalUrlLabel')} *</label>
                  <input
                    type="url"
                    required
                    placeholder={t('externalUrlPlaceholder')}
                    value={videoExternalUrl}
                    onChange={(e) => setVideoExternalUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold mb-1">{t('videoDescLabel')}</label>
                <textarea
                  rows={2}
                  placeholder={t('videoDescPlaceholder')}
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white resize-none focus:border-blue-500 focus:outline-none"
                />
              </div>

              {videoUploading && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-[11px] font-bold text-slate-300">
                    <span>{t('uploadingVideo')}</span>
                    <span>{videoProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelVideoUpload}
                    className="text-xs font-bold text-rose-400 hover:underline"
                  >
                    {t('cancelUpload')}
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  disabled={videoUploading}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={videoUploading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2"
                >
                  {videoUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{videoUploading ? t('loading') : t('save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SOCCER CV MODAL --- */}
      {showCvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 text-white space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span>{t('uploadPdfCv')}</span>
            </h3>

            {cvError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{cvError}</span>
              </div>
            )}

            <input
              type="file"
              ref={cvInputRef}
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleDashboardCvSelect(e.target.files[0]);
                }
              }}
            />

            <div
              onClick={() => cvInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-900/40 rounded-2xl text-center cursor-pointer transition-all space-y-2"
            >
              <Upload className="w-8 h-8 text-blue-400 mx-auto" />
              <p className="text-xs font-bold text-white">{t('dropPdfHere')}</p>
              <p className="text-[10px] text-slate-400">Accepted format: PDF (.pdf) • Max 10 MB</p>
            </div>

            {cvUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>{t('uploadingCv')}</span>
                  <span>{cvProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${cvProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCvModal(false)}
                disabled={cvUploading}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Followers / Following Modal */}
      {showFollowersModal && userAccount?.uid && (
        <FollowersModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          userId={userAccount.uid}
          initialTab={followersModalTab}
          currentUserId={userAccount.uid}
          currentUserRole={role}
        />
      )}
    </div>
  );
};

