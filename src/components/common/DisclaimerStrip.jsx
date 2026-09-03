import React from 'react';

// FR-5.4 — mandatory on every safety verdict: ORCA relays and explains
// official advisories, it never supersedes them.
export default function DisclaimerStrip({ className = '' }) {
  return (
    <div className={`flex items-start gap-1.5 text-[10px] leading-tight text-on-surface-variant/90 ${className}`}>
      <span className="material-symbols-outlined text-[13px] flex-shrink-0 mt-px">info</span>
      <span>
        Advisory only &mdash; not a substitute for official IMD / INCOIS warnings. Always follow local port authority instructions.
      </span>
    </div>
  );
}
