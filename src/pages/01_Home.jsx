import React from 'react';
import { useMarine } from '../context/MarineContext';
import { useLanguage } from '../context/LanguageContext';
import WarningStrip from '../components/common/WarningStrip';
import SafetyVerdictCard from '../components/common/SafetyVerdictCard';
import TelemetryBento from '../components/common/TelemetryBento';
import EvidenceChip from '../components/common/EvidenceChip';
import TacticalGisMap from '../components/maps/TacticalGisMap';

export default function HomePage() {
  const { setCurrentRoute, setIsVoiceOpen } = useMarine();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-pad-md pb-28 pt-2">
      {/* 1. Active High Hazard & Weather Warning Strip */}
      <WarningStrip />

      {/* 2. Primary Safety Verdict Card ("Verdict Before Detail") */}
      <SafetyVerdictCard onDetailClick={() => setCurrentRoute('safety')} />

      {/* 3. Voice-First Conversational Launcher */}
      <div className="rounded-xl bg-gradient-to-r from-primary-container to-secondary p-pad-md text-white shadow-md flex items-center justify-between gap-pad-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-secondary-container">
            <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
            <span className="font-label-sm text-[11px] uppercase font-bold tracking-wider">
              Voice-First Assistant
            </span>
          </div>
          <p className="font-headline-sm text-sm font-bold mt-0.5 leading-snug">
            {t('voicePrompt')}
          </p>
          <span className="text-[11px] text-white/75 mt-0.5">
            "நாளை காலை 5 மணிக்கு கடலுக்கு செல்லலாமா?"
          </span>
        </div>

        <button
          onClick={() => setIsVoiceOpen(true)}
          className="w-12 h-12 rounded-full bg-white text-secondary flex items-center justify-center flex-shrink-0 shadow-lg active:scale-95 transition-transform"
          aria-label="Activate Voice Assistant"
        >
          <span className="material-symbols-outlined text-[26px]">mic</span>
        </button>
      </div>

      {/* 4. Live Marine Map Preview Card */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-secondary">explore</span>
            <span className="font-headline-sm text-sm font-bold text-on-surface">
              Live Tactical Marine Map
            </span>
          </div>
          <button
            onClick={() => setCurrentRoute('map')}
            className="text-xs font-bold text-secondary flex items-center gap-0.5 hover:underline"
          >
            <span>Expand Full Map</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Embedded Map Visual */}
        <TacticalGisMap height="180px" showLayers={false} />

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-on-surface-variant font-medium">Nearest Safe Route to PFZ #01</span>
          <span className="font-mono font-bold text-secondary">18.4 NM · Bearing 135°</span>
        </div>
      </div>

      {/* 5. Compact Marine Conditions Telemetry Bento */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
            Physical Sea Telemetry (INCOIS Buoy BD08)
          </span>
          <span className="font-label-sm text-[10px] text-secondary font-mono">
            SYNCED 8m AGO
          </span>
        </div>
        <TelemetryBento />
      </div>

      {/* 6. Nearest Potential Fishing Zone (PFZ) Card */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">sailing</span>
            <span className="font-headline-sm text-sm font-bold text-on-surface">
              Nearest PFZ Catch Front
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-label-sm text-[10px] font-bold">
            HIGH TUNA / SARDINE PROBABILITY
          </span>
        </div>

        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-emerald-950">PFZ #01 (SE Kasimedu)</span>
            <span className="font-mono font-bold text-xs text-emerald-800">18.4 NM · 135° SE</span>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            Strong chlorophyll-a front (<strong>0.88 mg/m³</strong>) with sharp SST thermal gradient (0.6°C boundary). Estimated fuel savings: <strong>28%</strong>.
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-[11px]">
            <span className="text-amber-800 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              Caution on nearshore bar transit
            </span>
            <button
              onClick={() => setCurrentRoute('pfz')}
              className="text-secondary font-bold hover:underline flex items-center"
            >
              Voyage Plan <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* 7. Multi-Agency Scientific Evidence & Provenance Chips */}
      <div className="flex flex-col gap-1.5">
        <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold text-on-surface-variant px-1">
          Government Agency Provenance & Confidence
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <EvidenceChip source="INCOIS OSF" metric="94%" type="default" />
          <EvidenceChip source="MOSDAC SATELLITE" metric="LIVE" type="live" />
          <EvidenceChip source="IMD GALE ALERT" metric="ACTIVE" type="hazard" />
          <EvidenceChip source="NavIC GNSS" metric="DGPS" type="default" icon="satellite" />
        </div>
      </div>
    </div>
  );
}
