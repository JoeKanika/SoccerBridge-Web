/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminService } from '../../services/adminService';
import { ModerationItem, ModerationTargetType, ModerationStatus } from '../../types/admin';
import {
  Image,
  Video,
  FileText,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  ExternalLink,
} from 'lucide-react';

export const AdminModerationView: React.FC = () => {
  const { t, language } = useLanguage();
  const { adminRole, hasPermission } = useAdminAuth();

  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | ModerationTargetType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ModerationStatus>('all');

  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await AdminService.fetchModerationItems();
      setItems(data);
    } catch (e) {
      console.error('Failed to load moderation queue:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesType = typeFilter === 'all' || item.targetType === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const handleApplyAction = async (status: ModerationStatus) => {
    if (!selectedItem) return;
    if (!moderationReason.trim()) {
      alert(language === 'fr' ? 'Veuillez saisir un motif de modération.' : 'Please enter a moderation reason.');
      return;
    }

    setActionInProgress(true);
    try {
      await AdminService.applyModerationAction(
        selectedItem.id,
        selectedItem.targetType,
        selectedItem.targetId,
        status,
        moderationReason,
        { uid: 'admin_user', email: 'moderator@soccerbridge.org', role: adminRole || 'moderator' }
      );
      setModerationReason('');
      setSelectedItem(null);
      await loadItems();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">{t('adminMenuModeration')}</h2>
        <p className="text-xs text-slate-400">
          {language === 'fr'
            ? 'File de révision des médias, photos de profil, vidéos de faits saillants et contenus utilisateurs'
            : 'Review queue for profile photos, highlight videos, biographies, and opportunity listings'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">{language === 'fr' ? 'Tous les médias' : 'All Media Types'}</option>
          <option value="video">Highlight Videos</option>
          <option value="player_photo">Profile Photos</option>
          <option value="gallery_photo">Gallery Photos</option>
          <option value="profile_bio">Bios</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">{language === 'fr' ? 'Tous les statuts' : 'All Statuses'}</option>
          <option value="approved">{language === 'fr' ? 'Approuvé' : 'Approved'}</option>
          <option value="hidden">{language === 'fr' ? 'Masqué' : 'Hidden'}</option>
          <option value="flagged">{language === 'fr' ? 'Signalé' : 'Flagged'}</option>
        </select>
      </div>

      {/* Media Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-[#0A0E17] border border-slate-800 rounded-3xl text-slate-500 text-xs">
            {language === 'fr' ? 'Aucun élément dans la file de modération.' : 'No media items currently in moderation queue.'}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-[#0A0E17] border border-slate-800 hover:border-blue-500/50 rounded-3xl p-5 cursor-pointer transition-all hover:scale-[1.005] group space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  {item.targetType === 'video' ? <Video className="w-4 h-4 text-blue-400" /> : <Image className="w-4 h-4 text-emerald-400" />}
                  <span className="capitalize">{item.targetType.replace('_', ' ')}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : item.status === 'hidden'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                  {item.title || 'Untitled Upload'}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {item.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>By: {item.authorName}</span>
                <span className="text-blue-400 font-bold">{language === 'fr' ? 'Examiner' : 'Moderate'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Moderation Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-[#0A0E17] border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-lg font-black text-white">{selectedItem.title || 'Media Inspection'}</h3>
                <button onClick={() => setSelectedItem(null)} className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Preview */}
              {selectedItem.contentUrl && (
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-center">
                  <a
                    href={selectedItem.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg"
                  >
                    <span>{language === 'fr' ? 'Ouvrir la source média' : 'Open Media Asset'}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  {language === 'fr' ? 'Motif de modération' : 'Moderation Note / Reason'}
                </label>
                <textarea
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder={language === 'fr' ? 'Précisez le motif...' : 'Specify moderation reason (e.g. Approved standard match footage; Copyright dispute; Inappropriate content)'}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              {hasPermission('moderate_content') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    disabled={actionInProgress}
                    onClick={() => handleApplyAction('approved')}
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('adminActionApprove')}</span>
                  </button>

                  <button
                    disabled={actionInProgress}
                    onClick={() => handleApplyAction('hidden')}
                    className="p-3 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <EyeOff className="w-4 h-4" />
                    <span>{t('adminActionHideContent')}</span>
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
