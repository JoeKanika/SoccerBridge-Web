import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { UserRole } from '../types';
import { LegalModal, PolicyType } from './LegalModal';
import {
  User,
  Briefcase,
  Shield,
  CheckCircle2,
  ArrowRight,
  Play,
  Pause,
  Video,
  Sparkles,
  Search,
  Bookmark,
  MessageSquare,
  Calendar,
  Lock,
  Eye,
  ShieldCheck,
  Award,
  Users,
  Compass,
  FileText,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface WelcomeScreenProps {
  onSelectRole: (role: UserRole) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectRole,
  onOpenLogin,
  onOpenRegister,
}) => {
  const { language, t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState<PolicyType>('safeguarding');

  // Check for prefers-reduced-motion user preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openPolicyModal = (tab: PolicyType) => {
    setActivePolicyTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <div className="bg-white text-slate-900 w-full overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (80-90vh on Desktop) */}
      {/* ========================================================================= */}
      <section
        id="hero"
        aria-label="SoccerBridge Introduction"
        className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50/60 border-b border-slate-200/80 px-4 sm:px-6 lg:px-12 py-12 lg:py-16"
      >
        {/* Subtle geometric sports grid background accents */}
        <div className="absolute inset-0 bg-[radial-gradient(#2563eb_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
          {/* LEFT: Editorial Content Cluster */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center text-left space-y-6">
            {/* Small Premium Eyebrow */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-black tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>{t('heroEyebrow')}</span>
            </div>

            {/* Semantic H1 Headline with Fluid Clamp Scaling */}
            <h1 className="text-[34px] sm:text-[46px] md:text-[54px] lg:text-[58px] font-black tracking-tight leading-[1.08] text-slate-950">
              {t('heroHeadlinePart1')}{' '}
              <span className="text-blue-600 block sm:inline mt-1 sm:mt-0 font-black">
                {t('heroHeadlinePart2')}
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
              {t('heroSupportingCopy')}
            </p>

            {/* Primary & Secondary Call to Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                onClick={() => onSelectRole('player')}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <span>{t('heroCtaPrimary')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('how-it-works')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-base border border-slate-300 shadow-xs transition-all cursor-pointer"
              >
                <span>{t('heroCtaSecondary')}</span>
              </button>
            </div>

            {/* Already have an account link */}
            <div className="pt-1 text-sm text-slate-500 flex items-center gap-1.5 font-medium">
              <span>{t('alreadyHaveAccount')}</span>
              <button
                onClick={onOpenLogin}
                className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors focus:outline-none cursor-pointer"
              >
                {t('signInLink')}
              </button>
            </div>

            {/* Key trust badges on hero */}
            <div className="pt-4 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left">
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {language === 'fr' ? 'Scouts Vérifiés' : 'Verified Scouts'}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {language === 'fr' ? 'FIFA & Universités' : 'FIFA, CPL & NCAA'}
                </p>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {language === 'fr' ? 'CV & Faits Saillants' : 'CV & Highlights'}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {language === 'fr' ? 'Vidéos & Statistiques' : 'Match Video Reels'}
                </p>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {language === 'fr' ? 'Protection' : 'Safe Sport'}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {language === 'fr' ? 'Normes LPRPDE' : 'PIPEDA Privacy'}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: High-End Promotional Video Composition */}
          <div className="lg:col-span-6 xl:col-span-6 relative w-full">
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none rounded-2xl overflow-hidden bg-slate-950 border border-slate-300 shadow-2xl group">
              {/* Top Video Header Tag */}
              <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[11px] font-semibold text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{t('promoVideoBadge')}</span>
              </div>

              {/* Video Element */}
              {!prefersReducedMotion && !videoError ? (
                <div className="relative aspect-video w-full bg-slate-950">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted={isMuted}
                    loop
                    playsInline
                    preload="auto"
                    poster="/assets/images/soccerbridge_hero_poster.jpg"
                    onError={() => setVideoError(true)}
                    className="w-full h-full object-cover"
                  >
                    <source src="/assets/videos/soccerbridge_promo.mp4" type="video/mp4" />
                    {/* Fallback image */}
                    <img
                      src="/assets/images/soccerbridge_hero_poster.jpg"
                      alt="SoccerBridge Football Action"
                      className="w-full h-full object-cover"
                    />
                  </video>

                  {/* Video Play/Mute Overlay Controls (Clean minimal corner buttons) */}
                  <div className="absolute bottom-3.5 right-3.5 z-20 flex items-center gap-2 bg-slate-950/70 backdrop-blur-md rounded-full p-1 border border-white/10 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'Pause video' : 'Play video'}
                      className="p-1.5 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={toggleMute}
                      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                      className="p-1.5 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ) : (
                /* Static Fallback for reduced motion or fallback */
                <div className="relative aspect-video w-full">
                  <img
                    src="/assets/images/soccerbridge_hero_poster.jpg"
                    alt="SoccerBridge Platform Showcase"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-6">
                    <p className="text-white text-sm font-semibold">
                      {t('slogan')}
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Feature Ribbon */}
              <div className="bg-[#0B132B] text-slate-300 px-5 py-3 text-xs flex items-center justify-between border-t border-slate-800">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span>National Soccer Recruiting Hub</span>
                </span>
                <span className="text-blue-400 font-bold uppercase tracking-wider text-[10px]">
                  SoccerBridge Canada
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ROLE SELECTION SECTION */}
      {/* ========================================================================= */}
      <section
        id="roles"
        aria-label="Choose your role"
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-12 bg-white border-b border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mb-3">
              {t('roleSectionTitle')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-normal">
              {t('roleSectionSubtitle')}
            </p>
          </div>

          {/* 3 Premium Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* 1. PLAYER CARD */}
            <div
              id="roles-player"
              className="flex flex-col justify-between p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-200 group relative"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100/80 text-blue-700">
                    {t('rolePlayerBadge')}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-950 mb-1">
                    {t('rolePlayerTitle')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('rolePlayerDesc')}
                  </p>
                </div>

                {/* Specific feature highlights */}
                <ul className="space-y-2 pt-2 border-t border-slate-200/70 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'fr' ? 'CV soccer interactif et téléchargeable' : 'Interactive Soccer CV & verified stats'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'fr' ? 'Hébergement de vidéos faits saillants' : 'Highlight video reel showcase'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'fr' ? 'Réception d’invitations officielles aux essais' : 'Direct trial invitations from scouts'}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/70">
                <button
                  onClick={() => onSelectRole('player')}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{t('rolePlayerCta')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. AGENT / RECRUITER CARD */}
            <div
              id="roles-recruiter"
              className="flex flex-col justify-between p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-200 group relative"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-200 text-slate-800">
                    {t('roleRecruiterBadge')}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-950 mb-1">
                    {t('roleRecruiterTitle')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('roleRecruiterDesc')}
                  </p>
                </div>

                {/* Specific feature highlights */}
                <ul className="space-y-2 pt-2 border-t border-slate-200/70 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'fr' ? 'Recherche multicritère avancée de joueurs' : 'Advanced multi-criteria player search'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'fr' ? 'Sélections privées & notes de dépistage' : 'Custom shortlists & scouting notes'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'fr' ? 'Vérification officielle des attestations' : 'Verified credential badge for credibility'}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/70">
                <button
                  onClick={() => onSelectRole('recruiter')}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{t('roleRecruiterCta')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3. CLUB / ORGANISATION CARD */}
            <div
              id="roles-club"
              className="flex flex-col justify-between p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-200 group relative"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                    {t('roleClubBadge')}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-950 mb-1">
                    {t('roleClubTitle')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('roleClubDesc')}
                  </p>
                </div>

                {/* Specific feature highlights */}
                <ul className="space-y-2 pt-2 border-t border-slate-200/70 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'fr' ? 'Gestion des opportunités et essais de club' : 'Club trials and vacancy management'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'fr' ? 'Collaboration en équipe de recrutement' : 'Multi-scout organizational pipeline'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'fr' ? 'Réseau avec universités et académies' : 'Direct academy & university recruitment'}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/70">
                <button
                  onClick={() => onSelectRole('club')}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{t('roleClubCta')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW SOCCERBRIDGE WORKS (Clean light section with large numerals) */}
      {/* ========================================================================= */}
      <section
        id="how-it-works"
        aria-label="How SoccerBridge works"
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-12 bg-slate-50/70 border-b border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-20">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 mb-2 block">
              {language === 'fr' ? 'PROCESSUS DE RECRUTEMENT' : 'THE RECRUITMENT PATHWAY'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mb-3">
              {t('howItWorksTitle')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-normal">
              {t('howItWorksSubtitle')}
            </p>
          </div>

          {/* 3 Step Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Step 01 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative flex flex-col justify-between">
              <div>
                <span className="text-5xl font-black text-blue-600/20 block mb-4 font-mono tracking-tighter">
                  {t('howStep1Number')}
                </span>
                <h3 className="text-xl font-bold text-slate-950 mb-2">
                  {t('howStep1Title')}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {t('howStep1Desc')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-blue-600">
                <FileText className="w-4 h-4" />
                <span>{language === 'fr' ? 'CV, Vidéos & Statistiques' : 'CV, Video & Metrics'}</span>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative flex flex-col justify-between">
              <div>
                <span className="text-5xl font-black text-blue-600/20 block mb-4 font-mono tracking-tighter">
                  {t('howStep2Number')}
                </span>
                <h3 className="text-xl font-bold text-slate-950 mb-2">
                  {t('howStep2Title')}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {t('howStep2Desc')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-blue-600">
                <Search className="w-4 h-4" />
                <span>{language === 'fr' ? 'Scouts certifiés & Algorithme' : 'Certified Scouts & Matching'}</span>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative flex flex-col justify-between">
              <div>
                <span className="text-5xl font-black text-blue-600/20 block mb-4 font-mono tracking-tighter">
                  {t('howStep3Number')}
                </span>
                <h3 className="text-xl font-bold text-slate-950 mb-2">
                  {t('howStep3Title')}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {t('howStep3Desc')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-blue-600">
                <Calendar className="w-4 h-4" />
                <span>{language === 'fr' ? 'Essais & Messagerie Directe' : 'Trials & Direct Contact'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PRODUCT PREVIEW SECTION (More than a directory) */}
      {/* ========================================================================= */}
      <section
        id="preview"
        aria-label="Platform Capabilities"
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-12 bg-white border-b border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 mb-2 block">
              {language === 'fr' ? 'FONCTIONNALITÉS CLÉS' : 'PLATFORM CAPABILITIES'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mb-3">
              {t('previewSectionTitle')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-normal">
              {t('previewSectionSubtitle')}
            </p>
          </div>

          {/* 8 Polished Capability Cards (Exact Platform Features) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Player Profiles */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 hover:bg-white transition-all shadow-2xs hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <User className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-950 mb-1.5">
                {t('previewPlayerProfilesTitle')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('previewPlayerProfilesDesc')}
              </p>
            </div>

            {/* 2. Highlight Videos */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 hover:bg-white transition-all shadow-2xs hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-950 mb-1.5">
                {t('previewHighlightVideosTitle')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('previewHighlightVideosDesc')}
              </p>
            </div>

            {/* 3. Talent Discovery */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 hover:bg-white transition-all shadow-2xs hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-950 mb-1.5">
                {t('previewTalentDiscoveryTitle')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('previewTalentDiscoveryDesc')}
              </p>
            </div>

            {/* 4. Smart Matching */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 hover:bg-white transition-all shadow-2xs hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-950 mb-1.5">
                {t('previewSmartMatchingTitle')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('previewSmartMatchingDesc')}
              </p>
            </div>

            {/* 5. Recruiter Search */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 hover:bg-white transition-all shadow-2xs hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-950 mb-1.5">
                {t('previewRecruiterSearchTitle')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('previewRecruiterSearchDesc')}
              </p>
            </div>

            {/* 6. Saved Players & Shortlists */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 hover:bg-white transition-all shadow-2xs hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <Bookmark className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-950 mb-1.5">
                {t('previewSavedPlayersTitle')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('previewSavedPlayersDesc')}
              </p>
            </div>

            {/* 7. Direct Messaging */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 hover:bg-white transition-all shadow-2xs hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-950 mb-1.5">
                {t('previewMessagingTitle')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('previewMessagingDesc')}
              </p>
            </div>

            {/* 8. Trial Opportunities */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 hover:bg-white transition-all shadow-2xs hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-950 mb-1.5">
                {t('previewTrialOppsTitle')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('previewTrialOppsDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TRUST & SAFETY SECTION (Professional Light Gray / Blue) */}
      {/* ========================================================================= */}
      <section
        id="safety"
        aria-label="Trust and Safety"
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-12 bg-slate-50 border-b border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>{language === 'fr' ? 'SÉCURITÉ & PROTECTION' : 'TRUST & INTEGRITY'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mb-3">
              {t('trustSectionTitle')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-normal">
              {t('trustSectionSubtitle')}
            </p>
          </div>

          {/* 5 Safety Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Recruiter Verification */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">
                {t('trustRecruiterVerificationTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('trustRecruiterVerificationDesc')}
              </p>
            </div>

            {/* 2. Visibility Controls */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">
                {t('trustVisibilityControlsTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('trustVisibilityControlsDesc')}
              </p>
            </div>

            {/* 3. Reporting & Moderation */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">
                {t('trustReportingTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('trustReportingDesc')}
              </p>
            </div>

            {/* 4. Secure Authentication */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">
                {t('trustSecureAuthTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('trustSecureAuthDesc')}
              </p>
            </div>

            {/* 5. Privacy Compliance */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 md:col-span-2 lg:col-span-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">
                {t('trustPrivacyTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('trustPrivacyDesc')}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                <button
                  onClick={() => openPolicyModal('safeguarding')}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  {language === 'fr' ? 'Politique de protection des mineurs' : 'Minor Safeguarding Policy'} →
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => openPolicyModal('privacy')}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  {language === 'fr' ? 'Politique de confidentialité (LPRPDE)' : 'Privacy Policy (PIPEDA)'} →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FINAL CALL TO ACTION (Deep Navy Visual Anchor) */}
      {/* ========================================================================= */}
      <section
        id="final-cta"
        aria-label="Join SoccerBridge"
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-12 bg-[#020617] text-white relative overflow-hidden"
      >
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <span className="text-xs font-black uppercase tracking-widest text-blue-400 block">
            {language === 'fr' ? 'VOTRE PROCHAINE ÉTAPE' : 'YOUR NEXT STEP'}
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {t('finalCtaTitle')}
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
            {t('finalCtaSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onSelectRole('player')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-base shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {t('finalCtaPlayer')}
            </button>

            <button
              onClick={() => onSelectRole('recruiter')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold text-base shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
            >
              {t('finalCtaRecruiter')}
            </button>
          </div>

          <div className="pt-3">
            <button
              onClick={() => onSelectRole('club')}
              className="text-xs font-semibold text-slate-400 hover:text-blue-400 transition-colors underline cursor-pointer"
            >
              {t('finalCtaClub')}
            </button>
          </div>

          <div className="pt-4 text-xs text-slate-500">
            <span>{t('alreadyHaveAccount')} </span>
            <button
              onClick={onOpenLogin}
              className="text-blue-400 hover:text-blue-300 font-bold hover:underline cursor-pointer"
            >
              {t('signInLink')}
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Safeguarding / Legal Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={activePolicyTab}
      />
    </div>
  );
};
