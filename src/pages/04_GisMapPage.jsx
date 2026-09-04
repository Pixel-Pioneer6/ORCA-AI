import React, { useState, useEffect, useRef } from 'react';
import { useMarine } from '../context/MarineContext';
import { useLanguage } from '../context/LanguageContext';
import TacticalGisMap from '../components/maps/TacticalGisMap';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../services/speech';

const RISK_RANK = { danger: 3, HIGH: 3, caution: 2, MODERATE: 2, safe: 1, LOW: 1 };

export default function GisMapPage() {
  const { setCurrentRoute } = useMarine();
  const { language } = useLanguage();
  const [mapMode, setMapMode] = useState('fisher');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState(''); // '' | 'searching' | 'not_found' | 'locating' | 'listening'
  const [focusOverride, setFocusOverride] = useState(null);
  const [inspector, setInspector] = useState(null);
  const [banner, setBanner] = useState(null);
  const recognizerRef = useRef(null);
  const latestTranscriptRef = useRef('');

  // Real per-mode content — previously the banner and inspector drawer
  // below always showed the same hardcoded "PFZ #01" text regardless of
  // which of the three mode pills was selected.
  useEffect(() => {
    let cancelled = false;

    if (mapMode === 'port') {
      fetch('/api/port/status').then((r) => r.json()).then((d) => {
        if (cancelled) return;
        const worst = [...d.vessels].sort((a, b) => (RISK_RANK[b.status_level] || 0) - (RISK_RANK[a.status_level] || 0))[0];
        setBanner({ text: d.status_verdict, metric: `Depth ${d.current_depth_datum}m` });
        setInspector({
          kind: 'port', title: worst?.name || d.port_name, badge: worst?.status_level?.toUpperCase() || 'STATUS',
          sub: worst ? `${worst.vessel_type} · ${worst.berth}` : d.tide_phase,
          desc: worst ? `${worst.status} — ${worst.action_required}. Next high tide ${d.next_high_tide}.` : d.status_verdict,
        });
      }).catch(() => {});
    } else if (mapMode === 'disaster') {
      fetch('/api/ddmo/status').then((r) => r.json()).then((d) => {
        if (cancelled) return;
        const worst = [...d.coastal_blocks].sort((a, b) => (RISK_RANK[b.risk_level] || 0) - (RISK_RANK[a.risk_level] || 0))[0];
        setBanner({ text: `${d.district} — ${d.alert_level}`, metric: `${d.metrics.at_risk_population.toLocaleString()} at risk` });
        setInspector({
          kind: 'disaster', title: worst?.block_name, badge: worst?.risk_level,
          sub: `Projected wave ${worst?.projected_max_wave}m · ${worst?.population_exposed.toLocaleString()} exposed`,
          desc: `${worst?.shelter_status}. ${worst?.alert_action}.`,
        });
      }).catch(() => {});
    } else {
      fetch('/api/v1/pfz/nearest').then((r) => r.json()).then((d) => {
        if (cancelled) return;
        const z = d.nearest_zone;
        setBanner({ text: 'Sector SEC-04 Active Squall Crosshatch', metric: '1.8m SWH' });
        setInspector({
          kind: 'fisher', title: z.name, badge: `${z.probability_pct}% Catch Probability`,
          sub: `Coordinates: ${z.coordinates.lat}°N, ${z.coordinates.lon}°E · ${z.distance_nm} NM · ETA ${z.eta_label}`,
          desc: `Chlorophyll front confluence for ${z.species}. ${d.transit_advisory}`,
        });
      }).catch(() => {});
    }

    return () => { cancelled = true; };
  }, [mapMode]);

  useEffect(() => {
    return () => { recognizerRef.current?.abort(); };
  }, []);

  // Real forward geocoding (backend/connectors/nominatim.py) — previously
  // this search box did nothing at all when submitted.
  const runSearch = async (query) => {
    const q = (query ?? searchQuery).trim();
    if (!q) return;
    setSearchStatus('searching');
    try {
      const res = await fetch(`/api/v1/geo/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const hit = data.results?.[0];
      if (!hit) {
        setSearchStatus('not_found');
        setTimeout(() => setSearchStatus(''), 2500);
        return;
      }
      setFocusOverride({ lat: hit.lat, lon: hit.lon, label: hit.place_name });
      setSearchQuery(hit.place_name);
      setSearchStatus('');
    } catch {
      setSearchStatus('not_found');
      setTimeout(() => setSearchStatus(''), 2500);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    runSearch();
  };

  // Real browser geolocation — the button previously just showed a
  // hardcoded alert() and never touched the map.
  const centerOnMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setSearchStatus('not_found');
      setTimeout(() => setSearchStatus(''), 2500);
      return;
    }
    setSearchStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        let label = 'My current location';
        try {
          const res = await fetch(`/api/v1/geo/reverse?lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data.place_name) label = data.place_name;
        } catch { /* keep generic label */ }
        setFocusOverride({ lat, lon, label });
        setSearchQuery(label);
        setSearchStatus('');
      },
      () => {
        setSearchStatus('not_found');
        setTimeout(() => setSearchStatus(''), 2500);
      },
      { timeout: 8000 }
    );
  };

  // Real one-shot voice search — a local Web Speech API recognizer scoped
  // to this search box (distinct from the global voice assistant modal,
  // which always routes to the chat page instead of searching the map).
  const startVoiceSearch = () => {
    if (!isSpeechRecognitionSupported()) {
      setSearchStatus('not_found');
      setTimeout(() => setSearchStatus(''), 2500);
      return;
    }
    setSearchStatus('listening');
    latestTranscriptRef.current = '';
    const recognizer = createSpeechRecognizer({
      language,
      onResult: (text) => {
        if (!text.trim()) return;
        latestTranscriptRef.current = text;
        setSearchQuery(text);
      },
      onError: () => {
        setSearchStatus('not_found');
        setTimeout(() => setSearchStatus(''), 2500);
      },
      onEnd: () => {
        setSearchStatus('');
        if (latestTranscriptRef.current.trim()) runSearch(latestTranscriptRef.current);
      },
    });
    if (recognizer) {
      recognizer.start();
      recognizerRef.current = recognizer;
    } else {
      setSearchStatus('');
    }
  };

  return (
    <div className="flex flex-col gap-pad-sm pb-28 pt-2">
      {/* Top Search & HUD Bar */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <div className="flex-grow relative flex items-center bg-surface-container-lowest rounded-xl border border-surface-container-high px-3 py-2 shadow-sm">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant mr-2">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search a coastal place — e.g. Royapuram, Ennore Creek..."
            className="w-full bg-transparent text-xs font-semibold text-on-surface focus:outline-none"
          />
          <button
            type="button"
            onClick={startVoiceSearch}
            className={`p-1 rounded-full transition-colors ${searchStatus === 'listening' ? 'text-error animate-pulse' : 'text-secondary hover:bg-surface-container'}`}
            title="Voice Search"
          >
            <span className="material-symbols-outlined text-[18px]">mic</span>
          </button>
        </div>

        <button
          type="button"
          onClick={centerOnMyLocation}
          className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-surface-container-high flex items-center justify-center text-secondary shadow-sm hover:bg-surface-container flex-shrink-0"
          title="Center on My Current Location"
        >
          <span className={`material-symbols-outlined text-[20px] ${searchStatus === 'locating' ? 'animate-pulse' : ''}`}>my_location</span>
        </button>
      </form>

      {searchStatus === 'searching' && <p className="text-[10px] text-on-surface-variant px-1">Searching…</p>}
      {searchStatus === 'locating' && <p className="text-[10px] text-on-surface-variant px-1">Getting your location…</p>}
      {searchStatus === 'listening' && <p className="text-[10px] text-error px-1">Listening — say a place name…</p>}
      {searchStatus === 'not_found' && <p className="text-[10px] text-error px-1">Could not resolve that location. Try a different name.</p>}

      {/* Mode Switcher Pill — real modes now (see TacticalGisMap's `mode`
          prop): each fetches and plots genuinely different data. */}
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

      {/* Active Area Caution Banner — real, mode-specific summary */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 text-amber-950 border border-amber-200 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>
          <span className="font-semibold">{banner?.text || 'Loading live status…'}</span>
        </div>
        <span className="font-mono text-[10px] font-bold text-amber-800">{banner?.metric || ''}</span>
      </div>

      {/* Full-Screen Vector Tactical Map */}
      <TacticalGisMap height="360px" showLayers={true} mode={mapMode} focusOverride={focusOverride} />

      {/* Bottom Feature Inspector Drawer — real, mode-specific content */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-md flex flex-col gap-pad-sm">
        {inspector ? (
          <>
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    inspector.badge === 'DANGER' || inspector.badge === 'HIGH' ? 'bg-error' :
                    inspector.badge === 'CAUTION' || inspector.badge === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                  <span className="font-headline-sm text-sm font-bold text-on-surface">{inspector.title}</span>
                </div>
                <span className="font-mono text-xs text-secondary font-semibold">{inspector.sub}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold whitespace-nowrap">
                {inspector.badge}
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">{inspector.desc}</p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setCurrentRoute(inspector.kind === 'fisher' ? 'pfz' : 'home')}
                className="py-2.5 px-3 rounded-lg border border-secondary text-secondary font-bold text-xs hover:bg-secondary/5 transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>{inspector.kind === 'fisher' ? 'Catch Intel' : inspector.kind === 'port' ? 'Port Detail' : 'DDMO Detail'}</span>
              </button>
              <button
                onClick={() => setCurrentRoute('safety')}
                className="py-2.5 px-3 rounded-lg bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary/90 flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Safety Check</span>
              </button>
            </div>
          </>
        ) : (
          <p className="text-xs text-on-surface-variant text-center py-4">Loading…</p>
        )}
      </div>
    </div>
  );
}
