import React from 'react';

export default function ClimatologySstChart() {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">show_chart</span>
          <span className="font-headline-sm text-sm font-bold text-on-surface">
            SST vs. Climatological Baseline — 30-Day Trajectory
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-secondary"></span> Observed SST (2026)
          </span>
          <span className="flex items-center gap-1 text-on-surface-variant">
            <span className="w-3 h-0.5 bg-slate-400 stroke-dashed"></span> 30-Year Normal
          </span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded bg-emerald-400"></span> Upwelling Front
          </span>
        </div>
      </div>

      {/* SVG Climatology Curve */}
      <div className="w-full overflow-hidden">
        <svg viewBox="0 0 740 220" className="w-full h-auto select-none font-mono text-[10px]">
          <defs>
            <linearGradient id="anomalyGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#006399" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#cde5ff" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="coolGrad" x1="0" x2="0" y1="1" y2="0">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line x1="45" x2="710" y1="30" y2="30" stroke="#eaedff" strokeWidth="1" />
          <text x="36" y="34" fill="#74777f" textAnchor="end">30.0°C</text>

          <line x1="45" x2="710" y1="80" y2="80" stroke="#eaedff" strokeWidth="1" />
          <text x="36" y="84" fill="#74777f" textAnchor="end">29.0°C</text>

          <line x1="45" x2="710" y1="130" y2="130" stroke="#eaedff" strokeWidth="1" />
          <text x="36" y="134" fill="#74777f" textAnchor="end">28.0°C</text>

          <line x1="45" x2="710" y1="180" y2="180" stroke="#eaedff" strokeWidth="1" />
          <text x="36" y="184" fill="#74777f" textAnchor="end">27.0°C</text>

          {/* Climatological Baseline Dotted Curve (28.6°C mean) */}
          <path
            d="M 45,95 Q 220,105 400,90 T 710,100"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Observed SST Curve with Anomaly Shading */}
          <path
            d="M 45,75 Q 180,50 320,60 T 520,145 T 710,65"
            fill="none"
            stroke="#006399"
            strokeWidth="2.5"
          />

          {/* Upwelling Drop Event Region */}
          <rect x="440" y="30" width="160" height="150" fill="url(#coolGrad)" />
          <text x="520" y="45" fill="#059669" fontWeight="bold" textAnchor="middle">
            COASTAL UPWELLING EVENT (-1.2°C)
          </text>

          {/* Current Day Point */}
          <circle cx="710" cy="65" r="5" fill="#006399" stroke="#FFFFFF" strokeWidth="2" />
          <rect x="650" y="40" width="70" height="18" rx="4" fill="#0B2545" />
          <text x="685" y="52" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">29.4°C LIVE</text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs text-on-surface-variant border-t border-surface-container pt-2">
        <span>30-Day Hindcast Range (INSAT-3D Imager Level-3 & Sentinel-3 SLSTR)</span>
        <span className="font-mono font-bold text-secondary">Statistical R² = 0.942</span>
      </div>
    </div>
  );
}
