import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Check, X, Shield, Award, Zap } from 'lucide-react';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const { upgradeToProMembership, userAccount, playerProfile } = useAuth();
  const [activating, setActivating] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  if (!isOpen) return null;

  const isAlreadyPro = userAccount?.membership === 'PRO' || playerProfile?.membership === 'PRO';

  const handleDevActivation = async () => {
    setActivating(true);
    try {
      await upgradeToProMembership();
      setActivatedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0A0E17] border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-[0_0_50px_rgba(245,158,11,0.2)] my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* PRO Badge Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/25 mb-3">
            <Sparkles className="w-8 h-8 fill-current" />
          </div>
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            SoccerBridge PRO
          </span>
          <h2 className="text-2xl font-black">{t('foundingMemberOffer')}</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">{t('welcomeSubtitle')}</p>
        </div>

        {/* Pricing Box */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 text-center mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-3 py-1 rounded-bl-xl">
            Save 30%
          </div>
          <div className="text-3xl font-black text-amber-400 mb-1">{t('proPrice')}</div>
          <div className="text-xs text-slate-500 line-through">{t('proRegularPrice')}</div>
        </div>

        {/* Benefits List */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>{t('proBenefit1')}</span>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>{t('proBenefit2')}</span>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>{t('proBenefit3')}</span>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>{t('proBenefit4')}</span>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>{t('proBenefit5')}</span>
          </div>
        </div>

        {/* Dev Placeholder Activation Button */}
        {isAlreadyPro ? (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-emerald-300 text-xs font-bold text-center">
            {t('proActive')}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleDevActivation}
              disabled={activating || activatedSuccess}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 text-sm transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {activating
                  ? t('loading')
                  : activatedSuccess
                  ? 'PRO Activated!'
                  : t('activateProDev')}
              </span>
            </button>
            <p className="text-[10px] text-center text-slate-500 italic">
              Payment Gateway Integration Placeholder — No real charge applied during simulation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
