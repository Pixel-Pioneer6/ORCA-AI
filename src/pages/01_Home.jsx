import React, { useEffect } from 'react';
import { useMarine } from '../context/MarineContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import WarningStrip from '../components/common/WarningStrip';
import SafetyVerdictCard from '../components/common/SafetyVerdictCard';
import TelemetryBento from '../components/common/TelemetryBento';
import EvidenceChip from '../components/common/EvidenceChip';
import TacticalGisMap from '../components/maps/TacticalGisMap';
import LiveDataFreshnessBadge from '../components/common/LiveDataFreshnessBadge';
import { getStaleness } from '../lib/staleness';

export default function HomePage() {
  const { setCurrentRoute, setIsVoiceOpen, telemetry, now } = useMarine();
  const { t } = useLanguage();
  const { isGuest, guestQueryCount, incrementGuestQuery, openAuth } = useAuth();
  const staleness = getStaleness(telemetry.retrievedAt, 'forecast', now);

  // FR-6.7 — the sign-in upsell is surfaced after a guest's second safety
  // query, contextually, never as a blocking interstitial.
  useEffect(() => {
    if (isGuest) incrementGuestQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-pad-md pb-28 pt-2">
      {/* 1. Active High Hazard & Weather Warning Strip */}
      <WarningStrip />

      {/* 2. Primary Safety Verdict Card ("Verdict Before Detail") */}
      <SafetyVerdictCard onDetailClick={() => setCurrentRoute('safety')} />
      <LiveDataFreshnessBadge className="px-1" />

      {isGuest && guestQueryCount >= 2 && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/10 border border-secondary/30">
          <span className="material-symbols-outlined text-secondary text-[22px]">notifications_active</span>
          <div className="flex-grow">
            <p className="text-xs font-bold text-on-surface">Get alerts for your zone</p>
            <p className="text-[11px] text-on-surface-variant">Sign in to receive push + SMS warnings for your registered fishing area.</p>
          </div>
          <button
            onClick={() => openAuth('fisherman')}
            className="px-3 py-1.5 rounded-lg bg-secondary text-white text-xs font-bold flex-shrink-0"
          >
            Sign In
          </button>
        </div>
      )}

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
              {t('home.liveMap')}
            </span>
          </div>
          <button
            onClick={() => setCurrentRoute('map')}
            className="text-xs font-bold text-secondary flex items-center gap-0.5 hover:underline"
          >
            <span>{t('home.expandMap')}</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Embedded Map Visual */}
        <TacticalGisMap height="180px" showLayers={false} />

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-on-surface-variant font-medium">{t('home.nearestRoute')}</span>
          <span className="font-mono font-bold text-secondary">18.4 NM · Bearing 135°</span>
        </div>
      </div>

      {/* 5. Compact Marine Conditions Telemetry Bento */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
            {t('home.telemetryHeading')}
          </span>
          <span className={`font-label-sm text-[10px] font-mono ${staleness.badgeState === 'amber' ? 'text-amber-700' : staleness.badgeState === 'expired' ? 'text-error' : 'text-secondary'}`}>
            SYNCED {staleness.ageLabel.toUpperCase()}
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
              {t('home.nearestPfz')}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-label-sm text-[10px] font-bold">
            {t('home.highProbability')}
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
              {t('home.transitCaution')}
            </span>
            <button
              onClick={() => setCurrentRoute('pfz')}
              className="text-secondary font-bold hover:underline flex items-center"
            >
              {t('home.voyagePlan')} <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* 7. Multi-Agency Scientific Evidence & Provenance Chips */}
      <div className="flex flex-col gap-1.5">
        <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold text-on-surface-variant px-1">
          {t('home.provenanceHeading')}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <EvidenceChip source="INCOIS OSF" metric="94%" type="default" ledgerId="incois-osf-wave" />
          <EvidenceChip source="MOSDAC SATELLITE" metric="LIVE" type="live" ledgerId="mosdac-scatterometer-wind" />
          <EvidenceChip source="IMD GALE ALERT" metric="ACTIVE" type="hazard" ledgerId="imd-gale-warning" />
          <EvidenceChip source="NavIC GNSS" metric="DGPS" type="default" icon="satellite" ledgerId="navic-gnss" />
        </div>
      </div>
    </div>
  );
}
