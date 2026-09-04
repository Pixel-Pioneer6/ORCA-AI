import React, { useState, useEffect, useRef } from 'react';
import { useMarine } from '../../context/MarineContext';
import { useLanguage } from '../../context/LanguageContext';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../../services/speech';

// FR-1.1: EN/HI + two coastal languages (Tamil, Malayalam) — labels for the
// live-listening indicator so it reflects the ASR locale actually in use.
const LANGUAGE_LABELS = { en: 'English', ta: 'தமிழ்', hi: 'हिन्दी', ml: 'മലയാളം' };

// Errors are shown to the user, not just console-logged, so a permission
// denial / unsupported browser / offline ASR service reads as "here's why",
// not as a silently broken mic button.
const ERROR_MESSAGES = {
  'not-allowed': 'Microphone access was denied. Allow it in your browser\'s site settings and try again.',
  'no-speech': "Didn't catch that — try speaking again.",
  network: "Voice recognition needs an internet connection (Chrome's speech engine is cloud-based) — check your connection.",
  'audio-capture': 'No microphone was found on this device.',
  'service-not-allowed': 'Voice recognition is blocked on this connection — it requires HTTPS or localhost.',
};

export default function VoiceMicModal() {
  const { isVoiceOpen, setIsVoiceOpen, setCurrentRoute, setPendingVoiceQuery } = useMarine();
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(true);
  const [asrError, setAsrError] = useState(null);
  const recognizerRef = useRef(null);
  const [recognizedQuery, setRecognizedQuery] = useState(
    {
      ta: 'நாளை காலை 5 மணிக்கு 8 மீ படகில் கடலுக்கு செல்லலாமா?',
      hi: 'क्या मैं कल सुबह 5 बजे 8 मीटर की नाव में समुद्र जा सकता हूं?',
      ml: 'നാളെ രാവിലെ 5 മണിക്ക് 8 മീറ്റർ ബോട്ടിൽ കടലിൽ പോകാമോ?',
    }[language] || 'Can I venture out tomorrow at 5 AM with my 8m FRP boat?'
  );

  const asrSupported = isSpeechRecognitionSupported();
  // getUserMedia (and therefore live speech recognition) is blocked by
  // browsers on any non-secure origin except localhost — opening the app
  // via a LAN IP (e.g. http://192.168.x.x:5173, printed by `vite --host`)
  // silently disables voice input with no console error at all.
  const secureContext = typeof window !== 'undefined' ? window.isSecureContext : true;
  const voiceAvailable = asrSupported && secureContext;

  useEffect(() => {
    if (!isVoiceOpen || !voiceAvailable) {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
        recognizerRef.current = null;
      }
      return;
    }

    // React.StrictMode (see src/main.jsx) double-invokes this effect in dev:
    // mount -> cleanup -> mount, synchronously. Calling SpeechRecognition
    // .start() on a new instance before the previous instance's abort() has
    // actually torn down (an async, engine-level operation) throws
    // InvalidStateError and silently kills capture. Deferring the real
    // start by a tick lets StrictMode's throwaway mount's cleanup cancel
    // the timer before anything ever starts, so only the real mount fires.
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled || !isListening) return;
      try {
        const recognizer = createSpeechRecognizer({
          language,
          onResult: (text) => {
            if (text.trim()) {
              setRecognizedQuery(text);
              setAsrError(null);
            }
          },
          onError: (err) => {
            console.warn('ASR error:', err);
            if (err !== 'aborted' && err !== 'no-speech') {
              setAsrError(ERROR_MESSAGES[err] || `Voice recognition error: ${err}`);
            }
          },
          onEnd: () => {
            if (isListening && isVoiceOpen && recognizerRef.current === recognizer) {
              try { recognizer.start(); } catch (e) { /* already stopped/aborted — fine */ }
            }
          },
        });
        if (recognizer) {
          recognizer.start();
          recognizerRef.current = recognizer;
        }
      } catch (err) {
        console.warn('Could not start live ASR:', err);
        setAsrError('Could not start the microphone. Try reloading the page.');
      }
    }, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (recognizerRef.current) {
        recognizerRef.current.abort();
        recognizerRef.current = null;
      }
    };
  }, [isVoiceOpen, isListening, language, voiceAvailable]);

  if (!isVoiceOpen) return null;

  const quickQueries = [
    {
      en: 'Is there a squall warning tonight?', ta: 'இன்று இரவு சூறாவளி எச்சரிக்கை உள்ளதா?',
      hi: 'क्या आज रात तूफान की चेतावनी है?', ml: 'ഇന്ന് രാത്രി ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പ് ഉണ്ടോ?',
    },
    {
      en: 'Where is the nearest safe PFZ zone?', ta: 'அருகிலுள்ள பாதுகாப்பான மீன்பிடி மண்டலம் எங்கே?',
      hi: 'निकटतम सुरक्षित मछली पकड़ने का क्षेत्र कहाँ है?', ml: 'ഏറ്റവും അടുത്ത സുരക്ഷിത മീൻപിടിത്ത മേഖല എവിടെയാണ്?',
    },
    {
      en: 'Show me wave height forecast for 24h', ta: '24 மணி நேர அலை உயர முன்னறிவிப்பைக் காட்டு',
      hi: '24 घंटे का लहर ऊंचाई पूर्वानुमान दिखाएं', ml: '24 മണിക്കൂർ തിരമാല ഉയരം പ്രവചനം കാണിക്കുക',
    },
  ];

  const handleSelectQuery = (q) => {
    setRecognizedQuery(q[language] || q.en);
  };

  const handleSubmit = () => {
    const query = recognizedQuery.trim();
    setIsVoiceOpen(false);
    if (query) setPendingVoiceQuery({ text: query, language });
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

        {!voiceAvailable && (
          <div className="w-full p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0">warning</span>
            <span>
              {!asrSupported
                ? "Live voice input isn't supported in this browser — try Chrome or Edge. You can still type your question below."
                : 'Voice input needs a secure connection. Open this app via http://localhost:5173 (not a network IP) or over HTTPS. You can still type your question below.'}
            </span>
          </div>
        )}

        {voiceAvailable && asrError && (
          <div className="w-full p-3 rounded-xl bg-error-container border border-error/30 text-on-error-container text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
            <span>{asrError}</span>
          </div>
        )}

        {/* Pulsating Microphone Visualizer */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Animated concentric rings */}
          {isListening && voiceAvailable && (
            <>
              <span className="absolute w-28 h-28 rounded-full bg-secondary/20 animate-ping"></span>
              <span className="absolute w-36 h-36 rounded-full bg-secondary/10 animate-voice-ripple"></span>
            </>
          )}

          <button
            onClick={() => voiceAvailable && setIsListening(!isListening)}
            disabled={!voiceAvailable}
            className="relative w-20 h-20 rounded-full bg-secondary text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[36px]">
              {!voiceAvailable ? 'mic_off' : isListening ? 'mic' : 'mic_off'}
            </span>
          </button>
        </div>

        {/* Listening Status & Transcript */}
        <div className="flex flex-col items-center text-center gap-1 w-full">
          <span className="font-label-sm text-xs uppercase font-bold text-secondary tracking-wider">
            {!voiceAvailable
              ? 'Voice Input Unavailable'
              : isListening
              ? `${t('assistant.voice')}: ${LANGUAGE_LABELS[language] || 'English'}`
              : 'Microphone Paused'}
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
                {q[language] || q.en}
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
