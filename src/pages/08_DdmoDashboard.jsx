import React, { useState } from 'react';
import TacticalGisMap from '../components/maps/TacticalGisMap';
import SwellWindCurve from '../components/charts/SwellWindCurve';

export default function DdmoDashboard() {
  const [broadcastSent, setBroadcastSent] = useState(false);

  const incidents = [
    { time: '15:38 IST', type: 'WARNING', title: 'Nearshore Bar Breaking Surge', desc: 'Waves reaching 1.8m at Kasimedu harbour mouth. Non-decked craft prohibited.', status: 'ACTIVE' },
    { time: '15:12 IST', type: 'INFO', title: 'Coast Guard Hovercraft Sortie', desc: 'ICG-H02 deployed to shepherd 28 returnee artisanal craft inside breaker line.', status: 'DEPLOYED' },
    { time: '14:45 IST', type: 'SMS', title: 'Mass SMS Dissemination', desc: '14,200 broadcast alerts delivered across North Chennai & Ennore fishing hamlets.', status: 'SENT' },
    { time: '13:30 IST', type: 'ADVISORY', title: 'INCOIS Model Convergence', desc: 'WAVEWATCH-III v3.4 confirms squall peak between 06:00 and 09:00 IST tomorrow.', status: 'VERIFIED' },
  ];

  return (
    <div className="flex flex-col gap-pad-lg pb-16">
      {/* Top Demo Operational Authority Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-pad-sm bg-surface-container-high px-pad-md py-2 rounded-xl border border-surface-container-highest">
        <div className="flex items-center gap-pad-xs text-on-surface">
          <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
          <span className="font-label-sm text-xs uppercase font-bold tracking-wider">
            Official Operational Mode
          </span>
          <span className="text-xs text-on-surface-variant">
            | CONNECTED TO INCOIS-IMD DISASTER CELL · ZONE 04
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-mono text-xs font-bold text-emerald-800">
            SECURE LIVE STREAM (4G/SAT-COM)
          </span>
        </div>
      </div>

      {/* Tier-1 Critical Warning Banner */}
      <div className="relative overflow-hidden rounded-xl bg-error-container p-pad-md border border-error/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-pad-md">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-error text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[28px]">crisis_alert</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-error text-white text-[10px] font-bold uppercase tracking-wider">
                TIER-1 HAZARD
              </span>
              <span className="font-mono text-xs text-on-error-container font-semibold">
                BULLETIN #KSM-04 · VALID TO 18:00 IST
              </span>
            </div>
            <h1 className="font-headline-lg text-lg font-bold text-on-error-container mt-0.5">
              INCOIS HIGH WAVE & SQUALL ADVISORY #KSM-04
            </h1>
            <p className="text-xs text-on-error-container/90 mt-0.5">
              Squall gusts 24-28 kt and breaking shoaling waves along North Tamil Nadu coast. Complete suspension of artisanal venturing.
            </p>
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              setBroadcastSent(true);
              setTimeout(() => setBroadcastSent(false), 3000);
            }}
            className="px-4 py-2.5 rounded-lg bg-error text-white font-bold text-xs shadow-sm hover:bg-error/90 flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">cell_tower</span>
            <span>{broadcastSent ? 'BROADCAST ISSUED!' : 'ISSUE SIREN / SMS BROADCAST'}</span>
          </button>
        </div>
      </div>

      {/* Situational Awareness KPI Metrics Row (5 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-pad-sm">
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">At-Risk Population</span>
          <div className="font-telemetry-lg text-xl font-bold text-on-surface mt-1">142,500</div>
          <span className="text-[10px] text-amber-700 font-medium">8 Coastal Villages</span>
        </div>
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Active Craft at Sea</span>
          <div className="font-telemetry-lg text-xl font-bold text-amber-700 mt-1">28 Craft</div>
          <span className="text-[10px] text-on-surface-variant font-medium">Returning to Port</span>
        </div>
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Sheltered in Basin</span>
          <div className="font-telemetry-lg text-xl font-bold text-emerald-700 mt-1">418 Secured</div>
          <span className="text-[10px] text-on-surface-variant font-medium">Kasimedu Inner Basin</span>
        </div>
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Cyclone Shelters</span>
          <div className="font-telemetry-lg text-xl font-bold text-on-surface mt-1">6 Ready</div>
          <span className="text-[10px] text-secondary font-medium">Capacity: 12,000</span>
        </div>
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs col-span-2 md:col-span-1">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Response Teams</span>
          <div className="font-telemetry-lg text-xl font-bold text-secondary mt-1">4 Deployed</div>
          <span className="text-[10px] text-on-surface-variant font-medium">SDRF & Coast Guard</span>
        </div>
      </div>

      {/* Two-Column Operational Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-pad-md">
        {/* Left Column: GIS Risk Map & Surge Timeline (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-pad-md">
          <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">map</span>
                <h2 className="font-headline-sm text-sm font-bold text-on-surface">
                  Tactical Geospatial Marine Risk Map
                </h2>
              </div>
              <span className="text-[11px] font-mono text-secondary font-bold">
                13.12°N, 80.30°E
              </span>
            </div>
            <TacticalGisMap height="320px" showLayers={true} />
          </div>

          <SwellWindCurve />
        </div>

        {/* Right Column: Incident & Dispatch Feed (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-pad-md">
          <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">feed</span>
                <span className="font-headline-sm text-sm font-bold text-on-surface">
                  Real-time Incident & Operational Log
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
              {incidents.map((inc, i) => (
                <div key={i} className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-on-surface-variant font-bold">{inc.time}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                      inc.type === 'WARNING' ? 'bg-error text-white' : 'bg-secondary text-white'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                  <span className="font-bold text-on-surface">{inc.title}</span>
                  <p className="text-[11px] text-on-surface-variant leading-tight">{inc.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-surface-container flex items-center justify-between text-xs">
              <button 
                onClick={() => alert('Exporting Official Gazetted Advisory Situation Brief...')}
                className="text-secondary font-bold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                <span>Download Situation Brief (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
