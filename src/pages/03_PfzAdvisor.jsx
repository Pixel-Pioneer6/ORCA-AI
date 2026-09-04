import React, { useState } from 'react';
import { useMarine } from '../context/MarineContext';
import { useLanguage } from '../context/LanguageContext';
import TacticalGisMap from '../components/maps/TacticalGisMap';
import EvidenceChip from '../components/common/EvidenceChip';
import DisclaimerStrip from '../components/common/DisclaimerStrip';

export default function PfzAdvisorPage() {
  const { setCurrentRoute, setIsVoiceOpen } = useMarine();
  const { t } = useLanguage();
  const [selectedPfz, setSelectedPfz] = useState('pfz-1');
  const [showScientificBasis, setShowScientificBasis] = useState(false);

  const pfzList = [
    {
      id: 'pfz-1',
      name: 'PFZ #01 (SE Kasimedu)',
      distance: '18.4 NM',
      bearing: '135° SE',
      chl: '0.88 mg/m³',
      sst: '28.2°C (Δ0.6°C)',
      species: 'Pelagic Tuna & Sardine',
      prob: '88%',
      fuelSave: '28%',
      transitRisk: 'Caution (1.8m nearshore swell)',
    },
    {
      id: 'pfz-2',
      name: 'PFZ #02 (East Ennore Shoal)',
      distance: '24.2 NM',
      bearing: '110° ESE',
      chl: '0.72 mg/m³',
      sst: '28.5°C (Δ0.4°C)',
      species: 'Mackerel & Anchovy',
      prob: '76%',
      fuelSave: '21%',
      transitRisk: 'Safe (Calmer 1.2m swell)',
    },
    {
      id: 'pfz-3',
      name: 'PFZ #03 (Covelong Deep Trench)',
      distance: '31.0 NM',
      bearing: '090° E',
      chl: '0.94 mg/m³',
      sst: '27.8°C (Δ0.8°C)',
      species: 'Skipjack Tuna & Trevally',
      prob: '92%',
      fuelSave: '34%',
      transitRisk: 'Caution (Strong northerly current)',
    },
  ];

  const current = pfzList.find((p) => p.id === selectedPfz) || pfzList[0];

  return (
    <div className="flex flex-col gap-pad-md pb-28 pt-2">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentRoute('home')}
          className="flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{t('pfz.backToHome')}</span>
        </button>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-label-sm text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>{t('pfz.liveIngest')}</span>
        </div>
      </div>

      {/* 1. PRIMARY HERO PFZ CARD */}
      <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-pad-md border border-emerald-300 shadow-md flex flex-col gap-pad-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[28px]">sailing</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-base font-bold text-on-surface">
                {current.name}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono font-bold text-secondary">
                  {current.distance} ({Math.round(parseFloat(current.distance) * 1.852 * 10) / 10} km) · Bearing {current.bearing}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-emerald-950 font-bold bg-emerald-100/80 px-2 py-0.5 rounded self-start">
                <span className="material-symbols-outlined text-[14px]">timer</span>
                <span>ETA: {Math.floor(parseFloat(current.distance) / 7)}h {Math.round(((parseFloat(current.distance) / 7) % 1) * 60)}m @ 7 kt</span>
                <span className="text-[10px] text-emerald-800 font-normal">· Valid: Today 23:59 IST</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-950 font-mono text-xs font-bold">
              Catch Prob: {current.prob}
            </span>
            <span className="text-[9px] font-mono text-on-surface-variant">INCOIS WFS / ERDDAP</span>
          </div>
        </div>

        {/* Primary Oceanographic Telemetry 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
            <span className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant">
              {t('pfz.chlFront')}
            </span>
            <div className="font-telemetry-sm text-sm font-bold text-emerald-800">
              {current.chl}
            </div>
            <span className="text-[10px] text-on-surface-variant">High Phytoplankton Bloom</span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
            <span className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant">
              {t('pfz.sstBoundary')}
            </span>
            <div className="font-telemetry-sm text-sm font-bold text-emerald-800">
              {current.sst}
            </div>
            <span className="text-[10px] text-on-surface-variant">Optimal Pelagic Convergence</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50 text-emerald-950 border border-emerald-200">
          <span>{t('pfz.speciesConcentration')}: <strong>{current.species}</strong></span>
          <span className="font-bold text-emerald-800">{t('pfz.fuelSavings')}: ~{current.fuelSave}</span>
        </div>
      </section>

      {/* 2. SEPARATED TRANSIT SAFETY VERDICT (CRITICAL MARINE REQUIREMENT) */}
      <section className="rounded-xl bg-amber-50 p-pad-md border border-amber-300 shadow-sm flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-950">
            <span className="material-symbols-outlined text-[20px] text-amber-600">crisis_alert</span>
            <span className="font-headline-sm text-sm font-bold">
              {t('pfz.transitHeading')}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-label-sm text-[10px] font-bold uppercase">
            {t('pfz.transitCautionBadge')}
          </span>
        </div>

        <p className="text-xs text-amber-950 leading-relaxed">
          While the PFZ polygon itself has calm open water, the <strong>Kasimedu harbour sandbar exit corridor</strong> experiences <strong>1.8m breaking swells</strong> and cross-current between 06:00 and 09:00 IST.
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-amber-200 text-xs">
          <span className="font-medium text-amber-900">{t('pfz.recommendedDeparture')}: <strong>After 10:00 IST</strong></span>
          <button
            onClick={() => setCurrentRoute('map')}
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs shadow-sm hover:bg-amber-700 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">route</span>
            <span>{t('pfz.plotSafeRoute')}</span>
          </button>
        </div>
        <DisclaimerStrip className="pt-1 border-t border-amber-200" />
      </section>

      {/* Mini Nautical Vector Preview */}
      <TacticalGisMap height="200px" showLayers={true} />

      {/* 3. Ranked Nearby PFZ Alternatives */}
      <div className="flex flex-col gap-2">
        <span className="font-headline-sm text-sm font-bold text-on-surface px-1">
          {t('pfz.alternativesHeading')}
        </span>
        {pfzList.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPfz(p.id)}
            className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
              selectedPfz === p.id
                ? 'bg-surface-container-lowest border-secondary shadow-md ring-1 ring-secondary'
                : 'bg-surface-container-lowest border-surface-container-high hover:border-surface-container-highest'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface">{p.name}</span>
              <span className="text-[11px] font-mono text-secondary font-medium">
                {p.distance} · {p.bearing} · {p.species}
              </span>
              <span className="text-[10px] text-on-surface-variant mt-0.5">
                Transit: {p.transitRisk}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-xs font-bold text-emerald-700">
                {p.prob} Match
              </span>
              <span className="text-[10px] text-on-surface-variant">
                Fuel -{p.fuelSave}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 4. Scientific Basis Explainer */}
      <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/80 overflow-hidden shadow-sm">
        <button
          onClick={() => setShowScientificBasis(!showScientificBasis)}
          className="w-full p-pad-md flex items-center justify-between text-left hover:bg-surface-container-low/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">science</span>
            <span className="font-headline-sm text-sm font-bold text-on-surface">
              {t('pfz.scientificBasisHeading')}
            </span>
          </div>
          <span className={`material-symbols-outlined text-[20px] text-on-surface-variant transition-transform ${showScientificBasis ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {showScientificBasis && (
          <div className="p-pad-md pt-0 text-xs text-on-surface-variant flex flex-col gap-2 border-t border-surface-container bg-surface-container-low/30">
            <p className="pt-2">
              Potential Fishing Zones are computed by INCOIS using simultaneous satellite observations of <strong>Sea Surface Temperature (SST)</strong> from INSAT-3D and <strong>Ocean Color (Chlorophyll-a)</strong> from Oceansat-3.
            </p>
            <p>
              Fish aggregate along the thermal gradients and chlorophyll fronts where nutrient-rich upwelling waters support high densities of phytoplankton and zooplankton.
            </p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <EvidenceChip source="INCOIS PFZ ADVISORY" metric="DAILY" type="default" ledgerId="incois-pfz-advisory" />
              <EvidenceChip source="Oceansat-3 OCM" metric="LIVE" type="live" ledgerId="oceansat3-ocm" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Voice Hook */}
      <button
        onClick={() => setIsVoiceOpen(true)}
        className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-surface-container-high"
      >
        <span className="material-symbols-outlined text-[18px]">record_voice_over</span>
        <span>&ldquo;{t('pfz.voiceHook')}&rdquo;</span>
      </button>
    </div>
  );
}
