import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { evaluateSafety, VESSEL_CLASSES, classifyVessel } from '../lib/safetyEngine';

const MarineContext = createContext();

// Route-id <-> URL path mapping. Route ids are kept as the stable internal
// vocabulary (used throughout pages/components); the router owns the URL.
const ROUTE_ID_TO_PATH = {
  home: '/',
  safety: '/safety',
  pfz: '/pfz',
  map: '/map',
  assistant: '/assistant',
  profile: '/profile',
  settings: '/settings',
  ddmo: '/dashboard/ddmo',
  port: '/dashboard/port',
  researcher: '/dashboard/researcher',
  authority: '/dashboard/authority',
};
const PATH_TO_ROUTE_ID = Object.fromEntries(
  Object.entries(ROUTE_ID_TO_PATH).map(([id, path]) => [path, id])
);
const ROLE_DEFAULT_ROUTE = { fisher: 'home', ddmo: 'ddmo', port: 'port', researcher: 'researcher', authority: 'authority' };

// Mock sensor scenarios for the deterministic-safety-engine demo. These feed
// RAW inputs into evaluateSafety() — the verdict itself is always derived,
// never set directly (PRD §9 hard rule).
const SENSOR_SCENARIOS = {
  safe: {
    wave: 1.1, wind: 9, waveDesc: 'Gentle Swell (SSE)', windDesc: 'Calm Coastal Breeze',
    current: '0.6', direction: '110° ESE', period: '6.2s', sst: '28.8°C',
    overrides: {}, dataMissing: false, ageHours: 0.5,
  },
  caution: {
    wave: 1.8, wind: 24, waveDesc: 'Elevated Breaker Swell', windDesc: 'Squally Wind Gusts',
    current: '1.2', direction: '142° SE', period: '8.4s', sst: '28.2°C',
    overrides: {}, dataMissing: false, ageHours: 2,
  },
  danger: {
    wave: 2.7, wind: 32, waveDesc: 'High Breaking Swell', windDesc: 'Gale Force Squalls',
    current: '2.4', direction: '065° ENE', period: '12.8s', sst: '27.4°C',
    overrides: { highWaveOrSwellSurge: true }, dataMissing: false, ageHours: 0.3,
  },
  stale: {
    wave: 0, wind: 0, waveDesc: 'Telemetry Interrupted', windDesc: 'Sensor Latency > 6h',
    current: '--', direction: '--', period: '--', sst: '--',
    overrides: {}, dataMissing: true, ageHours: 13,
  },
};

const ADVISORY_TEMPLATES = {
  SAFE: (v) => `Ocean swell (${v.wave}m) and surface winds (${v.wind} kt) are well within your craft's ${v.thresholds.caution.wave}m physical threshold. Recommended window for shoreline departure and coastal trolling.`,
  CAUTION: (v) => `Conditions may be difficult for your ${v.loa}m motorized FRP vessel tomorrow morning because of elevated breaker waves (${v.wave}m) and squally wind gusts out of Kasimedu harbour mouth. Keep radio tuned to Port VHF Ch-16.`,
  DO_NOT_VENTURE: (v) => `Rough to very rough breaking sea conditions. High waves (${v.wave}m) and gale gusts (${v.wind} kt) create imminent risk for craft below 15m. Port signals advise complete suspension of operations.`,
  INSUFFICIENT_DATA: () => `Primary ocean wave telemetry has not synchronized in over 6 hours. Deterministic safety thresholds cannot be certified for sea departure until live satellite ingest completes.`,
};

export function MarineProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentRoute = PATH_TO_ROUTE_ID[location.pathname] || 'home';
  const setCurrentRoute = (routeId) => {
    const path = ROUTE_ID_TO_PATH[routeId];
    if (path) navigate(path);
  };

  const [currentRole, setRoleState] = useState('fisher');
  const isDesktopRole = ['ddmo', 'port', 'researcher', 'authority'].includes(currentRole);

  const switchRole = (role) => {
    setRoleState(role);
    setCurrentRoute(ROLE_DEFAULT_ROUTE[role] || 'home');
  };

  const [vesselSpecs, setVesselSpecs] = useState({
    name: 'Meenavan-01',
    regNo: 'IND-TN-02-MM-4491',
    loa: 8.2,
    beam: 2.1,
    draft: 0.8,
    hp: 9.9,
    hull: 'FRP (Fibre Reinforced Plastic)',
    gear: 'Gillnet (Pelagic Drift)',
  });

  const [activeLocation, setActiveLocation] = useState({
    name: 'Kasimedu (13.12°N, 80.30°E)',
    harbour: 'Kasimedu Fishing Harbour, Chennai',
    lat: 13.12,
    lon: 80.30,
    zone: 'SEC-04 (Chennai North)',
    jurisdiction: 'Tamil Nadu & Coromandel Coast',
  });

  const [themeMode, setThemeMode] = useState('light');
  const [textScale, setTextScale] = useState('md'); // 'md' | 'lg' | 'xl'
  const [highContrast, setHighContrast] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Demo-only sensor scenario selector (Safety Assessment page). Sets RAW
  // inputs; the verdict is always computed by evaluateSafety() below.
  const [sensorScenario, setSensorScenario] = useState('caution');
  // Demo-only clock skip, in hours, to exercise the staleness hard-expiry contract (§12.6).
  const [demoClockOffsetHours, setDemoClockOffsetHours] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', themeMode === 'dark');
    root.classList.toggle('high-contrast', highContrast);
    root.dataset.textScale = textScale;
  }, [themeMode, highContrast, textScale]);

  const rawSensors = SENSOR_SCENARIOS[sensorScenario] || SENSOR_SCENARIOS.caution;

  const retrievedAt = useMemo(
    () => new Date(Date.now() - rawSensors.ageHours * 60 * 60 * 1000).toISOString(),
    [rawSensors.ageHours, sensorScenario]
  );

  const now = useMemo(() => new Date(Date.now() + demoClockOffsetHours * 60 * 60 * 1000), [demoClockOffsetHours]);

  const safety = useMemo(
    () =>
      evaluateSafety({
        wave: rawSensors.wave,
        wind: rawSensors.wind,
        loaMeters: vesselSpecs.loa,
        overrides: rawSensors.overrides,
        dataMissing: rawSensors.dataMissing,
      }),
    [rawSensors, vesselSpecs.loa]
  );

  const telemetry = useMemo(() => {
    const advisoryFn = ADVISORY_TEMPLATES[safety.verdict] || ADVISORY_TEMPLATES.CAUTION;
    const confidencePct = safety.verdict === 'INSUFFICIENT_DATA' ? 42 : Math.max(70, 100 - safety.exceedance.wave / 4);
    return {
      wave: rawSensors.dataMissing ? '--' : rawSensors.wave.toFixed(1),
      waveUnit: 'm',
      waveDesc: rawSensors.waveDesc,
      wind: rawSensors.dataMissing ? '--' : String(Math.round(rawSensors.wind)),
      windUnit: 'kt',
      windDesc: rawSensors.windDesc,
      current: rawSensors.current,
      currentUnit: 'kt',
      direction: rawSensors.direction,
      period: rawSensors.period,
      sst: rawSensors.sst,
      confidence: `${Math.round(confidencePct)}%`,
      retrievedAt,
      advisory: advisoryFn({ ...safety, wave: rawSensors.wave, wind: rawSensors.wind, loa: vesselSpecs.loa }),
    };
  }, [rawSensors, safety, retrievedAt, vesselSpecs.loa]);

  return (
    <MarineContext.Provider
      value={{
        currentRole,
        setCurrentRole: switchRole,
        currentRoute,
        setCurrentRoute,
        vesselSpecs,
        setVesselSpecs,
        vesselClass: classifyVessel(vesselSpecs.loa),
        vesselThresholds: VESSEL_CLASSES[classifyVessel(vesselSpecs.loa)],
        activeLocation,
        setActiveLocation,
        themeMode,
        setThemeMode,
        textScale,
        setTextScale,
        highContrast,
        setHighContrast,
        isVoiceOpen,
        setIsVoiceOpen,
        sensorScenario,
        setSensorScenario,
        demoClockOffsetHours,
        setDemoClockOffsetHours,
        now,
        safety,
        telemetry,
      }}
    >
      {children}
    </MarineContext.Provider>
  );
}

export function useMarine() {
  const context = useContext(MarineContext);
  if (!context) throw new Error('useMarine must be used within a MarineProvider');
  return context;
}
