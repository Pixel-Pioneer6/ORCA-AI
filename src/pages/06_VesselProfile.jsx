import React, { useState } from 'react';
import { useMarine } from '../context/MarineContext';

export default function VesselProfilePage() {
  const { vesselSpecs, setVesselSpecs, setCurrentRoute } = useMarine();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...vesselSpecs });
  const [showSpecsExplainer, setShowSpecsExplainer] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    // Dynamically recalculate physical limits based on LOA and HP
    const parsedLoa = parseFloat(formData.loa) || 8.2;
    const parsedHp = parseFloat(formData.hp) || 9.9;
    const computedMaxWave = parseFloat((parsedLoa * 0.18).toFixed(1)); // ~1.5m for 8.2m
    const computedMaxWind = Math.round(14 + parsedHp * 0.4); // ~18 kt for 9.9hp

    setVesselSpecs({
      ...formData,
      loa: parsedLoa,
      hp: parsedHp,
      maxWave: computedMaxWave,
      maxWind: computedMaxWind,
    });
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-pad-md pb-28 pt-2">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentRoute('home')}
          className="flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Home</span>
        </button>
        <span className="text-xs font-mono font-bold text-secondary">
          IND-TN-02-MM-4491
        </span>
      </div>

      {/* Skipper & Profile Summary Card */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary-container text-white flex items-center justify-center font-bold text-lg shadow-md">
              KA
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline-md text-base font-bold text-on-surface">
                  K. Arumugam
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-label-sm text-[10px] font-bold">
                  VERIFIED SKIPPER
                </span>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">
                Kasimedu Fishing Harbour · Chennai District
              </span>
              <span className="font-mono text-[11px] text-secondary font-semibold">
                DAT-SG Transponder: #TN-9810-NAV
              </span>
            </div>
          </div>
        </div>

        {/* Profile Completion Gauge */}
        <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-on-surface">Hydrodynamic Calibration: 85%</span>
            <span className="font-mono text-secondary font-bold">OPTIMIZED</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
            <div className="w-[85%] h-full bg-secondary rounded-full"></div>
          </div>
          <span className="text-[10px] text-on-surface-variant">
            Calibrated against INCOIS SWAN wave drag profiles for non-decked FRP hulls.
          </span>
        </div>
      </div>

      {/* Vessel Specifications 2x2 Bento / Edit Form */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-secondary">sailing</span>
            <span className="font-headline-sm text-sm font-bold text-on-surface">
              Craft Specifications & Engine Rig
            </span>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">tune</span>
            <span>{isEditing ? 'Cancel' : 'Edit Specs'}</span>
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                  Length Overall (LOA in m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.loa}
                  onChange={(e) => setFormData({ ...formData, loa: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-surface-container-high bg-surface-container-low font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                  Beam Width (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.beam}
                  onChange={(e) => setFormData({ ...formData, beam: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-surface-container-high bg-surface-container-low font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                  Engine Power (HP)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.hp}
                  onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-surface-container-high bg-surface-container-low font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                  Draft Depth (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.draft}
                  onChange={(e) => setFormData({ ...formData, draft: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-surface-container-high bg-surface-container-low font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-4 rounded-lg bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary/90 mt-1"
            >
              Save & Recalculate Thresholds
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Length (LOA)</span>
              <div className="font-telemetry-sm text-sm font-bold text-on-surface">{vesselSpecs.loa} meters</div>
              <span className="text-[10px] text-on-surface-variant">Traditional 27ft FRP</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Outboard Motor</span>
              <div className="font-telemetry-sm text-sm font-bold text-on-surface">{vesselSpecs.hp} HP OBM</div>
              <span className="text-[10px] text-on-surface-variant">Twin Stroke Kerosene</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Beam & Draught</span>
              <div className="font-telemetry-sm text-sm font-bold text-on-surface">{vesselSpecs.beam}m / {vesselSpecs.draft}m</div>
              <span className="text-[10px] text-on-surface-variant">Shallow Sandbar Draft</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Calculated Limit</span>
              <div className="font-telemetry-sm text-sm font-bold text-secondary">{vesselSpecs.maxWave}m SWH</div>
              <span className="text-[10px] text-amber-700 font-semibold">{vesselSpecs.maxWind} kt Max Wind</span>
            </div>
          </div>
        )}
      </div>

      {/* Safety & Emergency Equipment Checklist */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-2">
        <span className="font-headline-sm text-sm font-bold text-on-surface">
          Safety Gear & Regulatory Compliance
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-950 border border-emerald-200 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
            <span>4 Lifejackets on board</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-950 border border-emerald-200 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
            <span>VHF Marine Ch-16 Radio</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-950 border border-emerald-200 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
            <span>NavIC Transponder Unit</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-950 border border-emerald-200 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
            <span>Distress Beacon (DAT-SG)</span>
          </div>
        </div>
      </div>

      {/* "Why Specs Matter" Explainer */}
      <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowSpecsExplainer(!showSpecsExplainer)}
          className="w-full p-pad-md flex items-center justify-between text-left hover:bg-surface-container-low/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">help_center</span>
            <span className="font-headline-sm text-sm font-bold text-on-surface">
              Why your craft specs matter for safety
            </span>
          </div>
          <span className={`material-symbols-outlined text-[20px] text-on-surface-variant transition-transform ${showSpecsExplainer ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {showSpecsExplainer && (
          <div className="p-pad-md pt-0 text-xs text-on-surface-variant flex flex-col gap-2 border-t border-surface-container bg-surface-container-low/30">
            <p className="pt-2">
              Unlike generic weather forecasts, ORCA uses your boat's physical dimensions (length, beam, engine horsepower) to determine whether a wave pattern will cause deck swamping or capsizing.
            </p>
            <p>
              A 1.8m swell may be safe for a 15m trawler, but is hazardous for an 8m motorized FRP boat when crossing shallow harbour bars.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
