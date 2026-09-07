import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Video, Send, FileText, Globe, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  scheduleMeeting,
  generateGoogleCalendarUrl,
  downloadIcsFile,
} from '../../services/collaborationService';

interface MeetingScheduleModalProps {
  inviteeId: string;
  inviteeName: string;
  isOpen: boolean;
  onClose: () => void;
  onMeetingScheduled?: () => void;
}

export const MeetingScheduleModal: React.FC<MeetingScheduleModalProps> = ({
  inviteeId,
  inviteeName,
  isOpen,
  onClose,
  onMeetingScheduled,
}) => {
  const { t } = useLanguage();
  const { userAccount } = useAuth();

  const [type, setType] = useState<
    'Meeting' | 'Interview' | 'Trial' | 'Virtual Call' | 'Scouting Review'
  >('Virtual Call');
  const [title, setTitle] = useState(`Scouting Review with ${inviteeName}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [provider, setProvider] = useState<'Google Meet' | 'Zoom' | 'Daily' | 'Agora' | 'Twilio'>(
    'Google Meet'
  );
  const [locationOrLink, setLocationOrLink] = useState(`https://meet.google.com/sb-scout-${Date.now().toString(36)}`);
  const [agenda, setAgenda] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAccount?.uid) return;

    setLoading(true);
    try {
      await scheduleMeeting({
        hostId: userAccount.uid,
        hostName: userAccount.fullName,
        hostRole: userAccount.role,
        inviteeId,
        inviteeName,
        type,
        title,
        date,
        time,
        durationMinutes,
        locationOrLink,
        agenda,
        provider,
      });

      setSuccess(true);
      if (onMeetingScheduled) onMeetingScheduled();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error scheduling meeting:', err);
    } finally {
      setLoading(false);
    }
  };

  const googleCalUrl = generateGoogleCalendarUrl(
    title,
    `SoccerBridge Meeting Agenda: ${agenda}`,
    locationOrLink,
    date,
    time,
    durationMinutes
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0A0E17] border border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">{t('scheduleMeeting')}</h3>
              <p className="text-xs text-slate-400">Invite player {inviteeName} to a trial, interview, or virtual call</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1.5 text-xs font-bold rounded-xl hover:bg-slate-800"
          >
            {t('close')}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Meeting Type Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">Meeting Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                ['Virtual Call', 'Interview', 'Trial', 'Meeting', 'Scouting Review'] as const
              ).map((tType) => (
                <button
                  key={tType}
                  type="button"
                  onClick={() => {
                    setType(tType);
                    setTitle(`${tType} with ${inviteeName}`);
                  }}
                  className={`p-2.5 rounded-2xl text-xs font-bold border text-center transition-all ${
                    type === tType
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tType}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Invitation Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Duration (Mins)</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value={15}>15 Mins</option>
                <option value={30}>30 Mins</option>
                <option value={45}>45 Mins</option>
                <option value={60}>60 Mins (1 hr)</option>
                <option value={90}>90 Mins</option>
              </select>
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Platform Architecture</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['Google Meet', 'Zoom', 'Daily', 'Agora', 'Twilio'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 ${
                    provider === p
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Location or Call Link */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Location or Virtual Call URL</label>
            <input
              type="text"
              required
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Agenda / Details */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Agenda & Notes</label>
            <textarea
              rows={3}
              placeholder="Outline the goals of this scouting interview or trial session..."
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Calendar Export Links Preview */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-bold text-slate-400">Calendar Integration Options:</span>
            <div className="flex items-center gap-2">
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline font-bold flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t('addToGoogleCalendar')}</span>
              </a>
              <button
                type="button"
                onClick={() =>
                  downloadIcsFile(
                    title,
                    `SoccerBridge Agenda: ${agenda}`,
                    locationOrLink,
                    date,
                    time
                  )
                }
                className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t('downloadIcs')}</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-emerald-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {success ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Invitation Sent!</span>
              </>
            ) : (
              <>
                <span>Send Meeting Invitation</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
