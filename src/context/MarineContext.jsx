import React, { createContext, useContext, useState, useEffect } from 'react';

const MarineContext = createContext();

export function MarineProvider({ children }) {
  // Navigation & Role State
  const [currentRole, setCurrentRole] = useState('fisher'); // 'fisher' | 'ddmo' | 'port' | 'researcher' | 'authority'
  const [currentRoute, setCurrentRoute] = useState('home'); // 'home' | 'safety' | 'pfz' | 'map' | 'assistant' | 'profile' | 'settings' | 'ddmo' | 'port' | 'researcher' | 'authority'
  
  // Deterministic Safety State
  const [safetyState, setSafetyState] = useState('caution'); // 'caution' | 'safe' | 'danger' | 'stale'
  
  // Vessel Profile State
  const [vesselSpecs, setVesselSpecs] = useState({
    name: 'Meenavan-01',
    regNo: 'IND-TN-02-MM-4491',
    loa: 8.2, // meters
    beam: 2.1,
    draft: 0.8,
    hp: 9.9, // OBM HP
    hull: 'FRP (Fibre Reinforced Plastic)',
    gear: 'Gillnet (Pelagic Drift)',
    maxWave: 1.5, // meters threshold
    maxWind: 18,  // knots threshold
  });

  // Active Location & Geolocation State
  const [activeLocation, setActiveLocation] = useState({
    name: 'Kasimedu (13.12°N, 80.30°E)',
    harbour: 'Kasimedu Fishing Harbour, Chennai',
    lat: 13.12,
    lon: 80.30,
    zone: 'SEC-04 (Chennai North)',
    jurisdiction: 'Tamil Nadu & Coromandel Coast',
  });

  // Theme & Glare Mode
  const [themeMode, setThemeMode] = useState('light'); // 'light' | 'dark' | 'solar'
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Sync theme with DOM document element
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  // Handle role switching and auto-routing
  const switchRole = (role) => {
    setCurrentRole(role);
    if (role === 'fisher') setCurrentRoute('home');
    else if (role === 'ddmo') setCurrentRoute('ddmo');
    else if (role === 'port') setCurrentRoute('port');
    else if (role === 'researcher') setCurrentRoute('researcher');
    else if (role === 'authority') setCurrentRoute('authority');
  };

  // Telemetry dictionary tied dynamically to safetyState
  const getTelemetry = () => {
    switch (safetyState) {
      case 'safe':
        return {
          wave: '1.1',
          waveUnit: 'm',
          waveDesc: 'Gentle Swell (SSE)',
          wind: '09',
          windUnit: 'kt',
          windDesc: 'Calm Coastal Breeze',
          current: '0.6',
          currentUnit: 'kt',
          direction: '110° ESE',
          period: '6.2s',
          sst: '28.8°C',
          confidence: '92%',
          advisory: 'Ocean swell (1.1m) and surface winds (9 kt) are well within your craft\'s 1.5m physical threshold. Recommended window for shoreline departure and coastal trolling.',
        };
      case 'danger':
        return {
          wave: '2.7',
          waveUnit: 'm',
          waveDesc: 'High Breaking Swell',
          wind: '32',
          windUnit: 'kt',
          windDesc: 'Gale Force Squalls',
          current: '2.4',
          currentUnit: 'kt',
          direction: '065° ENE',
          period: '12.8s',
          sst: '27.4°C',
          confidence: '96%',
          advisory: 'Rough to very rough breaking sea conditions. High waves (2.7m) and gale gusts (32 kt) create imminent risk for craft below 15m. Port signals advise complete suspension of operations.',
        };
      case 'stale':
        return {
          wave: '--',
          waveUnit: 'm',
          waveDesc: 'Telemetry Interrupted',
          wind: '--',
          windUnit: 'kt',
          windDesc: 'Sensor Latency > 6h',
          current: '--',
          currentUnit: 'kt',
          direction: '--',
          period: '--',
          sst: '--',
          confidence: '42%',
          advisory: 'Primary ocean wave telemetry has not synchronized in 6 hours. Deterministic safety thresholds cannot be certified for sea departure until live satellite ingest completes.',
        };
      case 'caution':
      default:
        return {
          wave: '1.8',
          waveUnit: 'm',
          waveDesc: 'Elevated Breaker Swell',
          wind: '24',
          windUnit: 'kt',
          windDesc: 'Squally Wind Gusts',
          current: '1.2',
          currentUnit: 'kt',
          direction: '142° SE',
          period: '8.4s',
          sst: '28.2°C',
          confidence: '84%',
          advisory: 'Conditions may be difficult for your 8m motorized FRP vessel tomorrow morning because of elevated breaker waves (1.8m) and squally wind gusts out of Kasimedu harbour mouth. Keep radio tuned to Port VHF Ch-16.',
        };
    }
  };

  return (
    <MarineContext.Provider
      value={{
        currentRole,
        setCurrentRole: switchRole,
        currentRoute,
        setCurrentRoute,
        safetyState,
        setSafetyState,
        vesselSpecs,
        setVesselSpecs,
        activeLocation,
        setActiveLocation,
        themeMode,
        setThemeMode,
        isVoiceOpen,
        setIsVoiceOpen,
        telemetry: getTelemetry(),
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
