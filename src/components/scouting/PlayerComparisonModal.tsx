import React, { useState } from 'react';
import { PlayerProfile } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateRecruiterPlayerMatch } from '../../services/recommendationService';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  UserPlus,
  Trash2,
  Check,
  Minus,
  Sparkles,
  Award,
  Footprints,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

interface PlayerComparisonModalProps {
  allPlayers: PlayerProfile[];
  initialPlayers?: PlayerProfile[];
  onClose: () => void;
  onSelectPlayer: (player: PlayerProfile) => void;
}

export const PlayerComparisonModal: React.FC<PlayerComparisonModalProps> = ({
  allPlayers,
  initialPlayers = [],
  onClose,
  onSelectPlayer,
}) => {
  const { t } = useLanguage();
  const { recruiterProfile } = useAuth();
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerProfile[]>(
    initialPlayers.slice(0, 4)
  );
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddPlayer = (p: PlayerProfile) => {
    if (selectedPlayers.length >= 4) return;
    if (selectedPlayers.some((sp) => sp.uid === p.uid)) return;
    setSelectedPlayers((prev) => [...prev, p]);
    setSearchQuery('');
  };

  const handleRemovePlayer = (uid: string) => {
    setSelectedPlayers((prev) => prev.filter((p) => p.uid !== uid));
  };

  const candidatePool = allPlayers
    .filter((p) => !selectedPlayers.some((sp) => sp.uid === p.uid))
    .filter((p) =>
      searchQuery
        ? (p.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.primaryPosition || '').toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl max-w-6xl w-full p-6 space-y-6 my-8 text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span>{t('comparePlayersTitle')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t('compareUpToFour')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Player Control */}
        {selectedPlayers.length < 4 && (
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Type player name to add to comparison matrix..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            {candidatePool.length > 0 && searchQuery && (
              <div className="flex flex-wrap gap-2 w-full">
                {candidatePool.slice(0, 5).map((p) => (
                  <button
                    key={p.uid}
                    onClick={() => handleAddPlayer(p)}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>
                      {p.fullName} ({p.primaryPosition})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comparison Matrix Table */}
        {selectedPlayers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No players selected. Search and add players above to begin side-by-side comparison.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="p-3 text-xs font-bold text-slate-500 w-48">Metric / Attribute</th>
                  {selectedPlayers.map((p) => (
                    <th key={p.uid} className="p-3 text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden border border-slate-700">
                          {p.profilePhotoUrl ? (
                            <img
                              src={p.profilePhotoUrl}
                              alt={p.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-blue-400 text-base">
                              {p.fullName?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white">{p.fullName}</h4>
                          <span className="text-[10px] text-blue-400 font-bold">
                            {p.primaryPosition}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => onSelectPlayer(p)}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleRemovePlayer(p.uid)}
                            className="p-1 bg-red-950/60 text-red-400 hover:bg-red-900 rounded-lg text-[10px]"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 text-xs">
                {/* Match Score */}
                <tr className="bg-slate-900/40 font-bold">
                  <td className="p-3 text-slate-400">Match Recommendation</td>
                  {selectedPlayers.map((p) => {
                    const match = recruiterProfile
                      ? calculateRecruiterPlayerMatch(recruiterProfile, p)
                      : null;
                    return (
                      <td key={p.uid} className="p-3 text-center">
                        <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full font-black text-xs">
                          {match ? `${match.matchScore}% Match` : 'N/A'}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Age */}
                <tr>
                  <td className="p-3 text-slate-400">Age</td>
                  {selectedPlayers.map((p) => (
                    <td key={p.uid} className="p-3 text-center font-semibold text-slate-200">
                      {p.age ? `${p.age} yrs` : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Height & Weight */}
                <tr>
                  <td className="p-3 text-slate-400">Physical Metrics</td>
                  {selectedPlayers.map((p) => (
                    <td key={p.uid} className="p-3 text-center font-semibold text-slate-200">
                      {p.heightCm ? `${p.heightCm} cm` : '—'} / {p.weightKg ? `${p.weightKg} kg` : '—'}
                    </td>
                  ))}
                </tr>

                {/* Preferred Foot */}
                <tr>
                  <td className="p-3 text-slate-400">Preferred Foot</td>
                  {selectedPlayers.map((p) => (
                    <td key={p.uid} className="p-3 text-center font-semibold text-slate-200">
                      {p.preferredFoot || 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Club / Org */}
                <tr>
                  <td className="p-3 text-slate-400">Current Club</td>
                  {selectedPlayers.map((p) => (
                    <td key={p.uid} className="p-3 text-center font-semibold text-slate-200">
                      {p.currentOrganization || 'Free Agent'}
                    </td>
                  ))}
                </tr>

                {/* Location */}
                <tr>
                  <td className="p-3 text-slate-400">Location</td>
                  {selectedPlayers.map((p) => (
                    <td key={p.uid} className="p-3 text-center font-semibold text-slate-200">
                      {p.city}, {p.province}
                    </td>
                  ))}
                </tr>

                {/* Playing Level */}
                <tr>
                  <td className="p-3 text-slate-400">Playing Level</td>
                  {selectedPlayers.map((p) => (
                    <td key={p.uid} className="p-3 text-center font-semibold text-slate-200">
                      {p.playingLevel || 'Unspecified'}
                    </td>
                  ))}
                </tr>

                {/* Availability */}
                <tr>
                  <td className="p-3 text-slate-400">Open to Trials / Relocate</td>
                  {selectedPlayers.map((p) => (
                    <td key={p.uid} className="p-3 text-center font-semibold">
                      <div className="flex justify-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            p.openToTrials ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          Trials: {p.openToTrials ? 'Yes' : 'No'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            p.willingToRelocate ? 'bg-indigo-950 text-indigo-400' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          Relocate: {p.willingToRelocate ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Account Status */}
                <tr>
                  <td className="p-3 text-slate-400">Membership Tier</td>
                  {selectedPlayers.map((p) => (
                    <td key={p.uid} className="p-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          p.membership === 'PRO' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.membership === 'PRO' ? 'PRO' : 'FREE'}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
