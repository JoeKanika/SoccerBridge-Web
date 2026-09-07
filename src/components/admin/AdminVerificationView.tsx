/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminService } from '../../services/adminService';
import { VerificationRequest, VerificationQueueStatus } from '../../types/admin';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  Search,
  MessageSquare,
  AlertCircle,
  X,
  Send,
} from 'lucide-react';

interface AdminVerificationViewProps {
  initialType?: 'recruiter' | 'club';
}

export const AdminVerificationView: React.FC<AdminVerificationViewProps> = ({
  initialType = 'recruiter',
}) => {
  const { t, language } = useLanguage();
  const { adminRole, hasPermission } = useAdminAuth();

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetType, setTargetType] = useState<'recruiter' | 'club'>(initialType);
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationQueueStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected request modal / review drawer
  const [selectedReq, setSelectedReq] = useState<VerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await AdminService.fetchVerificationRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load verification requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = requests.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesType = r.userType === targetType;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch =
      (r.applicantName || '').toLowerCase().includes(q) ||
      (r.organizationName || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.fifaLicenceNumber && r.fifaLicenceNumber.toLowerCase().includes(q));

    return matchesType && matchesStatus && matchesSearch;
  });

  const handleProcess = async (status: 'verified' | 'rejected' | 'needsMoreInformation') => {
    if (!selectedReq) return;
    if (!reviewNotes.trim()) {
      alert(language === 'fr' ? 'Veuillez saisir une note de vérification.' : 'Please enter verification notes.');
      return;
    }

    setActionInProgress(true);
    try {
      await AdminService.processVerification(
        selectedReq.id,
        selectedReq.userId,
        status,
        reviewNotes,
        { uid: 'admin_user', email: 'verifier@soccerbridge.org', role: adminRole || 'superadmin' }
      );
      setFeedbackMessage(
        status === 'verified'
          ? (language === 'fr' ? 'Candidature approuvée avec succès.' : 'Applicant verified.')
          : (language === 'fr' ? 'Décision de vérification enregistrée.' : 'Verification decision updated.')
      );
      setReviewNotes('');
      setSelectedReq(null);
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">
            {targetType === 'recruiter' ? t('adminMenuRecruiters') : t('adminMenuClubs')}
          </h2>
          <p className="text-xs text-slate-400">
            {language === 'fr'
              ? 'Examen des accréditations professionnelles, licences FIFA et affiliations de clubs'
              : 'Audit professional credentials, FIFA agent licences and official club affiliations'}
          </p>
        </div>

        {/* Type Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1">
          <button
            onClick={() => setTargetType('recruiter')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              targetType === 'recruiter' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'fr' ? 'Recruteurs & Agents' : 'Agents & Scouts'}</span>
          </button>
          <button
            onClick={() => setTargetType('club')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              targetType === 'club' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{language === 'fr' ? 'Clubs & Académies' : 'Clubs & Academies'}</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-xs text-emerald-300 flex items-center justify-between">
          <span>{feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Status Filters */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher par nom, organisation, licence FIFA...' : 'Search by name, organization, FIFA licence...'}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">{language === 'fr' ? 'Tous les statuts' : 'All Statuses'}</option>
            <option value="pending">{language === 'fr' ? 'En attente' : 'Pending'}</option>
            <option value="underReview">{language === 'fr' ? 'En examen' : 'Under Review'}</option>
            <option value="verified">{language === 'fr' ? 'Vérifié' : 'Verified'}</option>
            <option value="rejected">{language === 'fr' ? 'Rejeté' : 'Rejected'}</option>
          </select>
        </div>
      </div>

      {/* Verification Queue List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRequests.length === 0 ? (
          <div className="col-span-2 py-12 text-center bg-[#0A0E17] border border-slate-800 rounded-3xl text-slate-500 text-xs">
            {language === 'fr' ? 'Aucune demande dans cette file.' : 'No verification requests in this queue.'}
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              onClick={() => {
                setSelectedReq(req);
                setReviewNotes(req.reviewerNotes || '');
              }}
              className="bg-[#0A0E17] border border-slate-800 hover:border-blue-500/50 rounded-3xl p-5 cursor-pointer transition-all hover:scale-[1.005] group space-y-4 shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold">
                    {req.applicantName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                      {req.applicantName}
                    </h3>
                    <span className="text-xs text-slate-400">{req.organizationName}</span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    req.status === 'verified'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : req.status === 'rejected'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {req.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                <div>
                  <span className="text-slate-500 text-[10px] block">{language === 'fr' ? 'Type / Rôle' : 'Org Type / Role'}</span>
                  <span className="text-slate-300 font-bold">{req.orgType || req.jobTitle || 'Scout'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">{language === 'fr' ? 'Licence FIFA' : 'FIFA Licence'}</span>
                  <span className="font-mono text-slate-300 font-bold">
                    {req.fifaLicenceNumber || (language === 'fr' ? 'Non spécifié' : 'N/A')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{req.city ? `${req.city}, ${req.country}` : req.country}</span>
                <span className="text-blue-400 font-bold flex items-center gap-1 group-hover:underline">
                  <span>{language === 'fr' ? 'Examiner' : 'Inspect'}</span>
                  <FileText className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Verification Drawer / Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-[#0A0E17] border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-black text-lg">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{selectedReq.applicantName}</h3>
                    <span className="text-xs text-slate-400">{selectedReq.organizationName}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReq(null)}
                  className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dossier Information */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">{t('email')}</span>
                    <span className="block font-mono text-white break-all">{selectedReq.email}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">FIFA Licence</span>
                    <span className="block font-mono text-emerald-400 font-bold">
                      {selectedReq.fifaLicenceNumber || 'Not provided'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px]">Organization Details</span>
                  <span className="block text-white font-bold">{selectedReq.organizationName} ({selectedReq.orgType})</span>
                  {selectedReq.website && (
                    <a
                      href={selectedReq.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1 mt-1 text-[11px]"
                    >
                      <span>{selectedReq.website}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Verification Notes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  {language === 'fr' ? 'Notes d’examen / Justificatif' : 'Reviewer Assessment Notes'}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={language === 'fr' ? 'Ex : Licence FIFA vérifiée dans le registre officiel ; documentation approuvée' : 'e.g., FIFA registry ID confirmed; official club staff directory verified'}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              {hasPermission('verify_recruiters') && (
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      disabled={actionInProgress}
                      onClick={() => handleProcess('verified')}
                      className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('adminActionApprove')}</span>
                    </button>

                    <button
                      disabled={actionInProgress}
                      onClick={() => handleProcess('rejected')}
                      className="p-3 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{t('adminActionReject')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-800 text-slate-500 text-[11px]">
              {t('adminAuditTrailTitle')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
