import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import {
  User as UserIcon,
  LogOut,
  Sparkles,
  Search,
  Bookmark,
  MessageSquare,
  Menu,
  X,
  ChevronDown,
  Bell,
  Settings,
} from 'lucide-react';
import { subscribeToUnreadCount } from '../services/notificationService';
import { NotificationCenter } from './NotificationCenter';
import { PlayerProfile, RecruiterProfile } from '../types';

interface NavbarProps {
  onNavigate: (view: string) => void;
  activeView: string;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenProModal: () => void;
  onOpenPlayerProfile?: (player: PlayerProfile) => void;
  onOpenRecruiterProfile?: (recruiter: RecruiterProfile) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  activeView,
  onOpenAuthModal,
  onOpenProModal,
  onOpenPlayerProfile,
  onOpenRecruiterProfile,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { currentUser, userAccount, playerProfile, recruiterProfile, signOutUser, devRoleOverride } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const role = devRoleOverride || userAccount?.role || 'player';
  const isPro = userAccount?.membership === 'PRO' || playerProfile?.membership === 'PRO';

  // Subscribe to real-time unread notification count
  useEffect(() => {
    if (!currentUser?.uid) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = subscribeToUnreadCount(currentUser.uid, (count) => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleNavScrollOrAction = (targetId: string) => {
    setMobileMenuOpen(false);
    if (activeView !== 'home') {
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // =========================================================================
  // 1. PUBLIC / UNAUTHENTICATED NAVBAR (Light Athletic Theme)
  // =========================================================================
  if (!currentUser) {
    return (
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-12 py-3.5 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* LEFT: Brand Logo */}
          <button
            onClick={() => {
              if (activeView !== 'home') onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:opacity-90 transition-opacity focus:outline-none cursor-pointer flex items-center"
            aria-label="SoccerBridge Home"
          >
            <Logo size="sm" showSlogan={false} />
          </button>

          {/* CENTER: Clean Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center space-x-7">
            <button
              onClick={() => handleNavScrollOrAction('how-it-works')}
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {t('navHowItWorks')}
            </button>

            <button
              onClick={() => handleNavScrollOrAction('roles-player')}
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {t('navPlayers')}
            </button>

            <button
              onClick={() => handleNavScrollOrAction('roles-recruiter')}
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {t('navRecruiters')}
            </button>

            <button
              onClick={() => handleNavScrollOrAction('roles-club')}
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {t('navClubs')}
            </button>

            <button
              onClick={() => handleNavScrollOrAction('safety')}
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {t('navSafety')}
            </button>
          </div>

          {/* RIGHT: Language Toggle + Sign In + Join CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Switcher Pill */}
            <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('fr')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  language === 'fr'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                FR
              </button>
            </div>

            {/* Sign In Link Button */}
            <button
              onClick={() => onOpenAuthModal('login')}
              className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors px-2 cursor-pointer"
            >
              {t('navSignIn')}
            </button>

            {/* Primary Join Button */}
            <button
              onClick={() => onOpenAuthModal('register')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {t('navJoin')}
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
              className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 cursor-pointer"
            >
              {language.toUpperCase()}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="p-2 text-slate-700 hover:text-slate-900 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Light Theme) */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-200 flex flex-col space-y-3 pb-3 px-2 bg-white rounded-xl shadow-lg">
            <button
              onClick={() => handleNavScrollOrAction('how-it-works')}
              className="text-left text-sm font-semibold text-slate-800 py-1.5 hover:text-blue-600 transition-colors"
            >
              {t('navHowItWorks')}
            </button>

            <button
              onClick={() => handleNavScrollOrAction('roles-player')}
              className="text-left text-sm font-semibold text-slate-800 py-1.5 hover:text-blue-600 transition-colors"
            >
              {t('navPlayers')}
            </button>

            <button
              onClick={() => handleNavScrollOrAction('roles-recruiter')}
              className="text-left text-sm font-semibold text-slate-800 py-1.5 hover:text-blue-600 transition-colors"
            >
              {t('navRecruiters')}
            </button>

            <button
              onClick={() => handleNavScrollOrAction('roles-club')}
              className="text-left text-sm font-semibold text-slate-800 py-1.5 hover:text-blue-600 transition-colors"
            >
              {t('navClubs')}
            </button>

            <button
              onClick={() => handleNavScrollOrAction('safety')}
              className="text-left text-sm font-semibold text-slate-800 py-1.5 hover:text-blue-600 transition-colors"
            >
              {t('navSafety')}
            </button>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  onOpenAuthModal('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm font-bold text-slate-800 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                {t('navSignIn')}
              </button>

              <button
                onClick={() => {
                  onOpenAuthModal('register');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors"
              >
                {t('navJoin')}
              </button>
            </div>
          </div>
        )}
      </nav>
    );
  }

  // =========================================================================
  // 2. AUTHENTICATED NAVBAR (Existing Dark Dashboard Navigation)
  // =========================================================================
  return (
    <nav className="sticky top-0 z-40 bg-[#020617]/90 backdrop-blur-md border-b border-blue-900/30 px-6 lg:px-10 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
        >
          <Logo size="sm" showSlogan={false} />
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <button
            onClick={() => onNavigate('home')}
            className={`text-sm font-semibold transition-colors cursor-pointer ${
              activeView === 'home' ? 'text-blue-400 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t('home')}
          </button>

          {(role === 'recruiter' || role === 'club') && (
            <>
              <button
                onClick={() => onNavigate('search')}
                className={`text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeView === 'search' ? 'text-blue-400 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4" />
                {t('players')}
              </button>
              <button
                onClick={() => onNavigate('saved')}
                className={`text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeView === 'saved' ? 'text-blue-400 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                {t('savedPlayers')}
              </button>
            </>
          )}

          <button
            onClick={() => onNavigate('dashboard')}
            className={`text-sm font-semibold transition-colors cursor-pointer ${
              activeView === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t('dashboard')}
          </button>

          <button
            onClick={() => onNavigate('saved')}
            className={`text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeView === 'saved' ? 'text-blue-400 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            {t('savedItems')}
          </button>

          <button
            onClick={() => onNavigate('messages')}
            className={`text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeView === 'messages' ? 'text-blue-400 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {t('messages')}
          </button>
        </div>

        {/* Right Action Cluster */}
        <div className="hidden md:flex items-center space-x-5">
          {/* Language Toggle Pill Selector */}
          <div className="flex bg-slate-900 rounded-full p-1 border border-slate-800">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-1 text-xs font-bold rounded-full uppercase transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('fr')}
              className={`px-4 py-1 text-xs font-bold rounded-full uppercase transition-all cursor-pointer ${
                language === 'fr'
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FR
            </button>
          </div>

          {/* PRO Badge / Upgrade CTA */}
          {role === 'player' && (
            <button
              onClick={onOpenProModal}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                isPro
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              {isPro ? t('proBadge') : t('upgradeToPro')}
            </button>
          )}

          {/* Notification Center Trigger Bell */}
          <button
            onClick={() => setNotifCenterOpen(true)}
            className="relative p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-full transition-all hover:bg-slate-800 cursor-pointer"
            title={t('notificationsTitle')}
          >
            <Bell className="w-4 h-4 text-blue-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-full py-1.5 px-3.5 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs overflow-hidden shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                {userAccount?.photoURL ? (
                  <img src={userAccount.photoURL} alt={userAccount.fullName} className="w-full h-full object-cover" />
                ) : (
                  userAccount?.fullName?.charAt(0) || 'U'
                )}
              </div>
              <span className="text-xs font-bold text-slate-200 max-w-[100px] truncate">
                {userAccount?.fullName || 'User'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Dropdown Box */}
            {userDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-slate-200 text-xs backdrop-blur-md"
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="font-bold text-white">{userAccount?.fullName}</p>
                  <p className="text-slate-400 text-[10px] truncate">{userAccount?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-950/80 text-blue-400 border border-blue-800/50 rounded-full text-[10px] font-bold uppercase">
                    {role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    onNavigate('dashboard');
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-2 font-semibold cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  {t('dashboard')}
                </button>

                <button
                  onClick={() => {
                    onNavigate('settings');
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-2 font-semibold text-slate-200 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-purple-400" />
                  {t('settingsTitle') || 'Settings'}
                </button>

                <button
                  onClick={() => {
                    signOutUser();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-800 text-rose-400 flex items-center gap-2 font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Toggle for Auth */}
        <div className="md:hidden flex items-center space-x-3">
          <button
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            className="p-1.5 bg-slate-800 text-xs font-bold text-blue-400 rounded-lg cursor-pointer"
          >
            {language.toUpperCase()}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-800/60 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay for Auth */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800 flex flex-col space-y-3 pb-4 px-2">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="text-left text-sm font-medium text-slate-200 py-2 hover:text-blue-400"
          >
            {t('home')}
          </button>

          <button
            onClick={() => {
              onNavigate('dashboard');
              setMobileMenuOpen(false);
            }}
            className="text-left text-sm font-medium text-slate-200 py-2 hover:text-blue-400"
          >
            {t('dashboard')}
          </button>

          <button
            onClick={() => {
              onNavigate('saved');
              setMobileMenuOpen(false);
            }}
            className="text-left text-sm font-medium text-amber-400 py-2 flex items-center gap-2"
          >
            <Bookmark className="w-4 h-4" />
            {t('savedItems')}
          </button>

          <button
            onClick={() => {
              onNavigate('messages');
              setMobileMenuOpen(false);
            }}
            className="text-left text-sm font-medium text-slate-200 py-2 hover:text-blue-400"
          >
            {t('messages')}
          </button>

          <button
            onClick={() => {
              onNavigate('settings');
              setMobileMenuOpen(false);
            }}
            className="text-left text-sm font-medium text-purple-400 py-2 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {t('settingsTitle') || 'Settings'}
          </button>

          <button
            onClick={() => {
              setNotifCenterOpen(true);
              setMobileMenuOpen(false);
            }}
            className="text-left text-sm font-medium text-slate-200 py-2 hover:text-blue-400 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <span>{t('notificationsTitle')}</span>
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white font-black text-[10px] rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {(role === 'recruiter' || role === 'club') && (
            <>
              <button
                onClick={() => {
                  onNavigate('search');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm font-medium text-slate-200 py-2 hover:text-blue-400"
              >
                {t('players')}
              </button>
              <button
                onClick={() => {
                  onNavigate('saved');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm font-medium text-slate-200 py-2 hover:text-blue-400"
              >
                {t('savedPlayers')}
              </button>
            </>
          )}

          {role === 'player' && (
            <button
              onClick={() => {
                onOpenProModal();
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl"
            >
              {isPro ? t('proActive') : t('upgradeToPro')}
            </button>
          )}

          <button
            onClick={() => {
              signOutUser();
              setMobileMenuOpen(false);
            }}
            className="text-left text-sm font-semibold text-rose-400 py-2"
          >
            {t('logout')}
          </button>
        </div>
      )}

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={notifCenterOpen}
        onClose={() => setNotifCenterOpen(false)}
        onNavigateToMessage={() => onNavigate('messages')}
        onOpenPlayerProfile={onOpenPlayerProfile}
        onOpenRecruiterProfile={onOpenRecruiterProfile}
      />
    </nav>
  );
};
