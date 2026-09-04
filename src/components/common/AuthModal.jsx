import React, { useState } from 'react';
import { useAuth, ROLE_VERIFICATION } from '../../context/AuthContext';
import { useMarine } from '../../context/MarineContext';

const TIER_ORDER = ['fisherman', 'researcher', 'port', 'ddmo', 'authority'];
const TIER_TO_MARINE_ROLE = { fisherman: 'fisher', researcher: 'researcher', port: 'port', ddmo: 'ddmo', authority: 'authority' };
// Mirrors backend/lib/auth_store.py's SEED_INVITE_CODES — shown as a visible
// hint since a placeholder alone reads as "just an example" to most users,
// even when (as here) it's literally the real working demo code.
const DEMO_INVITE_CODES = { ddmo: 'DDMO-KSM-04', authority: 'AUTH-CZM-01' };

export default function AuthModal() {
  const { authModalOpen, authModalTarget, closeAuth, requestOtp, verifyOtp } = useAuth();
  const { setCurrentRole } = useMarine();
  const [tier, setTier] = useState(authModalTarget || 'fisherman');
  const [step, setStep] = useState('tier'); // 'tier' | 'identify' | 'otp' | 'pending' | 'done'
  const [value, setValue] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [devNote, setDevNote] = useState('');
  const [sending, setSending] = useState(false);

  if (!authModalOpen) return null;

  const cfg = ROLE_VERIFICATION[tier];

  const reset = () => {
    setStep('tier');
    setValue('');
    setInviteCode('');
    setOtp('');
    setError('');
    setDevOtp(null);
    setDevNote('');
  };

  const handleClose = () => {
    reset();
    closeAuth();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!value.trim()) return setError('Enter your ' + (cfg.method === 'phone' ? 'phone number' : 'email address'));
    if (cfg.needsInviteCode && !inviteCode.trim()) return setError('Enter your admin-provisioned invite code');
    setError('');
    setSending(true);
    const res = await requestOtp({ tier, value, inviteCode });
    setSending(false);
    if (!res.sent) return setError(res.reason || 'Could not send code — try again');
    setDevOtp(res.dev_otp || null);
    setDevNote(res.dev_note || '');
    setStep('otp');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const res = await verifyOtp({ tier, code: otp, inviteCode });
    if (!res.ok) return setError(res.reason);
    if (res.pending) {
      setStep('pending');
      setTimeout(() => {
        setStep('done');
        setCurrentRole(TIER_TO_MARINE_ROLE[tier]);
      }, 2600);
    } else {
      setStep('done');
      setCurrentRole(TIER_TO_MARINE_ROLE[tier]);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl p-pad-lg flex flex-col gap-pad-sm border border-surface-container-high pb-safe">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">badge</span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Sign In to ORCA</span>
          </div>
          <button onClick={handleClose} aria-label="Close sign-in" className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {step === 'tier' && (
          <div className="flex flex-col gap-2 pt-1">
            <p className="text-xs text-on-surface-variant">
              Guests can already ask ORCA anything. Signing in unlocks saved zones, push/SMS alerts, and role-specific tools.
            </p>
            {TIER_ORDER.map((id) => (
              <button
                key={id}
                onClick={() => { setTier(id); setStep('identify'); }}
                className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${tier === id ? 'border-secondary bg-surface-container-low' : 'border-surface-container-high hover:bg-surface-container-low'}`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-on-surface">{ROLE_VERIFICATION[id].label}</span>
                  <span className="text-[10px] text-on-surface-variant">
                    {ROLE_VERIFICATION[id].method === 'phone' ? 'Phone + OTP' : 'Work email + OTP'}
                    {ROLE_VERIFICATION[id].needsInviteCode ? ' · Invite code required' : ''}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
              </button>
            ))}
          </div>
        )}

        {step === 'identify' && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-3 pt-1">
            <p className="text-xs text-on-surface-variant">{cfg.label} &middot; verification via {cfg.method === 'phone' ? 'phone OTP' : 'work-email OTP'}.</p>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                {cfg.method === 'phone' ? 'Phone number' : 'Email address'}
              </label>
              <input
                type={cfg.method === 'phone' ? 'tel' : 'email'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={cfg.method === 'phone' ? '+91 98765 43210' : 'name@department.gov.in'}
                className="w-full p-2.5 text-sm rounded-lg border border-surface-container-high bg-surface-container-low"
              />
            </div>
            {cfg.needsInviteCode && (
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Admin invite code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g. DDMO-KSM-04"
                  className="w-full p-2.5 text-sm rounded-lg border border-surface-container-high bg-surface-container-low font-mono"
                />
                <p className="text-[10px] text-secondary font-semibold mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>
                    Prototype demo code for this role:{' '}
                    <span className="font-mono bg-secondary/10 px-1 py-0.5 rounded">{DEMO_INVITE_CODES[tier]}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setInviteCode(DEMO_INVITE_CODES[tier])}
                    className="underline hover:no-underline"
                  >
                    Use it
                  </button>
                </p>
              </div>
            )}
            {error && <p className="text-xs text-error font-semibold">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setStep('tier')} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface text-xs font-bold">Back</button>
              <button type="submit" disabled={sending} className="flex-1 py-2.5 rounded-lg bg-primary text-white text-xs font-bold shadow-sm disabled:opacity-60">
                {sending ? 'Sending…' : 'Send OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerify} className="flex flex-col gap-3 pt-1">
            <p className="text-xs text-on-surface-variant">
              A verification code was generated for <strong>{value}</strong>.
            </p>
            {devOtp && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs flex flex-col gap-1">
                <span>
                  Prototype mode — real code: <span className="font-mono font-bold text-sm">{devOtp}</span>
                </span>
                <span className="text-[10px] opacity-80">{devNote}</span>
              </div>
            )}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
              className="w-full p-3 text-center text-lg tracking-[0.5em] font-mono rounded-lg border border-surface-container-high bg-surface-container-low"
            />
            {error && <p className="text-xs text-error font-semibold">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setStep('identify')} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface text-xs font-bold">Back</button>
              <button type="submit" className="flex-1 py-2.5 rounded-lg bg-primary text-white text-xs font-bold shadow-sm">Verify</button>
            </div>
          </form>
        )}

        {step === 'pending' && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="material-symbols-outlined text-[36px] text-amber-600 animate-pulse">hourglass_top</span>
            <p className="text-sm font-bold text-on-surface">Pending admin approval</p>
            <p className="text-xs text-on-surface-variant max-w-xs">
              {cfg.label} accounts require a second admin's sign-off (§12.2). You have researcher-level access in the meantime.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="material-symbols-outlined text-[36px] text-emerald-600">check_circle</span>
            <p className="text-sm font-bold text-on-surface">Verified as {cfg.label}</p>
            <button onClick={handleClose} className="mt-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold">Continue</button>
          </div>
        )}
      </div>
    </div>
  );
}
