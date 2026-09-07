/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { AdminService } from '../../services/adminService';
import { AdminDashboardOverviewMetrics } from '../../types/admin';
import {
  Users,
  UserCheck,
  Briefcase,
  Building2,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  Video,
  Calendar,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

interface AdminOverviewViewProps {
  onNavigateTab: (tab: any) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ onNavigateTab }) => {
  const { t, language } = useLanguage();
  const [metrics, setMetrics] = useState<AdminDashboardOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const res = await AdminService.fetchOverviewMetrics();
    setMetrics(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {language === 'fr' ? 'Chargement des indicateurs réels...' : 'Loading verified platform metrics...'}
        </span>
      </div>
    );
  }

  const proConversionRate = metrics.totalUsers > 0
    ? ((metrics.proUsersCount / metrics.totalUsers) * 100).toFixed(1)
    : '0.0';

  const profileCompletionRate = metrics.totalUsers > 0
    ? ((metrics.completedProfiles / metrics.totalUsers) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0A1128] via-[#0F172A] to-[#0A1128] border border-blue-900/40 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-black uppercase tracking-wider">
              {language === 'fr' ? 'Tableau de bord exécutif' : 'Executive Overview'}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {new Date().toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {t('adminPortal')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {t('adminPortalSubtitle')}
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-blue-400" />
          <span>{language === 'fr' ? 'Actualiser' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* KPI Primary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div
          onClick={() => onNavigateTab('users')}
          className="bg-[#0A0E17] border border-slate-800 hover:border-blue-500/50 rounded-3xl p-5 cursor-pointer transition-all hover:scale-[1.01] group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">{t('adminOverviewKPIUsers')}</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{metrics.totalUsers}</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center">
              +{metrics.newRegistrationsToday} {language === 'fr' ? 'auj.' : 'today'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>{language === 'fr' ? 'Actifs (24h) :' : 'Active (24h):'}</span>
            <span className="font-bold text-slate-300">{metrics.activeUsers24h}</span>
          </div>
        </div>

        {/* Players */}
        <div
          onClick={() => onNavigateTab('users')}
          className="bg-[#0A0E17] border border-slate-800 hover:border-blue-500/50 rounded-3xl p-5 cursor-pointer transition-all hover:scale-[1.01] group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">{t('adminOverviewKPIPlayers')}</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{metrics.totalPlayers}</span>
            <span className="text-[11px] text-slate-400">
              {metrics.totalUsers > 0 ? Math.round((metrics.totalPlayers / metrics.totalUsers) * 100) : 0}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>{language === 'fr' ? 'Vidéos profil :' : 'Player Videos:'}</span>
            <span className="font-bold text-slate-300">{metrics.uploadedVideosCount}</span>
          </div>
        </div>

        {/* Recruiters & Agents */}
        <div
          onClick={() => onNavigateTab('recruiters')}
          className="bg-[#0A0E17] border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-5 cursor-pointer transition-all hover:scale-[1.01] group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">{t('adminOverviewKPIRecruiters')}</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{metrics.totalRecruiters}</span>
            {metrics.pendingRecruiterVerificationsCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                {metrics.pendingRecruiterVerificationsCount} {language === 'fr' ? 'en attente' : 'pending'}
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>{language === 'fr' ? 'Invitations envoyées :' : 'Trials Sent:'}</span>
            <span className="font-bold text-slate-300">{metrics.trialInvitationsCount}</span>
          </div>
        </div>

        {/* Clubs & Academies */}
        <div
          onClick={() => onNavigateTab('clubs')}
          className="bg-[#0A0E17] border border-slate-800 hover:border-purple-500/50 rounded-3xl p-5 cursor-pointer transition-all hover:scale-[1.01] group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">{t('adminOverviewKPIClubs')}</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{metrics.totalClubs}</span>
            <span className="text-[11px] text-purple-300 font-bold">
              {metrics.opportunitiesCount} {language === 'fr' ? 'opps' : 'opps'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>{language === 'fr' ? 'Organisations actives :' : 'Active Orgs:'}</span>
            <span className="font-bold text-slate-300">{metrics.totalClubs}</span>
          </div>
        </div>
      </div>

      {/* Secondary Operational Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Onboarding & Conversion */}
        <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>{language === 'fr' ? 'Intégration & Profils' : 'Onboarding & Health'}</span>
            </h3>
            <span className="text-xs font-bold text-blue-400">{profileCompletionRate}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(parseFloat(profileCompletionRate), 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <span className="block text-slate-400 text-[11px]">{t('adminOverviewKPICompleted')}</span>
              <span className="text-lg font-black text-emerald-400">{metrics.completedProfiles}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <span className="block text-slate-400 text-[11px]">{t('adminOverviewKPIIncomplete')}</span>
              <span className="text-lg font-black text-amber-400">{metrics.incompleteOnboarding}</span>
            </div>
          </div>
        </div>

        {/* Membership & PRO Monetization */}
        <div
          onClick={() => onNavigateTab('subscriptions')}
          className="bg-[#0A0E17] border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 shadow-lg space-y-4 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>{language === 'fr' ? 'Abonnements PRO' : 'PRO Memberships'}</span>
            </h3>
            <span className="text-xs font-bold text-amber-400">{proConversionRate}% rate</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <span className="block text-slate-400 text-[11px]">FREE Tier</span>
              <span className="text-lg font-black text-slate-300">{metrics.freeUsersCount}</span>
            </div>
            <div className="bg-amber-950/40 p-3 rounded-2xl border border-amber-800/60">
              <span className="block text-amber-300 text-[11px]">PRO Tier</span>
              <span className="text-lg font-black text-amber-400">{metrics.proUsersCount}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>{language === 'fr' ? 'Gérer les forfaits' : 'Manage subscriptions'}</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {/* Trust, Safety & Reports */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-[#0A0E17] border border-slate-800 hover:border-rose-500/40 rounded-3xl p-6 shadow-lg space-y-4 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>{language === 'fr' ? 'Sécurité & Signalements' : 'Safety & Queues'}</span>
            </h3>
            {metrics.openAbuseReportsCount > 0 ? (
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[10px] font-bold">
                {metrics.openAbuseReportsCount} {language === 'fr' ? 'ouverts' : 'open'}
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-bold">
                {language === 'fr' ? 'Sain' : 'Clear'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <span className="block text-slate-400 text-[11px]">{t('adminOverviewKPISuspended')}</span>
              <span className="text-lg font-black text-rose-400">{metrics.suspendedAccountsCount}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <span className="block text-slate-400 text-[11px]">{t('adminOverviewKPIPendingVerif')}</span>
              <span className="text-lg font-black text-amber-400">{metrics.pendingRecruiterVerificationsCount}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>{language === 'fr' ? 'Accéder à la file de sécurité' : 'Open safety queue'}</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Shortcuts */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-4">
          {language === 'fr' ? 'Accès direct aux modules d’exploitation' : 'Operational Quick Access'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <button
            onClick={() => onNavigateTab('users')}
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
          >
            <Users className="w-5 h-5 text-blue-400 mb-2" />
            <span className="block font-bold text-white">{t('adminMenuUsers')}</span>
            <span className="block text-[11px] text-slate-500">{metrics.totalUsers} accounts</span>
          </button>

          <button
            onClick={() => onNavigateTab('recruiters')}
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
            <span className="block font-bold text-white">{t('adminMenuRecruiters')}</span>
            <span className="block text-[11px] text-slate-500">{metrics.pendingRecruiterVerificationsCount} awaiting review</span>
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 mb-2" />
            <span className="block font-bold text-white">{t('adminMenuReports')}</span>
            <span className="block text-[11px] text-slate-500">{metrics.openAbuseReportsCount} open cases</span>
          </button>

          <button
            onClick={() => onNavigateTab('health')}
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-purple-400 mb-2" />
            <span className="block font-bold text-white">{t('adminMenuHealth')}</span>
            <span className="block text-[11px] text-slate-500">Live telemetry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
