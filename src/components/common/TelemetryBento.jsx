import React from 'react';
import { useMarine } from '../../context/MarineContext';

export default function TelemetryBento() {
  const { telemetry } = useMarine();

  const metrics = [
    {
      title: 'Signif. Wave (SWH)',
      value: telemetry.wave,
      unit: telemetry.waveUnit,
      desc: telemetry.waveDesc,
      icon: 'waves',
      trend: '+0.2m',
      trendUp: true,
    },
    {
      title: 'Wind Speed',
      value: telemetry.wind,
      unit: telemetry.windUnit,
      desc: telemetry.windDesc,
      icon: 'air',
      trend: '+4 kt',
      trendUp: true,
    },
    {
      title: 'Surface Current',
      value: telemetry.current,
      unit: telemetry.currentUnit,
      desc: 'Northerly Drift',
      icon: 'arrow_outward',
      trend: 'Normal',
      trendUp: false,
    },
    {
      title: 'Swell Bearing & Period',
      value: telemetry.direction,
      unit: '',
      desc: `Period: ${telemetry.period}`,
      icon: 'explore',
      trend: 'Stable',
      trendUp: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-pad-sm">
      {metrics.map((m, idx) => (
        <div 
          key={idx}
          className="rounded-xl bg-surface-container-lowest p-pad-sm shadow-sm border border-surface-container-high/60 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-sm text-[11px] uppercase tracking-wider font-semibold truncate">
              {m.title}
            </span>
            <span className="material-symbols-outlined text-[18px] text-secondary">
              {m.icon}
            </span>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="font-telemetry-lg text-telemetry-lg font-bold text-on-surface tracking-tight">
              {m.value}
            </span>
            {m.unit && (
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                {m.unit}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] border-t border-surface-container-high/40 pt-1">
            <span className="text-on-surface-variant truncate font-medium">{m.desc}</span>
            <span className={`font-mono text-[10px] font-bold ${m.trendUp ? 'text-amber-600' : 'text-secondary'}`}>
              {m.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
