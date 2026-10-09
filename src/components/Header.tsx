import React from 'react';
import { BackendHealth } from '../types/finance';
import { Wrench, RefreshCw, Server, AlertCircle, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  health: BackendHealth | null;
  isLoading: boolean;
  onRefreshAll: () => void;
  onOpenBackendModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  isLoading,
  onRefreshAll,
  onOpenBackendModal,
}) => {
  const isConnected = health?.connected && health?.databaseReady;
  const isAuthRequired = health?.message?.includes('Sign-In') || health?.message?.includes('authentication');

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Business Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-100 text-sm">SATTAR AUTO</span>
              <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                PKR
              </span>
            </div>
            <div className="text-[11px] text-slate-400 tracking-tight leading-none">
              Mobile & Electrical Services
            </div>
          </div>
        </div>

        {/* Status Indicator & Refresh */}
        <div className="flex items-center gap-1.5">
          {/* Backend Status Trigger */}
          <button
            onClick={onOpenBackendModal}
            title="Inspect Google Apps Script Backend Status"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          >
            {isConnected ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : isAuthRequired ? (
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            ) : (
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
            <span className="text-[11px] text-slate-300">
              {isConnected ? 'API Live' : isAuthRequired ? 'Check Auth' : 'Offline'}
            </span>
          </button>

          {/* Quick Refresh Button */}
          <button
            onClick={onRefreshAll}
            disabled={isLoading}
            title="Refresh All Financial Data from Google Sheets"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
