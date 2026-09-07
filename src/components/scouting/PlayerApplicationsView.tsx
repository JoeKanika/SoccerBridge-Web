import React, { useState, useEffect } from 'react';
import { PlayerApplication, ApplicationStatus, PlayerProfile } from '../../types';
import {
  getRecruiterApplications,
  updateApplicationStatus,
} from '../../services/scoutingService';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Calendar,
  Filter,
} from 'lucide-react';

interface PlayerApplicationsViewProps {
  recruiterId: string;
  allPlayers: PlayerProfile[];
  onSelectPlayer: (player: PlayerProfile) => void;
  onOpenMessage: (player: PlayerProfile) => void;
  onOpenSendTrial: (player: PlayerProfile) => void;
}

export const PlayerApplicationsView: React.FC<PlayerApplicationsViewProps> = ({
  recruiterId,
  allPlayers,
  onSelectPlayer,
  onOpenMessage,
  onOpenSendTrial,
}) => {
  const { t } = useLanguage();
  const [applications, setApplications] = useState<PlayerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchApplications = async () => {
    setLoading(true);
    const list = await getRecruiterApplications(recruiterId);
    setApplications(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [recruiterId]);

  const handleStatusChange = async (appId: string, status: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status } : a))
    );
    await updateApplicationStatus(appId, status);
  };

  const filteredApps = applications.filter((app) =>
    statusFilter === 'all' ? true : app.status === statusFilter
  );

  return (
    <div className="space-y-6 text-white">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-400" />
            <span>{t('applications')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review incoming player trial applications and expressions of interest.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          {['all', 'pending', 'reviewed', 'accepted', 'declined', 'trial_scheduled'].map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs">Loading applications...</div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center bg-[#0A0E17] border border-slate-800 rounded-3xl space-y-3">
          <Inbox className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No applications match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => {
            const player = allPlayers.find((p) => p.uid === app.playerId);
            return (
              <div
                key={app.id}
                className="p-5 bg-[#0A0E17] border border-slate-800 hover:border-slate-700 rounded-3xl space-y-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                      {app.playerPhotoUrl || player?.profilePhotoUrl ? (
                        <img
                          src={app.playerPhotoUrl || player?.profilePhotoUrl}
                          alt={app.playerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-blue-400 text-sm">
                          {app.playerName?.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-white">{app.playerName}</h3>
                      <p className="text-xs text-blue-400 font-semibold">
                        {app.playerPosition || 'Player'} • {app.playerClub || 'Free Agent'}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Submitted:{' '}
                        {app.createdAt?.toDate
                          ? app.createdAt.toDate().toLocaleDateString()
                          : 'Recently'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      app.status === 'accepted' || app.status === 'trial_scheduled'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : app.status === 'declined'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {app.status.replace('_', ' ')}
                  </span>
                </div>

                {app.message && (
                  <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-xs text-slate-300">
                    <span className="font-bold text-slate-400 block mb-0.5">Player Pitch:</span>
                    "{app.message}"
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    {player && (
                      <button
                        onClick={() => onSelectPlayer(player)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                      </button>
                    )}

                    {player && (
                      <button
                        onClick={() => onOpenMessage(player)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        <span>Message</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {app.status !== 'declined' && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'declined')}
                        className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-xl font-bold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    )}

                    {app.status !== 'accepted' && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'accepted')}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                    )}

                    {player && (
                      <button
                        onClick={() => {
                          handleStatusChange(app.id, 'trial_scheduled');
                          onOpenSendTrial(player);
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/20"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule Trial</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
