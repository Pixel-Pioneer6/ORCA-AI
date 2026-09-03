import React from 'react';

export default function SensorMatrixTable() {
  const sensors = [
    { name: 'INSAT-3D Imager', param: 'Sea Surface Temp (SST)', res: '4.0 km', latency: '18m (LIVE)', qc: '99.4%', calib: 'Nominal DGPS' },
    { name: 'Oceansat-3 OCM-3', param: 'Chlorophyll-a & Suspended Matter', res: '360 m', latency: '42m', qc: '98.8%', calib: 'Calibrated V2' },
    { name: 'Sentinel-3 SLSTR', param: 'Dual-Angle Radiometry SST', res: '1.0 km', latency: '1h 14m', qc: '99.1%', calib: 'Level-2 Valid' },
    { name: 'INCOIS Buoy BD08', param: 'SWH, Direction & Wave Period', res: 'In-situ Point', latency: '8m (Real-time)', qc: '100%', calib: 'Acoustic Calib.' },
    { name: 'NIOT Coastal ADCP', param: 'Sub-surface Current Velocity', res: '0.5m Depth Bin', latency: '15m', qc: '97.6%', calib: 'Zero Drift Checked' },
  ];

  return (
    <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/80 overflow-hidden shadow-sm">
      <div className="p-pad-sm bg-surface-container-low/40 border-b border-surface-container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-secondary">verified</span>
          <span className="font-headline-sm text-xs uppercase font-bold text-on-surface">
            Multi-Sensor Telemetry & Data Provenance Matrix
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          5 Ingest Streams Active
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-body-sm">
          <thead>
            <tr className="border-b border-surface-container bg-surface-container-low/50">
              <th className="py-2.5 px-3 font-label-sm text-[10px] uppercase text-on-surface-variant">Sensor Instrument</th>
              <th className="py-2.5 px-3 font-label-sm text-[10px] uppercase text-on-surface-variant">Ocean Parameter</th>
              <th className="py-2.5 px-3 font-label-sm text-[10px] uppercase text-on-surface-variant">Spatial Res.</th>
              <th className="py-2.5 px-3 font-label-sm text-[10px] uppercase text-on-surface-variant">Ingest Latency</th>
              <th className="py-2.5 px-3 font-label-sm text-[10px] uppercase text-on-surface-variant">QC Score</th>
              <th className="py-2.5 px-3 font-label-sm text-[10px] uppercase text-on-surface-variant">Calibration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {sensors.map((s, i) => (
              <tr key={i} className="hover:bg-surface-container-low/60 transition-colors">
                <td className="py-2.5 px-3 font-bold text-xs text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-secondary">satellite_alt</span>
                  {s.name}
                </td>
                <td className="py-2.5 px-3 text-xs text-on-surface">{s.param}</td>
                <td className="py-2.5 px-3 font-mono text-xs font-semibold text-on-surface">{s.res}</td>
                <td className="py-2.5 px-3 font-mono text-xs font-bold text-secondary">{s.latency}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold font-mono">
                    {s.qc}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-xs text-on-surface-variant font-medium">{s.calib}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
