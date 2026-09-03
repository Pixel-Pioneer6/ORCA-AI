import React, { useState } from 'react';

export default function TacticalGisMap({ height = '340px', showLayers = true }) {
  const [activeLayers, setActiveLayers] = useState({
    bathymetry: true,
    hazards: true,
    pfz: true,
    vessels: true,
  });

  const toggleLayer = (key) => {
    setActiveLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#0A1626] border border-surface-container-high shadow-md">
      {/* Top Map HUD Bar */}
      <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/10 pointer-events-auto">
          <span className="material-symbols-outlined text-[14px] text-secondary-container">radar</span>
          <span className="font-label-sm text-[11px] font-bold">Kasimedu Bight · 15 NM Extent</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-emerald-400 border border-white/10 text-[10px] font-mono pointer-events-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>NavIC DGPS LOCK</span>
        </div>
      </div>

      {/* Layer Toggles Strip */}
      {showLayers && (
        <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center gap-1 overflow-x-auto pb-1 pointer-events-auto">
          <button
            onClick={() => toggleLayer('bathymetry')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              activeLayers.bathymetry ? 'bg-secondary text-white' : 'bg-black/60 text-white/60 border border-white/10'
            }`}
          >
            Bathymetry (10m/20m)
          </button>
          <button
            onClick={() => toggleLayer('hazards')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              activeLayers.hazards ? 'bg-error text-white' : 'bg-black/60 text-white/60 border border-white/10'
            }`}
          >
            Hazard Crosshatch
          </button>
          <button
            onClick={() => toggleLayer('pfz')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              activeLayers.pfz ? 'bg-emerald-600 text-white' : 'bg-black/60 text-white/60 border border-white/10'
            }`}
          >
            PFZ #01 (18.4 NM)
          </button>
        </div>
      )}

      {/* Vector Nautical Map Canvas */}
      <svg 
        viewBox="0 0 400 320" 
        className="w-full select-none"
        style={{ height }}
      >
        <defs>
          {/* Hazard Diagonal Crosshatch Pattern */}
          <pattern id="hazardHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.45" />
          </pattern>
          {/* PFZ Radial Glow */}
          <radialGradient id="pfzGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#0077B6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0A1626" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ocean Background Canvas */}
        <rect width="400" height="320" fill="#0B1C33" />

        {/* Bathymetric Depth Contours */}
        {activeLayers.bathymetry && (
          <g opacity="0.6">
            {/* 5m contour */}
            <path d="M 60,0 Q 80,120 70,220 T 50,320" fill="none" stroke="#173B66" strokeWidth="1.5" />
            <text x="75" y="60" fill="#38BDF8" fontSize="8" fontFamily="JetBrains Mono">5m</text>
            {/* 10m breaker contour */}
            <path d="M 120,0 Q 150,110 135,210 T 110,320" fill="none" stroke="#1E4E85" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="140" y="100" fill="#38BDF8" fontSize="8" fontFamily="JetBrains Mono">10m</text>
            {/* 20m trawling contour */}
            <path d="M 210,0 Q 230,120 220,230 T 190,320" fill="none" stroke="#2664AA" strokeWidth="1.5" />
            <text x="225" y="160" fill="#67BAFD" fontSize="8" fontFamily="JetBrains Mono">20m</text>
            {/* 50m deep blue */}
            <path d="M 310,0 Q 330,130 320,240 T 300,320" fill="none" stroke="#1E528F" strokeWidth="1.5" />
            <text x="325" y="220" fill="#67BAFD" fontSize="8" fontFamily="JetBrains Mono">50m</text>
          </g>
        )}

        {/* Western Coastline Belt (Tamil Nadu) */}
        <path
          d="M 0,0 L 45,0 Q 60,80 50,160 Q 40,240 30,320 L 0,320 Z"
          fill="#1E293B"
          stroke="#475569"
          strokeWidth="1.5"
        />
        <text x="8" y="40" fill="#94A3B8" fontSize="9" fontWeight="bold">TAMIL NADU</text>
        <text x="8" y="55" fill="#64748B" fontSize="8">Chennai Coast</text>

        {/* Range Rings (5 NM & 15 NM) */}
        <circle cx="50" cy="140" r="70" fill="none" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="2 2" />
        <text x="122" y="138" fill="#38BDF8" fontSize="7" opacity="0.6">5 NM</text>
        <circle cx="50" cy="140" r="180" fill="none" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="2 2" />
        <text x="232" y="138" fill="#38BDF8" fontSize="7" opacity="0.6">15 NM</text>

        {/* Hazard Exclusion Area (Bar Mouth Shoaling) */}
        {activeLayers.hazards && (
          <g>
            <polygon
              points="48,110 110,100 130,150 70,175 48,150"
              fill="url(#hazardHatch)"
              stroke="#EF4444"
              strokeWidth="1.5"
            />
            <rect x="68" y="125" width="60" height="16" rx="3" fill="#BA1A1A" fillOpacity="0.9" />
            <text x="98" y="136" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">
              SQUALL ZONE
            </text>
          </g>
        )}

        {/* PFZ #01 Zone & Optimal Transit Corridor */}
        {activeLayers.pfz && (
          <g>
            {/* Transit Route avoiding Hazard */}
            <path
              d="M 50,140 Q 60,195 120,210 T 260,225"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeDasharray="4 3"
            />
            {/* PFZ Gradient Circle */}
            <circle cx="260" cy="225" r="45" fill="url(#pfzGlow)" />
            <circle cx="260" cy="225" r="45" fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* PFZ Target Pin */}
            <circle cx="260" cy="225" r="4" fill="#10B981" />
            <rect x="230" y="240" width="60" height="16" rx="3" fill="#0B2545" stroke="#10B981" strokeWidth="1" />
            <text x="260" y="251" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">
              PFZ #01 (18.4 NM)
            </text>
          </g>
        )}

        {/* Vessel Position Icon (Kasimedu Pier) */}
        <g transform="translate(50, 140)">
          {/* Animated GPS ping */}
          <circle cx="0" cy="0" r="10" fill="#0284C7" fillOpacity="0.3">
            <animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* Boat pin */}
          <circle cx="0" cy="0" r="5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
          <line x1="0" y1="0" x2="12" y2="-6" stroke="#38BDF8" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="8" y="15" fill="#FFFFFF" fontSize="8" fontWeight="bold">My Vessel</text>
        </g>
      </svg>
    </div>
  );
}
