/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminService } from '../../services/adminService';
import { SafeguardingRecord } from '../../types/admin';
import {
  ShieldAlert,
  Lock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Search,
  Eye,
  EyeOff,
  FileCheck,
} from 'lucide-react';

export const AdminSafeguardingView: React.FC = () => {
  const { t, language } = useLanguage();
  const { hasPermission } = useAdminAuth();

  const [records, setRecords] = useState<SafeguardingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuardianData, setShowGuardianData] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await AdminService.fetchSafeguardingRecords();
      setRecords(data);
    } catch (e) {
      console.error('Failed to load safeguarding records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!hasPermission('access_safeguarding')) {
    return (
      <div className="bg-[#0A0E17] border border-rose-900/40 rounded-3xl p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400 mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">
          {language === 'fr' ? 'Accès Restreint - Protection des Mineurs' : 'Restricted Minor Safeguarding Vault'}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {t('adminSafeguardingNotice')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase tracking-wider">
            {language === 'fr' ? 'Zone de Sécurité Renforcée' : 'Privacy-Hardened Zone'}
          </span>
        </div>
        <h2 className="text-xl font-black text-white">{t('adminMenuSafeguarding')}</h2>
        <p className="text-xs text-slate-400">
          {t('adminSafeguardingNotice')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <span className="text-slate-400 text-[11px]">
            {language === 'fr' ? 'Athlètes mineurs (<18 ans)' : 'Minor Athletes (Under 18)'}
          </span>
          <span className="text-2xl font-black text-white">{records.length}</span>
        </div>

        <div className="bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <span className="text-slate-400 text-[11px]">
            {language === 'fr' ? 'Consentement parental confirmé' : 'Guardian Consent Verified'}
          </span>
          <span className="text-2xl font-black text-emerald-400">
            {records.filter((r) => r.hasGuardianConsent).length}
          </span>
        </div>

        <div className="bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <span className="text-slate-400 text-[11px]">
            {language === 'fr' ? 'Consentement en attente' : 'Missing / Incomplete Consent'}
          </span>
          <span className="text-2xl font-black text-amber-400">
            {records.filter((r) => !r.hasGuardianConsent).length}
          </span>
        </div>
      </div>

      {/* Controls & Privacy Mode Toggle */}
      <div className="flex justify-between items-center bg-[#0A0E17] border border-slate-800 rounded-3xl p-4">
        <span className="text-xs text-slate-400">
          {language === 'fr' ? 'Masquer / Démasquer les coordonnées des tuteurs' : 'Guardian PII Privacy Veil'}
        </span>
        <button
          onClick={() => setShowGuardianData(!showGuardianData)}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
        >
          {showGuardianData ? <EyeOff className="w-4 h-4 text-purple-400" /> : <Eye className="w-4 h-4 text-purple-400" />}
          <span>{showGuardianData ? (language === 'fr' ? 'Masquer PII' : 'Hide Guardian Data') : (language === 'fr' ? 'Afficher PII' : 'Reveal Guardian Data')}</span>
        </button>
      </div>

      {/* Safeguarding Table */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#050914] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Athlète' : 'Athlete'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Âge / Date de naissance' : 'Age / DOB'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Consentement tuteur' : 'Guardian Consent'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Tuteur légal' : 'Legal Guardian'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Courriel tuteur' : 'Guardian Contact'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Statut' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {language === 'fr' ? 'Aucun athlète mineur enregistré.' : 'No minor athletes currently registered.'}
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/50">
                    <td className="py-3.5 px-4 font-bold text-white">{r.playerName}</td>
                    <td className="py-3.5 px-4">{r.age} yrs ({r.dateOfBirth || 'N/A'})</td>
                    <td className="py-3.5 px-4">
                      {r.hasGuardianConsent ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'fr' ? 'Vérifié' : 'Confirmed'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{language === 'fr' ? 'Manquant' : 'Missing'}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {showGuardianData ? (r.guardianName || 'N/A') : '••••••••••••'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {showGuardianData ? (r.guardianEmail || 'N/A') : '••••••••••••'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase">
                        {r.status}
                      </span>
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
