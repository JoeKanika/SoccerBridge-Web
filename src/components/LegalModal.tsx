import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { X, ShieldCheck, FileText, Lock, Shield, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';

export type PolicyType = 'safeguarding' | 'terms' | 'privacy';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyType;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, initialTab = 'safeguarding' }) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<PolicyType>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  const isFr = language === 'fr';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              {activeTab === 'safeguarding' && <ShieldCheck className="w-5 h-5" />}
              {activeTab === 'terms' && <FileText className="w-5 h-5" />}
              {activeTab === 'privacy' && <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                {activeTab === 'safeguarding' && (isFr ? 'Protection des Jeunes Joueurs (Safeguarding)' : 'Youth Safeguarding Policy')}
                {activeTab === 'terms' && (isFr ? 'Conditions Générales d\'Utilisation' : 'Terms & Conditions of Service')}
                {activeTab === 'privacy' && (isFr ? 'Politique de Confidentialité' : 'Privacy & Data Policy')}
              </h2>
              <p className="text-xs text-slate-400">
                SoccerBridge Canada • {isFr ? 'Dernière mise à jour: Juillet 2026' : 'Last Updated: July 2026'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('safeguarding')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
              activeTab === 'safeguarding'
                ? 'bg-slate-900 text-blue-400 border-blue-500 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isFr ? 'Safeguarding & Protection' : 'Youth Safeguarding'}
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
              activeTab === 'terms'
                ? 'bg-slate-900 text-blue-400 border-blue-500 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            {isFr ? 'Conditions (Terms)' : 'Terms & Conditions'}
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
              activeTab === 'privacy'
                ? 'bg-slate-900 text-blue-400 border-blue-500 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            {isFr ? 'Confidentialité (Privacy)' : 'Privacy Policy'}
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm leading-relaxed text-slate-300">
          
          {/* SAFEGUARDING POLICY */}
          {activeTab === 'safeguarding' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-blue-200 text-sm mb-1">
                    {isFr ? 'Engagement Zéro Tolérance pour la Sécurité des Mineurs' : 'Zero Tolerance Youth Protection Commitment'}
                  </p>
                  <p className="text-slate-300">
                    {isFr
                      ? 'SoccerBridge Canada s\'engage à offrir un environnement sécurisé, éthique et vérifié pour tous les jeunes athlètes. Aucun contact direct non autorisé entre recruteur et joueur mineur n\'est toléré sans consentement parental certifié.'
                      : 'SoccerBridge Canada is dedicated to providing a secure, ethical, and verified environment for all young athletes. Direct unauthorized contact between recruiters and minor players is strictly prohibited without verified guardian consent.'}
                  </p>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                  1. {isFr ? 'Vérification Obligatoire des Recruteurs & Agents' : 'Mandatory Recruiter & Scout Identity Verification'}
                </h3>
                <p>
                  {isFr
                    ? 'Tous les recruteurs, scouts et agents inscrits sur la plateforme doivent soumettre des pièces d\'identité officielles (numéro de licence FIFA/Canada Soccer ou preuve de club professionnel) pour obtenir le badge de Vérification Recommandée.'
                    : 'All recruiters, scouts, and agents registered on SoccerBridge must submit official identification credentials (FIFA/Canada Soccer license or accredited professional club credentials) to earn the Verified Scout badge.'}
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li>{isFr ? 'Vérification du registre des antécédents judiciaires et éthique sportive.' : 'Background ethics audit and official registry verification.'}</li>
                  <li>{isFr ? 'Validation obligatoire de l\'adresse courriel professionnelle du club ou de l\'académie.' : 'Mandatory validation of official professional club or academy email addresses.'}</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  2. {isFr ? 'Supervision Parentale et Consentement du Tuteur' : 'Parental Supervision & Guardian Consent'}
                </h3>
                <p>
                  {isFr
                    ? 'Pour tous les joueurs âgés de moins de 18 ans, la création et la gestion de profil nécessitent l\'adresse courriel d\'un parent ou tuteur légal. Toutes les communications et sollicitations de recruteurs sont systématiquement copiées à l\'adresse du tuteur.'
                    : 'For all players under the age of 18, profile setup and messaging require verified guardian contact information. All recruiter messages, trial invitations, and contract inquiries are automatically carbon-copied to the designated guardian email address.'}
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  3. {isFr ? 'Messagerie Sécurisée et Signalement Instantané' : 'Monitored Messaging & Instant Reporting'}
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li>
                    {isFr
                      ? 'Les échanges de messages sont filtrés par nos systèmes de protection automatisés contre les comportements inappropriés ou suspects.'
                      : 'All messaging threads are scanned using automated safety filters to prevent grooming, inappropriate communication, or solicitations outside official trial protocols.'}
                  </li>
                  <li>
                    {isFr
                      ? 'Un bouton de signalement d\'urgence est accessible en tout temps sur chaque profil et dans chaque conversation.'
                      : 'An emergency "Report Account" trigger is available 24/7 on every profile and message thread for immediate admin review and account suspension.'}
                  </li>
                </ul>
              </section>
            </div>
          )}

          {/* TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-fadeIn">
              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white">1. {isFr ? 'Acceptation des Conditions' : 'Acceptance of Terms'}</h3>
                <p>
                  {isFr
                    ? 'En créant un compte sur SoccerBridge, vous acceptez de vous conformer aux présentes conditions générales d\'utilisation. Ces conditions régissent l\'accès aux services de mise en relation sportive entre joueurs, recruteurs, agents et clubs.'
                    : 'By creating an account on SoccerBridge, you agree to abide by these Terms and Conditions. These terms govern access to soccer scouting, trial connection, and talent showcase services.'}
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white">2. {isFr ? 'Exactitude des Données et Statistiques' : 'Accuracy of Player Stats & Highlights'}</h3>
                <p>
                  {isFr
                    ? 'Les joueurs s\'engagent à fournir des informations véridiques quant à leur âge, club actuel, position et faits saillants vidéo. Toute falsification délibérée d\'âge ou de palmarès entraînera la suspension immédiate du compte.'
                    : 'Players agree to provide accurate information regarding their age, current club affiliation, playing position, and video highlights. Deliberate misrepresentation of age or playing credentials will lead to permanent platform revocation.'}
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white">3. {isFr ? 'Abonnements et Comptes PRO' : 'Subscriptions & PRO Accounts'}</h3>
                <p>
                  {isFr
                    ? 'Les abonnements PRO Joueur ou Recruteur accordent des fonctionnalités avancées (analyse vidéo IA, mise en avant sur la page de recherche, messagerie directe). Les abonnements se renouvellent automatiquement mensuellement sauf annulation dans les paramètres de profil.'
                    : 'PRO Player and PRO Scout memberships unlock elevated showcase badges, AI highlights, direct messaging features, and search priority. Subscriptions automatically renew monthly unless cancelled in user settings prior to renewal date.'}
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white">4. {isFr ? 'Règlements FIFA & Fédéraux' : 'FIFA & Federation Regulatory Compliance'}</h3>
                <p>
                  {isFr
                    ? 'SoccerBridge respecte le cadre réglementaire de FIFA, Canada Soccer et des associations provinciales de soccer concernant la représentation des mineurs et le recrutement d\'athlètes amateurs.'
                    : 'SoccerBridge complies with FIFA, Canada Soccer, and provincial association guidelines governing amateur athlete recruitment, trial invitations, and agent representation.'}
                </p>
              </section>
            </div>
          )}

          {/* PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fadeIn">
              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white">1. {isFr ? 'Collecte et Protection des Données (LPRPDE / PIPEDA)' : 'Data Collection & Protection (PIPEDA Compliant)'}</h3>
                <p>
                  {isFr
                    ? 'Conformément aux lois canadiennes sur la protection des renseignements personnels (LPRPDE / Loi 25), SoccerBridge stocke de manière hautement sécurisée vos coordonnées, statistiques sportives, et fichiers vidéo.'
                    : 'In compliance with Canadian Personal Information Protection and Electronic Documents Act (PIPEDA), SoccerBridge encrypts and securely stores user contact details, athletic performance metrics, and video highlight assets.'}
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white">2. {isFr ? 'Utilisation des Vidéos et Extraits IA' : 'Use of Player Videos & AI Clip Generation'}</h3>
                <p>
                  {isFr
                    ? 'Les vidéos téléchargées sont traitées exclusivement pour générer des clips d\'analyse technique (vitesse, précision de passe, vision du jeu) visibles par les recruteurs certifiés. Vos données ne sont jamais vendues à des tiers publicitaires.'
                    : 'Uploaded videos are processed solely to generate athletic performance metrics (sprint speed, pass accuracy, positional heatmaps) visible to verified scouts. Personal data is never sold to third-party ad networks.'}
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white">3. {isFr ? 'Contrôle de la Visibilité du Profil' : 'Profile Visibility Controls'}</h3>
                <p>
                  {isFr
                    ? 'Chaque joueur peut basculer son profil en mode Réseau Privé, restreignant l\'accès aux seuls recruteurs vérifiés par l\'équipe d\'administration SoccerBridge.'
                    : 'Players can toggle their profile visibility to Private Scout Mode at any time, restricting view rights exclusively to verified academy scouts and FIFA licensed agents.'}
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white">4. {isFr ? 'Droit de Suppression et Exportation' : 'Right to Erasure & Data Export'}</h3>
                <p>
                  {isFr
                    ? 'Vous pouvez demander à tout moment la suppression définitive de votre compte et de toutes vos vidéos associées par simple demande à privacy@soccerbridge.ca.'
                    : 'You may request full account deletion and complete erasure of uploaded videos at any time by contacting privacy@soccerbridge.ca.'}
                </p>
              </section>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isFr ? 'Sécurité Certifiée SoccerBridge Canada' : 'Certified SoccerBridge Safe Scouting'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            {isFr ? 'Fermer & Accepter' : 'Close & Understand'}
          </button>
        </div>

      </div>
    </div>
  );
};
