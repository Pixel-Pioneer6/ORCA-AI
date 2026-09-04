import React, { useState, useEffect, useCallback } from 'react';

// PRD §12.2-12.3 — real, enumerable multi-device sessions with real
// revocation, backed by backend/routes/auth.py's /v1/auth/sessions
// endpoints (SQLite-persisted, not a single opaque "signed in" flag).
export default function ActiveSessionsPanel() {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');

  const token = (() => {
    try { return localStorage.getItem('orca_session_token'); } catch { return null; }
  })();

  const load = useCallback(() => {
    if (!token) return;
    fetch('/api/v1/auth/sessions', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setError('Could not load sessions — backend unreachable.'));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const revoke = async (sessionToken) => {
    try {
      const res = await fetch(`/api/v1/auth/sessions/${sessionToken}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError('Could not revoke that session.');
        return;
      }
      load();
    } catch {
      setError('Could not revoke that session — backend unreachable.');
    }
  };

  if (!token) return null;

  return (
    <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-container">
      <span className="text-[10px] font-bold text-on-surface-variant uppercase">Active Sessions (this identity)</span>
      {error && <p className="text-[10px] text-error">{error}</p>}
      {sessions === null && <p className="text-[10px] text-on-surface-variant">Loading…</p>}
      {sessions?.map((s) => (
        <div key={s.token} className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container text-[11px]">
          <div className="flex flex-col">
            <span className="font-bold text-on-surface">
              {s.tier} session {s.is_current_session ? '(this device)' : ''}
            </span>
            <span className="text-[10px] text-on-surface-variant font-mono">
              Signed in {s.created_at?.slice(0, 16).replace('T', ' ')} UTC · expires {s.expires_at?.slice(0, 10)}
            </span>
          </div>
          {!s.is_current_session && (
            <button
              onClick={() => revoke(s.token)}
              className="px-2 py-1 rounded-md bg-error-container text-on-error-container text-[10px] font-bold hover:opacity-80"
            >
              Sign out device
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
