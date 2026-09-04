import React from 'react';
import { useMarine } from '../../context/MarineContext';
import { useLanguage } from '../../context/LanguageContext';

const TEXT_SCALES = ['md', 'lg', 'xl'];

// Official credibility strip modeled on the masthead conventions used by
// ISRO/government data portals (MOSDAC, INCOIS): agency byline, bilingual
// toggle, and accessibility controls (text size / high contrast), sitting
// above the app's own header so the product UX underneath is untouched.
export default function GovMasthead({ variant = 'mobile' }) {
  const { textScale, setTextScale, highContrast, setHighContrast } = useMarine();
  const { language, setLanguage } = useLanguage();

  const cycleTextScale = () => {
    const idx = TEXT_SCALES.indexOf(textScale);
    setTextScale(TEXT_SCALES[(idx + 1) % TEXT_SCALES.length]);
  };

  const isDesktop = variant === 'desktop';

  return (
    <div
      className={`fixed top-0 inset-x-0 z-[60] h-8 flex items-center justify-between bg-[#001026] text-white/90 text-[10px] font-medium ${
        isDesktop ? 'px-gutter-desktop' : 'px-gutter-mobile'
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-8 focus:px-2 focus:py-1 focus:bg-white focus:text-primary focus:rounded"
      >
        Skip to main content
      </a>
      <div className="flex items-center gap-1.5 truncate">
        <span className="material-symbols-outlined text-[13px] text-secondary-container flex-shrink-0">verified</span>
        <span className="truncate">
          Government of India &middot; Department of Space &middot; ISRO &middot; INCOIS
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1" role="group" aria-label="Text size">
          <button
            onClick={cycleTextScale}
            className="px-1.5 py-0.5 rounded hover:bg-white/10 font-bold"
            aria-label="Cycle text size"
            title="Increase text size for readability"
          >
            {textScale === 'md' ? 'A' : textScale === 'lg' ? 'A+' : 'A++'}
          </button>
        </div>
        <button
          onClick={() => setHighContrast(!highContrast)}
          className={`px-1.5 py-0.5 rounded hover:bg-white/10 flex items-center gap-1 ${highContrast ? 'text-secondary-container font-bold' : ''}`}
          aria-pressed={highContrast}
          title="Toggle high-contrast mode"
        >
          <span className="material-symbols-outlined text-[13px]">contrast</span>
          <span className="hidden sm:inline">High Contrast</span>
        </button>
        <div className="flex items-center gap-0.5" role="group" aria-label="Language">
          {['en', 'ta', 'hi', 'ml'].map((lng) => (
            <button
              key={lng}
              onClick={() => setLanguage(lng)}
              className={`px-1.5 py-0.5 rounded uppercase font-bold ${language === lng ? 'bg-secondary text-white' : 'hover:bg-white/10 text-white/70'}`}
            >
              {lng}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
