import React, { useState } from 'react';
import { useMarine } from '../context/MarineContext';
import { useLanguage } from '../context/LanguageContext';

export default function AssistantPage() {
  const { setCurrentRoute, setIsVoiceOpen } = useMarine();
  const { language } = useLanguage();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'user',
      text: language === 'ta'
        ? 'நாளை காலை 5 மணிக்கு எனது 8 மீ படகில் கடலுக்கு செல்லலாமா?'
        : 'Can I venture out tomorrow at 5 AM with my 8m FRP boat?',
      time: '15:42 IST',
      isVoice: true,
    },
    {
      id: 2,
      sender: 'orca',
      verdict: 'CAUTION',
      verdictTa: 'எச்சரிக்கை',
      verdictColor: 'bg-amber-50 text-amber-950 border-amber-300',
      badgeColor: 'bg-amber-500 text-white',
      text: 'Tomorrow morning from 05:00 to 10:00 IST is marginal for your 8m motorized FRP boat. Breaker waves out of Kasimedu harbour bar reach 1.8m (exceeding your 1.5m safe limit), with squalls of 24 kt. Not recommended for non-decked craft without experienced crew.',
      time: '15:42 IST',
      confidence: '84% MEDIUM',
      sources: 'INCOIS OSF + IMD Doppler Radar',
    },
    {
      id: 3,
      sender: 'user',
      text: language === 'ta'
        ? 'அப்படியானால் எப்போது செல்வது பாதுகாப்பானது?'
        : 'When is the safest alternative time to depart?',
      time: '15:43 IST',
    },
    {
      id: 4,
      sender: 'orca',
      verdict: 'SAFE WINDOW',
      verdictTa: 'பாதுகாப்பான நேரம்',
      verdictColor: 'bg-emerald-50 text-emerald-950 border-emerald-300',
      badgeColor: 'bg-emerald-600 text-white',
      text: 'Recommended Departure Window: Tomorrow afternoon from 14:00 to 19:00 IST. Swells drop to 1.1m (well within 1.5m limit) and surface winds decrease to 10 kt. Optimal for coastal trolling.',
      time: '15:43 IST',
      confidence: '92% HIGH',
      sources: 'INCOIS WAVEWATCH-III Forecast',
    },
  ]);

  const [inputVal, setInputVal] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputVal,
      time: 'Just now',
    };

    setMessages((prev) => [
      ...prev,
      newMsg,
      {
        id: Date.now() + 1,
        sender: 'orca',
        verdict: 'CHECKED',
        verdictTa: 'சரிபார்க்கப்பட்டது',
        verdictColor: 'bg-surface-container-low text-on-surface border-surface-container',
        badgeColor: 'bg-secondary text-white',
        text: `Processing live query "${inputVal}" against INCOIS and IMD sensor feeds. Conditions at Kasimedu harbour are currently monitored at 1.8m SWH.`,
        time: 'Just now',
        confidence: '89%',
        sources: 'MOSDAC Realtime Ingest',
      },
    ]);
    setInputVal('');
  };

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
            <span className="font-bold text-xs text-on-surface">ORCA Conversational Assistant</span>
            <span className="text-[10px] text-on-surface-variant">Tamil · English · Hindi Voice Engine</span>
          </div>
        </div>
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="px-2.5 py-1 rounded-lg bg-secondary text-white text-xs font-bold flex items-center gap-1 shadow-xs"
        >
          <span className="material-symbols-outlined text-[15px]">mic</span>
          <span>Voice</span>
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
                      onClick={() => alert('Playing bilingual audio advisory in Tamil/English...')}
                      className="text-secondary p-0.5 hover:bg-black/5 rounded-full"
                      title="Listen Audio"
                    >
                      <span className="material-symbols-outlined text-[18px]">volume_up</span>
                    </button>
                  </div>

                  <p className="leading-relaxed font-body-md text-xs">{m.text}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[10px] opacity-75">
                    <span>Confidence: <strong>{m.confidence}</strong></span>
                    <span>{m.sources}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
            placeholder="Type your question in Tamil or English..."
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
