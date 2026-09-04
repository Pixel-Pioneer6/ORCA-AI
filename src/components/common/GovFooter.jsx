import React from 'react';
import { Link } from 'react-router-dom';

export default function GovFooter({ variant = 'mobile' }) {
  const isDesktop = variant === 'desktop';
  const lastUpdated = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <footer
      className={`border-t border-surface-container-high/80 bg-surface-container-lowest text-on-surface-variant text-[11px] py-4 flex flex-col gap-2 ${
        isDesktop ? 'px-gutter-desktop mt-pad-lg' : 'px-gutter-mobile pb-28 mt-pad-md rounded-xl'
      }`}
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-center md:justify-start gap-1.5 font-bold text-on-surface text-xs">
            <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
            <span>ORCA Marine Intelligence Platform</span>
            <span className="text-[10px] text-on-surface-variant font-mono">&middot; SIH 2026 PS-26176</span>
          </div>
          <p className="text-[10px] text-on-surface-variant">
            Data synthesized from ISRO (Oceansat-3, INSAT-3D), INCOIS OSF (WAVEWATCH-III v3.4), and IMD. Content owned by Department of Space, ISRO &middot; INCOIS.
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

      <div className="max-w-5xl mx-auto w-full flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 pt-2 border-t border-surface-container-high/50">
        {['ISRO', 'INCOIS', 'IMD', 'MOSDAC', 'Bhuvan'].map((agency) => (
          <span key={agency} className="px-2 py-0.5 rounded bg-surface-container border border-surface-container-high font-bold text-on-surface-variant">
            {agency}
          </span>
        ))}
        {/* Placeholder legal content — no dedicated policy pages exist yet.
            Mobile genuinely has a /settings route to land on; the desktop
            officer dashboards don't (no Settings screen for those roles),
            so linking there would silently hit the wrong dashboard via the
            route fallback. Real navigation where a destination exists,
            plain text where one doesn't — not a link that goes nowhere. */}
        {isDesktop ? (
          <>
            <span className="text-on-surface-variant/70">Data Access Policy</span>
            <span className="text-on-surface-variant/70">Privacy Policy</span>
            <span className="text-on-surface-variant/70">Terms &amp; Conditions</span>
          </>
        ) : (
          <>
            <Link to="/settings" className="text-secondary hover:underline">Data Access Policy</Link>
            <Link to="/settings" className="text-secondary hover:underline">Privacy Policy</Link>
            <Link to="/settings" className="text-secondary hover:underline">Terms &amp; Conditions</Link>
          </>
        )}
        <span className="md:ml-auto">Last updated: {lastUpdated}</span>
      </div>
      <p className="max-w-5xl mx-auto w-full text-center md:text-left italic text-[10px]">
        Advisory only &mdash; not a substitute for official IMD / INCOIS warnings.
      </p>
    </footer>
  );
}
