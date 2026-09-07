import React from 'react';
import { PlayerProfile } from '../../types';
import {
  Clock,
  Video,
  UserCheck,
  Bookmark,
  CalendarCheck,
  MessageSquare,
  Sparkles,
  Award,
} from 'lucide-react';

interface PlayerTimelineViewProps {
  player: PlayerProfile;
}

export const PlayerTimelineView: React.FC<PlayerTimelineViewProps> = ({ player }) => {
  // Synthesize or calculate chronological activity items
  const timelineEvents = [
    {
      id: '1',
      type: 'profile_updated',
      title: 'Player Profile Updated',
      description: `Updated primary position to ${player.primaryPosition || 'Footballer'} and location to ${player.city || 'Canada'}${player.province ? `, ${player.province}` : ''}.`,
      date: '2 days ago',
      icon: UserCheck,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
    {
      id: '2',
      type: 'video_uploaded',
      title: 'New Highlight Reel Uploaded',
      description: 'Added 2025 Midfield Season Highlights video.',
      date: '5 days ago',
      icon: Video,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      id: '3',
      type: 'availability_changed',
      title: 'Availability Status Updated',
      description: `Set open to trials: ${player.openToTrials ? 'Yes' : 'No'}, willing to relocate: ${player.willingToRelocate ? 'Yes' : 'No'}.`,
      date: '1 week ago',
      icon: Clock,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: '4',
      type: 'saved_by_recruiter',
      title: 'Added to Watchlist',
      description: 'A verified recruiter saved this profile.',
      date: '2 weeks ago',
      icon: Bookmark,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },
  ];

  return (
    <div className="bg-[#0A0E17] border border-slate-800 p-6 rounded-3xl space-y-6 text-white">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Activity Timeline for {player.fullName || 'Player'}</span>
        </h3>
        <span className="text-xs text-slate-500">Chronological Logs</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {timelineEvents.map((evt) => {
          const Icon = evt.icon;
          return (
            <div key={evt.id} className="relative group">
              {/* Timeline Bullet Dot */}
              <div
                className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border border-slate-900 flex items-center justify-center ${evt.color}`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>

              <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl space-y-1 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                    <span>{evt.title}</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold">{evt.date}</span>
                </div>
                <p className="text-xs text-slate-400">{evt.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
