import React, { useState } from 'react';
import { useMarine } from '../../context/MarineContext';
import { useLanguage } from '../../context/LanguageContext';

export default function VoiceMicModal() {
  const { isVoiceOpen, setIsVoiceOpen, setCurrentRoute } = useMarine();
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(true);
  const [recognizedQuery, setRecognizedQuery] = useState(
    language === 'ta'
      ? 'நாளை காலை 5 மணிக்கு 8 மீ படகில் கடலுக்கு செல்லலாமா?'
      : 'Can I venture out tomorrow at 5 AM with my 8m FRP boat?'
  );

  if (!isVoiceOpen) return null;

  const quickQueries = [
    { en: 'Is there a squall warning tonight?', ta: 'இன்று இரவு சூறாவளி எச்சரிக்கை உள்ளதா?' },
    { en: 'Where is the nearest safe PFZ zone?', ta: 'அருகிலுள்ள பாதுகாப்பான மீன்பிடி மண்டலம் எங்கே?' },
    { en: 'Show me wave height forecast for 24h', ta: '24 மணி நேர அலை உயர முன்னறிவிப்பைக் காட்டு' },
  ];

  const handleSelectQuery = (q) => {
    setRecognizedQuery(language === 'ta' ? q.ta : q.en);
  };

  const handleSubmit = () => {
    setIsVoiceOpen(false);
    setCurrentRoute('assistant');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl p-pad-lg flex flex-col items-center gap-pad-md animate-in slide-in-from-bottom border border-surface-container-high pb-safe">
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">mic</span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Ask ORCA Voice Assistant
            </span>
          </div>
          <button
            onClick={() => setIsVoiceOpen(false)}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Pulsating Microphone Visualizer */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Animated concentric rings */}
          {isListening && (
            <>
              <span className="absolute w-28 h-28 rounded-full bg-secondary/20 animate-ping"></span>
              <span className="absolute w-36 h-36 rounded-full bg-secondary/10 animate-voice-ripple"></span>
            </>
          )}

          <button
            onClick={() => setIsListening(!isListening)}
            className="relative w-20 h-20 rounded-full bg-secondary text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[36px]">
              {isListening ? 'mic' : 'mic_off'}
            </span>
          </button>
        </div>

        {/* Listening Status & Transcript */}
        <div className="flex flex-col items-center text-center gap-1 w-full">
          <span className="font-label-sm text-xs uppercase font-bold text-secondary tracking-wider">
            {isListening ? 'Listening (தமிழ் / English)...' : 'Microphone Paused'}
          </span>
          <div className="p-3 rounded-xl bg-surface-container-low w-full border border-surface-container text-on-surface font-body-md font-medium">
            "{recognizedQuery}"
          </div>
        </div>

        {/* Quick Query Pills */}
        <div className="w-full flex flex-col gap-1.5">
          <span className="text-[11px] font-label-sm text-on-surface-variant uppercase font-bold">
            Suggested Maritime Queries
          </span>
          <div className="flex flex-col gap-1">
            {quickQueries.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSelectQuery(q)}
                className="text-left text-xs p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface font-medium truncate"
              >
                {language === 'ta' ? q.ta : q.en}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => setIsVoiceOpen(false)}
            className="py-2.5 px-3 rounded-lg border border-outline-variant text-on-surface text-xs font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="py-2.5 px-3 rounded-lg bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary/90 flex items-center justify-center gap-1"
          >
            <span>Ask Assistant</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
