import React, { useState } from 'react';
import EvidenceDrawer from './EvidenceDrawer';
import { getEvidence } from '../../lib/evidenceLedger';

export default function EvidenceChip({
  source = 'INCOIS OSF',
  metric = '94%',
  type = 'default',
  icon = 'satellite_alt',
  ledgerId = null,
}) {
  const [open, setOpen] = useState(false);
  const record = ledgerId ? getEvidence(ledgerId) : null;
  const isInteractive = Boolean(record);

  const styles = {
    default: 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA]',
    live: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    hazard: 'bg-rose-50 border-rose-200 text-rose-800',
  };

  const Chip = (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold font-label-md tracking-wide shadow-xs ${styles[type] || styles.default} ${isInteractive ? 'cursor-pointer hover:brightness-95 active:scale-95 transition-all' : ''}`}>
      {type === 'live' ? (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
      ) : (
        <span className="material-symbols-outlined text-[13px]">{icon}</span>
      )}
      <span>{source}</span>
      {metric && <span className="opacity-70">· {metric}</span>}
      {isInteractive && <span className="material-symbols-outlined text-[12px] opacity-60">info</span>}
    </span>
  );

  if (!isInteractive) return Chip;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Inspect evidence: ${source}`}
        className="rounded-full"
      >
        {Chip}
      </button>
      {open && <EvidenceDrawer ledgerId={ledgerId} onClose={() => setOpen(false)} />}
    </>
  );
}
