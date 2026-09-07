import React, { Component, ErrorInfo, ReactNode } from 'react';
import { telemetry } from '../services/telemetryService';
import { Copy, RefreshCw, AlertOctagon } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  declare props: Props;
  declare state: State;
  declare setState: (
    state: Partial<State> | ((prevState: State) => Partial<State>),
    callback?: () => void
  ) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    telemetry.reportError(error, { componentStack: errorInfo.componentStack });
    console.error('[SoccerBridge ErrorBoundary Crash Captured]', error, errorInfo);
  }

  handleCopyReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      errorMessage: this.state.error?.message,
      errorStack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-rose-400">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-white">Application Crash Detected</h1>
            <p className="text-slate-400 text-xs mb-4">
              SoccerBridge caught an unhandled component exception.
            </p>
            {this.state.error?.message && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-rose-300 mb-4 text-left overflow-auto max-h-36 select-all">
                <div className="font-bold text-rose-400 mb-1">{this.state.error.message}</div>
                {this.state.error.stack && (
                  <div className="text-[10px] text-slate-400 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleCopyReport}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Copy className="w-4 h-4 text-blue-400" />
                {this.state.copied ? 'Diagnostic Copied!' : 'Copy Crash Report'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

