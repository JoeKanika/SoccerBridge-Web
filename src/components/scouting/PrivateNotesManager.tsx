import React, { useState, useEffect } from 'react';
import { ScoutingNote, PlayerProfile, RecruiterTag } from '../../types';
import {
  getPlayerScoutingNotes,
  saveScoutingNote,
  deleteScoutingNote,
} from '../../services/scoutingService';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Tag,
  Plus,
  Trash2,
  Lock,
  Calendar,
  UserCheck,
  CheckCircle2,
  X,
} from 'lucide-react';

interface PrivateNotesManagerProps {
  recruiterId: string;
  player: PlayerProfile;
}

const PRESET_TAGS: RecruiterTag[] = [
  'Fast',
  'Technical',
  'Leadership',
  'Needs Development',
  'Potential Pro',
  'Excellent Attitude',
  'Watch Again',
  'Trial Candidate',
  'Priority',
  'Medical Review',
];

export const PrivateNotesManager: React.FC<PrivateNotesManagerProps> = ({
  recruiterId,
  player,
}) => {
  const { t } = useLanguage();
  const { recruiterProfile } = useAuth();
  const [notes, setNotes] = useState<ScoutingNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    const list = await getPlayerScoutingNotes(recruiterId, player.uid);
    setNotes(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [recruiterId, player.uid]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;
    const tag = customTagInput.trim();
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setCustomTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    await saveScoutingNote(
      recruiterId,
      player.uid,
      title.trim() || 'Scouting Evaluation',
      body.trim(),
      selectedTags,
      recruiterProfile?.fullName || 'Scout',
      editingNoteId || undefined
    );

    setTitle('');
    setBody('');
    setSelectedTags([]);
    setEditingNoteId(null);
    fetchNotes();
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    await deleteScoutingNote(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  return (
    <div className="bg-[#0A0E17] border border-slate-800 p-6 rounded-3xl space-y-6 text-white">
      {/* Privacy Notice Banner */}
      <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/60 rounded-2xl flex items-center gap-3">
        <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
        <p className="text-xs text-indigo-200/90">{t('privateNotesNotice')}</p>
      </div>

      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Evaluation Notes & Scouting Tags for {player.fullName}</span>
        </h3>
        <span className="text-xs text-slate-500">{notes.length} Notes Recorded</span>
      </div>

      {/* Note Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            {t('noteTitle')}
          </label>
          <input
            type="text"
            placeholder="e.g. Match Performance vs Academy FC, Tactical discipline..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            {t('noteBody')} *
          </label>
          <textarea
            rows={3}
            placeholder="Write technical observations, pace assessment, tactical awareness, leadership qualities..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Tags Selection */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-2">
            Assign Scouting Tags
          </label>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {PRESET_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Custom Tag Input */}
          <div className="flex items-center gap-2 max-w-xs mt-2">
            <input
              type="text"
              placeholder="Add custom tag..."
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
            />
            <button
              type="button"
              onClick={handleAddCustomTag}
              className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700"
            >
              + Tag
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          {editingNoteId && (
            <button
              type="button"
              onClick={() => {
                setEditingNoteId(null);
                setTitle('');
                setBody('');
                setSelectedTags([]);
              }}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancel Edit
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
          >
            {editingNoteId ? 'Update Note' : 'Save Note'}
          </button>
        </div>
      </form>

      {/* Existing Notes List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-6 text-slate-500 text-xs">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No private notes written for this player yet.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2 relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-white">{note.title}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-blue-400" /> {note.authorName || 'Scout'}
                    </span>
                    <span>•</span>
                    <span>
                      {note.updatedAt?.toDate
                        ? note.updatedAt.toDate().toLocaleDateString()
                        : 'Recently'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(note.id)}
                  className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {note.body}
              </p>

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {note.tags.map((tg) => (
                    <span
                      key={tg}
                      className="px-2 py-0.5 bg-blue-950/80 border border-blue-800/80 text-blue-300 rounded-md text-[10px] font-bold"
                    >
                      #{tg}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
