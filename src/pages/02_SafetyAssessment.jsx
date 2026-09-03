import React, { useState } from 'react';
import { useMarine } from '../context/MarineContext';
import SafetyVerdictCard from '../components/common/SafetyVerdictCard';
import SwellWindCurve from '../components/charts/SwellWindCurve';
import EvidenceChip from '../components/common/EvidenceChip';

export default function SafetyAssessmentPage() {
  const { safetyState, setSafetyState, setCurrentRoute, telemetry, vesselSpecs } = useMarine();
  const [showReasoning, setShowReasoning] = useState(true);

  const simulationStates = [
    { id: 'caution', label: 'CAUTION', color: 'bg-amber-500' },
    { id: 'safe', label: 'SAFE', color: 'bg-emerald-600' },
    { id: 'danger', label: 'VENTURE NO', color: 'bg-error' },
    { id: 'stale', label: 'STALE DEMO', color: 'bg-outline' },
  ];

  return (
    <div className="flex flex-col gap-pad-md pb-28 pt-2">
      {/* Sub-header Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentRoute('home')}
          className="flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Home</span>
        </button>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-[10px]">
          <span className="material-symbols-outlined text-[13px]">tune</span>
          <span>Target Craft: {vesselSpecs.loa}m Motorized FRP</span>
        </div>
      </div>

      {/* Operational Simulation State Selector */}
      <div className="flex flex-col gap-1.5 bg-surface-container-low p-pad-sm rounded-xl border border-surface-container">
        <div className="flex items-center justify-between px-1">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-secondary">science</span>
            Deterministic Safety Simulation
          </span>
          <span className="text-[10px] text-on-surface-variant font-medium">
            Tap to Evaluate State
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 p-0.5 bg-surface-container rounded-lg">
          {simulationStates.map((s) => (
            <button
              key={s.id}
              onClick={() => setSafetyState(s.id)}
              className={`py-2 px-1 text-center rounded font-label-sm text-[11px] font-bold transition-all ${
                safetyState === s.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Dominant Safety Verdict Card */}
      <SafetyVerdictCard />

      {/* SECTION 2: Top Two Contributing Factors */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
        <span className="font-headline-sm text-sm font-bold text-on-surface">
          Primary Physical Risk Factors vs. Craft Thresholds
        </span>

        {/* Factor 1: Wave Height */}
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-container-low border border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">waves</span>
              <span className="text-xs font-bold text-on-surface">Significant Wave Height (SWH)</span>
            </div>
            <span className="font-telemetry-sm text-xs font-bold text-amber-700">
              {telemetry.wave}m (Limit: {vesselSpecs.maxWave}m)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                safetyState === 'safe'
                  ? 'w-[45%] bg-emerald-500'
                  : safetyState === 'danger'
                  ? 'w-[90%] bg-error'
                  : safetyState === 'stale'
                  ? 'w-0'
                  : 'w-[75%] bg-amber-500'
              }`}
            />
          </div>
          <span className="text-[10px] text-on-surface-variant">
            Exceedance: Breaker wave crests at harbour sandbar reach 1.8m between 06:00 and 09:00 IST.
          </span>
        </div>

        {/* Factor 2: Wind Gusts */}
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-container-low border border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">air</span>
              <span className="text-xs font-bold text-on-surface">Squall Gust Envelope</span>
            </div>
            <span className="font-telemetry-sm text-xs font-bold text-amber-700">
              {telemetry.wind} kt (Limit: {vesselSpecs.maxWind} kt)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                safetyState === 'safe'
                  ? 'w-[35%] bg-emerald-500'
                  : safetyState === 'danger'
                  ? 'w-[95%] bg-error'
                  : safetyState === 'stale'
                  ? 'w-0'
                  : 'w-[80%] bg-amber-500'
              }`}
            />
          </div>
          <span className="text-[10px] text-on-surface-variant">
            Crosswind vector from North-East generates 0.8m choppy chop outside Kasimedu breakwater.
          </span>
        </div>
      </div>

      {/* SECTION 3: 24-Hour Swell & Wind Curve */}
      <SwellWindCurve />

      {/* SECTION 4: Scientific Confidence & Latency Breakdown */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
        <span className="font-headline-sm text-sm font-bold text-on-surface">
          Institutional Sensor Consensus & Ingest Latency
        </span>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container">
            <div className="font-mono text-xs font-bold text-secondary">94%</div>
            <div className="text-[10px] font-bold text-on-surface">INCOIS OSF</div>
            <div className="text-[9px] text-on-surface-variant">Latency 14m</div>
          </div>
          <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container">
            <div className="font-mono text-xs font-bold text-secondary">92%</div>
            <div className="text-[10px] font-bold text-on-surface">MOSDAC SATELLITE</div>
            <div className="text-[9px] text-on-surface-variant">Latency 28m</div>
          </div>
          <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container">
            <div className="font-mono text-xs font-bold text-secondary">88%</div>
            <div className="text-[10px] font-bold text-on-surface">IMD DOPPLER</div>
            <div className="text-[9px] text-on-surface-variant">Latency 8m</div>
          </div>
        </div>
      </div>

      {/* SECTION 5: How ORCA Reached this Result (Reasoning Accordion) */}
      <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className="w-full p-pad-md flex items-center justify-between text-left hover:bg-surface-container-low/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">psychology</span>
            <span className="font-headline-sm text-sm font-bold text-on-surface">
              How ORCA Reached this Result
            </span>
          </div>
          <span className={`material-symbols-outlined text-[20px] text-on-surface-variant transition-transform ${showReasoning ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {showReasoning && (
          <div className="p-pad-md pt-0 text-xs text-on-surface-variant flex flex-col gap-2 border-t border-surface-container bg-surface-container-low/30">
            <div className="flex items-start gap-2 pt-2">
              <span className="w-5 h-5 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</span>
              <p>
                <strong>Hydrodynamic Modeling:</strong> INCOIS WAVEWATCH-III predicts wave heights climbing from 1.4m to 1.8m by 07:00 IST in Sector SEC-04.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</span>
              <p>
                <strong>Vessel Hull Constraint:</strong> Your registered craft length (8.2m) has a certified hydrodynamic safety threshold of 1.5m SWH for non-decked FRP craft.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">3</span>
              <p>
                <strong>Deterministic Override:</strong> Because 1.8m exceeds 1.5m by 20%, rule engine clamps the verdict to <strong>CAUTION</strong> regardless of calm afternoon outlook.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setCurrentRoute('assistant')}
          className="py-3 px-3 rounded-lg border border-secondary text-secondary font-bold text-xs flex items-center justify-center gap-1 hover:bg-secondary/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          <span>Find Safe Window</span>
        </button>
        <button
          onClick={() => alert('Crew broadcast queued via Port VHF Ch-16 and NavIC transponder.')}
          className="py-3 px-3 rounded-lg bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary/90 flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">share</span>
          <span>Notify Crew</span>
        </button>
      </div>
    </div>
  );
}
