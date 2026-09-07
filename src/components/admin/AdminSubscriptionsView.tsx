/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminService } from '../../services/adminService';
import { SubscriptionAdminRecord } from '../../types/admin';
import { AccountMembership } from '../../types';
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  Clock,
  Search,
  Zap,
  Gift,
  X,
} from 'lucide-react';

export const AdminSubscriptionsView: React.FC = () => {
  const { t, language } = useLanguage();
  const { adminRole, hasPermission } = useAdminAuth();

  const [subscriptions, setSubscriptions] = useState<SubscriptionAdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Promotional Grant Modal
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [targetUid, setTargetUid] = useState('');
  const [grantTier, setGrantTier] = useState<AccountMembership>('PRO');
  const [grantReason, setGrantReason] = useState('');
  const [grantInProgress, setGrantInProgress] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await AdminService.fetchSubscriptions();
      setSubscriptions(data);
    } catch (e) {
      console.error('Failed to load subscriptions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSubs = subscriptions.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesTier = tierFilter === 'all' || s.tier === tierFilter;
    const matchesSearch =
      (s.userName || '').toLowerCase().includes(q) ||
      (s.userEmail || '').toLowerCase().includes(q) ||
      (s.userId || '').toLowerCase().includes(q);
    return matchesTier && matchesSearch;
  });

  const handleGrantPro = async () => {
    if (!targetUid.trim() || !grantReason.trim()) {
      alert(language === 'fr' ? 'Veuillez remplir l’UID et le motif.' : 'Please enter target UID and reason.');
      return;
    }

    setGrantInProgress(true);
    try {
      await AdminService.grantMembershipTier(
        targetUid.trim(),
        grantTier,
        grantReason,
        { uid: 'admin_user', email: 'billing@soccerbridge.org', role: adminRole || 'superadmin' }
      );
      alert(language === 'fr' ? 'Attribution PRO enregistrée avec succès.' : 'PRO membership tier updated.');
      setGrantModalOpen(false);
      setTargetUid('');
      setGrantReason('');
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Grant failed');
    } finally {
      setGrantInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">{t('adminMenuSubscriptions')}</h2>
          <p className="text-xs text-slate-400">
            {language === 'fr'
              ? 'Surveillance des forfaits FREE vs PRO et attributions promotionnelles auditées'
              : 'Monitor FREE vs PRO subscriptions, billing status and audited promotional grants'}
          </p>
        </div>

        {hasPermission('manage_subscriptions') && (
          <button
            onClick={() => setGrantModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-lg"
          >
            <Gift className="w-4 h-4" />
            <span>{language === 'fr' ? 'Octroi PRO promotionnel' : 'Grant PRO Tier'}</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <span className="text-slate-400 text-[11px]">Total Subscribers</span>
          <span className="text-2xl font-black text-white">{subscriptions.length}</span>
        </div>

        <div className="bg-[#0A0E17] border border-amber-900/40 p-5 rounded-3xl space-y-1 shadow-lg">
          <span className="text-amber-400 text-[11px]">Active PRO Members</span>
          <span className="text-2xl font-black text-amber-400">
            {subscriptions.filter((s) => s.tier !== 'FREE').length}
          </span>
        </div>

        <div className="bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <span className="text-slate-400 text-[11px]">FREE Members</span>
          <span className="text-2xl font-black text-slate-300">
            {subscriptions.filter((s) => s.tier === 'FREE').length}
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher un abonné...' : 'Search by subscriber name, email...'}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">{language === 'fr' ? 'Tous les forfaits' : 'All Tiers'}</option>
          <option value="FREE">FREE</option>
          <option value="PLAYER_PRO">PLAYER_PRO</option>
          <option value="RECRUITER_PRO">RECRUITER_PRO</option>
          <option value="CLUB_PRO">CLUB_PRO</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#050914] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Abonné' : 'Subscriber'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Forfait' : 'Tier'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Fournisseur' : 'Provider'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Statut' : 'Status'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Motif octroi' : 'Grant Reason'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    {language === 'fr' ? 'Aucun abonnement trouvé.' : 'No subscriptions found.'}
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-900/50">
                    <td className="py-3.5 px-4">
                      <span className="block font-bold text-white">{sub.userName}</span>
                      <span className="block text-[11px] text-slate-400 font-mono">{sub.userEmail}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          sub.tier !== 'FREE'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {sub.tier}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono capitalize">{sub.provider.replace('_', ' ')}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-400 font-bold capitalize">{sub.status}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {sub.grantReason || 'Standard subscription'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Modal */}
      {grantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {language === 'fr' ? 'Octroi PRO / Forfait Test' : 'Grant PRO Membership Tier'}
              </h3>
              <button onClick={() => setGrantModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">User Account UID</label>
                <input
                  type="text"
                  value={targetUid}
                  onChange={(e) => setTargetUid(e.target.value)}
                  placeholder="Paste user UID (e.g. kA82x...)"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Tier</label>
                <select
                  value={grantTier}
                  onChange={(e) => setGrantTier(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                >
                  <option value="PRO">PRO</option>
                  <option value="FREE">FREE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Operational Reason (Logged to Audit Trail) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="e.g., FIFA Certified Partner courtesy trial; Community Ambassador grant"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  rows={2}
                />
              </div>
            </div>

            <button
              disabled={grantInProgress}
              onClick={handleGrantPro}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-colors"
            >
              {grantInProgress ? 'Applying...' : 'Apply Membership & Log Audit Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
