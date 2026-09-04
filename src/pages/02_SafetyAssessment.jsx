import React, { useState } from 'react';
import { useMarine } from '../context/MarineContext';
import { useLanguage } from '../context/LanguageContext';
import SafetyVerdictCard from '../components/common/SafetyVerdictCard';
import SwellWindCurve from '../components/charts/SwellWindCurve';
import EvidenceChip from '../components/common/EvidenceChip';
import DisclaimerStrip from '../components/common/DisclaimerStrip';
import TaskGraphModal from '../components/common/TaskGraphModal';

export default function SafetyAssessmentPage() {
  const { sensorScenario, setSensorScenario, setCurrentRoute, telemetry, vesselSpecs, safety } = useMarine();
  const { t } = useLanguage();
  const [showReasoning, setShowReasoning] = useState(true);
  const [isDagOpen, setIsDagOpen] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState('');

  // Real notify-crew action — previously a canned alert() with a fixed
  // string unrelated to actual conditions. Uses the real Web Share API
  // (shares to the phone's actual SMS/WhatsApp/etc. share sheet) with the
  // real current advisory text; falls back to copying it to the clipboard
  // (also real) where Web Share isn't available (most desktop browsers).
  const notifyCrew = async () => {
    const shareText = `ORCA Safety Advisory — ${safety.verdict}: ${telemetry.advisory}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ORCA Safety Advisory', text: shareText });
        return;
      } catch {
        // user cancelled the native share sheet — not an error
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setNotifyStatus('Advisory copied to clipboard — paste it into SMS/WhatsApp to your crew.');
    } catch {
      setNotifyStatus('Could not share or copy — your browser blocked both.');
    }
    setTimeout(() => setNotifyStatus(''), 4000);
  };

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
          <span>{t('safety.backToHome')}</span>
        </button>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-[10px]">
          <span className="material-symbols-outlined text-[13px]">tune</span>
          <span>{t('safety.targetCraft')}: {vesselSpecs.loa}m ({safety.thresholds.label})</span>
        </div>
      </div>

      {/* Operational Simulation State Selector */}
      <div className="flex flex-col gap-1.5 bg-surface-container-low p-pad-sm rounded-xl border border-surface-container">
        <div className="flex items-center justify-between px-1">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-secondary">science</span>
            {t('safety.simHeading')}
          </span>
          <span className="text-[10px] text-on-surface-variant font-medium">
            {t('safety.simSub')}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 p-0.5 bg-surface-container rounded-lg">
          {simulationStates.map((s) => (
            <button
              key={s.id}
              onClick={() => setSensorScenario(s.id)}
              className={`py-2 px-1 text-center rounded font-label-sm text-[11px] font-bold transition-all ${
                sensorScenario === s.id
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
          {t('safety.riskFactorsHeading')}
        </span>

        {/* Factor 1: Wave Height */}
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-container-low border border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">waves</span>
              <span className="text-xs font-bold text-on-surface">{t('safety.waveFactor')}</span>
            </div>
            <span className="font-telemetry-sm text-xs font-bold text-amber-700">
              {telemetry.wave}m (Do-Not-Venture Limit: {safety.thresholds.doNotVenture.wave}m)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                safety.verdict === 'SAFE' ? 'bg-emerald-500' : safety.verdict === 'DO_NOT_VENTURE' ? 'bg-error' : safety.verdict === 'INSUFFICIENT_DATA' ? 'bg-outline' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(safety.exceedance.wave, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-on-surface-variant">
            {safety.exceedance.wave}% of the {safety.thresholds.label} do-not-venture wave threshold.
          </span>
        </div>

        {/* Factor 2: Wind Gusts */}
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-container-low border border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">air</span>
              <span className="text-xs font-bold text-on-surface">{t('safety.windFactor')}</span>
            </div>
            <span className="font-telemetry-sm text-xs font-bold text-amber-700">
              {telemetry.wind} kt (Do-Not-Venture Limit: {safety.thresholds.doNotVenture.wind} kt)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                safety.verdict === 'SAFE' ? 'bg-emerald-500' : safety.verdict === 'DO_NOT_VENTURE' ? 'bg-error' : safety.verdict === 'INSUFFICIENT_DATA' ? 'bg-outline' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(safety.exceedance.wind, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-on-surface-variant">
            {safety.exceedance.wind}% of the {safety.thresholds.label} do-not-venture wind threshold.
          </span>
        </div>
      </div>

      {/* SECTION 3: 24-Hour Swell & Wind Curve */}
      <SwellWindCurve />

      {/* SECTION 4: Scientific Confidence & Latency Breakdown */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
        <span className="font-headline-sm text-sm font-bold text-on-surface">
          {t('safety.consensusHeading')}
        </span>
        <span className="text-[10px] text-on-surface-variant -mt-1">{t('safety.tapToInspect')}</span>
        <div className="flex flex-wrap gap-2">
          <EvidenceChip source="INCOIS OSF" metric="94%" ledgerId="incois-osf-wave" />
          <EvidenceChip source="MOSDAC SATELLITE" metric="92%" type="live" ledgerId="mosdac-scatterometer-wind" />
          <EvidenceChip source="IMD DOPPLER" metric="88%" ledgerId="imd-doppler" />
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
              {t('safety.reasoningHeading')}
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
                <strong>Sensor Inputs:</strong> Wave {telemetry.wave}{telemetry.waveUnit} (INCOIS OSF) and wind {telemetry.wind}{telemetry.windUnit} (MOSDAC scatterometer) at {vesselSpecs.name}'s registered position.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</span>
              <p>
                <strong>Vessel Hull Constraint:</strong> Registered craft length ({vesselSpecs.loa}m) is classified <strong>{safety.thresholds.label}</strong> — caution threshold {safety.thresholds.caution.wave}m / {safety.thresholds.caution.wind}kt, do-not-venture threshold {safety.thresholds.doNotVenture.wave}m / {safety.thresholds.doNotVenture.wind}kt.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">3</span>
              <div>
                <strong>Deterministic Verdict:</strong> Rule engine outputs <strong>{safety.verdict.replace(/_/g, ' ')}</strong>.
                {safety.drivers.length > 0 && (
                  <ul className="list-disc list-inside mt-1">
                    {safety.drivers.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsDagOpen(true)}
              className="mt-2 w-full py-2 px-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-secondary/20"
            >
              <span className="material-symbols-outlined text-[16px]">account_tree</span>
              <span>Inspect Supervisor Task Graph (DAG Trace — PRD §6.3)</span>
            </button>
          </div>
        )}
      </div>

      <TaskGraphModal isOpen={isDagOpen} onClose={() => setIsDagOpen(false)} query="Is it safe to go out tomorrow morning?" />

      <DisclaimerStrip />

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setCurrentRoute('assistant')}
          className="py-3 px-3 rounded-lg border border-secondary text-secondary font-bold text-xs flex items-center justify-center gap-1 hover:bg-secondary/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          <span>{t('safety.findWindow')}</span>
        </button>
        <button
          onClick={notifyCrew}
          className="py-3 px-3 rounded-lg bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary/90 flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">share</span>
          <span>{t('safety.notifyCrew')}</span>
        </button>
      </div>
      {notifyStatus && (
        <p className="text-[10px] text-on-surface-variant text-center -mt-1">{notifyStatus}</p>
      )}
    </div>
  );
}
