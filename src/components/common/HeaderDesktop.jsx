import React from 'react';
import { useMarine } from '../../context/MarineContext';
import { useLanguage } from '../../context/LanguageContext';

export default function HeaderDesktop() {
  const { 
    currentRole, 
    setCurrentRole, 
    themeMode, 
    setThemeMode 
  } = useMarine();
  const { language, setLanguage } = useLanguage();

  const roles = [
    { id: 'fisher', label: 'VESSEL', sub: 'Mobile' },
    { id: 'ddmo', label: 'DDMO', sub: 'Disaster Ops' },
    { id: 'port', label: 'PORT', sub: 'Operations' },
    { id: 'researcher', label: 'SCIENTIFIC', sub: 'Climatology' },
    { id: 'authority', label: 'AUTHORITY', sub: 'Command' },
  ];

  return (
    <header className="fixed top-8 inset-x-0 z-50 h-16 bg-primary-container text-white px-gutter-desktop flex items-center justify-between border-b border-white/10 shadow-md">
      {/* Brand & Authority Badge */}
      <div className="flex items-center gap-pad-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-white shadow-sm">
            O
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight leading-none text-white">
                ORCA Marine Intelligence
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-label-sm uppercase tracking-wider text-secondary-container">
                ISRO · INCOIS Ecosystem
              </span>
            </div>
            <span className="text-[11px] text-white/70 font-medium">
              Tamil Nadu & Coromandel Maritime Command (Zone 04)
            </span>
          </div>
        </div>

        {/* Operational System Health Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>OPERATIONAL · LIVE FEED</span>
        </div>
      </div>

      {/* Role Navigation Switcher Deck */}
      <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10">
        {roles.map((r) => {
          const isActive = currentRole === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setCurrentRole(r.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center ${
                isActive
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{r.label}</span>
              <span className="text-[9px] opacity-70 font-normal">{r.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Right Tools: Language, Glare/Theme, User */}
      <div className="flex items-center gap-pad-sm">
        {/* Language Toggle */}
        <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-xs font-bold">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded ${language === 'en' ? 'bg-secondary text-white' : 'text-white/70 hover:text-white'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ta')}
            className={`px-2 py-1 rounded ${language === 'ta' ? 'bg-secondary text-white' : 'text-white/70 hover:text-white'}`}
          >
            தமிழ்
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          title="Toggle High Glare / Night Watch"
        >
          <span className="material-symbols-outlined text-[18px]">
            {themeMode === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        {/* User Identity */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-xs">
            VR
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-white leading-tight">V. Ramanathan</span>
            <span className="text-[10px] text-white/60">Joint Ops Commander</span>
          </div>
        </div>
      </div>
    </header>
  );
}
