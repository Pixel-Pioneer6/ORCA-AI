import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Real auth client — PRD §12. Talks to the backend's SQLite-backed identity
// store (backend/lib/auth_store.py, backend/routes/auth.py) instead of the
// old localStorage-only mock: a bearer session token is the only thing kept
// client-side, and heldRoles/pendingRoles/identity are always the server's
// answer, fetched fresh via GET /v1/auth/me — never fabricated locally.

const API_BASE = '/api';
const TOKEN_KEY = 'orca_session_token';

// §12.2 verification gradient (mirrors backend/routes/auth.py TIER_CONFIG)
export const ROLE_VERIFICATION = {
  fisherman: { method: 'phone', needsInviteCode: false, label: 'Fisherman / Vessel Operator', sessionDays: 30 },
  researcher: { method: 'email', needsInviteCode: false, label: 'Researcher', sessionDays: 7 },
  port: { method: 'email', needsInviteCode: false, label: 'Port Operator', sessionDays: 7, domainLocked: true },
  ddmo: { method: 'email', needsInviteCode: true, label: 'DDMO / Disaster Management', sessionDays: 7 },
  authority: { method: 'email', needsInviteCode: true, label: 'Authority / Fisheries Dept.', sessionDays: 7 },
};

const AuthContext = createContext();

async function apiPost(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body || {}) });
  return res.json();
}

async function apiGet(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}${path}`, { headers });
  return res.json();
}

export function AuthProvider({ children }) {
  const [sessionToken, setSessionToken] = useState(() => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  });
  const [heldRoles, setHeldRoles] = useState([]);
  const [pendingRoles, setPendingRoles] = useState([]);
  const [identity, setIdentity] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [guestQueryCount, setGuestQueryCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTarget, setAuthModalTarget] = useState(null);
  // The identity value an OTP was just requested for — verifyOtp() needs it
  // but the modal only carries the code back, not the phone/email again.
  const pendingIdentityRef = useRef(null);

  // Restore the session from the server on load. The server is the source
  // of truth (SQLite), so a locally-edited or stale localStorage value can
  // never grant a role it wasn't actually issued for.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionToken) { setAuthReady(true); return; }
      try {
        const me = await apiGet('/v1/auth/me', sessionToken);
        if (cancelled) return;
        if (me.authenticated) {
          setHeldRoles(me.held_roles || []);
          setPendingRoles(me.pending_roles || []);
          setIdentity(me.identity || null);
        } else {
          try { localStorage.removeItem(TOKEN_KEY); } catch {}
          setSessionToken(null);
        }
      } catch {
        // Backend unreachable — fail open to guest rather than blocking the UI.
      }
      if (!cancelled) setAuthReady(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While a role is pending admin sign-off, poll the server for the real
  // state change — the backend flips it via its own delayed task
  // (backend/routes/auth.py's _auto_approve_after_delay), so the client
  // just needs to notice, not simulate the transition itself.
  useEffect(() => {
    if (pendingRoles.length === 0 || !sessionToken) return;
    const interval = setInterval(async () => {
      try {
        const me = await apiGet('/v1/auth/me', sessionToken);
        if (me.authenticated) {
          setHeldRoles(me.held_roles || []);
          setPendingRoles(me.pending_roles || []);
        }
      } catch {
        // transient network hiccup — next poll will retry
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [pendingRoles.length, sessionToken]);

  const isGuest = heldRoles.length === 0;

  const openAuth = (targetTier = 'fisherman') => {
    setAuthModalTarget(targetTier);
    setAuthModalOpen(true);
  };
  const closeAuth = () => setAuthModalOpen(false);

  const requestOtp = async ({ tier, value, inviteCode }) => {
    pendingIdentityRef.current = value;
    return apiPost('/v1/auth/request-otp', { tier, identity_value: value, invite_code: inviteCode });
  };

  const verifyOtp = async ({ tier, code, inviteCode }) => {
    const value = pendingIdentityRef.current;
    if (!value) return { ok: false, reason: 'Session expired — request a new code' };

    const result = await apiPost('/v1/auth/verify-otp', {
      tier, identity_value: value, code, invite_code: inviteCode,
    });

    if (result.ok) {
      setSessionToken(result.session_token);
      try { localStorage.setItem(TOKEN_KEY, result.session_token); } catch {}
      setIdentity({ method: ROLE_VERIFICATION[tier]?.method || 'phone', value });
      if (result.pending) {
        setPendingRoles((prev) => Array.from(new Set([...prev, tier])));
      } else {
        setHeldRoles((prev) => Array.from(new Set([...prev, tier])));
      }
    }
    return result;
  };

  const signOut = async () => {
    if (sessionToken) {
      try { await apiPost('/v1/auth/logout', {}, sessionToken); } catch { /* best-effort */ }
    }
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    setSessionToken(null);
    setHeldRoles([]);
    setPendingRoles([]);
    setIdentity(null);
  };

  const incrementGuestQuery = () => setGuestQueryCount((c) => c + 1);

  return (
    <AuthContext.Provider
      value={{
        isGuest,
        heldRoles,
        pendingRoles,
        identity,
        authReady,
        guestQueryCount,
        incrementGuestQuery,
        authModalOpen,
        authModalTarget,
        openAuth,
        closeAuth,
        requestOtp,
        verifyOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
