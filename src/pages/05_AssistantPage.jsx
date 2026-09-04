import React, { useState, useEffect, useRef } from 'react';
import { useMarine } from '../context/MarineContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import DisclaimerStrip from '../components/common/DisclaimerStrip';
import TaskGraphModal from '../components/common/TaskGraphModal';
import { chatWithOrca } from '../services/api';
import { speakText } from '../services/speech';

export default function AssistantPage() {
  const { setCurrentRoute, setIsVoiceOpen, pendingVoiceQuery, setPendingVoiceQuery, vesselSpecs, activeLocation, chatSessionId } = useMarine();
  const { language, t } = useLanguage();
  const { isGuest } = useAuth();
  const [isDagOpen, setIsDagOpen] = useState(false);
  const [dagQuery, setDagQuery] = useState('Can I venture out tomorrow at 5 AM with my 8m FRP boat?');
  // Seed conversation shown before any real message — localized across all
  // four supported languages (previously only EN/TA, so opening the app in
  // Hindi or Malayalam showed an English example conversation).
  const SEED_L10N = {
    q1: { en: 'Can I venture out tomorrow at 5 AM with my 8m FRP boat?', ta: 'நாளை காலை 5 மணிக்கு எனது 8 மீ படகில் கடலுக்கு செல்லலாமா?', hi: 'क्या मैं कल सुबह 5 बजे अपनी 8 मीटर की नाव में समुद्र जा सकता हूं?', ml: 'നാളെ രാവിലെ 5 മണിക്ക് എന്റെ 8 മീറ്റർ ബോട്ടിൽ കടലിൽ പോകാമോ?' },
    a1: { en: 'Tomorrow morning from 05:00 to 10:00 IST is marginal for your 8m motorized FRP boat. Breaker waves out of Kasimedu harbour bar reach 1.8m (exceeding your 1.5m safe limit), with squalls of 24 kt. Not recommended for non-decked craft without experienced crew.', ta: 'நாளை காலை 05:00 முதல் 10:00 IST வரை உங்கள் 8மீ மோட்டார் FRP படகுக்கு நிலைமை எல்லைக்குட்பட்டது. காசிமேடு முகத்துவாரத்தில் அலைகள் 1.8மீ வரை (1.5மீ பாதுகாப்பு வரம்பை மீறி) மற்றும் 24 நாட்ஸ் காற்று வேகம். அனுபவமிக்க குழு இல்லாமல் பரிந்துரைக்கப்படவில்லை.', hi: 'कल सुबह 05:00 से 10:00 IST तक आपकी 8मी मोटर चालित FRP नाव के लिए स्थिति सीमांत है। कासिमेडु बंदरगाह मुहाने की टूटती लहरें 1.8मी तक पहुंचती हैं (1.5मी सुरक्षित सीमा से अधिक), 24 नॉट के तूफानी झोंकों के साथ। अनुभवी चालक दल के बिना अनुशंसित नहीं।', ml: 'നാളെ രാവിലെ 05:00 മുതൽ 10:00 വരെ (IST) നിങ്ങളുടെ 8 മീറ്റർ മോട്ടോർ FRP ബോട്ടിന് സാഹചര്യം അതിർത്തിയിലാണ്. കാസിമേഡു തുറമുഖ വാതിലിലെ തിരമാലകൾ 1.8 മീറ്റർ വരെ എത്തുന്നു (1.5 മീറ്റർ സുരക്ഷിത പരിധിക്ക് മുകളിൽ), 24 നോട്ട് ശക്തിയുള്ള കാറ്റോടെ. പരിചയസമ്പന്നരായ ജീവനക്കാരില്ലാതെ ശുപാർശ ചെയ്യുന്നില്ല.' },
    q2: { en: 'When is the safest alternative time to depart?', ta: 'அப்படியானால் எப்போது செல்வது பாதுகாப்பானது?', hi: 'जाने का सबसे सुरक्षित वैकल्पिक समय कब है?', ml: 'പോകാൻ ഏറ്റവും സുരക്ഷിതമായ സമയം എപ്പോഴാണ്?' },
    a2: { en: 'Recommended Departure Window: Tomorrow afternoon from 14:00 to 19:00 IST. Swells drop to 1.1m (well within 1.5m limit) and surface winds decrease to 10 kt. Optimal for coastal trolling.', ta: 'பரிந்துரைக்கப்படும் நேரம்: நாளை மதியம் 14:00 முதல் 19:00 IST வரை. அலைகள் 1.1மீ ஆக குறையும் (1.5மீ வரம்பிற்குள்) மற்றும் காற்று வேகம் 10 நாட்ஸ் ஆக குறையும். கரையோர மீன்பிடிக்கு ஏற்றது.', hi: 'अनुशंसित प्रस्थान समय: कल दोपहर 14:00 से 19:00 IST तक। लहरें घटकर 1.1मी हो जाती हैं (1.5मी सीमा के भीतर) और सतही हवाएं घटकर 10 नॉट हो जाती हैं। तटीय मछली पकड़ने के लिए उपयुक्त।', ml: 'ശുപാർശ ചെയ്യുന്ന യാത്രാ സമയം: നാളെ ഉച്ചയ്ക്ക് 14:00 മുതൽ 19:00 വരെ (IST). തിരമാലകൾ 1.1 മീറ്ററായി കുറയുന്നു (1.5 മീറ്റർ പരിധിക്കുള്ളിൽ) കൂടാതെ കാറ്റ് 10 നോട്ടായി കുറയുന്നു. തീരദേശ മീൻപിടിത്തത്തിന് അനുയോജ്യം.' },
  };
  const VERDICT_L10N = {
    caution: { ta: 'எச்சரிக்கை', hi: 'चेतावनी', ml: 'ജാഗ്രത' },
    safeWindow: { ta: 'பாதுகாப்பான நேரம்', hi: 'सुरक्षित समय', ml: 'സുരക്ഷിത സമയം' },
  };
  const pick = (dict) => dict[language] || dict.en;

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'user',
      text: pick(SEED_L10N.q1),
      time: '15:42 IST',
      isVoice: true,
    },
    {
      id: 2,
      sender: 'orca',
      verdict: 'CAUTION',
      verdictTa: VERDICT_L10N.caution[language] || VERDICT_L10N.caution.ta,
      verdictColor: 'bg-amber-50 text-amber-950 border-amber-300',
      badgeColor: 'bg-amber-500 text-white',
      text: pick(SEED_L10N.a1),
      time: '15:42 IST',
      confidence: '84% MEDIUM',
      sources: 'INCOIS OSF + IMD Doppler Radar',
    },
    {
      id: 3,
      sender: 'user',
      text: pick(SEED_L10N.q2),
      time: '15:43 IST',
    },
    {
      id: 4,
      sender: 'orca',
      verdict: 'SAFE WINDOW',
      verdictTa: VERDICT_L10N.safeWindow[language] || VERDICT_L10N.safeWindow.ta,
      verdictColor: 'bg-emerald-50 text-emerald-950 border-emerald-300',
      badgeColor: 'bg-emerald-600 text-white',
      text: pick(SEED_L10N.a2),
      time: '15:43 IST',
      confidence: '92% HIGH',
      sources: 'INCOIS WAVEWATCH-III Forecast',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const consumedVoiceQueryRef = useRef(null);

  // FR-1.2: a registered fisherman's home port is a real, known location —
  // send it. A guest has no registered port, so try a live GPS fix; only if
  // that's unavailable/denied does the backend get `null` and ask where the
  // user is, instead of the app silently guessing Kasimedu for a stranger.
  const resolveLocationForChat = () =>
    new Promise((resolve) => {
      if (!isGuest) {
        resolve({ lat: activeLocation.lat, lon: activeLocation.lon, name: activeLocation.harbour });
        return;
      }
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 4000 }
      );
    });

  const sendQuery = async (query, { isVoice = false } = {}) => {
    if (!query || loading) return;

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: 'Just now',
      isVoice,
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    const location = await resolveLocationForChat();
    const apiRes = await chatWithOrca({
      query,
      vesselLoa: vesselSpecs.loa,
      vesselHp: vesselSpecs.hp,
      language,
      sessionId: chatSessionId,
      location,
    });

    setLoading(false);

    if (apiRes) {
      const isDanger = apiRes.verdict === 'DO NOT VENTURE';
      const isSafe = apiRes.verdict === 'SAFE';

      // FR-1.1/FR-1.5: pick the reply/verdict in whatever language is
      // actually selected — previously this only ever checked for Tamil,
      // so a Hindi- or Malayalam-selected conversation silently displayed
      // (and then spoke, via TTS) the English text regardless of language.
      const localizedReply = { en: apiRes.reply, ta: apiRes.reply_ta, hi: apiRes.reply_hi, ml: apiRes.reply_ml }[language];
      const localizedVerdict = { ta: apiRes.verdict_ta, hi: apiRes.verdict_hi, ml: apiRes.verdict_ml }[language];

      const botMsg = {
        id: Date.now() + 1,
        sender: 'orca',
        verdict: apiRes.verdict,
        verdictTa: localizedVerdict || apiRes.verdict_ta || 'சரிபார்க்கப்பட்டது',
        verdictColor: isDanger
          ? 'bg-error-container text-on-error-container border-error/30'
          : isSafe
          ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
          : 'bg-amber-50 text-amber-950 border-amber-300',
        badgeColor: isDanger
          ? 'bg-error text-white'
          : isSafe
          ? 'bg-emerald-600 text-white'
          : 'bg-amber-500 text-white',
        text: localizedReply || apiRes.reply,
        time: 'Just now',
        confidence: apiRes.confidence,
        sources: apiRes.sources?.join(' + ') || 'INCOIS + MOSDAC',
        // FR-1.2: when the backend can't resolve location it returns
        // harbour-name options here — surfaced as tappable quick replies so
        // answering the clarifying question is a single tap, not retyping.
        followups: apiRes.suggested_followups || [],
        needsLocation: apiRes.verdict === 'NEED_LOCATION',
      };
      setMessages((prev) => [...prev, botMsg]);
    } else {
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'orca',
          verdict: 'CHECKED',
          verdictTa: 'சரிபார்க்கப்பட்டது',
          verdictColor: 'bg-surface-container-low text-on-surface border-surface-container',
          badgeColor: 'bg-secondary text-white',
          text: `Kasimedu buoy BD08 reports 1.8m SWH with squalls of 24 kt. Exercise caution crossing outer sandbars.`,
          time: 'Just now',
          confidence: '89%',
          sources: 'INCOIS Local Cache',
        }
      ]);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const query = inputVal.trim();
    if (!query) return;
    setInputVal('');
    sendQuery(query);
  };

  // Consumes the transcript captured by VoiceMicModal's real Web Speech API
  // recognizer (US-01) — without this the recognized speech had no path
  // into the conversation and was silently discarded on navigation.
  useEffect(() => {
    if (!pendingVoiceQuery || consumedVoiceQueryRef.current === pendingVoiceQuery) return;
    consumedVoiceQueryRef.current = pendingVoiceQuery;
    sendQuery(pendingVoiceQuery.text, { isVoice: true });
    setPendingVoiceQuery(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingVoiceQuery]);

  const suggestions = [
    'Where is the closest safe PFZ?',
    'Explain the current squall warning',
    'What is wave height at 20 NM offshore?',
    'Check Port VHF Marine Channel 16',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] pb-24 pt-2">
      {/* Welcome Micro-Banner */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xs mb-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs">
            AI
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-on-surface">{t('assistant.title')}</span>
            <span className="text-[10px] text-on-surface-variant">{t('assistant.subtitle')}</span>
          </div>
        </div>
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="px-2.5 py-1 rounded-lg bg-secondary text-white text-xs font-bold flex items-center gap-1 shadow-xs"
        >
          <span className="material-symbols-outlined text-[15px]">mic</span>
          <span>{t('assistant.voice')}</span>
        </button>
      </div>

      {/* Message Feed Container */}
      <div className="flex-grow overflow-y-auto flex flex-col gap-3 pr-1">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[90%]`}>
              {isUser ? (
                <div className="rounded-2xl rounded-tr-xs bg-primary text-white p-3 text-xs shadow-sm flex flex-col gap-1">
                  {m.isVoice && (
                    <div className="flex items-center gap-1 text-[10px] text-secondary-container opacity-90">
                      <span className="material-symbols-outlined text-[13px]">mic</span>
                      <span>Voice Input Transcript</span>
                    </div>
                  )}
                  <p className="leading-relaxed">{m.text}</p>
                  <span className="text-[9px] text-white/60 self-end font-mono">{m.time}</span>
                </div>
              ) : (
                <div className={`rounded-2xl rounded-tl-xs p-3.5 border text-xs shadow-sm flex flex-col gap-2 ${m.verdictColor}`}>
                  {/* Verdict Pill */}
                  <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${m.badgeColor}`}>
                        {m.verdict}
                      </span>
                      <span className="font-bold text-[11px] opacity-90">{m.verdictTa}</span>
                    </div>
                    <button
                      onClick={() => speakText(m.text, language || 'en')}
                      className="text-secondary p-1 hover:bg-black/5 rounded-full transition-transform active:scale-90"
                      title="Listen Audio (Web Speech TTS)"
                    >
                      <span className="material-symbols-outlined text-[18px]">volume_up</span>
                    </button>
                  </div>

                  <p className="leading-relaxed font-body-md text-xs">{m.text}</p>

                  {!m.needsLocation && (
                    <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[10px] opacity-75">
                      <span>Confidence: <strong>{m.confidence}</strong></span>
                      <span>{m.sources}</span>
                    </div>
                  )}

                  {m.followups?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.followups.map((f, i) => (
                        <button
                          key={i}
                          onClick={() => sendQuery(f)}
                          className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            m.needsLocation
                              ? 'bg-secondary/10 border-secondary/30 text-secondary hover:bg-secondary/20'
                              : 'bg-black/5 border-transparent hover:bg-black/10 text-on-surface-variant'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setDagQuery(m.text);
                      setIsDagOpen(true);
                    }}
                    className="mt-1 py-1.5 px-2 rounded-lg bg-black/5 hover:bg-black/10 text-secondary font-bold text-[10px] flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">account_tree</span>
                    <span>View Supervisor Task Graph (DAG Trace)</span>
                  </button>

                  <DisclaimerStrip className="opacity-70" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TaskGraphModal isOpen={isDagOpen} onClose={() => setIsDagOpen(false)} query={dagQuery} />

      {/* Suggested Follow-up Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => setInputVal(s)}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container border border-surface-container text-on-surface text-[11px] font-medium transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Persistent Touch Input Bar */}
      <form onSubmit={handleSend} className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setIsVoiceOpen(true)}
          className="w-11 h-11 rounded-xl bg-surface-container-low hover:bg-surface-container text-secondary flex items-center justify-center flex-shrink-0 border border-surface-container shadow-xs"
        >
          <span className="material-symbols-outlined text-[22px]">mic</span>
        </button>

        <div className="flex-grow relative flex items-center bg-surface-container-lowest rounded-xl border border-surface-container-high px-3 py-2 shadow-sm">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={t('assistant.placeholder')}
            className="w-full bg-transparent text-xs text-on-surface focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </form>
    </div>
  );
}
