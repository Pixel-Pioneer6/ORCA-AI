import React, { useState } from 'react';

export default function SwellWindCurve() {
  const [activeHour, setActiveHour] = useState(2); // 07:00 IST peak

  const dataPoints = [
    { time: '05:00', wave: 1.4, wind: 16, status: 'safe' },
    { time: '06:00', wave: 1.6, wind: 20, status: 'caution' },
    { time: '07:00', wave: 1.8, wind: 24, status: 'caution' },
    { time: '08:00', wave: 1.7, wind: 22, status: 'caution' },
    { time: '09:00', wave: 1.5, wind: 18, status: 'caution' },
    { time: '10:00', wave: 1.3, wind: 15, status: 'safe' },
    { time: '11:00', wave: 1.2, wind: 13, status: 'safe' },
    { time: '12:00', wave: 1.1, wind: 10, status: 'safe' },
  ];

  return (
    <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/70 shadow-sm flex flex-col gap-pad-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-secondary">show_chart</span>
          <span className="font-headline-sm text-sm font-bold text-on-surface">
            24-Hour Swell & Wind Curve
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-secondary"></span> Swell (m)
          </span>
          <span className="flex items-center gap-1 text-on-surface-variant">
            <span className="w-2.5 h-0.5 bg-amber-500 stroke-dashed"></span> Wind (kt)
          </span>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox="0 0 360 140" className="w-full h-auto overflow-visible select-none">
          {/* Danger Limit Zone: Red above 2.0m */}
          <rect x="0" y="0" width="360" height="25" fill="#FEF2F2" fillOpacity="0.7" />
          <line x1="0" y1="25" x2="360" y2="25" stroke="#EF4444" strokeWidth="1" strokeDasharray="3 3" />
          <text x="355" y="20" fill="#EF4444" fontSize="8" textAnchor="end" fontWeight="bold">2.2m DANGER</text>

          {/* Physical Craft Limit: Amber at 1.5m */}
          <rect x="0" y="25" width="360" height="35" fill="#FEF3C7" fillOpacity="0.4" />
          <line x1="0" y1="60" x2="360" y2="60" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 4" />
          <text x="355" y="55" fill="#D97706" fontSize="8" textAnchor="end" fontWeight="bold">1.5m 8m CRAFT LIMIT</text>

          {/* Safe Zone below 1.5m */}
          <rect x="0" y="60" width="360" height="60" fill="#ECFDF5" fillOpacity="0.5" />

          {/* Swell Curve Path */}
          <path
            d="M 20,70 Q 70,40 120,38 T 220,75 T 340,95"
            fill="none"
            stroke="#006399"
            strokeWidth="2.5"
          />

          {/* Wind Curve Path */}
          <path
            d="M 20,80 Q 70,55 120,48 T 220,85 T 340,105"
            fill="none"
            stroke="#D97706"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* Data Nodes */}
          {dataPoints.map((d, i) => {
            const x = 20 + i * 45;
            // approximate y for wave
            const y = d.wave >= 1.8 ? 38 : d.wave >= 1.6 ? 50 : d.wave >= 1.4 ? 70 : 90;
            const isSelected = activeHour === i;
            return (
              <g key={i} onClick={() => setActiveHour(i)} className="cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : 3.5}
                  fill={isSelected ? '#006399' : '#FFFFFF'}
                  stroke="#006399"
                  strokeWidth="2"
                />
                <text x={x} y="132" fill="#74777F" fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono">
                  {d.time}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Scrubber Details */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-on-surface">
            {dataPoints[activeHour].time} IST
          </span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
            dataPoints[activeHour].status === 'safe' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {dataPoints[activeHour].status}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono">
            Wave: <strong className="text-secondary">{dataPoints[activeHour].wave}m</strong>
          </span>
          <span className="font-mono">
            Wind: <strong className="text-amber-700">{dataPoints[activeHour].wind} kt</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
