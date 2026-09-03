import React from 'react';

export default function VesselTrafficTable() {
  const vessels = [
    { name: 'MV Ocean Star', mmsi: '419001284', type: 'Mechanized Trawler (18m)', draft: '2.1m', status: 'Bar Hold', statusColor: 'bg-amber-100 text-amber-900 border-amber-300', berth: 'Outer Anchorage', action: 'Hold Clearance' },
    { name: 'Sea Fisher IV', mmsi: '419002931', type: 'Traditional FRP (9m)', draft: '0.9m', status: 'Caution Inbound', statusColor: 'bg-amber-100 text-amber-900 border-amber-300', berth: 'Jetty B-04', action: 'Escort Pilot' },
    { name: 'Coromandel Pearl', mmsi: '419003884', type: 'Gillnetter (14m)', draft: '1.6m', status: 'Cleared Exit', statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300', berth: 'Channel Out', action: 'VHF-16 Log' },
    { name: 'Harbour Tug 02', mmsi: '419004112', type: 'Port Assist Tug', draft: '2.8m', status: 'Stationary Watch', statusColor: 'bg-sky-100 text-sky-900 border-sky-300', berth: 'Pier 1 Standby', action: 'Direct Dispatch' },
    { name: 'Blue Fin 08', mmsi: '419005009', type: 'Longliner (16m)', draft: '1.8m', status: 'Shoal Risk', statusColor: 'bg-red-100 text-red-900 border-red-300', berth: 'Approach Bar', action: 'Immediate Alert' },
  ];

  return (
    <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/80 overflow-hidden shadow-sm">
      <div className="p-pad-sm bg-surface-container-low/40 border-b border-surface-container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-secondary">directions_boat</span>
          <span className="font-headline-sm text-xs uppercase font-bold text-on-surface">
            Vessel Traffic (AIS) & Harbour Allocation Queue
          </span>
        </div>
        <span className="text-[11px] font-mono text-secondary font-bold">
          42 Tracked in Perimeter
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-body-sm">
          <thead>
            <tr className="border-b border-surface-container bg-surface-container-low/50">
              <th className="py-2.5 px-3 font-label-sm text-[10px] uppercase text-on-surface-variant">Vessel / MMSI</th>
              <th className="py-2.5 px-3 font-label-sm text-[10px] uppercase text-on-surface-variant">Craft Type</th>
              <th className="py-2.5 px-3 font-label-sm text-[10px] uppercase text-on-surface-variant">Draught</th>
              <th className="py-2.5 px-3 font-label-sm text-[10px] uppercase text-on-surface-variant">Status</th>
              <th className="py-2.5 px-3 font-label-sm text-[10px] uppercase text-on-surface-variant">Berth</th>
              <th className="py-2.5 px-3 font-label-sm text-[10px] uppercase text-on-surface-variant text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {vessels.map((v, i) => (
              <tr key={i} className="hover:bg-surface-container-low/60 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="font-bold text-xs text-on-surface">{v.name}</div>
                  <div className="font-mono text-[10px] text-on-surface-variant">MMSI: {v.mmsi}</div>
                </td>
                <td className="py-2.5 px-3 text-xs text-on-surface">{v.type}</td>
                <td className="py-2.5 px-3 font-mono text-xs font-semibold text-on-surface">{v.draft}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${v.statusColor}`}>
                    {v.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-xs text-on-surface-variant font-medium">{v.berth}</td>
                <td className="py-2.5 px-3 text-right">
                  <button className="text-secondary hover:text-primary font-bold text-xs transition-colors">
                    {v.action}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
