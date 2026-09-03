import React, { useState } from 'react';
import { useMarine } from '../context/MarineContext';
import TacticalGisMap from '../components/maps/TacticalGisMap';

export default function GisMapPage() {
  const { setCurrentRoute, setIsVoiceOpen } = useMarine();
  const [mapMode, setMapMode] = useState('fisher');
  const [searchQuery, setSearchQuery] = useState('Kasimedu Outer Bight (13.12°N, 80.30°E)');

  return (
    <div className="flex flex-col gap-pad-sm pb-28 pt-2">
      {/* Top Search & HUD Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-grow relative flex items-center bg-surface-container-lowest rounded-xl border border-surface-container-high px-3 py-2 shadow-sm">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant mr-2">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search port, buoy or coordinates..."
            className="w-full bg-transparent text-xs font-semibold text-on-surface focus:outline-none"
          />
          <button
            onClick={() => setIsVoiceOpen(true)}
            className="text-secondary p-1 hover:bg-surface-container rounded-full"
            title="Voice Search"
          >
            <span className="material-symbols-outlined text-[18px]">mic</span>
          </button>
        </div>

        <button
          onClick={() => alert('GPS Centered on Kasimedu Pier')}
          className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-surface-container-high flex items-center justify-center text-secondary shadow-sm hover:bg-surface-container"
          title="Center on My Vessel"
        >
          <span className="material-symbols-outlined text-[20px]">my_location</span>
        </button>
      </div>

      {/* Mode Switcher Pill */}
      <div className="grid grid-cols-3 gap-1 p-0.5 bg-surface-container-low rounded-xl border border-surface-container">
        <button
          onClick={() => setMapMode('fisher')}
          className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
            mapMode === 'fisher' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'
          }`}
        >
          Fisherman View
        </button>
        <button
          onClick={() => setMapMode('port')}
          className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
            mapMode === 'port' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'
          }`}
        >
          Harbour Channel
        </button>
        <button
          onClick={() => setMapMode('disaster')}
          className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
            mapMode === 'disaster' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'
          }`}
        >
          Disaster Hazard
        </button>
      </div>

      {/* Active Area Caution Banner */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 text-amber-950 border border-amber-200 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>
          <span className="font-semibold">Sector SEC-04 Active Squall Crosshatch</span>
        </div>
        <span className="font-mono text-[10px] font-bold text-amber-800">1.8m SWH</span>
      </div>

      {/* Full-Screen Vector Tactical Map */}
      <TacticalGisMap height="360px" showLayers={true} />

      {/* Bottom Feature Inspector Drawer */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-md flex flex-col gap-pad-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-headline-sm text-sm font-bold text-on-surface">
                PFZ #01 (SE Kasimedu)
              </span>
            </div>
            <span className="font-mono text-xs text-secondary font-semibold">
              Coordinates: 13.04°N, 80.48°E · 18.4 NM
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold">
            High Density Front
          </span>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Chlorophyll front confluence calculated from Oceansat-3 OCM-3 sensor pass. Wave height in zone is 1.1m (calm), but outer harbour sandbar crossing requires heightened caution.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setCurrentRoute('pfz')}
            className="py-2.5 px-3 rounded-lg border border-secondary text-secondary font-bold text-xs hover:bg-secondary/5 transition-colors flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>Catch Intel</span>
          </button>
          <button
            onClick={() => setCurrentRoute('safety')}
            className="py-2.5 px-3 rounded-lg bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary/90 flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>Safety Check</span>
          </button>
        </div>
      </div>
    </div>
  );
}
