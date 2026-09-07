import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Logo } from './Logo';
import {
  User,
  Briefcase,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
  initialRole?: UserRole;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'register',
  initialRole = 'player',
  onSuccess,
}) => {
  const { language, t } = useLanguage();
  const {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    resetPassword,
    error,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [newsAccepted, setNewsAccepted] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [localValidationErr, setLocalValidationErr] = useState<string | null>(null);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedRole(initialRole);
      setLocalValidationErr(null);
      setResetSuccess(false);
      clearError();
    }
  }, [isOpen, initialMode, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalValidationErr(null);

    if (mode === 'register') {
      if (!fullName.trim()) {
        setLocalValidationErr(
          language === 'fr' ? 'Veuillez entrer votre nom complet.' : 'Please enter your full name.'
        );
        return;
      }
      if (password.length < 6) {
        setLocalValidationErr(
          language === 'fr'
            ? 'Le mot de passe doit contenir au moins 6 caractères.'
            : 'Password must be at least 6 characters long.'
        );
        return;
      }
      if (password !== confirmPassword) {
        setLocalValidationErr(
          language === 'fr'
            ? 'Les mots de passe ne correspondent pas.'
            : 'Passwords do not match.'
        );
        return;
      }
      if (!termsAccepted) {
        setLocalValidationErr(
          language === 'fr'
            ? 'Vous devez accepter les conditions d’utilisation.'
            : 'You must accept the Terms of Service.'
        );
        return;
      }

      setSubmitting(true);
      try {
        await signUpWithEmail(email, password, fullName, selectedRole);
        onSuccess();
        onClose();
      } catch (err) {
        // Handled in AuthContext error state
      } finally {
        setSubmitting(false);
      }
    } else if (mode === 'login') {
      setSubmitting(true);
      try {
        await signInWithEmail(email, password);
        onSuccess();
        onClose();
      } catch (err) {
        // Handled in AuthContext
      } finally {
        setSubmitting(false);
      }
    } else if (mode === 'forgot') {
      if (!email.trim()) {
        setLocalValidationErr(
          language === 'fr' ? 'Veuillez entrer votre e-mail.' : 'Please enter your email.'
        );
        return;
      }
      setSubmitting(true);
      try {
        await resetPassword(email);
        setResetSuccess(true);
      } catch (err) {
        // Error handled in AuthContext
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleGoogleClick = async () => {
    try {
      await signInWithGoogle(selectedRole);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Google Auth Error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-2xl my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <Logo size="md" showSlogan={false} />
          <h2 className="text-2xl font-black mt-3 text-center">
            {mode === 'register'
              ? language === 'fr' ? 'Créer un compte' : 'Create an Account'
              : mode === 'login'
              ? language === 'fr' ? 'Connexion' : 'Welcome Back'
              : language === 'fr' ? 'Mot de passe oublié' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400 text-center mt-1">
            {mode === 'register'
              ? language === 'fr'
                ? 'Rejoins le réseau et connecte ton talent aux bonnes opportunités.'
                : 'Join the network and connect your talent with real opportunities.'
              : mode === 'login'
              ? t('welcomeSubtitle')
              : language === 'fr'
              ? 'Entrez votre e-mail pour recevoir les instructions.'
              : 'Enter your email to receive reset instructions.'}
          </p>
        </div>

        {/* Global Error Banner */}
        {(error || localValidationErr) && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-2xl flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{localValidationErr || error}</span>
          </div>
        )}

        {/* Registration Flow */}
        {mode === 'register' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Account Role Selection (As shown in reference image 1) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                {t('chooseAccountType')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Player Card */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('player')}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    selectedRole === 'player'
                      ? 'border-blue-500 bg-blue-950/40 text-white shadow-lg shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {selectedRole === 'player' && (
                    <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-blue-500 fill-blue-500/20" />
                  )}
                  <User className={`w-6 h-6 mb-1 ${selectedRole === 'player' ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">{t('playerRole')}</span>
                </button>

                {/* Recruiter Card */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('recruiter')}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    selectedRole === 'recruiter'
                      ? 'border-blue-500 bg-blue-950/40 text-white shadow-lg shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {selectedRole === 'recruiter' && (
                    <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-blue-500 fill-blue-500/20" />
                  )}
                  <Briefcase className={`w-6 h-6 mb-1 ${selectedRole === 'recruiter' ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">{t('recruiterRole')}</span>
                </button>

                {/* Club Card */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('club')}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    selectedRole === 'club'
                      ? 'border-blue-500 bg-blue-950/40 text-white shadow-lg shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {selectedRole === 'club' && (
                    <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-blue-500 fill-blue-500/20" />
                  )}
                  <Shield className={`w-6 h-6 mb-1 ${selectedRole === 'club' ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">{t('clubRole')}</span>
                </button>
              </div>
            </div>

            {/* 2. Account Details */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                {t('createAccount')}
              </label>

              {/* Full Name */}
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder={t('fullName')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('confirmPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Terms checkboxes */}
            <div className="space-y-2 text-xs text-slate-400">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <span>{t('termsAgreement')}</span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsAccepted}
                  onChange={(e) => setNewsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <span>{t('updatesAgreement')}</span>
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 text-sm transition-all"
            >
              {submitting ? t('loading') : language === 'fr' ? 'Créer mon compte' : 'Create My Account'}
            </button>
          </form>
        )}

        {/* Login Flow */}
        {mode === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-xs text-blue-400 hover:underline"
              >
                {t('forgotPassword')}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 text-sm transition-all"
            >
              {submitting ? t('loading') : t('login')}
            </button>
          </form>
        )}

        {/* Forgot Password Flow */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            {resetSuccess ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-emerald-300 text-xs text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold">
                  {language === 'fr'
                    ? 'Un lien de réinitialisation a été envoyé à votre adresse e-mail.'
                    : 'A password reset link has been sent to your email.'}
                </p>
                <button
                  onClick={() => setMode('login')}
                  className="text-blue-400 font-bold underline text-xs"
                >
                  {t('login')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder={t('email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm"
                >
                  {submitting ? t('loading') : t('sendResetLink')}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Divider & Social Provider Options */}
        {mode !== 'forgot' && (
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="relative flex justify-center text-xs text-slate-500 mb-4">
              <span className="bg-[#0A0E17] px-3">
                {language === 'fr' ? 'ou continuer avec' : 'or continue with'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleClick}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-slate-900 font-semibold rounded-2xl text-xs hover:bg-slate-100 transition-colors shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleGoogleClick}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 border border-slate-700 text-white font-semibold rounded-2xl text-xs hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.09c.67-.82 1.13-1.96.99-3.09-1 .04-2.22.67-2.92 1.49-.62.72-1.16 1.88-1.01 3 1.12.09 2.27-.58 2.94-1.4" />
                </svg>
                <span>Apple</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Toggle */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {mode === 'register' ? (
            <p>
              {t('alreadyHaveAccount')}{' '}
              <button
                onClick={() => setMode('login')}
                className="text-blue-400 font-bold hover:underline"
              >
                {t('login')}
              </button>
            </p>
          ) : (
            <p>
              {t('dontHaveAccount')}{' '}
              <button
                onClick={() => setMode('register')}
                className="text-blue-400 font-bold hover:underline"
              >
                {t('register')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
