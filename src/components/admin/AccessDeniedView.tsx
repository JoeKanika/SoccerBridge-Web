/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ShieldAlert, Lock, ArrowLeft, RefreshCw } from 'lucide-react';

interface AccessDeniedViewProps {
  onReturnHome: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({ onReturnHome }) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const { refreshAdminStatus } = useAdminAuth();

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 selection:bg-rose-600">
      <div className="w-full max-w-lg bg-[#0A0E17] border border-rose-900/40 rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-3xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400 mx-auto mb-6 shadow-inner">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[11px] font-bold uppercase tracking-wider mb-4">
          <Lock className="w-3.5 h-3.5" />
          <span>HTTP 403 Forbidden</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">
          {t('adminAccessDeniedTitle')}
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          {t('adminAccessDeniedDesc')}
        </p>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-8 text-left text-xs text-slate-300 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span>{language === 'fr' ? 'Compte connecté :' : 'Active Account:'}</span>
            <span className="font-mono text-white text-[11px]">
              {currentUser?.email || (language === 'fr' ? 'Non authentifié' : 'Unauthenticated')}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>{language === 'fr' ? 'Identifiant UID :' : 'Account UID:'}</span>
            <span className="font-mono text-slate-400 text-[10px]">
              {currentUser?.uid ? `${currentUser.uid.slice(0, 16)}...` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>{language === 'fr' ? 'Niveau d’autorisation :' : 'Authorization Status:'}</span>
            <span className="font-bold text-rose-400">
              {language === 'fr' ? 'Privilèges insuffisants (Custom Claims manquants)' : 'Insufficient Claims (Admin Custom Claim Required)'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onReturnHome}
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('adminReturnHome')}</span>
          </button>

          <button
            onClick={() => refreshAdminStatus()}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{language === 'fr' ? 'Réactualiser l’autorisation' : 'Refresh Authorization'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
