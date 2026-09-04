// Web Speech API Service for Live Multilingual Maritime ASR & TTS (PRD §8.1, D-1)

// FR-1.1: EN/HI plus two coastal languages (Tamil, Malayalam) — the Web
// Speech API's BCP-47 locale tags for each, used for both recognition and
// synthesis so voice input and voice reply (FR-1.5) cover the same set.
export const SUPPORTED_VOICE_LANGUAGES = ['en', 'hi', 'ta', 'ml'];
const LOCALE_MAP = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', ml: 'ml-IN' };

export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}

export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function createSpeechRecognizer({ language = 'en', onResult, onError, onEnd }) {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.lang = LOCALE_MAP[language] || 'en-IN';

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    if (onResult) onResult(transcript);
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}

export function speakText(text, language = 'en') {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported in this browser environment.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95; // Slightly measured pace for wet-hand deck environments
  utterance.pitch = 1.0;

  utterance.lang = LOCALE_MAP[language] || 'en-IN';

  // Pick voice if available
  const voices = window.speechSynthesis.getVoices();
  const targetVoice = voices.find((v) => v.lang.startsWith(utterance.lang));
  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  window.speechSynthesis.speak(utterance);
}
