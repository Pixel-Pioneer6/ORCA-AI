import React from 'react';

export default function EvidenceChip({ 
  source = 'INCOIS OSF', 
  metric = '94%', 
  type = 'default',
  icon = 'satellite_alt' 
}) {
  const styles = {
    default: 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA]',
    live: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    hazard: 'bg-rose-50 border-rose-200 text-rose-800',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold font-label-md tracking-wide shadow-xs ${styles[type] || styles.default}`}>
      {type === 'live' ? (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
      ) : (
        <span className="material-symbols-outlined text-[13px]">{icon}</span>
      )}
      <span>{source}</span>
      {metric && <span className="opacity-70">· {metric}</span>}
    </span>
  );
}
