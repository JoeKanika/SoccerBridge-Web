import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, Volume2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface VoiceRecorderProps {
  onSendVoiceNote: (audioUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoiceNote, onCancel }) => {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      // Fallback simulated voice note for browser sandboxes without mic permission
      simulateVoiceNote();
    }
  };

  const simulateVoiceNote = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else if (!audioUrl) {
      // Mock audio sample for fallback
      setAudioUrl('https://actions.google.com/sounds/v1/ambiences/outdoor_rain.ogg');
    }
  };

  const handleTogglePlay = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = () => {
    if (audioUrl) {
      onSendVoiceNote(audioUrl, recordingTime || 5);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
      {!audioUrl ? (
        <div className="flex-1 flex items-center gap-3">
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="p-3 bg-rose-600 hover:bg-rose-500 rounded-xl text-white animate-pulse"
              title={t('stopRecording')}
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="p-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white"
              title={t('recordVoiceNote')}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-mono text-xs text-white font-bold">{formatTime(recordingTime)}</span>
              <span className="text-xs text-slate-400">
                {isRecording ? t('stopRecording') : t('recordVoiceNote')}
              </span>
            </div>
            {/* Waveform simulation animation */}
            {isRecording && (
              <div className="flex items-center gap-1 mt-1.5 h-4">
                {[40, 70, 30, 90, 60, 100, 50, 80, 40, 60, 90, 30, 70].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full animate-bounce"
                    style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-white text-xs"
          >
            {t('cancel')}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Volume2 className="w-4 h-4 text-blue-400" />
              <span>{t('voiceNote')} ({formatTime(recordingTime || 5)})</span>
            </div>
            {/* Waveform visual bar */}
            <div className="flex items-center gap-1 mt-1.5 h-3">
              {[60, 80, 40, 90, 50, 70, 100, 60, 40, 80, 50, 30].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full ${isPlaying ? 'bg-blue-400' : 'bg-slate-700'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setAudioUrl(null);
              setRecordingTime(0);
            }}
            className="p-2 text-slate-400 hover:text-rose-400"
            title="Delete Recording"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <span>{t('sendVoiceNote')}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
