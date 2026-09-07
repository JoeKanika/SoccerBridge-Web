/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminService } from '../../services/adminService';
import { SafetyReportItem, SafetyReportStatus, SafetyReportCategory } from '../../types/admin';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Search,
  User,
  X,
} from 'lucide-react';

export const AdminSafetyCenterView: React.FC = () => {
  const { t, language } = useLanguage();
  const { adminRole, hasPermission } = useAdminAuth();

  const [reports, setReports] = useState<SafetyReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | SafetyReportStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SafetyReportCategory>('all');

  const [selectedReport, setSelectedReport] = useState<SafetyReportItem | null>(null);
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await AdminService.fetchSafetyReports();
      setReports(data);
    } catch (e) {
      console.error('Failed to load safety reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const handleResolve = async (status: 'actionTaken' | 'dismissed') => {
    if (!selectedReport) return;
    if (!resolutionDetails.trim()) {
      alert(language === 'fr' ? 'Veuillez saisir les détails de résolution.' : 'Please enter resolution details.');
      return;
    }

    setActionInProgress(true);
    try {
      await AdminService.resolveSafetyReport(
        selectedReport.id,
        status,
        resolutionDetails,
        { uid: 'admin_user', email: 'moderator@soccerbridge.org', role: adminRole || 'moderator' }
      );
      setResolutionDetails('');
      setSelectedReport(null);
      await loadReports();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">{t('adminMenuReports')}</h2>
        <p className="text-xs text-slate-400">
          {language === 'fr'
            ? 'Gestion des signalements d’abus, escroqueries, harcèlement et alertes de sécurité'
            : 'Abuse report triage, impersonation investigations, scam alerts and safety actions'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">{language === 'fr' ? 'Tous les statuts' : 'All Statuses'}</option>
          <option value="open">{language === 'fr' ? 'Ouvert' : 'Open'}</option>
          <option value="investigating">{language === 'fr' ? 'En cours' : 'Investigating'}</option>
          <option value="actionTaken">{language === 'fr' ? 'Action prise' : 'Action Taken'}</option>
          <option value="dismissed">{language === 'fr' ? 'Classé' : 'Dismissed'}</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as any)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">{language === 'fr' ? 'Toutes les catégories' : 'All Categories'}</option>
          <option value="scam">Scam / Fraud</option>
          <option value="fake_recruiter">Fake Recruiter</option>
          <option value="harassment">Harassment</option>
          <option value="safeguarding_concern">Safeguarding Concern</option>
          <option value="spam">Spam</option>
        </select>
      </div>

      {/* Reports Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-[#0A0E17] border border-slate-800 rounded-3xl text-slate-500 text-xs">
            {language === 'fr' ? 'Aucun signalement actif.' : 'No safety reports in this queue.'}
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="bg-[#0A0E17] border border-slate-800 hover:border-rose-500/50 rounded-3xl p-5 cursor-pointer transition-all hover:scale-[1.005] group space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                  {report.category.replace('_', ' ')}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    report.status === 'open'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : report.status === 'actionTaken'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {report.status}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">
                  Target UID: {report.targetUserId}
                </span>
                <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                  {report.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Reporter: {report.reporterId.slice(0, 10)}...</span>
                <span className="text-rose-400 font-bold">{language === 'fr' ? 'Traiter' : 'Investigate'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Safety Report Detail Drawer */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-[#0A0E17] border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white capitalize">{selectedReport.category.replace('_', ' ')}</h3>
                    <span className="text-xs text-slate-400">Report ID: {selectedReport.id}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px]">Report Description</span>
                  <p className="text-white leading-relaxed">{selectedReport.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Reporter ID</span>
                    <span className="block font-mono text-slate-300 break-all">{selectedReport.reporterId}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Target Account</span>
                    <span className="block font-mono text-rose-300 break-all">{selectedReport.targetUserId}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  {language === 'fr' ? 'Détails de l’action prise / Motif' : 'Resolution Details & Safety Assessment'}
                </label>
                <textarea
                  value={resolutionDetails}
                  onChange={(e) => setResolutionDetails(e.target.value)}
                  placeholder={language === 'fr' ? 'Expliquez l’action prise...' : 'e.g. Account suspended for impersonation; False positive cleared.'}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              {hasPermission('manage_reports') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    disabled={actionInProgress}
                    onClick={() => handleResolve('actionTaken')}
                    className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('adminActionResolve')}</span>
                  </button>

                  <button
                    disabled={actionInProgress}
                    onClick={() => handleResolve('dismissed')}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{t('adminActionDismiss')}</span>
                  </button>
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
