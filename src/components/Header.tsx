import React from 'react';
import { BackendHealth, User } from '../types/finance';
import { Wrench, RefreshCw, LogOut, Shield } from 'lucide-react';

interface HeaderProps {
  health: BackendHealth | null;
  isLoading: boolean;
  onRefreshAll: () => void;
  onOpenBackendModal: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenAdminModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  isLoading,
  onRefreshAll,
  onOpenBackendModal,
  currentUser,
  onLogout,
  onOpenAdminModal,
}) => {
  const isConnected = health?.connected && health?.databaseReady;
  const isAuthRequired = health?.message?.includes('Sign-In') || health?.message?.includes('authentication');

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Business Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-100 text-xs sm:text-sm">SATTAR AUTO</span>
              <span className="text-[9px] uppercase font-semibold text-amber-400 bg-amber-400/10 px-1 py-0.2 rounded">
                PKR
              </span>
            </div>
            <div className="text-[10px] text-slate-400 tracking-tight leading-none">
              Mobile & Electrical
            </div>
          </div>
        </div>

        {/* User Badge, Status Indicator & Actions */}
        <div className="flex items-center gap-1.5">
          {/* Current User Role / Admin Trigger */}
          {currentUser && (
            <button
              onClick={onOpenAdminModal}
              title={`Logged in as ${currentUser.name} (${currentUser.role}). Tap to manage users.`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors"
            >
              <Shield className={`w-3 h-3 ${currentUser.role === 'ADMIN' ? 'text-amber-400' : 'text-blue-400'}`} />
              <span className="max-w-[70px] truncate">{currentUser.username}</span>
            </button>
          )}

          {/* Backend Status Trigger */}
          <button
            onClick={onOpenBackendModal}
            title="Inspect Google Apps Script Backend Status"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
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
            <span className="text-[10px] text-slate-300">
              {isConnected ? 'API' : isAuthRequired ? 'Auth' : 'Offline'}
            </span>
          </button>

          {/* Quick Refresh Button */}
          <button
            onClick={onRefreshAll}
            disabled={isLoading}
            title="Refresh All Financial Data from Google Sheets"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Lock & Log Out"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 hover:border-rose-800/60 border border-slate-700/60 text-slate-400 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

