/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminService } from '../../services/adminService';
import { SystemFeatureFlag } from '../../types/admin';
import { Sliders, ToggleLeft, ToggleRight, CheckCircle2, Shield, Sparkles } from 'lucide-react';

export const AdminFeatureFlagsView: React.FC = () => {
  const { t, language } = useLanguage();
  const { adminRole, hasPermission } = useAdminAuth();

  const [flags, setFlags] = useState<SystemFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const data = await AdminService.fetchFeatureFlags();
      setFlags(data);
    } catch (e) {
      console.error('Failed to load feature flags:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (flag: SystemFeatureFlag) => {
    const nextVal = !flag.enabled;
    const flagName = language === 'fr' ? flag.nameFr : flag.nameEn;
    const reason = prompt(
      language === 'fr'
        ? `Motif du changement pour ${flagName} :`
        : `Reason for modifying flag "${flagName}":`
    );

    if (!reason || !reason.trim()) {
      alert(language === 'fr' ? 'Le motif est obligatoire pour la traçabilité.' : 'Reason is required for audit trail.');
      return;
    }

    try {
      await AdminService.toggleFeatureFlag(
        flag.id,
        nextVal,
        reason.trim(),
        { uid: 'admin_user', email: 'devops@soccerbridge.org', role: adminRole || 'superadmin' }
      );
      await loadFlags();
    } catch (e: any) {
      alert(e.message || 'Toggle failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">{t('adminMenuFeatureFlags')}</h2>
        <p className="text-xs text-slate-400">
          {language === 'fr'
            ? 'Gestion des drapeaux de fonctionnalités, règles de sécurité et modules expérimentaux'
            : 'Configure real-time runtime toggles, safeguarding locks, and rollout gates'}
        </p>
      </div>

      <div className="space-y-3">
        {flags.map((flag) => (
          <div
            key={flag.id}
            className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-lg"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {language === 'fr' ? flag.nameFr : flag.nameEn}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                  {flag.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'fr' ? flag.descriptionFr : flag.descriptionEn}
              </p>
            </div>

            {hasPermission('manage_feature_flags') ? (
              <button
                onClick={() => handleToggle(flag)}
                className={`p-2 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all ${
                  flag.enabled
                    ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-400'
                }`}
              >
                {flag.enabled ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-emerald-400" />
                    <span>ON</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-slate-500" />
                    <span>OFF</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs font-bold text-slate-500">
                {flag.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
