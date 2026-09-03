import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    appName: 'ORCA Marine',
    agencyTag: 'ISRO · INCOIS',
    home: 'Home',
    map: 'Map',
    askOrca: 'Ask ORCA',
    alerts: 'Alerts',
    profile: 'Profile',
    settings: 'Settings',
    safe: 'SAFE',
    caution: 'CAUTION',
    doNotVenture: 'DO NOT VENTURE',
    stale: 'STALE TELEMETRY',
    safeDesc: 'Normal Feasible Conditions for 8m Motorized FRP Boats',
    cautionDesc: 'Moderate Risk: Conditions Require Heightened Alert',
    dangerDesc: 'Severe Maritime Hazard: Hull Capsizing Risk',
    staleDesc: 'Ground Buoy Sync Delayed (>6 Hours)',
    maxWave: 'Max Wave',
    windGusts: 'Gust Profile',
    swellPeriod: 'Swell Period',
    current: 'Ocean Current',
    confidence: 'Confidence',
    targetWindow: 'Target Window',
    plotRoute: 'Plot Safe Route',
    voicePrompt: 'Ask ORCA in Tamil or English',
    speakNow: 'Speak Now...',
    onlineStatus: 'ONLINE · 4G',
    activeAlerts: 'Active Alerts',
    jointAdvisory: 'Joint Advisory · INCOIS / IMD',
  },
  ta: {
    appName: 'ஆர்கா கடல்சார்',
    agencyTag: 'இஸ்ரோ · இன்கோயிஸ்',
    home: 'முகப்பு',
    map: 'வரைபடம்',
    askOrca: 'ஆர்காவிடம் கேள்',
    alerts: 'எச்சரிக்கைகள்',
    profile: 'சுயவிவரம்',
    settings: 'அமைப்புகள்',
    safe: 'பாதுகாப்பானது',
    caution: 'எச்சரிக்கை',
    doNotVenture: 'கடலுக்கு செல்ல வேண்டாம்',
    stale: 'தரவு காலாவதியானது',
    safeDesc: '8 மீ ஃபைபர் படகுகளுக்கு பாதுகாப்பான சூழல்',
    cautionDesc: 'மிதமான ஆபத்து: கூடுதல் எச்சரிக்கையுடன் செயல்படவும்',
    dangerDesc: 'கடும் அபாயம்: படகு கவிழும் ஆபத்து உள்ளது',
    staleDesc: 'தகவல் தாமதம் (>6 மணி நேரம்)',
    maxWave: 'அலை உயரம்',
    windGusts: 'காற்று வேகம்',
    swellPeriod: 'அலை இடைவெளி',
    current: 'கடல் நீரோட்டம்',
    confidence: 'நம்பகத்தன்மை',
    targetWindow: 'நேர இடைவெளி',
    plotRoute: 'பாதுகாப்பான வழித்தடம்',
    voicePrompt: 'தமிழில் அல்லது ஆங்கிலத்தில் பேசவும்',
    speakNow: 'இப்போது பேசவும்...',
    onlineStatus: 'ஆன்லைன் · 4G',
    activeAlerts: 'நேரலை எச்சரிக்கைகள்',
    jointAdvisory: 'கூட்டு ஆலோசனை · INCOIS / IMD',
  },
  hi: {
    appName: 'ओरका समुद्री',
    agencyTag: 'इसरो · इनकोइस',
    home: 'होम',
    map: 'मानचित्र',
    askOrca: 'ओरका से पूछें',
    alerts: 'अलर्ट',
    profile: 'प्रोफाइल',
    settings: 'सेटिंग्स',
    safe: 'सुरक्षित',
    caution: 'चेतावनी',
    doNotVenture: 'समुद्र में न जाएं',
    stale: 'डेटा पुराना है',
    safeDesc: '8 मीटर एफआरपी नावों के लिए सामान्य अनुकूल परिस्थितियां',
    cautionDesc: 'मध्यम जोखिम: सतर्कता बनाए रखें',
    dangerDesc: 'गंभीर समुद्री खतरा: पलटने का भारी जोखिम',
    staleDesc: 'डेटा विलंब (>6 घंटे)',
    maxWave: 'अधिकतम लहर',
    windGusts: 'हवा की गति',
    swellPeriod: 'लहर अंतराल',
    current: 'समुद्री धारा',
    confidence: 'सटीकता',
    targetWindow: 'समय खिड़की',
    plotRoute: 'सुरक्षित मार्ग बनाएं',
    voicePrompt: 'हिंदी या अंग्रेजी में पूछें',
    speakNow: 'अब बोलें...',
    onlineStatus: 'ऑनलाइन · 4G',
    activeAlerts: 'सक्रिय अलर्ट',
    jointAdvisory: 'संयुक्त परामर्श · INCOIS / IMD',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
