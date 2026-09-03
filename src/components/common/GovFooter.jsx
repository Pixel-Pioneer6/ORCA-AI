import React from 'react';

export default function GovFooter({ variant = 'mobile' }) {
  const isDesktop = variant === 'desktop';

  return (
    <footer
      className={`border-t border-surface-container-high/80 bg-surface-container-lowest text-on-surface-variant text-[11px] py-4 ${
        isDesktop ? 'px-gutter-desktop pl-68' : 'px-gutter-mobile pb-28'
      }`}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-center md:justify-start gap-1.5 font-bold text-on-surface text-xs">
            <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
            <span>ORCA Marine Intelligence Platform</span>
            <span className="text-[10px] text-on-surface-variant font-mono">&middot; SIH 2026 PS-26176</span>
          </div>
          <p className="text-[10px] text-on-surface-variant">
            Data synthesized from ISRO (Oceansat-3, INSAT-3D), INCOIS OSF (WAVEWATCH-III v3.4), and IMD.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface">
            VHF Ch-16 / 156.8 MHz
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface">
            Coast Guard: 1554
          </span>
          <span>v2.8.4-PRO</span>
        </div>
      </div>
    </footer>
  );
}
