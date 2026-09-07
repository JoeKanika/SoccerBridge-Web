import React, { useState, useEffect } from 'react';
import { PipelineItem, PipelineStage, PlayerProfile } from '../../types';
import {
  getRecruiterPipeline,
  updatePipelineStage,
  removeFromPipeline,
} from '../../services/scoutingService';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Kanban,
  UserPlus,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface PipelineKanbanProps {
  recruiterId: string;
  allPlayers: PlayerProfile[];
  onSelectPlayer: (player: PlayerProfile) => void;
  onOpenMessage: (player: PlayerProfile) => void;
  onOpenSendTrial: (player: PlayerProfile) => void;
}

const STAGES: { key: PipelineStage; labelKey: string; color: string }[] = [
  { key: 'Discovered', labelKey: 'pipelineStageDiscovered', color: 'border-slate-700 bg-slate-900/50' },
  { key: 'Watching', labelKey: 'pipelineStageWatching', color: 'border-blue-800 bg-blue-950/30' },
  { key: 'Interested', labelKey: 'pipelineStageInterested', color: 'border-indigo-800 bg-indigo-950/30' },
  { key: 'Contacted', labelKey: 'pipelineStageContacted', color: 'border-purple-800 bg-purple-950/30' },
  { key: 'Trial Scheduled', labelKey: 'pipelineStageTrialScheduled', color: 'border-amber-800 bg-amber-950/30' },
  { key: 'Offer Made', labelKey: 'pipelineStageOfferMade', color: 'border-emerald-800 bg-emerald-950/30' },
  { key: 'Signed', labelKey: 'pipelineStageSigned', color: 'border-green-600 bg-green-950/40' },
  { key: 'Archived', labelKey: 'pipelineStageArchived', color: 'border-slate-800 bg-slate-950/60' },
];

export const PipelineKanban: React.FC<PipelineKanbanProps> = ({
  recruiterId,
  allPlayers,
  onSelectPlayer,
  onOpenMessage,
  onOpenSendTrial,
}) => {
  const { t } = useLanguage();
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddPlayer, setSelectedAddPlayer] = useState('');

  const fetchPipeline = async () => {
    setLoading(true);
    const items = await getRecruiterPipeline(recruiterId);
    setPipelineItems(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchPipeline();
  }, [recruiterId]);

  const handleStageMove = async (
    item: PipelineItem,
    newStage: PipelineStage
  ) => {
    const playerObj = allPlayers.find((p) => p.uid === item.playerId) || {
      uid: item.playerId,
      fullName: item.playerName,
      primaryPosition: item.playerPos,
      currentOrganization: item.playerClub,
      profilePhotoUrl: item.playerPhotoUrl,
    };

    // Optimistic UI
    setPipelineItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, stage: newStage } : i))
    );

    await updatePipelineStage(recruiterId, playerObj as PlayerProfile, newStage);
  };

  const handleRemove = async (item: PipelineItem) => {
    if (!confirm(`Remove ${item.playerName} from scouting pipeline?`)) return;
    setPipelineItems((prev) => prev.filter((i) => i.id !== item.id));
    await removeFromPipeline(recruiterId, item.playerId);
  };

  const handleAddPlayerToPipeline = async () => {
    if (!selectedAddPlayer) return;
    const p = allPlayers.find((player) => player.uid === selectedAddPlayer);
    if (!p) return;

    await updatePipelineStage(recruiterId, p, 'Discovered');
    fetchPipeline();
    setSelectedAddPlayer('');
  };

  const unpipelinedPlayers = allPlayers.filter(
    (p) => !pipelineItems.some((item) => item.playerId === p.uid)
  );

  return (
    <div className="space-y-6 text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <Kanban className="w-5 h-5 text-blue-400" />
            <span>{t('scoutingPipelineTab')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track candidates through recruitment stages from discovery to signed contract.
          </p>
        </div>

        {/* Quick Add Player to Pipeline */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedAddPlayer}
            onChange={(e) => setSelectedAddPlayer(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-blue-500 max-w-xs"
          >
            <option value="">Select player to add...</option>
            {unpipelinedPlayers.map((p) => (
              <option key={p.uid} value={p.uid}>
                {p.fullName} ({p.primaryPosition})
              </option>
            ))}
          </select>
          <button
            onClick={handleAddPlayerToPipeline}
            disabled={!selectedAddPlayer}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs">Loading pipeline...</div>
      ) : (
        /* Kanban Horizontal Scroll Container */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1200px]">
            {STAGES.map((col) => {
              const stageItems = pipelineItems.filter((i) => i.stage === col.key);
              return (
                <div
                  key={col.key}
                  className={`w-72 shrink-0 border rounded-3xl p-4 flex flex-col justify-between ${col.color}`}
                >
                  {/* Stage Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                      <span className="text-xs font-black uppercase text-slate-200">
                        {t(col.labelKey as any) || col.key}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-900/80 border border-slate-800 rounded-full text-[10px] font-bold text-blue-400">
                        {stageItems.length}
                      </span>
                    </div>

                    {/* Stage Cards List */}
                    <div className="space-y-3 min-h-[250px]">
                      {stageItems.length === 0 ? (
                        <div className="text-[11px] text-slate-600 text-center py-8">
                          No players in this stage
                        </div>
                      ) : (
                        stageItems.map((item) => {
                          const player = allPlayers.find((p) => p.uid === item.playerId);
                          return (
                            <div
                              key={item.id}
                              className="bg-[#0A0E17] border border-slate-800 hover:border-slate-700 p-3.5 rounded-2xl space-y-3 shadow-md group transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                                    {item.playerPhotoUrl || player?.profilePhotoUrl ? (
                                      <img
                                        src={item.playerPhotoUrl || player?.profilePhotoUrl}
                                        alt={item.playerName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center font-bold text-blue-400 text-xs">
                                        {item.playerName?.charAt(0)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="overflow-hidden">
                                    <h4 className="text-xs font-bold text-white truncate">
                                      {item.playerName}
                                    </h4>
                                    <p className="text-[10px] text-blue-400 truncate">
                                      {item.playerPos || 'Player'} • {item.playerClub || 'Free'}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleRemove(item)}
                                  className="text-slate-600 hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove from pipeline"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Stage Selector Dropdown */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-900 gap-1">
                                <select
                                  value={item.stage}
                                  onChange={(e) =>
                                    handleStageMove(item, e.target.value as PipelineStage)
                                  }
                                  className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded-lg p-1 font-bold w-full focus:outline-none"
                                >
                                  {STAGES.map((s) => (
                                    <option key={s.key} value={s.key}>
                                      Stage: {t(s.labelKey as any) || s.key}
                                    </option>
                                  ))}
                                </select>

                                {player && (
                                  <button
                                    onClick={() => onSelectPlayer(player)}
                                    className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg shrink-0"
                                    title="View Profile"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
