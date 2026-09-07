/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AuthModal } from './components/AuthModal';
import { PlayerOnboarding } from './components/PlayerOnboarding';
import { RecruiterOnboarding } from './components/RecruiterOnboarding';
import { PlayerDashboard } from './components/PlayerDashboard';
import { RecruiterDashboard } from './components/RecruiterDashboard';
import { HomeFeed } from './components/HomeFeed';
import { SavedItemsView } from './components/SavedItemsView';
import { PublicPlayerProfileModal } from './components/PublicPlayerProfileModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { TrialInvitationModal } from './components/TrialInvitationModal';
import { MessagingView } from './components/MessagingView';
import { SettingsView } from './components/SettingsView';
import { NotFoundView } from './components/NotFoundView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminDevBar } from './components/AdminDevBar';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DiagnosticDebugOverlay } from './components/DiagnosticDebugOverlay';
import { UserRole, PlayerProfile } from './types';
import { User, Briefcase, Shield, ArrowRight } from 'lucide-react';

function MainApp() {
  const {
    currentUser,
    userAccount,
    playerProfile,
    recruiterProfile,
    loading,
    devRoleOverride,
    setUserRole,
  } = useAuth();
  const { language, t } = useLanguage();

  // Navigation active view state
  const [activeView, setActiveView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash === '#admin' || path.startsWith('/admin')) {
        return 'admin';
      }
    }
    return 'home';
  });

  // Modal controls
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [authModalRole, setAuthModalRole] = useState<UserRole>('player');

  const [proModalOpen, setProModalOpen] = useState(false);

  // Selected player for public profile modal
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);

  // Trial invitation modal state
  const [trialPlayer, setTrialPlayer] = useState<PlayerProfile | null>(null);
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  // Messaging recipient
  const [messageRecipient, setMessageRecipient] = useState<PlayerProfile | null>(null);

  // Determine explicit role without unsafe fallback
  const resolvedRole = devRoleOverride || userAccount?.role;
  const isRoleKnown = Boolean(resolvedRole && ['player', 'recruiter', 'club'].includes(resolvedRole));
  const activeRole: UserRole = isRoleKnown ? (resolvedRole as UserRole) : 'player';

  // Role selection recovery needed when user exists but role is unresolved
  const needsRoleRecovery = Boolean(currentUser && !isRoleKnown);

  // Determine if onboarding is required strictly based on verified role
  const needsPlayerOnboarding = Boolean(
    currentUser && isRoleKnown && activeRole === 'player' && !userAccount?.onboardingCompleted
  );

  const needsRecruiterOnboarding = Boolean(
    currentUser &&
      isRoleKnown &&
      (activeRole === 'recruiter' || activeRole === 'club') &&
      !userAccount?.onboardingCompleted
  );

  const handleSelectRoleFromWelcome = (role: UserRole) => {
    setAuthModalRole(role);
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleSelectPlayerFromSearch = (player: PlayerProfile) => {
    setSelectedPlayer(player);
    setPlayerModalOpen(true);
  };

  const handleOpenMessageFromProfile = (player: PlayerProfile) => {
    setMessageRecipient(player);
    setPlayerModalOpen(false);
    setActiveView('messages');
  };

  const handleOpenSendTrialFromProfile = (player: PlayerProfile) => {
    setTrialPlayer(player);
    setPlayerModalOpen(false);
    setTrialModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">
            Loading SoccerBridge...
          </span>
        </div>
      </div>
    );
  }

  // Dedicated Full-Screen Admin Control Center
  if (activeView === 'admin') {
    return <AdminDashboard onReturnToPlatform={() => setActiveView('home')} />;
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col selection:bg-blue-600 selection:text-white ${!currentUser && activeView === 'home' ? 'bg-white text-slate-900' : 'bg-[#020617] text-white'}`}>
      {/* Dev Sandbox Bar for effortless role & verification testing */}
      <AdminDevBar onOpenAdmin={() => setActiveView('admin')} />

      {/* Main Navbar */}
      <Navbar
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenProModal={() => setProModalOpen(true)}
        onOpenPlayerProfile={handleSelectPlayerFromSearch}
      />

      {/* Primary View Router */}
      <main className="flex-1">
        {/* Case 1: Unauthenticated Users */}
        {!currentUser && (
          <>
            {activeView === 'home' ? (
              <WelcomeScreen
                onSelectRole={handleSelectRoleFromWelcome}
                onOpenLogin={() => handleOpenAuthModal('login')}
                onOpenRegister={() => handleOpenAuthModal('register')}
              />
            ) : ['dashboard', 'search', 'saved', 'messages', 'settings', 'onboarding_player'].includes(activeView) ? (
              /* Require login for private views */
              <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-2xl font-black mb-2">Authentication Required</h2>
                <p className="text-slate-400 text-sm mb-6 max-w-sm">Please log in or create an account to access this feature.</p>
                <button
                  onClick={() => handleOpenAuthModal('login')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Log In Now
                </button>
              </div>
            ) : (
              <NotFoundView onReturnHome={() => setActiveView('home')} />
            )}
          </>
        )}

        {/* Case 2: Authenticated but Role Unresolved (Recovery Screen) */}
        {currentUser && needsRoleRecovery && (
          <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 md:p-8 text-center shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400 mx-auto mb-4">
                <User className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">
                {language === 'fr' ? 'Choisissez votre type de profil' : 'Select Your Profile Type'}
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                {language === 'fr'
                  ? 'Pour finaliser votre configuration, indiquez comment vous souhaitez utiliser SoccerBridge.'
                  : 'To complete your account setup, please select how you will use SoccerBridge.'}
              </p>
              <div className="space-y-3 text-left">
                <button
                  onClick={() => setUserRole('player')}
                  className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-950/60 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-white">{t('playerRole')}</span>
                      <span className="block text-[11px] text-slate-400">{t('playerRoleDesc')}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 ml-2" />
                </button>

                <button
                  onClick={() => setUserRole('recruiter')}
                  className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-white">{t('recruiterRole')}</span>
                      <span className="block text-[11px] text-slate-400">{t('recruiterRoleDesc')}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 ml-2" />
                </button>

                <button
                  onClick={() => setUserRole('club')}
                  className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950/60 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-white">{t('clubRole')}</span>
                      <span className="block text-[11px] text-slate-400">{t('clubRoleDesc')}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Case 3: Onboarding Required */}
        {currentUser && !needsRoleRecovery && needsPlayerOnboarding && (
          <PlayerOnboarding onComplete={() => setActiveView('home')} />
        )}

        {currentUser && !needsRoleRecovery && needsRecruiterOnboarding && (
          <RecruiterOnboarding onComplete={() => setActiveView('home')} />
        )}

        {/* Case 4: Authenticated Normal Views */}
        {currentUser && !needsRoleRecovery && !needsPlayerOnboarding && !needsRecruiterOnboarding && (
          <>
            {activeView === 'home' && (
              <HomeFeed
                onSelectPlayer={handleSelectPlayerFromSearch}
                onOpenMessage={handleOpenMessageFromProfile}
                onOpenSendTrial={handleOpenSendTrialFromProfile}
                onOpenProModal={() => setProModalOpen(true)}
                onNavigate={setActiveView}
              />
            )}

            {activeView === 'dashboard' && (
              <>
                {activeRole === 'player' ? (
                  <PlayerDashboard
                    onOpenProModal={() => setProModalOpen(true)}
                    onOpenEditProfile={() =>
                      setActiveView('onboarding_player')
                    }
                    onNavigateToMessages={() => setActiveView('messages')}
                  />
                ) : (
                  <RecruiterDashboard
                    onSelectPlayer={handleSelectPlayerFromSearch}
                    onOpenMessage={handleOpenMessageFromProfile}
                    onOpenSendTrial={handleOpenSendTrialFromProfile}
                  />
                )}
              </>
            )}

            {activeView === 'search' && (
              <RecruiterDashboard
                onSelectPlayer={handleSelectPlayerFromSearch}
                onOpenMessage={handleOpenMessageFromProfile}
                onOpenSendTrial={handleOpenSendTrialFromProfile}
              />
            )}

            {activeView === 'saved' && (
              <SavedItemsView
                onSelectPlayer={handleSelectPlayerFromSearch}
                onOpenMessage={handleOpenMessageFromProfile}
                onOpenSendTrial={handleOpenSendTrialFromProfile}
                onNavigate={setActiveView}
              />
            )}

            {activeView === 'messages' && (
              <MessagingView initialRecipient={messageRecipient} />
            )}

            {activeView === 'settings' && (
              <SettingsView />
            )}

            {activeView === 'onboarding_player' && (
              <PlayerOnboarding onComplete={() => setActiveView('home')} />
            )}

            {!['home', 'dashboard', 'search', 'saved', 'messages', 'settings', 'onboarding_player'].includes(activeView) && (
              <NotFoundView onReturnHome={() => setActiveView('home')} />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        initialRole={authModalRole}
        onSuccess={() => setActiveView('home')}
      />

      <PublicPlayerProfileModal
        player={selectedPlayer}
        isOpen={playerModalOpen}
        onClose={() => setPlayerModalOpen(false)}
        onOpenMessage={handleOpenMessageFromProfile}
        onOpenSendTrial={handleOpenSendTrialFromProfile}
      />

      <ProUpgradeModal
        isOpen={proModalOpen}
        onClose={() => setProModalOpen(false)}
      />

      <TrialInvitationModal
        player={trialPlayer}
        isOpen={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
      />

      {/* Footer */}
      <Footer
        onSelectRole={handleSelectRoleFromWelcome}
        onNavigate={setActiveView}
        onOpenProModal={() => setProModalOpen(true)}
      />

      {/* Temporary Debug Overlay for Auth & Firestore Telemetry */}
      <DiagnosticDebugOverlay activeView={activeView} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <MainApp />
          </AdminAuthProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
