import React from 'react';
import { useMarine } from '../../context/MarineContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const TIER_TO_MARINE = { fisherman: 'fisher', ddmo: 'ddmo', port: 'port', researcher: 'researcher', authority: 'authority' };
const MARINE_TO_TIER = { fisher: 'fisherman', ddmo: 'ddmo', port: 'port', researcher: 'researcher', authority: 'authority' };

export default function HeaderDesktop() {
  const {
    currentRole,
    setCurrentRole,
    themeMode,
    setThemeMode
  } = useMarine();
  const { language, setLanguage } = useLanguage();
  const { isGuest, heldRoles, identity, openAuth, signOut } = useAuth();

  const roles = [
    { id: 'ddmo', label: 'DDMO', sub: 'Disaster Ops' },
    { id: 'port', label: 'PORT', sub: 'Operations' },
    { id: 'researcher', label: 'SCIENTIFIC', sub: 'Climatology' },
    { id: 'authority', label: 'AUTHORITY', sub: 'Command' },
  ];

  const isHeld = (id) => heldRoles.includes(MARINE_TO_TIER[id]);

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
          const held = isHeld(r.id);
          return (
            <button
              key={r.id}
              onClick={() => (held ? setCurrentRole(r.id) : openAuth(MARINE_TO_TIER[r.id]))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center relative ${
                isActive
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
              title={held ? undefined : 'Sign in to activate this role'}
            >
              <span className="flex items-center gap-1">
                {r.label}
                {!held && <span className="material-symbols-outlined text-[13px]">lock</span>}
              </span>
              <span className="text-[9px] opacity-70 font-normal">{r.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Right Tools: Language, Glare/Theme, User */}
      <div className="flex items-center gap-pad-sm">
        {/* Language Toggle — previously EN/Tamil only, so an officer on any
            desktop dashboard had no way to switch to Hindi or Malayalam
            at all (only the mobile GovMasthead offered all four). */}
        <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-xs font-bold">
          {[
            { code: 'en', label: 'EN' },
            { code: 'ta', label: 'தமிழ்' },
            { code: 'hi', label: 'हिं' },
            { code: 'ml', label: 'മല' },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`px-2 py-1 rounded ${language === l.code ? 'bg-secondary text-white' : 'text-white/70 hover:text-white'}`}
            >
              {l.label}
            </button>
          ))}
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
        {isGuest ? (
          <button
            onClick={() => openAuth('authority')}
            className="flex items-center gap-1.5 pl-3 ml-1 border-l border-white/10 text-xs font-bold text-white/90 hover:text-white"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Sign In
          </button>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-xs">
              {identity?.value?.slice(0, 2).toUpperCase() || 'OP'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">{identity?.value}</span>
              <button onClick={signOut} className="text-[10px] text-white/60 hover:text-white text-left">Sign Out</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
