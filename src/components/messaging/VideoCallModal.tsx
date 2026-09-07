import React, { useState } from 'react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Share2,
  Copy,
  Check,
  Globe,
  Users,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface VideoCallModalProps {
  recipientName: string;
  recipientRole?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  recipientName,
  recipientRole = 'Player',
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const [provider, setProvider] = useState<'Google Meet' | 'Zoom' | 'Daily' | 'Agora' | 'Twilio'>(
    'Google Meet'
  );
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const roomLink = `https://meet.soccerbridge.pro/room/sb-call-${recipientName
    .toLowerCase()
    .replace(/\s+/g, '-')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0A0E17] border border-slate-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>{t('videoCallRoom')}</span>
                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] rounded-full uppercase tracking-wider font-semibold">
                  {provider}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                SoccerBridge Virtual Scouting Call with <strong className="text-white">{recipientName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1.5 text-xs font-bold rounded-xl hover:bg-slate-800"
          >
            {t('close')}
          </button>
        </div>

        {/* Video Screen Preview */}
        <div className="relative flex-1 bg-black min-h-[320px] flex items-center justify-center p-6">
          {/* Main Participant Video Box */}
          <div className="relative w-full h-full min-h-[280px] bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
            {camEnabled ? (
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/40 to-slate-900 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
                    {recipientName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{recipientName}</h4>
                    <p className="text-xs text-blue-400 font-semibold uppercase">{recipientRole}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-full w-fit mx-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Room Ready ({provider} Provider)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 space-y-2">
                <VideoOff className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-xs font-medium">Camera Disabled</p>
              </div>
            )}

            {/* Self Video Thumbnail */}
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shadow-xl flex items-center justify-center">
              {camEnabled ? (
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center mx-auto">
                    You
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Self View</span>
                </div>
              ) : (
                <VideoOff className="w-6 h-6 text-slate-600" />
              )}
            </div>
          </div>
        </div>

        {/* Provider Architecture Options */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-300">Supported Video SDK Provider Architecture:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['Google Meet', 'Zoom', 'Daily', 'Agora', 'Twilio'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                    provider === p
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Meeting URL Copy Row */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2">
            <Globe className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
            <input
              type="text"
              readOnly
              value={roomLink}
              className="flex-1 bg-transparent text-xs text-slate-300 font-mono focus:outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Room Link'}</span>
            </button>
          </div>

          {/* In-Call Controls */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMicEnabled(!micEnabled)}
                className={`p-3 rounded-2xl border transition-all ${
                  micEnabled
                    ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                    : 'bg-rose-950 border-rose-800 text-rose-400'
                }`}
                title={t('toggleMic')}
              >
                {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setCamEnabled(!camEnabled)}
                className={`p-3 rounded-2xl border transition-all ${
                  camEnabled
                    ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                    : 'bg-rose-950 border-rose-800 text-rose-400'
                }`}
                title={t('toggleCam')}
              >
                {camEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => alert('Screen sharing initialized (WebRTC Ready)')}
                className="p-3 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-2xl"
                title={t('shareScreen')}
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={roomLink}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <span>{t('joinCall')}</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={onClose}
                className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-600/20"
                title="End / Close Call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
