/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminService } from '../../services/adminService';
import { AdminAuditLogEntry } from '../../types/admin';
import { ShieldAlert, Search, Filter, Clock, User, FileText, CheckCircle2, Lock } from 'lucide-react';

export const AdminAuditLogView: React.FC = () => {
  const { t, language } = useLanguage();
  const { hasPermission } = useAdminAuth();

  const [logs, setLogs] = useState<AdminAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await AdminService.fetchAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(q) ||
      (log.adminEmail || '').toLowerCase().includes(q) ||
      (log.targetId || '').toLowerCase().includes(q) ||
      (log.reason && log.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
              {language === 'fr' ? 'Registre Immuable' : 'Append-Only Ledger'}
            </span>
          </div>
          <h2 className="text-xl font-black text-white">{t('adminMenuAuditLogs')}</h2>
          <p className="text-xs text-slate-400">
            {language === 'fr'
              ? 'Journal d’audit officiel consignant toutes les actions administratives avec horodatage et justification'
              : 'Official cryptographic ledger recording administrative mutations, reviewer decisions and reason justification'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>{logs.length} logged events</span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-4 flex items-center">
        <Search className="w-4 h-4 text-slate-500 mr-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'fr' ? 'Filtrer par admin, action, identifiant cible ou motif...' : 'Filter by admin email, action type, target UID or reason...'}
          className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#050914] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Horodatage' : 'Timestamp'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Administrateur' : 'Staff Admin'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Action' : 'Action'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Cible (UID/ID)' : 'Target ID'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Justification / Motif' : 'Operational Reason'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    {language === 'fr' ? 'Aucun événement d’audit enregistré.' : 'No audit log events found.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateStr = log.timestamp?.toDate
                    ? log.timestamp.toDate().toLocaleString()
                    : new Date(log.timestamp).toLocaleString();

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-sans font-bold text-white text-xs">{log.adminEmail}</div>
                        <span className="text-[10px] text-blue-400 capitalize">{log.adminRole}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-200 text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] max-w-[120px] truncate">
                        {log.targetId}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans text-xs max-w-sm">
                        {log.reason || 'Automated record initialization'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
