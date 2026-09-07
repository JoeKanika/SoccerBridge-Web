import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  PrimaryPosition,
  PlayingLevel,
  AvailabilityStatus,
  GuardianInfo,
  PlayerProfile,
} from '../types';
import {
  uploadProfilePhoto,
  copyGooglePhotoToStorage,
  uploadSoccerCv,
  deleteStorageFile,
  getStorageErrorMessage,
} from '../utils/storageHelpers';
import { auth, getFirebaseErrorMessage } from '../firebase';
import {
  User,
  Activity,
  MapPin,
  CheckCircle2,
  Calendar,
  Flag,
  Globe,
  Upload,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileText,
  Video,
  Camera,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  X,
  Loader2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface PlayerOnboardingProps {
  onComplete: () => void;
}

const POSITIONS: PrimaryPosition[] = [
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

const PLAYING_LEVELS: PlayingLevel[] = [
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

const AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  'Actively looking',
  'Open to opportunities',
  'Available for trials',
  'Currently unavailable',
];

const CANADIAN_PROVINCES = [
  'Ontario (ON)',
  'Quebec (QC)',
  'British Columbia (BC)',
  'Alberta (AB)',
  'Manitoba (MB)',
  'Saskatchewan (SK)',
  'Nova Scotia (NS)',
  'New Brunswick (NB)',
  'Newfoundland & Labrador (NL)',
  'Prince Edward Island (PE)',
  'Northwest Territories (NT)',
  'Yukon (YT)',
  'Nunavut (NU)',
];

// Predefined Options for Geographic Availability
const GEOGRAPHIC_OPTIONS = [
  { id: 'My City', labelKey: 'geoMyCity' },
  { id: 'My Province or Territory', labelKey: 'geoMyProvince' },
  { id: 'Anywhere in Canada', labelKey: 'geoAnywhereCanada' },
  { id: 'United States', labelKey: 'geoUnitedStates' },
  { id: 'Europe', labelKey: 'geoEurope' },
  { id: 'Africa', labelKey: 'geoAfrica' },
  { id: 'South America', labelKey: 'geoSouthAmerica' },
  { id: 'Asia', labelKey: 'geoAsia' },
  { id: 'Worldwide', labelKey: 'geoWorldwide' },
  { id: 'Other', labelKey: 'geoOther' },
];

// Predefined Options for Short-Term Goals
const SHORT_TERM_GOAL_OPTIONS = [
  { id: 'Find a New Club', labelKey: 'stgNewClub' },
  { id: 'Get Scouted', labelKey: 'stgGetScouted' },
  { id: 'Attend Trials', labelKey: 'stgAttendTrials' },
  { id: 'Earn More Playing Time', labelKey: 'stgPlayingTime' },
  { id: 'Improve Technical Skills', labelKey: 'stgTechnicalSkills' },
  { id: 'Improve Physical Fitness', labelKey: 'stgPhysicalFitness' },
  { id: 'Build a Stronger Highlight Reel', labelKey: 'stgHighlightReel' },
  { id: 'College or University Recruitment', labelKey: 'stgCollegeRecruitment' },
  { id: 'Join an Academy', labelKey: 'stgJoinAcademy' },
  { id: 'Other', labelKey: 'stgOther' },
];

// Predefined Options for Long-Term Goals
const LONG_TERM_GOAL_OPTIONS = [
  { id: 'Become a Professional Player', labelKey: 'ltgProPlayer' },
  { id: 'Play Semi-Professional Soccer', labelKey: 'ltgSemiPro' },
  { id: 'NCAA or College Soccer', labelKey: 'ltgNcaaCollege' },
  { id: 'U SPORTS or Canadian University Soccer', labelKey: 'ltgUsports' },
  { id: 'Join a Professional Academy', labelKey: 'ltgProAcademy' },
  { id: 'Represent a National Team', labelKey: 'ltgNationalTeam' },
  { id: 'Play Internationally', labelKey: 'ltgPlayInternational' },
  { id: 'Earn a Soccer Scholarship', labelKey: 'ltgScholarship' },
  { id: 'Become a Coach', labelKey: 'ltgBecomeCoach' },
  { id: 'Other', labelKey: 'ltgOther' },
];

export const PlayerOnboarding: React.FC<PlayerOnboardingProps> = ({ onComplete }) => {
  const { language, t } = useLanguage();
  const { userAccount, playerProfile, savePlayerProfile, currentUser } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refs for file inputs & camera
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Live Camera Modal State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Step 1 State
  const [fullName, setFullName] = useState(userAccount?.fullName || playerProfile?.fullName || '');
  const [dateOfBirth, setDateOfBirth] = useState(playerProfile?.dateOfBirth || '2005-06-15');
  const [nationality, setNationality] = useState(playerProfile?.nationality || 'Canadian');
  const [city, setCity] = useState(playerProfile?.city || 'Toronto');
  const [province, setProvince] = useState(playerProfile?.province || 'Ontario (ON)');
  const [country, setCountry] = useState(playerProfile?.country || 'Canada');

  // Step 2 State
  const [primaryPosition, setPrimaryPosition] = useState<PrimaryPosition>(
    playerProfile?.primaryPosition || 'Central midfielder'
  );
  const [secondaryPosition, setSecondaryPosition] = useState<PrimaryPosition | ''>(
    playerProfile?.secondaryPosition || 'Attacking midfielder'
  );
  const [preferredFoot, setPreferredFoot] = useState<'Right' | 'Left' | 'Both'>(
    playerProfile?.preferredFoot || 'Right'
  );
  const [heightCm, setHeightCm] = useState<number>(playerProfile?.heightCm || 180);
  const [weightKg, setWeightKg] = useState<number>(playerProfile?.weightKg || 75);
  const [currentOrganization, setCurrentOrganization] = useState(
    playerProfile?.currentOrganization || 'Toronto FC Academy'
  );
  const [playingLevel, setPlayingLevel] = useState<PlayingLevel>(
    playerProfile?.playingLevel || 'Academy'
  );

  // Step 3 State (Availability Multi-select & Goals)
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(
    playerProfile?.availabilityStatus || 'Actively looking'
  );
  const [willingToRelocate, setWillingToRelocate] = useState<boolean>(
    playerProfile?.willingToRelocate ?? true
  );
  const [openToTrials, setOpenToTrials] = useState<boolean>(playerProfile?.openToTrials ?? true);

  // Multi-select states for Geographic Availability
  const [selectedGeographic, setSelectedGeographic] = useState<string[]>(() => {
    const existing = playerProfile?.geographicAvailability;
    if (Array.isArray(existing) && existing.length > 0) return existing;
    if (typeof existing === 'string' && existing.trim()) {
      return existing.split(',').map((s) => s.trim());
    }
    return ['Anywhere in Canada'];
  });
  const [geographicOther, setGeographicOther] = useState<string>(
    playerProfile?.geographicAvailabilityOther || ''
  );

  // Multi-select states for Short-Term Goals
  const [selectedShortGoals, setSelectedShortGoals] = useState<string[]>(() => {
    const existing = playerProfile?.shortTermGoals;
    if (Array.isArray(existing) && existing.length > 0) return existing;
    if (typeof existing === 'string' && existing.trim()) {
      return [existing.trim()];
    }
    return ['Attend Trials', 'Get Scouted'];
  });
  const [shortGoalsOther, setShortGoalsOther] = useState<string>(
    playerProfile?.shortTermGoalsOther || ''
  );

  // Multi-select states for Long-Term Goals
  const [selectedLongGoals, setSelectedLongGoals] = useState<string[]>(() => {
    const existing = playerProfile?.longTermGoals;
    if (Array.isArray(existing) && existing.length > 0) return existing;
    if (typeof existing === 'string' && existing.trim()) {
      return [existing.trim()];
    }
    return ['Become a Professional Player'];
  });
  const [longGoalsOther, setLongGoalsOther] = useState<string>(
    playerProfile?.longTermGoalsOther || ''
  );

  // Step 4 State (Profile Bio, Photo Upload, Soccer CV Upload)
  const [bio, setBio] = useState(
    playerProfile?.bio ||
      'Dynamic midfielder with exceptional pitch vision, tactical awareness, and strong work ethic. Captained provincial championship team.'
  );

  // Profile Photo Upload Metadata State
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(playerProfile?.profilePhotoUrl || '');
  const [profilePhotoStoragePath, setProfilePhotoStoragePath] = useState(
    playerProfile?.profilePhotoStoragePath || ''
  );
  const [profilePhotoFileName, setProfilePhotoFileName] = useState(
    playerProfile?.profilePhotoFileName || ''
  );
  const [profilePhotoContentType, setProfilePhotoContentType] = useState(
    playerProfile?.profilePhotoContentType || ''
  );
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  const [photoDragOver, setPhotoDragOver] = useState(false);

  // Soccer CV Upload Metadata State
  const [soccerCvUrl, setSoccerCvUrl] = useState(playerProfile?.soccerCvUrl || '');
  const [soccerCvStoragePath, setSoccerCvStoragePath] = useState(
    playerProfile?.soccerCvStoragePath || ''
  );
  const [soccerCvFileName, setSoccerCvFileName] = useState(
    playerProfile?.soccerCvFileName || ''
  );
  const [soccerCvContentType, setSoccerCvContentType] = useState(
    playerProfile?.soccerCvContentType || ''
  );
  const [cvUploading, setCvUploading] = useState(false);
  const [cvProgress, setCvProgress] = useState(0);
  const [cvError, setCvError] = useState<string | null>(null);
  const [cvSuccess, setCvSuccess] = useState<string | null>(null);
  const [cvDragOver, setCvDragOver] = useState(false);

  // Guardian State (Minor under 18)
  const [guardianName, setGuardianName] = useState(playerProfile?.guardian?.guardianName || '');
  const [guardianEmail, setGuardianEmail] = useState(playerProfile?.guardian?.guardianEmail || '');
  const [guardianPhone, setGuardianPhone] = useState(playerProfile?.guardian?.guardianPhone || '');
  const [guardianRelationship, setGuardianRelationship] = useState(
    playerProfile?.guardian?.guardianRelationship || ''
  );
  const [guardianConsent, setGuardianConsent] = useState(
    playerProfile?.guardian?.guardianConsent ?? true
  );

  // Calculate age from DOB
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 20;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const currentAge = calculateAge(dateOfBirth);
  const isMinor = currentAge < 18;

  // Calculate completion percentage dynamically
  const calculateCompletion = (): number => {
    let fields = 0;
    let filled = 0;

    // Step 1 & 2 items
    const checkValues = [
      fullName,
      dateOfBirth,
      nationality,
      city,
      province,
      country,
      primaryPosition,
      preferredFoot,
      heightCm,
      weightKg,
      currentOrganization,
      playingLevel,
      availabilityStatus,
      bio.trim(),
    ];

    fields += checkValues.length;
    filled += checkValues.filter((c) => Boolean(c)).length;

    // Photo check
    fields += 1;
    if (profilePhotoUrl) filled++;

    // Soccer CV check
    fields += 1;
    if (soccerCvUrl) filled++;

    // Step 3 multi-select checks
    fields += 3;
    if (
      selectedGeographic.length > 0 &&
      (!selectedGeographic.includes('Other') || geographicOther.trim().length > 0)
    )
      filled++;

    if (
      selectedShortGoals.length > 0 &&
      (!selectedShortGoals.includes('Other') || shortGoalsOther.trim().length > 0)
    )
      filled++;

    if (
      selectedLongGoals.length > 0 &&
      (!selectedLongGoals.includes('Other') || longGoalsOther.trim().length > 0)
    )
      filled++;

    // Guardian details for minor
    if (isMinor) {
      fields += 5;
      if (guardianName.trim()) filled++;
      if (guardianEmail.trim()) filled++;
      if (guardianPhone.trim()) filled++;
      if (guardianRelationship.trim()) filled++;
      if (guardianConsent) filled++;
    }

    return Math.min(100, Math.round((filled / fields) * 100));
  };

  const completionPct = calculateCompletion();

  // Multi-select toggles for Step 3
  const toggleGeographic = (id: string) => {
    if (selectedGeographic.includes(id)) {
      const next = selectedGeographic.filter((item) => item !== id);
      setSelectedGeographic(next);
      if (id === 'Other') {
        setGeographicOther('');
      }
    } else {
      setSelectedGeographic([...selectedGeographic, id]);
    }
  };

  const toggleShortGoal = (id: string) => {
    if (selectedShortGoals.includes(id)) {
      const next = selectedShortGoals.filter((item) => item !== id);
      setSelectedShortGoals(next);
      if (id === 'Other') {
        setShortGoalsOther('');
      }
    } else {
      setSelectedShortGoals([...selectedShortGoals, id]);
    }
  };

  const toggleLongGoal = (id: string) => {
    if (selectedLongGoals.includes(id)) {
      const next = selectedLongGoals.filter((item) => item !== id);
      setSelectedLongGoals(next);
      if (id === 'Other') {
        setLongGoalsOther('');
      }
    } else {
      setSelectedLongGoals([...selectedLongGoals, id]);
    }
  };

  // --- Photo Upload Engine ---
  const handleUseGooglePhoto = async () => {
    setPhotoError(null);
    setPhotoSuccess(null);

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

    const googlePhotoUrl = currentUser.photoURL;
    if (!googlePhotoUrl) {
      setPhotoError(t('noGooglePhotoExplanation'));
      return;
    }

    setPhotoUploading(true);
    setPhotoProgress(10);
    const oldPhotoPath = profilePhotoStoragePath;

    try {
      const res = await copyGooglePhotoToStorage(googlePhotoUrl, (progress) => {
        setPhotoProgress(progress);
      });

      setProfilePhotoUrl(res.downloadUrl);
      setProfilePhotoStoragePath(res.storagePath);
      setProfilePhotoFileName(res.fileName);
      setProfilePhotoContentType(res.contentType);

      try {
        await savePlayerProfile({
          profilePhotoUrl: res.downloadUrl,
          profilePhotoStoragePath: res.storagePath,
          profilePhotoFileName: res.fileName,
          profilePhotoContentType: res.contentType,
          profilePhotoSource: 'google',
          profilePhotoUploadedAt: new Date().toISOString(),
        });
      } catch (saveErr) {
        console.warn('Metadata update during Google photo upload:', saveErr);
      }

      if (oldPhotoPath && oldPhotoPath !== res.storagePath) {
        await deleteStorageFile(oldPhotoPath);
      }

      setPhotoSuccess(t('googlePhotoCopied'));
    } catch (err: any) {
      console.warn('Google photo direct copy failed, falling back to direct URL reference:', err);
      // Fallback if CORS prevents direct copy to Storage
      setProfilePhotoUrl(googlePhotoUrl);
      setProfilePhotoStoragePath('');
      setProfilePhotoFileName('google_profile_photo.jpg');
      setProfilePhotoContentType('image/jpeg');

      try {
        await savePlayerProfile({
          profilePhotoUrl: googlePhotoUrl,
          profilePhotoSource: 'google',
          profilePhotoUploadedAt: new Date().toISOString(),
        });
      } catch (e) {
        // Ignore
      }
      setPhotoSuccess(t('googlePhotoCorsNotice'));
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoFileSelect = async (file: File, source: 'camera' | 'gallery' | 'file' = 'file') => {
    setPhotoError(null);
    setPhotoSuccess(null);

    // 1. Verify Auth initialized & currentUser exists
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

    // 2. Validate MIME type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setPhotoError(t('errInvalidImageType'));
      return;
    }

    // 3. Validate size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError(t('errImageSize'));
      return;
    }

    setPhotoUploading(true);
    setPhotoProgress(0);

    const oldPhotoPath = profilePhotoStoragePath;

    try {
      // 4. Upload photo to player-images/{authenticatedUserId}/profile/{uniqueFileName}
      const res = await uploadProfilePhoto(currentUser.uid, file, (progress) => {
        setPhotoProgress(progress);
      });

      // 5. Update local state
      setProfilePhotoUrl(res.downloadUrl);
      setProfilePhotoStoragePath(res.storagePath);
      setProfilePhotoFileName(res.fileName);
      setProfilePhotoContentType(res.contentType);

      // 6. Save metadata to Firestore document (merge update) if profile exists
      try {
        await savePlayerProfile({
          profilePhotoUrl: res.downloadUrl,
          profilePhotoStoragePath: res.storagePath,
          profilePhotoFileName: res.fileName,
          profilePhotoContentType: res.contentType,
          profilePhotoSource: source,
          profilePhotoUploadedAt: new Date().toISOString(),
        });
      } catch (saveErr) {
        console.warn('Metadata update during photo upload notice:', saveErr);
      }

      // 7. Delete previous photo object from Storage ONLY AFTER new URL and metadata are saved
      if (oldPhotoPath && oldPhotoPath !== res.storagePath) {
        await deleteStorageFile(oldPhotoPath);
      }

      setPhotoSuccess(t('photoUploadSuccess'));
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setPhotoError(getStorageErrorMessage(err, language));
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (profilePhotoStoragePath) {
      await deleteStorageFile(profilePhotoStoragePath);
    }
    setProfilePhotoUrl('');
    setProfilePhotoStoragePath('');
    setProfilePhotoFileName('');
    setProfilePhotoContentType('');
    setPhotoSuccess(null);
    setPhotoError(null);
  };

  // Live Camera Controls
  const startCameraStream = async () => {
    setPhotoError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        });
        setCameraStream(stream);
        setShowCameraModal(true);
      } else {
        // Fallback to camera file input
        if (cameraInputRef.current) cameraInputRef.current.click();
      }
    } catch (err) {
      console.warn('Live camera stream not supported or permission denied:', err);
      // Fallback to native capture input
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setPhotoError(t('errCameraDenied'));
      }
    }
  };

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const captureCameraSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const capturedFile = new File([blob], `photo_${Date.now()}.jpg`, {
              type: 'image/jpeg',
            });
            stopCameraStream();
            handlePhotoFileSelect(capturedFile);
          }
        },
        'image/jpeg',
        0.88
      );
    }
  };

  useEffect(() => {
    if (showCameraModal && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCameraModal, cameraStream]);

  // --- Soccer CV Upload Engine ---
  const handleCvFileSelect = async (file: File) => {
    setCvError(null);
    setCvSuccess(null);

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

    // Validate PDF
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setCvError(t('errInvalidPdfType'));
      return;
    }

    // Validate size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setCvError(t('errPdfSize'));
      return;
    }

    setCvUploading(true);
    setCvProgress(0);

    const oldCvPath = soccerCvStoragePath;

    try {
      const res = await uploadSoccerCv(currentUser.uid, file, (progress) => {
        setCvProgress(progress);
      });

      setSoccerCvUrl(res.downloadUrl);
      setSoccerCvStoragePath(res.storagePath);
      setSoccerCvFileName(res.fileName);
      setSoccerCvContentType(res.contentType);

      try {
        await savePlayerProfile({
          soccerCvUrl: res.downloadUrl,
          soccerCvStoragePath: res.storagePath,
          soccerCvFileName: res.fileName,
          soccerCvContentType: res.contentType,
          soccerCvUploadedAt: new Date().toISOString(),
        });
      } catch (saveErr) {
        console.warn('Metadata update during CV upload notice:', saveErr);
      }

      if (oldCvPath && oldCvPath !== res.storagePath) {
        await deleteStorageFile(oldCvPath);
      }

      setCvSuccess(t('cvUploadSuccess'));
    } catch (err: any) {
      console.error('Soccer CV upload error:', err);
      setCvError(getStorageErrorMessage(err, language));
    } finally {
      setCvUploading(false);
    }
  };

  const handleRemoveCv = async () => {
    if (soccerCvStoragePath) {
      await deleteStorageFile(soccerCvStoragePath);
    }
    setSoccerCvUrl('');
    setSoccerCvStoragePath('');
    setSoccerCvFileName('');
    setSoccerCvContentType('');
    setCvSuccess(null);
    setCvError(null);
  };

  // Step Nav Validation
  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!fullName.trim() || !city.trim()) {
        setErrorMsg(
          language === 'fr'
            ? 'Veuillez remplir le nom complet et la ville.'
            : 'Please complete full name and city.'
        );
        return;
      }
    } else if (step === 2) {
      if (!primaryPosition || !currentOrganization.trim()) {
        setErrorMsg(
          language === 'fr'
            ? 'Veuillez sélectionner le poste principal et le club actuel.'
            : 'Please select primary position and current club.'
        );
        return;
      }
    } else if (step === 3) {
      if (selectedGeographic.length === 0) {
        setErrorMsg(
          language === 'fr'
            ? 'Veuillez sélectionner au moins une option de disponibilité géographique.'
            : 'Please select at least one geographic availability option.'
        );
        return;
      }
      if (selectedGeographic.includes('Other') && !geographicOther.trim()) {
        setErrorMsg(
          language === 'fr'
            ? 'Veuillez préciser votre disponibilité géographique personnalisée.'
            : 'Please specify your custom geographic availability.'
        );
        return;
      }
      if (selectedShortGoals.length === 0) {
        setErrorMsg(
          language === 'fr'
            ? 'Veuillez sélectionner au moins un objectif à court terme.'
            : 'Please select at least one short-term goal.'
        );
        return;
      }
      if (selectedShortGoals.includes('Other') && !shortGoalsOther.trim()) {
        setErrorMsg(
          language === 'fr'
            ? 'Veuillez préciser vos objectifs à court terme.'
            : 'Please specify your custom short-term goal.'
        );
        return;
      }
      if (selectedLongGoals.includes('Other') && !longGoalsOther.trim()) {
        setErrorMsg(
          language === 'fr'
            ? 'Veuillez préciser vos objectifs à long terme.'
            : 'Please specify your custom long-term goal.'
        );
        return;
      }
    }
    setStep(step + 1);
  };

  // Submit Handler
  const handleFinishOnboarding = async () => {
    setErrorMsg(null);
    if (isMinor) {
      if (
        !guardianName.trim() ||
        !guardianEmail.trim() ||
        !guardianPhone.trim() ||
        !guardianRelationship.trim() ||
        !guardianConsent
      ) {
        setErrorMsg(
          language === 'fr'
            ? 'Toutes les informations et l’autorisation du tuteur sont obligatoires pour les joueurs mineurs.'
            : 'All guardian details and written authorization are required for minor players under 18.'
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const profilePayload: Partial<PlayerProfile> = {
        role: 'player',
        fullName,
        email: currentUser?.email || auth.currentUser?.email || userAccount?.email || playerProfile?.email || '',
        dateOfBirth,
        age: currentAge,
        nationality,
        city,
        province,
        country,
        primaryPosition,
        secondaryPosition,
        preferredFoot,
        heightCm,
        weightKg,
        currentOrganization,
        playingLevel,
        availabilityStatus,
        geographicAvailability: selectedGeographic,
        geographicAvailabilityOther: selectedGeographic.includes('Other')
          ? geographicOther
          : null,
        willingToRelocate,
        openToTrials,
        shortTermGoals: selectedShortGoals,
        shortTermGoalsOther: selectedShortGoals.includes('Other')
          ? shortGoalsOther
          : null,
        longTermGoals: selectedLongGoals,
        longTermGoalsOther: selectedLongGoals.includes('Other')
          ? longGoalsOther
          : null,
        bio,
        profilePhotoUrl: profilePhotoUrl || undefined,
        profilePhotoStoragePath: profilePhotoStoragePath || undefined,
        profilePhotoFileName: profilePhotoFileName || undefined,
        profilePhotoContentType: profilePhotoContentType || undefined,
        soccerCvUrl: soccerCvUrl || undefined,
        soccerCvStoragePath: soccerCvStoragePath || undefined,
        soccerCvFileName: soccerCvFileName || undefined,
        soccerCvContentType: soccerCvContentType || undefined,
        membership: playerProfile?.membership || userAccount?.membership || 'FREE',
        profileCompletion: completionPct,
        onboardingCompleted: true,
      };

      if (isMinor) {
        profilePayload.guardian = {
          guardianName,
          guardianEmail,
          guardianPhone,
          guardianRelationship,
          guardianConsent,
        };
      }

      await savePlayerProfile(profilePayload);
      onComplete();
    } catch (err: any) {
      console.error('Error saving player profile:', err);
      setErrorMsg(getFirebaseErrorMessage(err?.code || err?.message || '', language));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Onboarding Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border border-blue-800/40 rounded-3xl p-6 mb-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/30 border border-blue-500/30 rounded-full text-xs font-bold text-blue-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('onboardingTitle')}</span>
            </div>
            <h1 className="text-2xl font-black">
              {step === 1 && t('step1Personal')}
              {step === 2 && t('step2Soccer')}
              {step === 3 && t('step3Availability')}
              {step === 4 && t('step4Completion')}
            </h1>
            <p className="text-xs text-slate-400 mt-1">Step {step} of 4</p>
          </div>

          {/* Completion Meter */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 min-w-[140px] text-center">
            <span className="text-xs text-slate-400 block mb-1">
              {t('profileCompletionRate')}
            </span>
            <div className="text-xl font-black text-blue-400">{completionPct}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-slate-800/80">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s <= step ? 'bg-blue-500' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Validation Error Banner */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-950/80 border border-rose-800 rounded-2xl text-rose-300 text-xs flex items-center gap-2 shadow-lg">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Personal Information */}
      {step === 1 && (
        <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-white shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t('fullName')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t('dob')}
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Age: <strong className="text-blue-400">{currentAge}</strong> {isMinor ? '(Minor - Under 18)' : '(Adult)'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t('nationality')}
              </label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t('city')}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t('province')}
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {CANADIAN_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t('country')}
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Soccer Information */}
      {step === 2 && (
        <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-white shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t('primaryPosition')}
              </label>
              <select
                value={primaryPosition}
                onChange={(e) => setPrimaryPosition(e.target.value as PrimaryPosition)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t('secondaryPosition')}
              </label>
              <select
                value={secondaryPosition}
                onChange={(e) => setSecondaryPosition(e.target.value as PrimaryPosition | '')}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">None</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t('preferredFoot')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Right', 'Left', 'Both'] as const).map((foot) => (
                  <button
                    key={foot}
                    type="button"
                    onClick={() => setPreferredFoot(foot)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      preferredFoot === foot
                        ? 'border-blue-500 bg-blue-950/60 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {foot === 'Right' ? t('footRight') : foot === 'Left' ? t('footLeft') : t('footBoth')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">{t('heightCm')}</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">{t('weightKg')}</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">{t('currentOrg')}</label>
              <input
                type="text"
                value={currentOrganization}
                onChange={(e) => setCurrentOrganization(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">{t('playingLevel')}</label>
              <select
                value={playingLevel}
                onChange={(e) => setPlayingLevel(e.target.value as PlayingLevel)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {PLAYING_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Availability & Goals (Multi-Select Chips & Conditional "Other" Logic) */}
      {step === 3 && (
        <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 text-white shadow-2xl">
          {/* Availability Status & Relocation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t('availabilityStatus')}
              </label>
              <select
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
              >
                {AVAILABILITY_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t('willingToRelocate')}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWillingToRelocate(true)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    willingToRelocate
                      ? 'border-blue-500 bg-blue-950/60 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  {t('yes')}
                </button>
                <button
                  type="button"
                  onClick={() => setWillingToRelocate(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    !willingToRelocate
                      ? 'border-blue-500 bg-blue-950/60 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  {t('no')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t('openToTrials')}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpenToTrials(true)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    openToTrials
                      ? 'border-blue-500 bg-blue-950/60 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  {t('yes')}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenToTrials(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    !openToTrials
                      ? 'border-blue-500 bg-blue-950/60 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  {t('no')}
                </button>
              </div>
            </div>
          </div>

          {/* 1. Geographic Availability */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-400">
                {t('geographicAvailability')}
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                Select all that apply
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {GEOGRAPHIC_OPTIONS.map((opt) => {
                const isSelected = selectedGeographic.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleGeographic(opt.id)}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/70 text-white shadow-lg shadow-blue-500/10'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{t(opt.labelKey as any) || opt.id}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom "Other" Input for Geographic Availability */}
            {selectedGeographic.includes('Other') && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t('specifyOther')} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={geographicOther}
                  onChange={(e) => setGeographicOther(e.target.value)}
                  placeholder="e.g. Caribbean, Central America, Specific Region..."
                  className="w-full bg-slate-900 border border-blue-500/60 rounded-2xl p-3 text-xs text-white focus:border-blue-500 focus:outline-none shadow-inner"
                />
                <p className="text-[10px] text-slate-400 mt-1">{t('customRequired')}</p>
              </div>
            )}
          </div>

          {/* 2. Short-Term Goals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-400">
                {t('shortTermGoals')}
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                Select all that apply
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {SHORT_TERM_GOAL_OPTIONS.map((opt) => {
                const isSelected = selectedShortGoals.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleShortGoal(opt.id)}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/70 text-white shadow-lg shadow-blue-500/10'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{t(opt.labelKey as any) || opt.id}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom "Other" Input for Short-Term Goals */}
            {selectedShortGoals.includes('Other') && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t('specifyOther')} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={shortGoalsOther}
                  onChange={(e) => setShortGoalsOther(e.target.value)}
                  placeholder="e.g. Recover from injury and return to starting 11..."
                  className="w-full bg-slate-900 border border-blue-500/60 rounded-2xl p-3 text-xs text-white focus:border-blue-500 focus:outline-none shadow-inner"
                />
                <p className="text-[10px] text-slate-400 mt-1">{t('customRequired')}</p>
              </div>
            )}
          </div>

          {/* 3. Long-Term Goals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-400">
                {t('longTermGoals')}
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                Select all that apply
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {LONG_TERM_GOAL_OPTIONS.map((opt) => {
                const isSelected = selectedLongGoals.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleLongGoal(opt.id)}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/70 text-white shadow-lg shadow-blue-500/10'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{t(opt.labelKey as any) || opt.id}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom "Other" Input for Long-Term Goals */}
            {selectedLongGoals.includes('Other') && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t('specifyOther')} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={longGoalsOther}
                  onChange={(e) => setLongGoalsOther(e.target.value)}
                  placeholder="e.g. Become a sports analyst or referee..."
                  className="w-full bg-slate-900 border border-blue-500/60 rounded-2xl p-3 text-xs text-white focus:border-blue-500 focus:outline-none shadow-inner"
                />
                <p className="text-[10px] text-slate-400 mt-1">{t('customRequired')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Profile & Guardian (Photo File Upload, Soccer CV PDF Upload, Bio, Private Guardian Info) */}
      {step === 4 && (
        <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 text-white shadow-2xl">
          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={galleryInputRef}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handlePhotoFileSelect(e.target.files[0]);
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
                handlePhotoFileSelect(e.target.files[0]);
              }
            }}
          />
          <input
            type="file"
            ref={cvInputRef}
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleCvFileSelect(e.target.files[0]);
              }
            }}
          />

          {/* 1. Profile Photo Upload Section */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-400">
              {t('profilePhoto')}
            </label>

            {photoError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            {photoSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{photoSuccess}</span>
              </div>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setPhotoDragOver(true);
              }}
              onDragLeave={() => setPhotoDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setPhotoDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handlePhotoFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className={`p-6 border-2 border-dashed rounded-3xl transition-all ${
                photoDragOver
                  ? 'border-blue-500 bg-blue-950/30'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Photo Preview Thumbnail */}
                <div className="relative w-28 h-28 rounded-3xl overflow-hidden border-2 border-blue-500/50 bg-slate-900 shrink-0 shadow-xl flex items-center justify-center">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Player Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-600" />
                  )}

                  {photoUploading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-2 text-center">
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin mb-1" />
                      <span className="text-[10px] font-bold text-white">{photoProgress}%</span>
                    </div>
                  )}
                </div>

                {/* Upload Controls & Actions */}
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div>
                    <h4 className="text-sm font-bold text-white">Upload Player Photo</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('dropPhotoHere')}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Max file size: 10 MB (JPG, PNG, WEBP)
                    </p>
                  </div>

                  {photoUploading && (
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${photoProgress}%` }}
                      />
                    </div>
                  )}

                  {/* Action Buttons: Google Photo, Camera, Gallery, Browse Files, Remove */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    {/* 1. Google Account Photo Option */}
                    {auth.currentUser?.photoURL ? (
                      <button
                        type="button"
                        onClick={handleUseGooglePhoto}
                        disabled={photoUploading}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>{t('useGooglePhoto')}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic hidden sm:inline">
                        {t('noGooglePhotoExplanation')}
                      </span>
                    )}

                    {/* 2. Take Photo with Camera */}
                    <button
                      type="button"
                      onClick={startCameraStream}
                      disabled={photoUploading}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{t('takePhotoCamera')}</span>
                    </button>

                    {/* 3. Choose from Gallery / Photos */}
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={photoUploading}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t('chooseGallery')}</span>
                    </button>

                    {/* 4. Browse Files */}
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={photoUploading}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('browseFiles')}</span>
                    </button>

                    {/* 5. Remove Current Photo */}
                    {profilePhotoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={photoUploading}
                        className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('removePhoto')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Soccer CV PDF Upload Section */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-400">
              {t('soccerCv')}
            </label>

            {cvError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{cvError}</span>
              </div>
            )}

            {cvSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{cvSuccess}</span>
              </div>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setCvDragOver(true);
              }}
              onDragLeave={() => setCvDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setCvDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleCvFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className={`p-6 border-2 border-dashed rounded-3xl transition-all ${
                cvDragOver
                  ? 'border-blue-500 bg-blue-950/30'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-800/50 text-blue-400 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {soccerCvUrl ? (soccerCvFileName || 'Soccer CV Document.pdf') : t('uploadPdfCv')}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {soccerCvUrl ? 'PDF uploaded and attached to player profile' : t('dropPdfHere')}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Accepted format: PDF (.pdf) • Max 10 MB
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {soccerCvUrl && (
                    <a
                      href={soccerCvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <span>{t('downloadCv')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => cvInputRef.current?.click()}
                    disabled={cvUploading}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-400" />
                    <span>{soccerCvUrl ? t('replaceCv') : t('browseFiles')}</span>
                  </button>

                  {soccerCvUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveCv}
                      disabled={cvUploading}
                      className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('removeCv')}</span>
                    </button>
                  )}
                </div>
              </div>

              {cvUploading && (
                <div className="mt-4 space-y-1">
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
            </div>
          </div>

          {/* 3. Biography Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-400">
                {t('bio')}
              </label>
              <span
                className={`text-[11px] font-bold ${
                  bio.length > 1000 ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {bio.length} / 1000
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={1000}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell scouts about your playing style, leadership skills, key achievements..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* 4. Guardian Information (Conditional if Minor under 18) */}
          {isMinor && (
            <div className="p-6 bg-amber-950/40 border border-amber-800/60 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{t('under18Notice')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t('guardianName')} <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t('guardianEmail')} <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t('guardianPhone')} <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t('guardianRelationship')} <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('guardianRelationshipPlaceholder')}
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-2 cursor-pointer text-xs text-amber-200">
                <input
                  type="checkbox"
                  required
                  checked={guardianConsent}
                  onChange={(e) => setGuardianConsent(e.target.checked)}
                  className="mt-0.5 rounded border-amber-700 bg-slate-900 text-amber-600 focus:ring-amber-500"
                />
                <span className="leading-snug">{t('guardianConsent')}</span>
              </label>

              <div className="text-[11px] text-slate-400 italic pt-1">
                🔒 Guardian contact information is strictly private and will never be published on public recruiter profile cards.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Navigation Controls */}
      <div className="flex items-center justify-between mt-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl text-xs font-bold border border-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('back')}</span>
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="flex items-center gap-1.5 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
          >
            <span>{t('next')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinishOnboarding}
            disabled={submitting || photoUploading || cvUploading}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{submitting ? t('loading') : t('completeOnboarding')}</span>
          </button>
        )}
      </div>

      {/* Live Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>Camera Photo Capture</span>
              </h3>
              <button
                onClick={stopCameraStream}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={stopCameraStream}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={captureCameraSnapshot}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Capture Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
