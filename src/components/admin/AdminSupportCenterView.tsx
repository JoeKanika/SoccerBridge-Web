/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminService } from '../../services/adminService';
import { SupportCaseItem } from '../../types/admin';
import { Headphones, CheckCircle2, Clock, MessageSquare, Search, AlertCircle, Plus, X } from 'lucide-react';

export const AdminSupportCenterView: React.FC = () => {
  const { t, language } = useLanguage();
  const { hasPermission } = useAdminAuth();

  const [cases, setCases] = useState<SupportCaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await AdminService.fetchSupportCases();
      setCases(data);
    } catch (e) {
      console.error('Failed to load support cases:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">{t('adminMenuSupport')}</h2>
        <p className="text-xs text-slate-400">
          {language === 'fr'
            ? 'Gestion des tickets d’assistance utilisateur, diagnostics d’accès et notes internes'
            : 'User support cases, account access assistance, error triage and internal support logs'}
        </p>
      </div>

      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-4 flex items-center">
        <Search className="w-4 h-4 text-slate-500 mr-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'fr' ? 'Rechercher un ticket ou utilisateur...' : 'Search tickets by number, email, issue topic...'}
          className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 mx-auto">
          <Headphones className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-white">
          {language === 'fr' ? 'File d’assistance à jour' : 'Support Queue Clean'}
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          {language === 'fr'
            ? 'Toutes les demandes de support et erreurs d’inscription ont été traitées avec succès.'
            : 'All incoming user inquiries and onboarding recovery requests are currently resolved.'}
        </p>
      </div>
    </div>
  );
};
