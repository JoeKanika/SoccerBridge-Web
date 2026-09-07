import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  collectDiagnosticSnapshot,
  logDiagnosticSnapshotToConsole,
  DiagnosticSnapshot,
} from '../utils/diagnosticLogger';
import {
  Bug,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Terminal,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  User,
  Database,
  Layers,
  AlertOctagon,
  X,
} from 'lucide-react';

interface DiagnosticDebugOverlayProps {
  activeView: string;
}

export const DiagnosticDebugOverlay: React.FC<DiagnosticDebugOverlayProps> = ({ activeView }) => {
  const {
    currentUser,
    userAccount,
    playerProfile,
    recruiterProfile,
    loading,
    devRoleOverride,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snapshot, setSnapshot] = useState<DiagnosticSnapshot | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'raw' | 'errors'>('summary');

  const refreshDiagnostics = useCallback(async () => {
    setRefreshing(true);
    try {
      const snap = await collectDiagnosticSnapshot({
        currentUser,
        userAccount,
        playerProfile,
        recruiterProfile,
        loading,
        devRoleOverride,
        activeView,
      });
      setSnapshot(snap);
      logDiagnosticSnapshotToConsole(snap);
    } catch (e) {
      console.error('[DiagnosticDebugOverlay] Failed to collect snapshot:', e);
    } finally {
      setRefreshing(false);
    }
  }, [currentUser, userAccount, playerProfile, recruiterProfile, loading, devRoleOverride, activeView]);

  // Re-run diagnostics on auth state/view changes
  useEffect(() => {
    refreshDiagnostics();
  }, [refreshDiagnostics]);

  const handleCopyJSON = () => {
    if (!snapshot) return;
    navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLog = () => {
    if (!snapshot) return;
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soccerbridge-auth-diagnostics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConsoleDump = () => {
    if (snapshot) {
      logDiagnosticSnapshotToConsole(snapshot);
    }
  };

  if (!snapshot) return null;

  const isAuth = snapshot.firebaseAuth.isAuthenticated;
  const hasErrors = snapshot.recentExceptions.length > 0;
  const isRecovering = snapshot.roleResolution.needsRoleRecovery;

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-xs select-none">
      {/* Minimized Pill Toggle */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-2xl border transition-all duration-200 backdrop-blur-md ${
            hasErrors
              ? 'bg-red-950/90 border-red-500 text-red-300 animate-pulse'
              : isRecovering
              ? 'bg-amber-950/90 border-amber-500 text-amber-300'
              : isAuth
              ? 'bg-slate-900/90 border-emerald-500/70 text-emerald-400 hover:bg-slate-800'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Open Firebase Auth & System Diagnostic Overlay"
        >
          <Bug className="w-4 h-4" />
          <span className="font-bold">Auth Diagnostics</span>
          <span
            className={`w-2 h-2 rounded-full ${
              loading
                ? 'bg-blue-400 animate-ping'
                : hasErrors
                ? 'bg-red-400'
                : isAuth
                ? 'bg-emerald-400'
                : 'bg-slate-400'
            }`}
          />
          {hasErrors && (
            <span className="bg-red-600 text-white font-black px-1.5 py-0.5 rounded-full text-[10px]">
              {snapshot.recentExceptions.length}
            </span>
          )}
        </button>
      ) : (
        /* Expanded Floating Diagnostic Panel */
        <div className="w-[92vw] sm:w-[480px] max-h-[85vh] bg-[#090D16]/95 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Bug className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Auth & Firestore Diagnostics</h3>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                      loading
                        ? 'bg-blue-500/20 text-blue-400'
                        : isAuth
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {loading ? 'LOADING' : isAuth ? 'AUTHENTICATED' : 'ANONYMOUS'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Live Telemetry & Exception Tracker</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={refreshDiagnostics}
                disabled={refreshing}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Refresh state"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Minimize overlay"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 px-2 pt-1 gap-1">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-[#090D16] text-blue-400 border-t-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              State Summary
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'raw'
                  ? 'bg-[#090D16] text-blue-400 border-t-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3 h-3" />
              Full Snapshot
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'errors'
                  ? 'bg-[#090D16] text-red-400 border-t-2 border-red-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              Errors ({snapshot.recentExceptions.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4 overflow-y-auto max-h-[50vh] space-y-3">
            {activeTab === 'summary' && (
              <div className="space-y-3">
                {/* Auth User State Box */}
                <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Firebase Auth User
                    </span>
                    <span className="text-[10px] text-slate-500">Loading: {String(snapshot.authLoading)}</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">UID:</span>
                      <span className="text-slate-200 font-mono select-all">
                        {snapshot.firebaseAuth.uid || '<null>'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-slate-200 font-mono select-all">
                        {snapshot.firebaseAuth.email || '<null>'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email Verified:</span>
                      <span className={snapshot.firebaseAuth.emailVerified ? 'text-emerald-400' : 'text-amber-400'}>
                        {String(snapshot.firebaseAuth.emailVerified)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Providers:</span>
                      <span className="text-slate-300">
                        {snapshot.firebaseAuth.providers.join(', ') || 'none'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Firestore Documents Existence Box */}
                <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      Firestore Document Existence
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">users/{'{uid}'}:</span>
                      <span
                        className={`flex items-center gap-1 font-bold ${
                          snapshot.firestoreUserDoc.exists ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {snapshot.firestoreUserDoc.exists ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {snapshot.firestoreUserDoc.exists ? 'EXISTS' : 'NOT FOUND'}
                      </span>
                    </div>
                    {snapshot.firestoreUserDoc.error && (
                      <div className="text-[10px] text-red-400 bg-red-950/40 p-1.5 rounded border border-red-900/50">
                        Error: {snapshot.firestoreUserDoc.error}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">playerProfiles/{'{uid}'}:</span>
                      <span
                        className={`flex items-center gap-1 ${
                          snapshot.firestorePlayerProfileDoc.exists ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {snapshot.firestorePlayerProfileDoc.exists ? 'EXISTS' : 'NONE'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">recruiterProfiles/{'{uid}'}:</span>
                      <span
                        className={`flex items-center gap-1 ${
                          snapshot.firestoreRecruiterProfileDoc.exists ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {snapshot.firestoreRecruiterProfileDoc.exists ? 'EXISTS' : 'NONE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Resolution & Flow Routing */}
                <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Role Resolution & App State
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                      <span className="block text-slate-500 text-[10px]">Resolved Role</span>
                      <span className="font-bold text-white uppercase">
                        {snapshot.roleResolution.resolvedRole || 'UNRESOLVED'}
                      </span>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                      <span className="block text-slate-500 text-[10px]">Active Role</span>
                      <span className="font-bold text-blue-400 uppercase">
                        {snapshot.roleResolution.activeRole}
                      </span>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                      <span className="block text-slate-500 text-[10px]">Role Known</span>
                      <span
                        className={snapshot.roleResolution.isRoleKnown ? 'text-emerald-400' : 'text-amber-400'}
                      >
                        {String(snapshot.roleResolution.isRoleKnown)}
                      </span>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                      <span className="block text-slate-500 text-[10px]">Active View</span>
                      <span className="font-mono text-slate-300">{snapshot.activeView}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Needs Role Recovery:</span>
                      <span
                        className={
                          snapshot.roleResolution.needsRoleRecovery ? 'text-amber-400 font-bold' : 'text-slate-500'
                        }
                      >
                        {String(snapshot.roleResolution.needsRoleRecovery)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Needs Player Onboarding:</span>
                      <span className="text-slate-300">
                        {String(snapshot.roleResolution.needsPlayerOnboarding)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Needs Recruiter Onboarding:</span>
                      <span className="text-slate-300">
                        {String(snapshot.roleResolution.needsRecruiterOnboarding)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'raw' && (
              <pre className="text-[10px] text-emerald-400 bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto select-all">
                {JSON.stringify(snapshot, null, 2)}
              </pre>
            )}

            {activeTab === 'errors' && (
              <div className="space-y-2">
                {snapshot.recentExceptions.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                    <p className="text-xs">No runtime errors or unhandled rejections recorded.</p>
                  </div>
                ) : (
                  snapshot.recentExceptions.map((ex, idx) => (
                    <div key={idx} className="bg-red-950/40 border border-red-900/60 rounded-xl p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-red-400 font-bold">
                        <span>{ex.type.toUpperCase()}</span>
                        <span className="text-slate-500">{ex.timestamp.split('T')[1]}</span>
                      </div>
                      <div className="text-[11px] text-red-200 font-bold">{ex.message}</div>
                      {ex.stack && (
                        <pre className="text-[9px] text-slate-400 bg-black/40 p-1.5 rounded overflow-x-auto max-h-24">
                          {ex.stack}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={handleConsoleDump}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
              title="Print formatted table to Browser DevTools Console (F12)"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Console Dump</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyJSON}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                title="Copy JSON snapshot to clipboard"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={handleDownloadLog}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors text-[11px]"
                title="Download JSON log file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Log</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
