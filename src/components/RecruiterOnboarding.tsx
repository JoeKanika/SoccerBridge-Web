import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getFirebaseErrorMessage } from '../firebase';
import { RecruiterOrgType } from '../types';
import { Briefcase, ShieldCheck, Upload, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface RecruiterOnboardingProps {
  onComplete: () => void;
}

const ORG_TYPES: RecruiterOrgType[] = [
  'FIFA Agent',
  'Independent Recruiter',
  'Professional Club',
  'Semi-Pro Club',
  'Academy',
  'College / University',
];

export const RecruiterOnboarding: React.FC<RecruiterOnboardingProps> = ({ onComplete }) => {
  const { language, t } = useLanguage();
  const { userAccount, recruiterProfile, saveRecruiterProfile } = useAuth();

  const [fullName, setFullName] = useState(userAccount?.fullName || recruiterProfile?.fullName || '');
  const [email] = useState(userAccount?.email || recruiterProfile?.email || '');
  const [phone, setPhone] = useState(recruiterProfile?.phone || '+1 (416) 555-0199');
  const [organization, setOrganization] = useState(
    recruiterProfile?.organization || 'Canada Global Sports Agency'
  );
  const [jobTitle, setJobTitle] = useState(recruiterProfile?.jobTitle || 'Head Scouting Director');
  const [organizationType, setOrganizationType] = useState<RecruiterOrgType>(
    recruiterProfile?.organizationType || 'FIFA Agent'
  );
  const [city, setCity] = useState(recruiterProfile?.city || 'Montreal');
  const [province, setProvince] = useState(recruiterProfile?.province || 'Quebec (QC)');
  const [country, setCountry] = useState(recruiterProfile?.country || 'Canada');
  const [website, setWebsite] = useState(recruiterProfile?.website || 'https://canadasportsagency.ca');
  const [fifaLicenceNumber, setFifaLicenceNumber] = useState(
    recruiterProfile?.fifaLicenceNumber || 'FIFA-CA-2024-8891'
  );
  const [bio, setBio] = useState(
    recruiterProfile?.bio ||
      'FIFA Certified Agent evaluating youth and collegiate talent across Canada for Canadian Premier League and European club placement.'
  );
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    recruiterProfile?.profilePhotoUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'
  );
  const [verificationDocumentsUrl, setVerificationDocumentsUrl] = useState(
    recruiterProfile?.verificationDocumentsUrl || 'https://soccerbridge.ca/docs/agent_license.pdf'
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !organization.trim()) {
      setErrorMsg(
        language === 'fr'
          ? 'Veuillez renseigner votre nom et votre organisation.'
          : 'Please complete full name and organization.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await saveRecruiterProfile({
        role: (userAccount?.role as any) || 'recruiter',
        fullName,
        email,
        phone,
        organization,
        jobTitle,
        organizationType,
        city,
        province,
        country,
        website,
        fifaLicenceNumber,
        bio,
        profilePhotoUrl,
        verificationDocumentsUrl,
        verificationStatus: recruiterProfile?.verificationStatus || 'pending',
        onboardingCompleted: true,
      });

      onComplete();
    } catch (err: any) {
      console.error('Error saving recruiter profile:', err);
      setErrorMsg(getFirebaseErrorMessage(err?.code || err?.message || '', language));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0A1128] to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">{t('recruiterOnboardingTitle')}</h1>
            <p className="text-xs text-slate-400">{t('welcomeSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">{t('fullName')}</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">{t('jobTitle')}</label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Organization / Club</label>
            <input
              type="text"
              required
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {t('organizationType')}
            </label>
            <select
              value={organizationType}
              onChange={(e) => setOrganizationType(e.target.value as RecruiterOrgType)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              {ORG_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">{t('city')}</label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">{t('province')}</label>
            <input
              type="text"
              required
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">{t('website')}</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {t('fifaLicence')}
            </label>
            <input
              type="text"
              value={fifaLicenceNumber}
              onChange={(e) => setFifaLicenceNumber(e.target.value)}
              placeholder="FIFA-CA-XXXX-XXXX"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">{t('bio')}</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            {t('verificationDocs')}
          </label>
          <input
            type="text"
            value={verificationDocumentsUrl}
            onChange={(e) => setVerificationDocumentsUrl(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 text-sm transition-all"
        >
          {submitting ? t('loading') : t('submit')}
        </button>
      </form>
    </div>
  );
};
