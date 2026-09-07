import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Compass, Home, ArrowLeft } from 'lucide-react';

interface NotFoundViewProps {
  onReturnHome: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onReturnHome }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center text-white bg-[#020617]">
      <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/30 rounded-3xl flex items-center justify-center text-blue-400 mb-6 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
        <Compass className="w-10 h-10 animate-pulse" />
      </div>

      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-mono font-bold tracking-widest uppercase mb-3">
        404 — Page Not Found
      </span>

      <h1 className="text-3xl sm:text-5xl font-black mb-3 text-white">
        Looks like this play went out of bounds.
      </h1>

      <p className="text-slate-400 max-w-md text-sm mb-8 leading-relaxed">
        The page or route you are looking for does not exist or may have been moved to a new section of the pitch.
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={onReturnHome}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </button>
      </div>
    </div>
  );
};
