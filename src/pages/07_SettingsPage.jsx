import React, { useState } from 'react';
import { useMarine } from '../context/MarineContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, ROLE_VERIFICATION } from '../context/AuthContext';
import ActiveSessionsPanel from '../components/common/ActiveSessionsPanel';
import { usePersistentState } from '../lib/usePersistentState';

const MARINE_TO_TIER = { fisher: 'fisherman', ddmo: 'ddmo', port: 'port', researcher: 'researcher', authority: 'authority' };
const TIER_TO_MARINE = { fisherman: 'fisher', ddmo: 'ddmo', port: 'port', researcher: 'researcher', authority: 'authority' };

export default function SettingsPage() {
  const {
    currentRole,
    setCurrentRole,
    setCurrentRoute,
    themeMode,
    setThemeMode,
    highContrast,
    setHighContrast,
  } = useMarine();
  const { language, setLanguage } = useLanguage();
  const { isGuest, heldRoles, pendingRoles, identity, openAuth, signOut } = useAuth();

  // Real persistence — these two toggles previously reset to "on" on every
  // reload regardless of what the user chose, since they were plain local
  // state with nothing backing them.
  const [smsAlerts, setSmsAlerts] = usePersistentState('orca_sms_alerts_enabled', true);
  const [offlineCache, setOfflineCache] = usePersistentState('orca_offline_cache_enabled', true);
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

          <button
            onClick={() => { setLanguage('ml'); triggerSave(); }}
            className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
              language === 'ml' ? 'bg-surface-container border-secondary shadow-xs' : 'border-surface-container-high'
            }`}
          >
            <div>
              <div className="font-bold text-xs text-on-surface">മലയാളം (Malayalam)</div>
              <div className="text-[10px] text-on-surface-variant">Coastal voice input & spoken advisories</div>
            </div>
            {language === 'ml' && <span className="material-symbols-outlined text-secondary">check</span>}
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
            checked={highContrast}
            onChange={(e) => { setHighContrast(e.target.checked); triggerSave(); }}
            className="w-5 h-5 accent-secondary"
          />
        </div>
      </div>

      {/* SECTION 3: IDENTITY & WORKSTATION ROLE SWITCHER (PRD §12) */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">badge</span>
            <span className="font-headline-sm text-sm font-bold text-on-surface">
              Identity & Workstation Role
            </span>
          </div>
          {!isGuest && (
            <button onClick={signOut} className="text-[11px] font-bold text-error hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">logout</span>
              Sign Out
            </button>
          )}
        </div>

        {isGuest && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span>You're browsing as a guest. Sign in to unlock alerts and role-specific tools.</span>
          </div>
        )}
        {identity && (
          <div className="text-[11px] text-on-surface-variant font-mono">Signed in as {identity.value}</div>
        )}
        {!isGuest && <ActiveSessionsPanel />}

        <div className="flex flex-col gap-2">
          {roles.map((r) => {
            const tier = MARINE_TO_TIER[r.id];
            const held = r.id === 'fisher' || heldRoles.includes(tier);
            const pending = pendingRoles.includes(tier);
            return (
              <button
                key={r.id}
                onClick={() => (held ? setCurrentRole(r.id) : openAuth(tier))}
                className={`p-3 rounded-lg border text-left transition-all flex items-start justify-between ${
                  currentRole === r.id
                    ? 'bg-primary-container text-white border-primary shadow-md'
                    : 'bg-surface-container-low border-surface-container hover:bg-surface-container'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    {r.title}
                    {!held && <span className="material-symbols-outlined text-[14px]">lock</span>}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${currentRole === r.id ? 'text-white/70' : 'text-on-surface-variant'}`}>
                    {r.desc}
                  </span>
                </div>
                {currentRole === r.id && (
                  <span className="px-2 py-0.5 rounded bg-secondary text-[9px] uppercase font-bold tracking-wider">
                    ACTIVE
                  </span>
                )}
                {pending && (
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[9px] uppercase font-bold tracking-wider">
                    PENDING
                  </span>
                )}
              </button>
            );
          })}
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

      {/* SECTION 5: GEOFENCED ALERT SUBSCRIPTIONS (PRD FR-4.1 & US-03) */}
      <GeofenceSubscriptionCard />
    </div>
  );
}

function GeofenceSubscriptionCard() {
  const [evaluating, setEvaluating] = useState(false);
  const [alertResult, setAlertResult] = useState(null);

  const handleTestGeofence = () => {
    setEvaluating(true);
    fetch('/api/v1/subscriptions/evaluate', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        setAlertResult(data);
        setEvaluating(false);
      })
      .catch((err) => {
        console.warn(err);
        setEvaluating(false);
      });
  };

  return (
    <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">fmd_good</span>
          <span className="font-headline-sm text-sm font-bold text-on-surface">
            Geofenced Alert Subscriptions (PRD FR-4.1)
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold">
          ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container flex flex-col">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Home Port</span>
          <span className="font-bold text-on-surface">Kasimedu Harbour</span>
        </div>
        <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container flex flex-col">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Operating Radius</span>
          <span className="font-bold text-on-surface">25 NM Perimeter</span>
        </div>
        <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container flex flex-col">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Registered Number</span>
          <span className="font-mono text-on-surface">+91-98401-44910</span>
        </div>
        <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container flex flex-col">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Delivery Ladder</span>
          <span className="font-bold text-emerald-800">Push → 2G SMS</span>
        </div>
      </div>

      <button
        onClick={handleTestGeofence}
        disabled={evaluating}
        className="w-full py-2.5 px-3 rounded-lg bg-secondary text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-secondary-container hover:text-primary transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[16px]">radar</span>
        <span>{evaluating ? 'Evaluating Polygon Intersections...' : 'Test Geofence Alert Intersection (US-03)'}</span>
      </button>

      {alertResult && (
        <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1.5 animate-in fade-in text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-900">Geofence Intersect Detected!</span>
            <span className="font-mono text-[10px] text-on-surface-variant">
              {alertResult.dispatched_alerts?.length} Alerts Triggered
            </span>
          </div>
          {alertResult.dispatched_alerts?.map((a, i) => (
            <div key={i} className="p-2 rounded bg-white border border-surface-container text-[11px] flex flex-col gap-0.5">
              <div className="flex items-center justify-between font-bold">
                <span className="text-secondary">{a.hazard} Alert</span>
                <span className="text-emerald-900">{a.status}</span>
              </div>
              <p className="font-mono text-[10px] text-on-surface">{a.sms_payload}</p>
              <span className="text-[9px] text-on-surface-variant">
                Channel: {a.delivery_ladder} · {a.sms_char_count} chars
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
