import React, { useState } from 'react';
import { useMarine } from '../context/MarineContext';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsPage() {
  const { 
    currentRole, 
    setCurrentRole, 
    setCurrentRoute, 
    themeMode, 
    setThemeMode 
  } = useMarine();
  const { language, setLanguage } = useLanguage();

  const [smsAlerts, setSmsAlerts] = useState(true);
  const [highGlare, setHighGlare] = useState(false);
  const [offlineCache, setOfflineCache] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const triggerSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const roles = [
    { id: 'fisher', title: 'Fisherman / Vessel Operator', desc: 'Mobile-first, voice-enabled safety alerts and PFZ catch zones' },
    { id: 'ddmo', title: 'District Disaster Management (DDMO)', desc: 'Tactical coastal disaster response, flood zones and siren broadcast' },
    { id: 'port', title: 'Port & Harbour Operations', desc: 'Approach bar monitoring, AIS queue, pilotage and statutory VHF alerts' },
    { id: 'researcher', title: 'Marine Researcher / Oceanographer', desc: 'High-density climatology, SST anomaly curves, NetCDF/CSV datasets' },
    { id: 'authority', title: 'Senior Maritime Oversight Authority', desc: 'Coromandel regional risk triage, fleet tracking and executive directives' },
  ];

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
        <span className="font-headline-sm text-sm font-bold text-on-surface">
          System Settings
        </span>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Preferences updated successfully!</span>
        </div>
      )}

      {/* SECTION 1: LANGUAGE & LOCALISATION */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">translate</span>
          <span className="font-headline-sm text-sm font-bold text-on-surface">
            Language & Localisation
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => { setLanguage('en'); triggerSave(); }}
            className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
              language === 'en' ? 'bg-surface-container border-secondary shadow-xs' : 'border-surface-container-high'
            }`}
          >
            <div>
              <div className="font-bold text-xs text-on-surface">English (Default)</div>
              <div className="text-[10px] text-on-surface-variant">Standard Maritime Terminology</div>
            </div>
            {language === 'en' && <span className="material-symbols-outlined text-secondary">check</span>}
          </button>

          <button
            onClick={() => { setLanguage('ta'); triggerSave(); }}
            className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
              language === 'ta' ? 'bg-surface-container border-secondary shadow-xs' : 'border-surface-container-high'
            }`}
          >
            <div>
              <div className="font-bold text-xs text-on-surface">தமிழ் (Tamil)</div>
              <div className="text-[10px] text-on-surface-variant">முழுமையான தமிழ் இடைமுகம் மற்றும் குரல் எச்சரிக்கைகள்</div>
            </div>
            {language === 'ta' && <span className="material-symbols-outlined text-secondary">check</span>}
          </button>

          <button
            onClick={() => { setLanguage('hi'); triggerSave(); }}
            className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
              language === 'hi' ? 'bg-surface-container border-secondary shadow-xs' : 'border-surface-container-high'
            }`}
          >
            <div>
              <div className="font-bold text-xs text-on-surface">हिन्दी (Hindi)</div>
              <div className="text-[10px] text-on-surface-variant">संपूर्ण तटीय इंटरफ़ेस और ऑडियो परामर्श</div>
            </div>
            {language === 'hi' && <span className="material-symbols-outlined text-secondary">check</span>}
          </button>
        </div>
      </div>

      {/* SECTION 2: APPEARANCE & GLARE FILTER */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">brightness_medium</span>
          <span className="font-headline-sm text-sm font-bold text-on-surface">
            Appearance & High-Glare Optimization
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setThemeMode('light'); triggerSave(); }}
            className={`p-3 rounded-lg border text-left transition-all ${
              themeMode === 'light' ? 'bg-surface-container border-secondary font-bold' : 'border-surface-container-high'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-on-surface">
              <span className="material-symbols-outlined text-[18px]">light_mode</span>
              <span>Light Mode</span>
            </div>
            <span className="text-[10px] text-on-surface-variant">Outdoor High Sunlight</span>
          </button>

          <button
            onClick={() => { setThemeMode('dark'); triggerSave(); }}
            className={`p-3 rounded-lg border text-left transition-all ${
              themeMode === 'dark' ? 'bg-surface-container border-secondary font-bold' : 'border-surface-container-high'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-on-surface">
              <span className="material-symbols-outlined text-[18px]">dark_mode</span>
              <span>Night Watch</span>
            </div>
            <span className="text-[10px] text-on-surface-variant">Bridge Low Glare</span>
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
          <div>
            <div className="text-xs font-bold text-on-surface">High-Glare Solar Filter (+15% Contrast)</div>
            <div className="text-[10px] text-on-surface-variant">Enhances optical legibility under direct sea spray</div>
          </div>
          <input
            type="checkbox"
            checked={highGlare}
            onChange={(e) => setHighGlare(e.target.checked)}
            className="w-5 h-5 accent-secondary"
          />
        </div>
      </div>

      {/* SECTION 3: WORKSTATION ROLE SWITCHER */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">badge</span>
          <span className="font-headline-sm text-sm font-bold text-on-surface">
            Active Workstation Role
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setCurrentRole(r.id)}
              className={`p-3 rounded-lg border text-left transition-all flex items-start justify-between ${
                currentRole === r.id
                  ? 'bg-primary-container text-white border-primary shadow-md'
                  : 'bg-surface-container-low border-surface-container hover:bg-surface-container'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-bold text-xs">{r.title}</span>
                <span className={`text-[10px] mt-0.5 ${currentRole === r.id ? 'text-white/70' : 'text-on-surface-variant'}`}>
                  {r.desc}
                </span>
              </div>
              {currentRole === r.id && (
                <span className="px-2 py-0.5 rounded bg-secondary text-[9px] uppercase font-bold tracking-wider">
                  ACTIVE
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4: OFFLINE & SATELLITE SYNC */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-2">
        <span className="font-headline-sm text-sm font-bold text-on-surface">
          Connectivity & Coastal Resilience
        </span>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
          <div>
            <div className="text-xs font-bold text-on-surface">Emergency SMS Fallback Broadcast</div>
            <div className="text-[10px] text-on-surface-variant">Auto-receives 2G SMS safety advisories beyond 15 NM</div>
          </div>
          <input
            type="checkbox"
            checked={smsAlerts}
            onChange={(e) => setSmsAlerts(e.target.checked)}
            className="w-5 h-5 accent-secondary"
          />
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
          <div>
            <div className="text-xs font-bold text-on-surface">Offline Nautical Tile Cache (25 NM)</div>
            <div className="text-[10px] text-on-surface-variant">Cached bathymetric and PFZ vector maps for zero network</div>
          </div>
          <input
            type="checkbox"
            checked={offlineCache}
            onChange={(e) => setOfflineCache(e.target.checked)}
            className="w-5 h-5 accent-secondary"
          />
        </div>
      </div>
    </div>
  );
}
