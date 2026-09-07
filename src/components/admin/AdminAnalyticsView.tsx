/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { AdminService } from '../../services/adminService';
import { AdminDashboardOverviewMetrics } from '../../types/admin';
import { BarChart3, TrendingUp, Users, MapPin, Video, Eye, Heart, MessageSquare, Award } from 'lucide-react';

export const AdminAnalyticsView: React.FC = () => {
  const { t, language } = useLanguage();
  const [metrics, setMetrics] = useState<AdminDashboardOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminService.fetchOverviewMetrics().then((data) => {
      setMetrics(data);
      setLoading(false);
    });
  }, []);

  if (loading || !metrics) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Geographic Distribution Mocked across Real Canadian Regions
  const provinces = [
    { code: 'ON', name: 'Ontario', count: Math.max(Math.round(metrics.totalUsers * 0.45), 4) },
    { code: 'QC', name: 'Quebec', count: Math.max(Math.round(metrics.totalUsers * 0.28), 3) },
    { code: 'BC', name: 'British Columbia', count: Math.max(Math.round(metrics.totalUsers * 0.15), 2) },
    { code: 'AB', name: 'Alberta', count: Math.max(Math.round(metrics.totalUsers * 0.08), 1) },
    { code: 'OTHER', name: 'Other Provinces', count: Math.max(Math.round(metrics.totalUsers * 0.04), 1) },
  ];

  const positions = [
    { label: 'Attackers (ST/W)', pct: 34, color: 'bg-blue-500' },
    { label: 'Midfielders (CM/CAM/CDM)', pct: 36, color: 'bg-emerald-500' },
    { label: 'Defenders (CB/FB)', pct: 22, color: 'bg-indigo-500' },
    { label: 'Goalkeepers (GK)', pct: 8, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">{t('adminMenuAnalytics')}</h2>
        <p className="text-xs text-slate-400">
          {language === 'fr'
            ? 'Analytique de croissance, répartition géographique canadienne et engagement des utilisateurs'
            : 'Platform user growth, Canadian provincial distribution and talent scouting velocity'}
        </p>
      </div>

      {/* Primary Visual Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Geographic Distribution */}
        <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>{language === 'fr' ? 'Répartition géographique (Canada)' : 'Canadian Regional Distribution'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">{metrics.totalUsers} Total</span>
          </div>

          <div className="space-y-3 pt-2">
            {provinces.map((prov) => {
              const pct = metrics.totalUsers > 0 ? Math.round((prov.count / metrics.totalUsers) * 100) : 0;
              return (
                <div key={prov.code} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-300">{prov.name} ({prov.code})</span>
                    <span className="text-slate-400 font-mono">{prov.count} users ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Player Position Breakdown */}
        <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>{language === 'fr' ? 'Répartition par poste' : 'Player Position Breakdown'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">{metrics.totalPlayers} Players</span>
          </div>

          <div className="space-y-3 pt-2">
            {positions.map((pos) => (
              <div key={pos.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-300">{pos.label}</span>
                  <span className="text-slate-400 font-mono">{pos.pct}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${pos.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${pos.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl space-y-1">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <Video className="w-4 h-4 text-blue-400" /> Videos Uploaded
          </span>
          <span className="text-2xl font-black text-white">{metrics.uploadedVideosCount}</span>
        </div>

        <div className="bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl space-y-1">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <MessageSquare className="w-4 h-4 text-emerald-400" /> Conversations
          </span>
          <span className="text-2xl font-black text-white">{metrics.conversationsCount}</span>
        </div>

        <div className="bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl space-y-1">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <TrendingUp className="w-4 h-4 text-purple-400" /> Trials Sent
          </span>
          <span className="text-2xl font-black text-white">{metrics.trialInvitationsCount}</span>
        </div>

        <div className="bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl space-y-1">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <Eye className="w-4 h-4 text-amber-400" /> Active 24h
          </span>
          <span className="text-2xl font-black text-white">{metrics.activeUsers24h}</span>
        </div>
      </div>
    </div>
  );
};
