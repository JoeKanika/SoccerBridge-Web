import React, { useState } from 'react';
import { Logo } from './Logo';
import { useLanguage } from '../i18n/LanguageContext';
import { LegalModal, PolicyType } from './LegalModal';
import { Globe, ShieldCheck, Mail, ArrowUpRight } from 'lucide-react';
import { UserRole } from '../types';

interface FooterProps {
  onSelectRole?: (role: UserRole) => void;
  onNavigate?: (view: string) => void;
  onOpenProModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectRole, onNavigate, onOpenProModal }) => {
  const { language, setLanguage, t } = useLanguage();
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState<PolicyType>('safeguarding');

  const openPolicy = (type: PolicyType) => {
    setActivePolicyTab(type);
    setLegalModalOpen(true);
  };

  const handleSectionClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate?.('home');
      setTimeout(() => {
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <>
      <footer className="border-t border-slate-900 bg-[#020617] text-slate-400 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Col 1 & 2: Brand & Mission Statement */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-start">
              <Logo size="sm" showSlogan={false} />
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              {language === 'fr'
                ? 'La plateforme nationale de recrutement connectant les joueurs de soccer au Canada avec les agents certifiés FIFA, les recruteurs de clubs professionnels et les universités.'
                : 'The national recruiting infrastructure connecting Canadian soccer players with FIFA-certified agents, recruiters, professional clubs, and universities.'}
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 flex items-center gap-2 font-bold text-xs transition-all cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>{language === 'en' ? 'Français (CA)' : 'English (CA)'}</span>
              </button>
            </div>
          </div>

          {/* Col 3: For Talent & Organizations */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              {language === 'fr' ? 'Écosystème' : 'Ecosystem'}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onSelectRole?.('player')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {language === 'fr' ? 'Pour les joueurs' : 'For Players'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectRole?.('recruiter')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {language === 'fr' ? 'Pour les agents & recruteurs' : 'For Agents & Recruiters'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectRole?.('club')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {language === 'fr' ? 'Pour les clubs & académies' : 'For Clubs & Academies'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSectionClick('how-it-works')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('navHowItWorks')}
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenProModal}
                  className="hover:text-amber-300 text-amber-400 font-bold transition-colors cursor-pointer text-left flex items-center gap-1"
                >
                  <span>{language === 'fr' ? 'Adhésion SoccerBridge PRO' : 'SoccerBridge PRO Membership'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Safety & Governance */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              {language === 'fr' ? 'Sécurité & Légal' : 'Safety & Legal'}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => openPolicy('safeguarding')}
                  className="text-blue-400 hover:text-blue-300 font-bold transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>{language === 'fr' ? 'Protection des mineurs' : 'Minor Safeguarding'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => openPolicy('terms')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {language === 'fr' ? 'Conditions d’utilisation' : 'Terms of Service'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => openPolicy('privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {language === 'fr' ? 'Politique de confidentialité (LPRPDE)' : 'Privacy Policy (PIPEDA)'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSectionClick('safety')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {language === 'fr' ? 'Piliers de sécurité' : 'Safety Standards'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('admin')}
                  className="text-slate-400 hover:text-blue-400 text-xs transition-colors cursor-pointer text-left flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>{language === 'fr' ? 'Portail d’administration' : 'Admin Portal'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Contact & Governance */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              SoccerBridge Canada
            </h4>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              {language === 'fr'
                ? 'Plateforme officielle d’intermédiation et de visibilité soccer.'
                : 'National football scouting and recruitment network.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-300 mb-4">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <a href="mailto:support@soccerbridge.ca" className="hover:text-white transition-colors">
                support@soccerbridge.ca
              </a>
            </div>
            <p className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} SoccerBridge Canada Inc.{' '}
              {language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>

      {/* Interactive Legal & Safeguarding Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={activePolicyTab}
      />
    </>
  );
};
