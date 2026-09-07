import React, { useState, useEffect } from 'react';
import { PlayerShortlist, PlayerProfile } from '../../types';
import {
  getRecruiterShortlists,
  createShortlist,
  deleteShortlist,
  togglePlayerInShortlist,
} from '../../services/scoutingService';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  FolderPlus,
  Trash2,
  UserPlus,
  Users,
  Check,
  Search,
  ExternalLink,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface ShortlistManagerProps {
  recruiterId: string;
  allPlayers: PlayerProfile[];
  onSelectPlayer: (player: PlayerProfile) => void;
}

export const ShortlistManager: React.FC<ShortlistManagerProps> = ({
  recruiterId,
  allPlayers,
  onSelectPlayer,
}) => {
  const { t } = useLanguage();
  const [shortlists, setShortlists] = useState<PlayerShortlist[]>([]);
  const [activeShortlistId, setActiveShortlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New shortlist form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Add player selector
  const [searchPlayerQuery, setSearchPlayerQuery] = useState('');

  const fetchShortlists = async () => {
    setLoading(true);
    const lists = await getRecruiterShortlists(recruiterId);
    setShortlists(lists);
    if (lists.length > 0 && !activeShortlistId) {
      setActiveShortlistId(lists[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchShortlists();
  }, [recruiterId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = await createShortlist(recruiterId, newTitle.trim(), newDesc.trim());
    setShortlists((prev) => [...prev, created]);
    setActiveShortlistId(created.id);
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shortlist?')) return;
    await deleteShortlist(id);
    setShortlists((prev) => prev.filter((s) => s.id !== id));
    if (activeShortlistId === id) {
      setActiveShortlistId(shortlists.find((s) => s.id !== id)?.id || null);
    }
  };

  const activeShortlist = shortlists.find((s) => s.id === activeShortlistId);

  const shortlistPlayers = allPlayers.filter((p) =>
    activeShortlist?.playerIds.includes(p.uid)
  );

  const availableToadd = allPlayers
    .filter((p) => !activeShortlist?.playerIds.includes(p.uid))
    .filter((p) =>
      searchPlayerQuery
        ? (p.fullName || '').toLowerCase().includes(searchPlayerQuery.toLowerCase()) ||
          (p.primaryPosition || '').toLowerCase().includes(searchPlayerQuery.toLowerCase())
        : true
    );

  const handleTogglePlayer = async (playerId: string) => {
    if (!activeShortlistId) return;
    const isAdded = await togglePlayerInShortlist(activeShortlistId, playerId);

    setShortlists((prev) =>
      prev.map((s) => {
        if (s.id === activeShortlistId) {
          const updatedIds = isAdded
            ? [...s.playerIds, playerId]
            : s.playerIds.filter((id) => id !== playerId);
          return { ...s, playerIds: updatedIds };
        }
        return s;
      })
    );
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>{t('shortlistsTab')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Organize players into custom tactical buckets, age cohorts, or recruiting targets.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 shrink-0"
        >
          <FolderPlus className="w-4 h-4" />
          <span>{t('createShortlist')}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs">Loading shortlists...</div>
      ) : shortlists.length === 0 ? (
        <div className="p-12 text-center bg-[#0A0E17] border border-slate-800 rounded-3xl space-y-4">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <p className="text-sm font-bold text-slate-300">No shortlists created yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Create custom shortlists like "Goalkeepers 2027", "Ontario Prospects", or "Trial Targets".
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl"
          >
            {t('createShortlist')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Shortlists Sidebar */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider px-2">
              Your Shortlists ({shortlists.length})
            </span>
            <div className="space-y-1.5">
              {shortlists.map((s) => {
                const isActive = s.id === activeShortlistId;
                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveShortlistId(s.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                      isActive
                        ? 'bg-blue-600/10 border-blue-500 text-white font-bold'
                        : 'bg-[#0A0E17] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="text-xs truncate flex items-center gap-2">
                        <span>{s.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {s.playerIds.length} players
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(s.id);
                        }}
                        className="p-1 hover:text-red-400 text-slate-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete shortlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight
                        className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-600'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Shortlist Player List & Quick Add */}
          <div className="lg:col-span-3 space-y-6">
            {activeShortlist && (
              <div className="bg-[#0A0E17] border border-slate-800 p-6 rounded-3xl space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-white">{activeShortlist.title}</h3>
                    {activeShortlist.description && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {activeShortlist.description}
                      </p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-blue-400 font-bold shrink-0">
                    {shortlistPlayers.length} Players Listed
                  </span>
                </div>

                {/* Listed Players Grid */}
                {shortlistPlayers.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No players added to this shortlist yet. Browse players below to add them.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {shortlistPlayers.map((player) => (
                      <div
                        key={player.uid}
                        className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                            {player.profilePhotoUrl ? (
                              <img
                                src={player.profilePhotoUrl}
                                alt={player.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-blue-400 text-xs">
                                {player.fullName?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-xs font-bold text-white truncate">
                              {player.fullName}
                            </h4>
                            <p className="text-[11px] text-blue-400 font-semibold truncate">
                              {player.primaryPosition} • {player.currentOrganization}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onSelectPlayer(player)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                            title="View Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleTogglePlayer(player.uid)}
                            className="p-1.5 bg-red-950/40 text-red-400 hover:bg-red-900/50 rounded-lg text-xs"
                            title="Remove from shortlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add More Players Selector */}
                <div className="pt-6 border-t border-slate-800 space-y-3">
                  <span className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-blue-400" />
                    <span>Add Players to {activeShortlist.title}</span>
                  </span>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search candidate players to add..."
                      value={searchPlayerQuery}
                      onChange={(e) => setSearchPlayerQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {availableToadd.slice(0, 10).map((p) => (
                      <div
                        key={p.uid}
                        className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{p.fullName}</span>
                          <span className="text-slate-400 ml-2">
                            ({p.primaryPosition} • {p.city})
                          </span>
                        </div>
                        <button
                          onClick={() => handleTogglePlayer(p.uid)}
                          className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[11px] font-bold transition-all"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Shortlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-extrabold text-white">{t('createShortlist')}</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  {t('shortlistTitle')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Goalkeepers 2027, NCAA Targets..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  {t('shortlistDesc')}
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes about recruitment objectives for this group..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
