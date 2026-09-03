import React from 'react';
import { getEvidence } from '../../lib/evidenceLedger';

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

// US-10 — "tap any sentence and see exactly which product, grid cell, and
// timestamp produced it." This drawer is that surface.
export default function EvidenceDrawer({ ledgerId, onClose }) {
  if (!ledgerId) return null;
  const record = getEvidence(ledgerId);
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl p-pad-lg flex flex-col gap-pad-sm border border-surface-container-high pb-safe">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">satellite_alt</span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Evidence Record</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close evidence record"
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-on-surface">{record.source}</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-xs font-bold">
            {record.confidencePct}% confidence
          </span>
        </div>
        <span className="text-xs text-on-surface-variant -mt-1">{record.agency}</span>

        <dl className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
            <dt className="text-[10px] uppercase font-bold text-on-surface-variant">Product</dt>
            <dd className="font-medium text-on-surface mt-0.5">{record.product}</dd>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
            <dt className="text-[10px] uppercase font-bold text-on-surface-variant">Value</dt>
            <dd className="font-mono font-bold text-on-surface mt-0.5">
              {record.value}{record.unit ? ` ${record.unit}` : ''}
            </dd>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
            <dt className="text-[10px] uppercase font-bold text-on-surface-variant">Grid Cell</dt>
            <dd className="font-mono text-on-surface mt-0.5">{record.grid}</dd>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
            <dt className="text-[10px] uppercase font-bold text-on-surface-variant">Variable</dt>
            <dd className="font-mono text-on-surface mt-0.5">{record.variable}</dd>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container col-span-2">
            <dt className="text-[10px] uppercase font-bold text-on-surface-variant">Valid Time</dt>
            <dd className="font-medium text-on-surface mt-0.5">{formatTime(record.validTime)}</dd>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container col-span-2">
            <dt className="text-[10px] uppercase font-bold text-on-surface-variant">Retrieved</dt>
            <dd className="font-medium text-on-surface mt-0.5">{formatTime(record.retrievedTime)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
