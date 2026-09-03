import React from 'react';
import { useMarine } from '../../context/MarineContext';

export default function WarningStrip() {
  const { setCurrentRoute } = useMarine();

  return (
    <div className="relative overflow-hidden rounded-xl bg-error-container p-pad-sm flex items-center gap-pad-sm shadow-sm border border-error/20">
      <div className="w-10 h-10 rounded-lg bg-error flex items-center justify-center flex-shrink-0 text-on-error">
        <span className="material-symbols-outlined text-[22px]">warning</span>
      </div>
      <div className="flex flex-col min-w-0 flex-grow">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-on-error-container">
            Joint Advisory · INCOIS / IMD
          </span>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-error text-on-error font-label-sm text-[9px] uppercase font-bold">
            Caution
          </span>
        </div>
        <p className="font-headline-sm text-[14px] font-bold text-on-error-container leading-snug truncate">
          High Wave & Squall Alert · Valid to 18:00 IST
        </p>
        <p className="font-body-sm text-[11px] text-on-error-container/80 leading-tight">
          Wind gusts 24-28 kt along Tamil Nadu north coast. Nearshore breaking swells.
        </p>
      </div>
      <button 
        onClick={() => setCurrentRoute('safety')}
        aria-label="View advisory details" 
        className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-lowest/80 text-on-surface flex items-center justify-center hover:bg-white transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </div>
  );
}
