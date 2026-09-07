import React, { useState, useEffect } from 'react';
import { PlayerProfile, ScoutingNote } from '../../types';
import { getPlayerScoutingNotes } from '../../services/scoutingService';
import { calculateRecruiterPlayerMatch } from '../../services/recommendationService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  X,
  Printer,
  FileText,
  Tag,
  ShieldCheck,
  Award,
  Footprints,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface ScoutingReportModalProps {
  player: PlayerProfile;
  recruiterId: string;
  onClose: () => void;
}

export const ScoutingReportModal: React.FC<ScoutingReportModalProps> = ({
  player,
  recruiterId,
  onClose,
}) => {
  const { t } = useLanguage();
  const { recruiterProfile } = useAuth();
  const [notes, setNotes] = useState<ScoutingNote[]>([]);

  useEffect(() => {
    if (recruiterId && player.uid) {
      getPlayerScoutingNotes(recruiterId, player.uid).then(setNotes);
    }
  }, [recruiterId, player.uid]);

  const match = recruiterProfile
    ? calculateRecruiterPlayerMatch(recruiterProfile, player)
    : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 my-8 text-white print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
        {/* Modal Controls Bar (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-extrabold">{t('generateReport')}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>{t('printReport')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT DOCUMENT BODY */}
        <div id="scouting-report-document" className="space-y-6 print:space-y-4">
          {/* Header Banner */}
          <div className="p-6 bg-[#0A0E17] border border-slate-800 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 print:border-gray-300 print:bg-gray-50 print:p-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-800 overflow-hidden border border-slate-700 shrink-0">
                {player.profilePhotoUrl ? (
                  <img
                    src={player.profilePhotoUrl}
                    alt={player.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-blue-400 text-xl">
                    {player.fullName?.charAt(0)}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white print:text-black">
                    {player.fullName}
                  </h1>
                  {player.membership === 'PRO' && (
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded uppercase">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-sm font-extrabold text-blue-400 mt-0.5">
                  {player.primaryPosition}
                  {player.secondaryPosition ? ` / ${player.secondaryPosition}` : ''}
                </p>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                  {player.city}, {player.province} • {player.currentOrganization || 'Free Agent'}
                </p>
              </div>
            </div>

            {/* Recommendation Badge */}
            {match && (
              <div className="px-4 py-3 bg-blue-950/60 border border-blue-800/80 rounded-2xl text-center shrink-0 print:border-blue-300 print:bg-blue-50">
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                  Recruiter Match Score
                </span>
                <div className="text-2xl font-black text-white print:text-blue-900 mt-0.5">
                  {match.matchScore}%
                </div>
              </div>
            )}
          </div>

          {/* Grid Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
            <div className="p-3 bg-[#0A0E17] border border-slate-800 rounded-2xl print:border-gray-300">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Age</span>
              <p className="text-sm font-extrabold text-white print:text-black">
                {player.age ? `${player.age} yrs` : 'N/A'}
              </p>
            </div>

            <div className="p-3 bg-[#0A0E17] border border-slate-800 rounded-2xl print:border-gray-300">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Height / Weight</span>
              <p className="text-sm font-extrabold text-white print:text-black">
                {player.heightCm ? `${player.heightCm} cm` : '—'} / {player.weightKg ? `${player.weightKg} kg` : '—'}
              </p>
            </div>

            <div className="p-3 bg-[#0A0E17] border border-slate-800 rounded-2xl print:border-gray-300">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Preferred Foot</span>
              <p className="text-sm font-extrabold text-white print:text-black">
                {player.preferredFoot || 'Unspecified'}
              </p>
            </div>

            <div className="p-3 bg-[#0A0E17] border border-slate-800 rounded-2xl print:border-gray-300">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Playing Level</span>
              <p className="text-sm font-extrabold text-white print:text-black">
                {player.playingLevel || 'Unspecified'}
              </p>
            </div>
          </div>

          {/* Availability & Career Goals */}
          <div className="p-5 bg-[#0A0E17] border border-slate-800 rounded-3xl space-y-3 print:border-gray-300 print:bg-white">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 print:text-gray-700">
              Availability & Objectives
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Open to Trials: </span>
                <strong className="text-white print:text-black">
                  {player.openToTrials ? 'Yes' : 'No'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Willing to Relocate: </span>
                <strong className="text-white print:text-black">
                  {player.willingToRelocate ? 'Yes' : 'No'}
                </strong>
              </div>
              {player.shortTermGoals && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Short-Term Goals: </span>
                  <span className="text-slate-300 print:text-gray-800">
                    {Array.isArray(player.shortTermGoals)
                      ? player.shortTermGoals.join(', ')
                      : player.shortTermGoals}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recruiter Private Notes Section */}
          <div className="p-5 bg-[#0A0E17] border border-slate-800 rounded-3xl space-y-3 print:border-gray-300 print:bg-white">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 print:text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Scout Evaluation Notes & Tags</span>
            </h3>

            {notes.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No notes recorded yet for this report.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl print:border-gray-200 print:bg-gray-50">
                    <h4 className="text-xs font-extrabold text-white print:text-black">{n.title}</h4>
                    <p className="text-xs text-slate-300 print:text-gray-800 mt-1 whitespace-pre-line">
                      {n.body}
                    </p>
                    {n.tags && n.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {n.tags.map((tg) => (
                          <span
                            key={tg}
                            className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded text-[10px] font-bold print:border-gray-300 print:bg-gray-200 print:text-black"
                          >
                            #{tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confidentiality Footer */}
          <div className="text-[10px] text-slate-500 print:text-gray-500 text-center border-t border-slate-800 pt-3 print:border-gray-300">
            SoccerBridge Scouting Suite Report • Confidential Document for Internal Recruitment Use
          </div>
        </div>
      </div>
    </div>
  );
};
