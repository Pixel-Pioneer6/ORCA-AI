import React, { useState } from 'react';
import { useMarine } from '../../context/MarineContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, ROLE_VERIFICATION } from '../../context/AuthContext';

const MARINE_TO_TIER = { fisher: 'fisherman', ddmo: 'ddmo', port: 'port', researcher: 'researcher', authority: 'authority' };
const TIER_TO_MARINE = { fisherman: 'fisher', ddmo: 'ddmo', port: 'port', researcher: 'researcher', authority: 'authority' };

export default function HeaderMobile() {
  const {
    currentRole,
    setCurrentRole,
    setCurrentRoute,
    activeLocation,
    themeMode,
    setThemeMode
  } = useMarine();
  const { language, setLanguage } = useLanguage();
  const { isGuest, heldRoles, pendingRoles, identity, openAuth, signOut } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Previously cycled EN -> TA -> HI -> EN, skipping Malayalam entirely —
  // there was no way to reach it from this quick-toggle button at all.
  const LANGUAGE_CYCLE = ['en', 'ta', 'hi', 'ml'];
  const LANGUAGE_LABELS = { en: 'EN', ta: 'தமிழ்', hi: 'हिन्दी', ml: 'മലയാളം' };
  const toggleLanguage = () => {
    const next = LANGUAGE_CYCLE[(LANGUAGE_CYCLE.indexOf(language) + 1) % LANGUAGE_CYCLE.length];
    setLanguage(next);
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const icons = { fisher: 'sailing', ddmo: 'flood', port: 'anchor', researcher: 'science', authority: 'shield' };
  const heldMarineRoles = ['fisher', ...heldRoles.map((t) => TIER_TO_MARINE[t]).filter(Boolean)];

  return (
    <header className="fixed top-8 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="h-28 px-gutter-mobile flex flex-col justify-between py-pad-xs border-b border-surface-container-high/60">
        {/* Top Branding Row */}
        <div className="flex items-center justify-between gap-pad-xs">
          <div className="flex items-center gap-pad-sm">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-sm tracking-tighter shadow-sm">
              ORCA
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-pad-xs">
                <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight leading-none">
                  ORCA Marine
                </span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase tracking-wider">
                  ISRO · INCOIS
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant font-medium leading-tight">
                Situational Intelligence
              </span>
            </div>
          </div>

          {/* Controls: Language, Theme, Auth/Role */}
          <div className="flex items-center gap-1.5">
            {/* Language Selector */}
            <button
              onClick={toggleLanguage}
              aria-label="Language Selector"
              className="min-h-[36px] px-2 flex items-center justify-center gap-1 rounded-md bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">translate</span>
              <span className="font-label-sm text-label-sm font-bold uppercase">
                {LANGUAGE_LABELS[language] || 'EN'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="w-9 h-9 flex items-center justify-center rounded-md bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                {themeMode === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            {isGuest ? (
              <button
                onClick={() => openAuth('fisherman')}
                className="h-9 px-3 rounded-md bg-primary text-on-primary flex items-center gap-1 text-xs font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>Sign In</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="h-9 px-2.5 rounded-md bg-primary text-on-primary flex items-center gap-1 text-xs font-bold shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                  <span className="hidden xs:inline uppercase">{currentRole}</span>
                </button>

                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl bg-surface-container-lowest shadow-xl border border-outline-variant/30 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 border-b border-surface-container text-[11px] font-label-sm uppercase font-bold text-on-surface-variant flex items-center justify-between">
                      <span>Your verified roles</span>
                      {identity && <span className="normal-case font-mono text-[10px] text-secondary truncate max-w-[90px]">{identity.value}</span>}
                    </div>
                    {heldMarineRoles.map((r) => (
                      <button
                        key={r}
                        onClick={() => { setCurrentRole(r); setShowRoleMenu(false); }}
                        className={`w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-semibold hover:bg-surface-container ${
                          currentRole === r ? 'text-secondary bg-surface-container-low font-bold' : 'text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{icons[r]}</span>
                        {r === 'fisher' ? 'Fisherman (Mobile)' : ROLE_VERIFICATION[MARINE_TO_TIER[r]]?.label}
                      </button>
                    ))}
                    {pendingRoles.length > 0 && (
                      <div className="px-3 py-1.5 text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
                        {pendingRoles.length} role(s) awaiting admin approval
                      </div>
                    )}
                    <button
                      onClick={() => { openAuth('researcher'); setShowRoleMenu(false); }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-semibold text-secondary hover:bg-surface-container border-t border-surface-container"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      Add another role
                    </button>
                    <button
                      onClick={() => { signOut(); setShowRoleMenu(false); }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-semibold text-error hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Profile Avatar */}
            <button
              onClick={() => setCurrentRoute('profile')}
              aria-label="Profile"
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>
          </div>
        </div>

        {/* Sub-bar: Geolocation & Real-time Live Ping */}
        <div className="flex items-center justify-between gap-pad-xs bg-surface-container-lowest/80 px-pad-sm py-1 rounded-lg border border-surface-container-high/40">
          <div className="flex items-center gap-1 min-h-[28px] text-left">
            <span className="material-symbols-outlined text-[16px] text-secondary">near_me</span>
            <span className="font-label-md text-label-md text-on-surface truncate max-w-[210px] font-medium">
              {activeLocation.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-pad-xs py-0.5 rounded-full bg-surface-container-low">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            <span className="font-label-sm text-label-sm text-secondary font-bold tracking-wide">
              ONLINE · 4G
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
