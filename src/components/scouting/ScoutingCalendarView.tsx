import React, { useState, useEffect } from 'react';
import { ScoutingEvent, ScoutingEventType, PlayerProfile } from '../../types';
import {
  getScoutingEvents,
  createScoutingEvent,
  updateScoutingEventStatus,
  deleteScoutingEvent,
} from '../../services/scoutingService';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Video,
  Users,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

interface ScoutingCalendarViewProps {
  recruiterId: string;
  allPlayers: PlayerProfile[];
}

const EVENT_TYPES: { key: ScoutingEventType; label: string; icon: any; color: string }[] = [
  { key: 'trial', label: 'Trial', icon: Users, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { key: 'meeting', label: 'Meeting', icon: Briefcase, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { key: 'scouting_trip', label: 'Scouting Trip', icon: MapPin, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { key: 'video_review', label: 'Video Review', icon: Video, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { key: 'follow_up', label: 'Follow-Up', icon: Clock, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { key: 'interview', label: 'Player Interview', icon: Users, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { key: 'offer_deadline', label: 'Offer Deadline', icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
];

export const ScoutingCalendarView: React.FC<ScoutingCalendarViewProps> = ({
  recruiterId,
  allPlayers,
}) => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<ScoutingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [type, setType] = useState<ScoutingEventType>('trial');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [location, setLocation] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    const list = await getScoutingEvents(recruiterId);
    setEvents(list.sort((a, b) => a.date.localeCompare(b.date)));
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [recruiterId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const playerObj = allPlayers.find((p) => p.uid === selectedPlayerId);

    const created = await createScoutingEvent({
      recruiterId,
      type,
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      location: location.trim(),
      playerId: selectedPlayerId || undefined,
      playerName: playerObj?.fullName || undefined,
      status: 'upcoming',
    });

    setEvents((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
    setTitle('');
    setDescription('');
    setLocation('');
    setSelectedPlayerId('');
    setShowAddModal(false);
  };

  const handleStatusChange = async (
    eventId: string,
    status: 'upcoming' | 'completed' | 'cancelled'
  ) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status } : e))
    );
    await updateScoutingEventStatus(eventId, status);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    await deleteScoutingEvent(eventId);
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>{t('calendarTab')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Schedule and manage trial days, scouting trips, video reviews, and offer deadlines.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addEvent')}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs">Loading calendar events...</div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-[#0A0E17] border border-slate-800 rounded-3xl space-y-4">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No scouting events scheduled yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl"
          >
            {t('addEvent')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((evt) => {
            const config = EVENT_TYPES.find((t) => t.key === evt.type) || EVENT_TYPES[0];
            const Icon = config.icon;
            return (
              <div
                key={evt.id}
                className="bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl flex flex-col justify-between space-y-4 group hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border flex items-center gap-1.5 ${config.color}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{config.label}</span>
                    </span>

                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        evt.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : evt.status === 'cancelled'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-white">{evt.title}</h3>
                    {evt.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-900">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        {evt.date} {evt.time ? `@ ${evt.time}` : ''}
                      </span>
                    </div>

                    {evt.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    )}

                    {evt.playerName && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Player: <strong className="text-slate-200">{evt.playerName}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Actions */}
                <div className="pt-3 border-t border-slate-900 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    {evt.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(evt.id, 'completed')}
                        className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>
                    )}
                    {evt.status !== 'cancelled' && (
                      <button
                        onClick={() => handleStatusChange(evt.id, 'cancelled')}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg text-[10px]"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(evt.id)}
                    className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 text-white">
            <h3 className="text-base font-extrabold">{t('addEvent')}</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Event Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ScoutingEventType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    {EVENT_TYPES.map((et) => (
                      <option key={et.key} value={et.key}>
                        {et.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Associated Player
                  </label>
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="">None (General)</option>
                    {allPlayers.map((p) => (
                      <option key={p.uid} value={p.uid}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Trial Evaluation Session at BMO Field..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Location / Address / Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. Downsview Park Field 3 or Zoom Link..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional event details, equipment requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
