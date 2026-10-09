import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already running standalone or user dismissed banner, hide
  if (isInstalled || dismissed) {
    return null;
  }

  // Chrome / Android prompt flow
  if (isInstallable) {
    return (
      <div className="bg-gradient-to-r from-amber-500/20 via-slate-800 to-slate-900 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs animate-in fade-in duration-300">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-100">Install Sattar Finance</span>
            <p className="text-[11px] text-slate-400">Install as home screen app on your phone</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <div className="bg-slate-800/90 border-b border-slate-700 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">Add Sattar Finance to Home Screen</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIOSModal(true)}
              className="text-[11px] font-semibold text-amber-400 hover:underline"
            >
              How to install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-200">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                Install on iPhone / iPad
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed space-y-1">
                1. Tap the <strong className="text-white">Share</strong> button in Safari's toolbar.<br />
                2. Scroll down and choose <strong className="text-white">Add to Home Screen</strong>.<br />
                3. Tap <strong className="text-amber-400">Add</strong> in the top-right corner.
              </p>
              <button
                onClick={() => setShowIOSModal(false)}
                className="mt-4 w-full rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-white transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
