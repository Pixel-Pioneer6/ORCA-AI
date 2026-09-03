import React, { useState } from 'react';
import TacticalGisMap from '../components/maps/TacticalGisMap';
import EvidenceChip from '../components/common/EvidenceChip';

export default function AuthorityDashboard() {
  const [directiveAction, setDirectiveAction] = useState('');

  const handleDirective = (actionName) => {
    setDirectiveAction(`Executive Directive Executed: ${actionName}`);
    setTimeout(() => setDirectiveAction(''), 3500);
  };

  return (
    <div className="flex flex-col gap-pad-lg pb-16">
      {/* 1. REGIONAL HIGH-DOMINANCE THREAT BANNER */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-container via-[#0e3560] to-secondary p-pad-md text-white shadow-lg border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-pad-md">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="material-symbols-outlined text-[32px]">shield</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-label-sm text-[10px] font-bold uppercase tracking-wider border border-amber-400/30">
                STATE MARITIME ALERT
              </span>
              <span className="font-mono text-xs text-white/80">
                JURISDICTION: COROMANDEL ZONE 04
              </span>
            </div>
            <h1 className="font-headline-lg text-xl font-bold mt-0.5 tracking-tight text-white">
              ELEVATED MARITIME THREAT LEVEL · ZONE 04
            </h1>
            <p className="text-xs text-white/80 mt-0.5 max-w-2xl">
              Gale wind gusts (24-28 kt) and nearshore shoaling breakers affecting 3 northern maritime districts. Inter-agency emergency standing orders active.
            </p>
          </div>
        </div>

        {/* Executive Action Deck */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleDirective('State-wide Outer Bar Crossing Suspension')}
            className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            <span>Issue Executive Directive</span>
          </button>
        </div>
      </section>

      {directiveAction && (
        <div className="p-3 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{directiveAction}</span>
        </div>
      )}

      {/* 2. 6 MACRO STRATEGIC AUTHORITY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-pad-sm">
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Active Craft at Sea</span>
          <div className="font-telemetry-lg text-xl font-bold text-on-surface mt-1">842 Vessels</div>
          <span className="text-[10px] text-secondary font-medium">NavIC / AIS Monitored</span>
        </div>

        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">At-Risk Coastal Districts</span>
          <div className="font-telemetry-lg text-xl font-bold text-amber-700 mt-1">03 Amber</div>
          <span className="text-[10px] text-on-surface-variant">Chennai, Tiruvallur, Kanchi</span>
        </div>

        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Harbour Operations</span>
          <div className="font-telemetry-lg text-xl font-bold text-on-surface mt-1">12 / 17 Open</div>
          <span className="text-[10px] text-amber-700 font-medium">4 Restricted · 1 Closed</span>
        </div>

        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">SAR Readiness</span>
          <div className="font-telemetry-lg text-xl font-bold text-emerald-700 mt-1">Tier-1 Ready</div>
          <span className="text-[10px] text-emerald-700 font-medium">2 Coast Guard Cutters</span>
        </div>

        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Broadcast Reach</span>
          <div className="font-telemetry-lg text-xl font-bold text-secondary mt-1">94.8%</div>
          <span className="text-[10px] text-on-surface-variant">VHF & SMS Delivered</span>
        </div>

        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Model Consensus</span>
          <div className="font-telemetry-lg text-xl font-bold text-secondary mt-1">98%</div>
          <span className="text-[10px] text-emerald-700 font-medium">INCOIS · IMD · MOSDAC</span>
        </div>
      </div>

      {/* 3. TWO-COLUMN STRATEGIC COMMAND LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-pad-md">
        {/* Left: Regional Geospatial Marine Risk Map (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">public</span>
              <h2 className="font-headline-sm text-sm font-bold text-on-surface">
                Regional Geospatial Marine Risk Map
              </h2>
            </div>
            <span className="text-[11px] font-mono text-secondary font-bold">
              Coromandel Coastal Belt
            </span>
          </div>

          <TacticalGisMap height="360px" showLayers={true} />

          <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-surface-container">
            <span>Maritime Boundary Line (EEZ 200 NM) Active</span>
            <span className="font-mono font-bold text-secondary">842 Craft AIS Vectors Active</span>
          </div>
        </div>

        {/* Right: Multi-Agency Directive Console & Gazette Notices (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-pad-md">
          {/* Executive Directives Deck */}
          <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <span className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                <span>Inter-Agency Directives</span>
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant">ORDER #TN-SDMA-08</span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDirective('Artisanal Venturing Prohibition (<12m)')}
                className="w-full p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-left transition-colors flex items-start gap-2.5"
              >
                <span className="material-symbols-outlined text-amber-700 text-[20px] mt-0.5">front_hand</span>
                <div>
                  <strong className="text-xs text-amber-950 block">Artisanal Venturing Prohibition (&lt;12m)</strong>
                  <span className="text-[11px] text-amber-900 leading-tight block">
                    Gazette order enjoining all artisanal fishers to remain in harbor until 18:00 IST.
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleDirective('Coast Guard Aerial Surveillance Sortie (Dornier-228)')}
                className="w-full p-3 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-left transition-colors flex items-start gap-2.5"
              >
                <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">flight_takeoff</span>
                <div>
                  <strong className="text-xs text-sky-950 block">Authorize Aerial Reconnaissance Sortie</strong>
                  <span className="text-[11px] text-sky-900 leading-tight block">
                    Dispatch CG Dornier aircraft from Chennai Meenambakkam base to sweep 25 NM perimeter.
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleDirective('Activate Coastal Cyclone Shelters (North Belt)')}
                className="w-full p-3 rounded-lg border border-surface-container bg-surface-container-low hover:bg-surface-container text-left transition-colors flex items-start gap-2.5"
              >
                <span className="material-symbols-outlined text-on-surface text-[20px] mt-0.5">night_shelter</span>
                <div>
                  <strong className="text-xs text-on-surface block">Pre-position SDRF Teams & Food Packets</strong>
                  <span className="text-[11px] text-on-surface-variant leading-tight block">
                    Place 6 cyclone shelters on standby across Kasimedu, Tiruvottiyur and Ennore.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Audit Provenance */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <EvidenceChip source="INCOIS OSF" metric="CHIEF SCIENTIST" type="default" />
            <EvidenceChip source="INDIAN COAST GUARD" metric="SAR OPS" type="live" />
            <EvidenceChip source="TN-SDMA" metric="STATE DISASTER CELL" type="default" />
          </div>
        </div>
      </div>
    </div>
  );
}
