import React from 'react';
import { useMarine } from '../../context/MarineContext';
import { useLanguage } from '../../context/LanguageContext';

export default function BottomNav() {
  const { currentRoute, setCurrentRoute, setIsVoiceOpen } = useMarine();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl border-t border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="relative flex justify-around items-center h-20 px-pad-xs max-w-lg mx-auto">
        {/* Tab 1: Home */}
        <button
          onClick={() => setCurrentRoute('home')}
          aria-current={currentRoute === 'home' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 w-16 min-h-[44px] transition-colors ${
            currentRoute === 'home' ? 'text-secondary font-semibold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className={`material-symbols-outlined text-[24px] ${currentRoute === 'home' ? 'fill-1' : ''}`}>
            anchor
          </span>
          <span className="font-label-sm text-label-sm">{t('home')}</span>
        </button>

        {/* Tab 2: Map */}
        <button
          onClick={() => setCurrentRoute('map')}
          aria-current={currentRoute === 'map' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 w-16 min-h-[44px] transition-colors ${
            currentRoute === 'map' ? 'text-secondary font-semibold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className={`material-symbols-outlined text-[24px] ${currentRoute === 'map' ? 'fill-1' : ''}`}>
            explore
          </span>
          <span className="font-label-sm text-label-sm">{t('map')}</span>
        </button>

        {/* Center Hero Action: Ask ORCA Voice FAB */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => setIsVoiceOpen(true)}
            aria-label="Ask ORCA Voice Assistant"
            className="w-14 h-14 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-[0_4px_20px_-2px_rgba(11,37,69,0.25)] ring-4 ring-surface active:scale-95 transition-transform group"
          >
            <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">
              mic
            </span>
          </button>
          <span className="font-label-sm text-label-sm font-bold text-on-surface mt-1">
            {t('askOrca')}
          </span>
        </div>

        {/* Tab 4: Alerts / Safety */}
        <button
          onClick={() => setCurrentRoute('safety')}
          aria-current={currentRoute === 'safety' ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center gap-0.5 w-16 min-h-[44px] transition-colors ${
            currentRoute === 'safety' ? 'text-secondary font-semibold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <span className={`material-symbols-outlined text-[24px] ${currentRoute === 'safety' ? 'fill-1' : ''}`}>
              crisis_alert
            </span>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error text-on-error font-label-sm text-[10px] flex items-center justify-center font-bold animate-pulse">
              1
            </span>
          </div>
          <span className="font-label-sm text-label-sm">{t('alerts')}</span>
        </button>

        {/* Tab 5: Profile */}
        <button
          onClick={() => setCurrentRoute('profile')}
          aria-current={currentRoute === 'profile' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 w-16 min-h-[44px] transition-colors ${
            currentRoute === 'profile' ? 'text-secondary font-semibold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className={`material-symbols-outlined text-[24px] ${currentRoute === 'profile' ? 'fill-1' : ''}`}>
            badge
          </span>
          <span className="font-label-sm text-label-sm">{t('profile')}</span>
        </button>
      </div>
    </nav>
  );
}
