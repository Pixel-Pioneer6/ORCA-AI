import React, { useState } from 'react';
import { useMarine } from '../../context/MarineContext';
import { useLanguage } from '../../context/LanguageContext';

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
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const toggleLanguage = () => {
    if (language === 'en') setLanguage('ta');
    else if (language === 'ta') setLanguage('hi');
    else setLanguage('en');
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const roles = [
    { id: 'fisher', label: 'Fisherman (Mobile)', icon: 'sailing' },
    { id: 'ddmo', label: 'DDMO Command', icon: 'flood' },
    { id: 'port', label: 'Port Operator', icon: 'anchor' },
    { id: 'researcher', label: 'Marine Researcher', icon: 'science' },
    { id: 'authority', label: 'Senior Authority', icon: 'shield' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
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

          {/* Controls: Language, Theme, Role Switcher */}
          <div className="flex items-center gap-1.5">
            {/* Language Selector */}
            <button
              onClick={toggleLanguage}
              aria-label="Language Selector"
              className="min-h-[36px] px-2 flex items-center justify-center gap-1 rounded-md bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">translate</span>
              <span className="font-label-sm text-label-sm font-bold uppercase">
                {language === 'en' ? 'EN' : language === 'ta' ? 'தமிழ்' : 'हिन्दी'}
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

            {/* Role Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="h-9 px-2.5 rounded-md bg-primary text-on-primary flex items-center gap-1 text-xs font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                <span className="hidden xs:inline uppercase">{currentRole}</span>
              </button>

              {/* Role Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-surface-container-lowest shadow-xl border border-outline-variant/30 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-surface-container text-[11px] font-label-sm uppercase font-bold text-on-surface-variant">
                    Select Workstation Role
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setCurrentRole(r.id);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-semibold hover:bg-surface-container ${
                        currentRole === r.id ? 'text-secondary bg-surface-container-low font-bold' : 'text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{r.icon}</span>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
