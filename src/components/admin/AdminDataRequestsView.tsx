/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminService } from '../../services/adminService';
import { DataPrivacyRequestItem } from '../../types/admin';
import { FileDown, Trash2, CheckCircle2, Clock, ShieldCheck, User, Search, X } from 'lucide-react';

export const AdminDataRequestsView: React.FC = () => {
  const { t, language } = useLanguage();
  const { hasPermission } = useAdminAuth();

  const [requests, setRequests] = useState<DataPrivacyRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await AdminService.fetchDataRequests();
      setRequests(data);
    } catch (e) {
      console.error('Failed to load data privacy requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider">
            {language === 'fr' ? 'Conformité Loi 25 / RGPD' : 'Law 25 & GDPR Compliance'}
          </span>
        </div>
        <h2 className="text-xl font-black text-white">{t('adminMenuDataRequests')}</h2>
        <p className="text-xs text-slate-400">
          {language === 'fr'
            ? 'Demandes d’exportation de données et de suppression définitive de compte utilisateur'
            : 'Fulfill Canadian privacy Law 25 and GDPR data export and account deletion requests'}
        </p>
      </div>

      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#050914] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Utilisateur' : 'User Email'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Type' : 'Request Type'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Statut' : 'Status'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Date de soumission' : 'Submitted Date'}</th>
                <th className="py-3.5 px-4 text-right">{language === 'fr' ? 'Action' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    {language === 'fr' ? 'Aucune demande en cours.' : 'No data privacy requests in queue.'}
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-bold text-white font-mono">{r.userEmail}</td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 font-bold text-[10px]">
                        {r.type === 'export' ? 'Data Export' : 'Account Deletion'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-400 font-bold capitalize">{r.status}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-[11px] font-bold">
                        {r.type === 'export' ? 'Download JSON' : 'Process Request'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
