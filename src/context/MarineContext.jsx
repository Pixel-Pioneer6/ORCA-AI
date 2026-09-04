import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { evaluateSafety, VESSEL_CLASSES, classifyVessel } from '../lib/safetyEngine';
import { usePersistentState } from '../lib/usePersistentState';
import { useLanguage } from './LanguageContext';

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

// Advisory sentences are the single most safety-critical string in the app
// (PRD FR-1.1/§9) — they must render in the fisherman's own language, not
// just the surrounding UI chrome. Keyed by language, then verdict.
const ADVISORY_TEMPLATES = {
  en: {
    SAFE: (v) => `Ocean swell (${v.wave}m) and surface winds (${v.wind} kt) are well within your craft's ${v.thresholds.caution.wave}m physical threshold. Recommended window for shoreline departure and coastal trolling.`,
    CAUTION: (v) => `Conditions may be difficult for your ${v.loa}m motorized FRP vessel tomorrow morning because of elevated breaker waves (${v.wave}m) and squally wind gusts out of Kasimedu harbour mouth. Keep radio tuned to Port VHF Ch-16.`,
    DO_NOT_VENTURE: (v) => `Rough to very rough breaking sea conditions. High waves (${v.wave}m) and gale gusts (${v.wind} kt) create imminent risk for craft below 15m. Port signals advise complete suspension of operations.`,
    INSUFFICIENT_DATA: () => `Primary ocean wave telemetry has not synchronized in over 6 hours. Deterministic safety thresholds cannot be certified for sea departure until live satellite ingest completes.`,
  },
  ta: {
    SAFE: (v) => `கடல் அலை (${v.wave}மீ) மற்றும் காற்று வேகம் (${v.wind} kt) உங்கள் படகின் ${v.thresholds.caution.wave}மீ பாதுகாப்பு வரம்புக்குள் உள்ளது. கரையோர பயணத்திற்கும் மீன்பிடிக்கும் ஏற்ற நேரம்.`,
    CAUTION: (v) => `உயர்ந்த அலைகள் (${v.wave}மீ) மற்றும் சூறாவளி காற்றால் (${v.loa}மீ) படகுக்கு நாளை காலை நிலைமை சிரமமாக இருக்கலாம். VHF Ch-16 வானொலியை கவனியுங்கள்.`,
    DO_NOT_VENTURE: (v) => `கடுமையான கடல் நிலை. உயர் அலைகள் (${v.wave}மீ) மற்றும் புயல் காற்று (${v.wind} kt) 15மீக்கு கீழுள்ள படகுகளுக்கு உடனடி ஆபத்தை ஏற்படுத்தும். அனைத்து பயணங்களும் நிறுத்தப்பட வேண்டும்.`,
    INSUFFICIENT_DATA: () => `முதன்மை அலை தரவு 6 மணி நேரத்திற்கும் மேலாக புதுப்பிக்கப்படவில்லை. நேரடி செயற்கைக்கோள் தரவு வரும் வரை பாதுகாப்பு முடிவை உறுதிசெய்ய முடியாது.`,
  },
  hi: {
    SAFE: (v) => `समुद्री लहर (${v.wave}मी) और हवा (${v.wind} kt) आपकी नाव की ${v.thresholds.caution.wave}मी सीमा के भीतर हैं। तटीय प्रस्थान और मछली पकड़ने के लिए उपयुक्त समय।`,
    CAUTION: (v) => `ऊंची लहरों (${v.wave}मी) और तूफानी हवाओं के कारण आपकी ${v.loa}मी नाव के लिए कल सुबह स्थिति कठिन हो सकती है। VHF Ch-16 रेडियो सुनते रहें।`,
    DO_NOT_VENTURE: (v) => `गंभीर समुद्री स्थिति। ऊंची लहरें (${v.wave}मी) और तेज़ हवाएं (${v.wind} kt) 15मी से छोटी नावों के लिए तत्काल खतरा हैं। सभी परिचालन रोक दें।`,
    INSUFFICIENT_DATA: () => `मुख्य लहर डेटा 6 घंटे से अधिक समय से सिंक नहीं हुआ है। लाइव सैटेलाइट डेटा आने तक सुरक्षा निर्णय की पुष्टि नहीं की जा सकती।`,
  },
  // Malayalam — previously missing entirely, so selecting Malayalam on the
  // demo simulator silently fell through to whatever ADVISORY_TEMPLATES.en
  // produced (the fallback below), never actually showing Malayalam text.
  ml: {
    SAFE: (v) => `കടൽ തിരമാല (${v.wave}മീ) കൂടാതെ ഉപരിതല കാറ്റ് (${v.wind} നോട്ട്) നിങ്ങളുടെ ബോട്ടിന്റെ ${v.thresholds.caution.wave}മീ സുരക്ഷിത പരിധിക്കുള്ളിലാണ്. തീരദേശ യാത്രയ്ക്കും മീൻപിടിത്തത്തിനും അനുയോജ്യമായ സമയം.`,
    CAUTION: (v) => `ഉയർന്ന തിരമാലകൾ (${v.wave}മീ) കൂടാതെ കാറ്റിന്റെ ശക്തമായ കുതിപ്പുകൾ കാരണം നിങ്ങളുടെ ${v.loa}മീ മോട്ടോർ ബോട്ടിന് നാളെ രാവിലെ സാഹചര്യം ബുദ്ധിമുട്ടായിരിക്കാം. VHF Ch-16 റേഡിയോ ശ്രദ്ധിക്കുക.`,
    DO_NOT_VENTURE: (v) => `കടുത്ത കടൽ സാഹചര്യം. ഉയർന്ന തിരമാലകൾ (${v.wave}മീ) കൂടാതെ ശക്തമായ കാറ്റ് (${v.wind} നോട്ട്) 15മീറ്ററിൽ താഴെയുള്ള ബോട്ടുകൾക്ക് ഉടനടി അപകടസാധ്യത സൃഷ്ടിക്കുന്നു. എല്ലാ യാത്രകളും നിർത്തിവയ്ക്കുക.`,
    INSUFFICIENT_DATA: () => `പ്രധാന തിരമാല ടെലിമെട്രി 6 മണിക്കൂറിലധികമായി സമന്വയിപ്പിച്ചിട്ടില്ല. തത്സമയ ഉപഗ്രഹ വിവരങ്ങൾ ലഭിക്കുന്നതുവരെ സുരക്ഷാ തീരുമാനം സ്ഥിരീകരിക്കാൻ കഴിയില്ല.`,
  },
};

export function MarineProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();

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

  const [vesselSpecs, setVesselSpecs] = usePersistentState('orca_vessel_specs', {
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

  // Dual screen mode: layout is normally chosen by role (fisher -> mobile
  // shell, ddmo/port/researcher/authority -> desktop shell), independent of
  // actual window width. This override lets a demo force either shell on
  // any device/window size — e.g. showing the mobile fisher UI on a laptop,
  // or a desktop dashboard on a phone — without resizing the browser.
  const [viewModeOverride, setViewModeOverride] = useState('auto'); // 'auto' | 'desktop' | 'mobile'

  const [themeMode, setThemeMode] = usePersistentState('orca_theme_mode', 'light');
  const [textScale, setTextScale] = usePersistentState('orca_text_scale', 'md'); // 'md' | 'lg' | 'xl'
  const [highContrast, setHighContrast] = usePersistentState('orca_high_contrast', false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  // Bridges the voice modal's real ASR transcript (US-01) into the
  // Assistant page's chat pipeline. Without this the recognized speech had
  // nowhere to go: the modal just navigated to /assistant and discarded it.
  const [pendingVoiceQuery, setPendingVoiceQuery] = useState(null);

  // FR-1.3: a stable per-tab session id so the backend's real conversation
  // memory (last-known location, pending clarification, turn history) is
  // actually addressable across chat turns instead of every request looking
  // like a brand-new conversation. Persisted to sessionStorage so a page
  // refresh mid-conversation doesn't lose it; a new tab gets a fresh one.
  const [chatSessionId] = useState(() => {
    try {
      const existing = sessionStorage.getItem('orca_chat_session_id');
      if (existing) return existing;
      const fresh = `s_${crypto.randomUUID()}`;
      sessionStorage.setItem('orca_chat_session_id', fresh);
      return fresh;
    } catch {
      return 's_default';
    }
  });

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
    const langTemplates = ADVISORY_TEMPLATES[language] || ADVISORY_TEMPLATES.en;
    const advisoryFn = langTemplates[safety.verdict] || langTemplates.CAUTION;
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
  }, [rawSensors, safety, retrievedAt, vesselSpecs.loa, language]);

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
        pendingVoiceQuery,
        setPendingVoiceQuery,
        chatSessionId,
        viewModeOverride,
        setViewModeOverride,
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
