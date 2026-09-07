/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminService } from '../../services/adminService';
import { SystemAnnouncementItem } from '../../types/admin';
import { Megaphone, Plus, Trash2, CheckCircle2, AlertTriangle, Eye, X } from 'lucide-react';

export const AdminAnnouncementsView: React.FC = () => {
  const { t, language } = useLanguage();
  const { hasPermission } = useAdminAuth();

  const [announcements, setAnnouncements] = useState<SystemAnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form State
  const [titleEn, setTitleEn] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [bodyFr, setBodyFr] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'emergency' | 'maintenance'>('info');
  const [targetAudience, setTargetAudience] = useState<'all' | 'players' | 'recruiters' | 'clubs'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await AdminService.fetchAnnouncements();
      setAnnouncements(data);
    } catch (e) {
      console.error('Failed to load announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() || !titleFr.trim()) {
      alert('Please fill out both English and French titles.');
      return;
    }

    setIsSubmitting(true);
    try {
      await AdminService.createAnnouncement({
        title: { en: titleEn, fr: titleFr },
        body: { en: bodyEn, fr: bodyFr },
        type,
        targetAudience,
        isActive: true,
      });
      setCreateModalOpen(false);
      setTitleEn('');
      setTitleFr('');
      setBodyEn('');
      setBodyFr('');
      await loadAnnouncements();
    } catch (e: any) {
      alert(e.message || 'Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">{t('adminMenuAnnouncements')}</h2>
          <p className="text-xs text-slate-400">
            {language === 'fr'
              ? 'Bannières d’annonces système, avis de maintenance et alertes générales'
              : 'Broadcast system-wide notices, emergency maintenance banners, and community updates'}
          </p>
        </div>

        {hasPermission('create_announcements') && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'fr' ? 'Nouvelle annonce' : 'Create Broadcast'}</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="py-12 text-center bg-[#0A0E17] border border-slate-800 rounded-3xl text-slate-500 text-xs">
            {language === 'fr' ? 'Aucune annonce active.' : 'No active broadcast announcements.'}
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
                  {ann.type} • Audience: {ann.targetAudience}
                </span>
                <span className="text-[11px] text-emerald-400 font-bold">Active</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">English (EN)</span>
                  <h4 className="font-bold text-white text-xs">{ann.title.en}</h4>
                  <p className="text-slate-300 text-xs mt-1">{ann.body.en}</p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Français (FR)</span>
                  <h4 className="font-bold text-white text-xs">{ann.title.fr}</h4>
                  <p className="text-slate-300 text-xs mt-1">{ann.body.fr}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateAnnouncement} className="w-full max-w-lg bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Broadcast Announcement</h3>
              <button type="button" onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white">
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="emergency">Emergency</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Target Audience</label>
                  <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value as any)} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white">
                    <option value="all">All Users</option>
                    <option value="players">Players Only</option>
                    <option value="recruiters">Recruiters Only</option>
                    <option value="clubs">Clubs Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Title (EN)</label>
                <input type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} required className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white" />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Title (FR)</label>
                <input type="text" value={titleFr} onChange={(e) => setTitleFr(e.target.value)} required className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white" />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Message (EN)</label>
                <textarea value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} required rows={2} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white" />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Message (FR)</label>
                <textarea value={bodyFr} onChange={(e) => setBodyFr(e.target.value)} required rows={2} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
