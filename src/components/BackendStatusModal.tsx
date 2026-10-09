import React, { useState } from 'react';
import { BackendHealth } from '../types/finance';
import { ApiService, DEFAULT_GAS_API_URL } from '../services/apiService';
import { CheckCircle2, AlertTriangle, RefreshCw, X, Server, ExternalLink, ShieldAlert } from 'lucide-react';

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: BackendHealth | null;
  isLoading: boolean;
  onRefreshHealth: () => void;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({
  isOpen,
  onClose,
  health,
  isLoading,
  onRefreshHealth,
}) => {
  const [customUrl, setCustomUrl] = useState(ApiService.getApiUrl());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConnected = health?.connected && health?.databaseReady;
  const isAuthRedirect = health?.message?.includes('Google Account Sign-In') || health?.message?.includes('authentication page');

  const handleSaveUrl = () => {
    ApiService.setApiUrl(customUrl);
    setSaveMessage('API endpoint updated. Re-testing...');
    onRefreshHealth();
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleResetUrl = () => {
    ApiService.resetApiUrl();
    setCustomUrl(DEFAULT_GAS_API_URL);
    setSaveMessage('Reset to default URL.');
    onRefreshHealth();
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Backend Health & API Status</h3>
              <p className="text-xs text-slate-400">Google Apps Script Web App Connection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-sm">
          {/* Status banner */}
          <div
            className={`p-3.5 rounded-lg border ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : isAuthRedirect
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : isAuthRedirect ? (
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-semibold text-xs tracking-wider uppercase">
                  {isConnected
                    ? 'Backend Connected & Ready'
                    : isAuthRedirect
                    ? 'Access Restricted (Requires Public Permission)'
                    : 'Backend Disconnected'}
                </div>
                <div className="text-xs leading-relaxed opacity-90">
                  {isConnected
                    ? `Connected to ${health.business || 'Sattar Auto'}. Currency: ${health.currency || 'PKR'} · Timezone: ${health.timezone || 'Asia/Karachi'}`
                    : health?.message || 'Unable to communicate with the Google Apps Script Web App API.'}
                </div>
              </div>
            </div>
          </div>

          {/* Apps Script Access Instructions if Auth Redirect */}
          {isAuthRedirect && (
            <div className="p-3.5 bg-slate-800/80 rounded-lg border border-slate-700/60 space-y-2 text-xs text-slate-300">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span>How to enable API access in Google Apps Script:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                <li>Open your Google Apps Script project for Sattar Auto.</li>
                <li>Click the blue <span className="text-amber-400 font-semibold">Deploy</span> button at top right &rarr; <span className="font-medium">Manage deployments</span>.</li>
                <li>Click the <span className="text-amber-400 font-semibold">Edit (pencil icon)</span> on the active Web App deployment.</li>
                <li>Under <span className="font-semibold text-slate-100">"Who has access"</span>, change from <em>"Only myself"</em> to <span className="text-emerald-400 font-bold">"Anyone"</span>.</li>
                <li>Click <span className="text-amber-400 font-semibold">Deploy</span>, then click "Re-check Connection" below.</li>
              </ol>
            </div>
          )}

          {/* Database Sheets List */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Database Sheets (Google Sheets)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                'Transactions',
                'Accounts',
                'Categories',
                'Customers',
                'Vehicles',
                'Users',
                'Settings',
                'Audit_Log',
              ].map((sheet) => (
                <div
                  key={sheet}
                  className="flex items-center gap-2 p-2 bg-slate-800/40 border border-slate-800 rounded-md"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span className="text-slate-300 font-mono text-[11px]">{sheet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Configured API URL */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Google Apps Script Web App URL
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleResetUrl}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Reset to Original URL
                </button>
                <button
                  type="button"
                  onClick={handleSaveUrl}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-md transition-colors"
                >
                  Save & Test
                </button>
              </div>
            </div>
            {saveMessage && (
              <p className="text-xs text-emerald-400 animate-fadeIn">{saveMessage}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onRefreshHealth}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-check Connection</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
