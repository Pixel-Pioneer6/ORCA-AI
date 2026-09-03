import React from 'react';
import { useMarine } from '../../context/MarineContext';
import { useLanguage } from '../../context/LanguageContext';
import DisclaimerStrip from './DisclaimerStrip';
import { getStaleness } from '../../lib/staleness';

export default function SafetyVerdictCard({ onDetailClick }) {
  const { safety, telemetry, vesselSpecs, now } = useMarine();
  const { t } = useLanguage();
  const safetyState = { SAFE: 'safe', CAUTION: 'caution', DO_NOT_VENTURE: 'danger', INSUFFICIENT_DATA: 'stale' }[safety.verdict] || 'caution';
  const staleness = getStaleness(telemetry.retrievedAt, 'safetyVerdict', now);

  const stateConfigs = {
    safe: {
      containerBg: 'bg-emerald-50 text-emerald-950 border-emerald-300',
      badgeBg: 'bg-emerald-600 text-white',
      pillBg: 'bg-emerald-200/90 text-emerald-950',
      telemetryCardBg: 'bg-emerald-100/80',
      telemetryText: 'text-emerald-950',
      telemetryValText: 'text-emerald-800',
      icon: 'check_circle',
      title: 'SAFE',
      tamilTitle: 'பாதுகாப்பானது',
      hindiTitle: 'सुरक्षित',
      subStatus: 'Normal Feasible Conditions for 8m Motorized FRP Boats',
    },
    danger: {
      containerBg: 'bg-red-50 text-red-950 border-red-300',
      badgeBg: 'bg-error text-white',
      pillBg: 'bg-red-200/90 text-red-950',
      telemetryCardBg: 'bg-red-100/80',
      telemetryText: 'text-red-950',
      telemetryValText: 'text-error',
      icon: 'dangerous',
      title: 'DO NOT VENTURE',
      tamilTitle: 'கடலுக்கு செல்ல வேண்டாம்',
      hindiTitle: 'समुद्र में न जाएं',
      subStatus: 'Severe Maritime Hazard: Hull Capsizing Risk',
    },
    stale: {
      containerBg: 'bg-surface-container text-on-surface border-outline-variant',
      badgeBg: 'bg-outline text-white',
      pillBg: 'bg-surface-container-high text-on-surface-variant',
      telemetryCardBg: 'bg-surface-container-low',
      telemetryText: 'text-on-surface-variant',
      telemetryValText: 'text-outline',
      icon: 'sync_problem',
      title: 'STALE TELEMETRY',
      tamilTitle: 'தரவு காலாவதியானது',
      hindiTitle: 'डेटा पुराना है',
      subStatus: 'INCOIS Ground Buoy Sync Delayed (>6 Hours)',
    },
    caution: {
      containerBg: 'bg-amber-50 text-amber-950 border-amber-300',
      badgeBg: 'bg-amber-500 text-white',
      pillBg: 'bg-amber-200/90 text-amber-950',
      telemetryCardBg: 'bg-amber-100/80',
      telemetryText: 'text-amber-950',
      telemetryValText: 'text-amber-800',
      icon: 'warning',
      title: 'CAUTION',
      tamilTitle: 'எச்சரிக்கை',
      hindiTitle: 'चेतावनी',
      subStatus: 'Moderate Risk: Conditions Require Heightened Alert',
    },
  };

  const cfg = stateConfigs[safetyState] || stateConfigs.caution;

  return (
    <section className={`relative overflow-hidden rounded-xl p-pad-md ${cfg.containerBg} border shadow-md transition-all`}>
      {/* Ambient subtle ocean wave watermark */}
      <div className="absolute -right-8 -top-8 w-44 h-44 opacity-10 pointer-events-none text-current">
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 100 100">
          <path d="M10 50 Q 25 30, 40 50 T 70 50 T 100 50 V 100 H 10 Z" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col gap-pad-sm">
        {/* Core Query Hook & Temporal Badge */}
        <div className="flex items-center justify-between pb-pad-xs border-b border-black/5">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-secondary">help_outline</span>
            <span className="font-label-md text-label-md font-semibold text-on-surface-variant">
              Departure Feasibility
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 shadow-xs text-on-surface">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
            <span className="font-label-sm text-label-sm">Updated 2h ago</span>
          </div>
        </div>

        {/* Verdict Top Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.badgeBg} shadow-sm flex-shrink-0`}>
              <span className="material-symbols-outlined text-[30px]">{cfg.icon}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display-lg-mobile text-display-lg-mobile font-bold tracking-tight leading-none">
                  {cfg.title}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-label-md text-label-md font-bold ${cfg.pillBg}`}>
                  {cfg.tamilTitle}
                </span>
              </div>
              <span className="font-label-md text-label-md font-medium opacity-80 mt-1">
                {t('confidence')}: {telemetry.confidence} · {cfg.subStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Temporal Window Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 shadow-xs self-start">
          <span className="material-symbols-outlined text-[16px] text-secondary">timer</span>
          <span className="font-label-md text-label-md font-bold text-on-surface">
            Target Window: Tomorrow 05:00 – 10:00 IST (5 Hours)
          </span>
        </div>

        {/* Plain-Language Advisory */}
        <div className="p-3 rounded-lg bg-white/90 text-on-surface shadow-xs border border-black/5">
          <p className="font-body-md text-body-md leading-relaxed">
            {telemetry.advisory}
          </p>
        </div>

        {/* 2-Col Immediate Telemetry Summary */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cfg.telemetryCardBg}`}>
            <span className="material-symbols-outlined text-[20px] text-secondary">waves</span>
            <div className="flex flex-col">
              <span className={`font-label-sm text-label-sm uppercase tracking-wider font-semibold ${cfg.telemetryText}`}>
                {t('maxWave')}
              </span>
              <span className={`font-telemetry-sm text-telemetry-sm font-bold ${cfg.telemetryValText}`}>
                {telemetry.wave}{telemetry.waveUnit} · {telemetry.waveDesc}
              </span>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cfg.telemetryCardBg}`}>
            <span className="material-symbols-outlined text-[20px] text-secondary">air</span>
            <div className="flex flex-col">
              <span className={`font-label-sm text-label-sm uppercase tracking-wider font-semibold ${cfg.telemetryText}`}>
                {t('windGusts')}
              </span>
              <span className={`font-telemetry-sm text-telemetry-sm font-bold ${cfg.telemetryValText}`}>
                {telemetry.wind} {telemetry.windUnit} · {telemetry.windDesc}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
