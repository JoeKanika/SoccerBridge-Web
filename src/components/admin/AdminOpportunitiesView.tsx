/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Target, Calendar, MapPin, Building2, User, Search, Eye, AlertCircle } from 'lucide-react';

export const AdminOpportunitiesView: React.FC = () => {
  const { t, language } = useLanguage();
  const { hasPermission } = useAdminAuth();

  const [trials, setTrials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'trialInvitations'));
      const list: any[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id }));
      setTrials(list);
    } catch (e) {
      console.warn('Error loading opportunities:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTrials = trials.filter((tr) => {
    const title = tr.eventTitle || tr.title || 'Trial';
    const org = tr.recruiterOrg || tr.recruiterName || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || org.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">{t('adminMenuOpportunities')}</h2>
        <p className="text-xs text-slate-400">
          {language === 'fr'
            ? 'Supervision des essais officiels, détections ouvertes et invitations aux clubs'
            : 'Supervise official trial invitations, open club showcases and trial applications'}
        </p>
      </div>

      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-4 flex items-center">
        <Search className="w-4 h-4 text-slate-500 mr-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'fr' ? 'Rechercher un essai ou une opportunité...' : 'Search trial listings, host club, location...'}
          className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTrials.length === 0 ? (
          <div className="col-span-2 py-12 text-center bg-[#0A0E17] border border-slate-800 rounded-3xl text-slate-500 text-xs">
            {language === 'fr' ? 'Aucune opportunité active pour le moment.' : 'No active opportunities listed.'}
          </div>
        ) : (
          filteredTrials.map((tr) => (
            <div key={tr.id} className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                  {tr.status || 'Active Listing'}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {tr.eventDate || 'Upcoming'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">{tr.eventTitle || tr.title || 'Official Trial Showcase'}</h4>
                <span className="text-xs text-slate-400 block">{tr.recruiterOrg || tr.recruiterName || 'Verified Organization'}</span>
              </div>

              <div className="text-xs text-slate-400 line-clamp-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                {tr.details || 'Official trial invitation registered through SoccerBridge platform.'}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {tr.location || 'Ontario, Canada'}
                </span>
                <span>Player: {tr.playerName || 'Direct Invite'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
