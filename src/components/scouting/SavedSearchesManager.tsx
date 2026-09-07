import React, { useState, useEffect } from 'react';
import { SavedSearch, SearchFilters } from '../../types';
import {
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
} from '../../services/scoutingService';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Bookmark,
  Search,
  Trash2,
  Plus,
  Play,
  Check,
} from 'lucide-react';

interface SavedSearchesManagerProps {
  recruiterId: string;
  currentFilters: SearchFilters;
  onApplyFilters: (filters: SearchFilters) => void;
}

export const SavedSearchesManager: React.FC<SavedSearchesManagerProps> = ({
  recruiterId,
  currentFilters,
  onApplyFilters,
}) => {
  const { t } = useLanguage();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTitle, setSearchTitle] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const fetchSearches = async () => {
    setLoading(true);
    const list = await getSavedSearches(recruiterId);
    setSavedSearches(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchSearches();
  }, [recruiterId]);

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTitle.trim()) return;

    const created = await createSavedSearch(
      recruiterId,
      searchTitle.trim(),
      currentFilters
    );

    setSavedSearches((prev) => [...prev, created]);
    setSearchTitle('');
    setShowSaveModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved search preset?')) return;
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    await deleteSavedSearch(id);
  };

  return (
    <div className="bg-[#0A0E17] border border-slate-800 p-5 rounded-3xl space-y-4 text-white">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-blue-400" />
          <span>Saved Search Presets ({savedSearches.length})</span>
        </h3>

        <button
          onClick={() => setShowSaveModal(true)}
          className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('saveSearch')}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-slate-500 text-xs">Loading presets...</div>
      ) : savedSearches.length === 0 ? (
        <div className="text-center py-4 text-slate-500 text-xs">
          No saved search presets yet. Adjust search filters and click "Save Current Filters".
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {savedSearches.map((s) => (
            <div
              key={s.id}
              className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center gap-2 group transition-all"
            >
              <button
                onClick={() => onApplyFilters(s.filters)}
                className="text-xs font-bold text-slate-200 hover:text-blue-400 flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 text-blue-400 fill-current" />
                <span>{s.title}</span>
              </button>

              <button
                onClick={() => handleDelete(s.id)}
                className="text-slate-600 hover:text-red-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete preset"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-extrabold">{t('saveSearch')}</h3>

            <form onSubmit={handleSaveCurrent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  {t('searchTitle')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ontario Midfielders 2026, U19 PRO Keepers..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300">Filters to be saved:</span>
                <p>Position: {currentFilters.position || 'Any'}</p>
                <p>Location: {currentFilters.location || 'Any'}</p>
                <p>Level: {currentFilters.playingLevel || 'Any'}</p>
                <p>Foot: {currentFilters.preferredFoot || 'Any'}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
