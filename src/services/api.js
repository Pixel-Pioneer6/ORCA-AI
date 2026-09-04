// Frontend API Service connecting to the ORCA Multi-Agent Backend

const API_BASE = '/api';

export async function chatWithOrca({ query, vesselLoa = 8.2, vesselHp = 9.9, language = 'en', sessionId = 's_default', location = null }) {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // location: null (not omitted) is how a guest with no resolvable
      // position signals that, so the backend can ask a clarifying question
      // (FR-1.2) instead of silently guessing Kasimedu. session_id lets the
      // backend carry real multi-turn memory (FR-1.3) across this chat.
      body: JSON.stringify({
        query,
        vessel_loa: vesselLoa,
        vessel_hp: vesselHp,
        language,
        session_id: sessionId,
        location,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API Chat call failed, falling back to local simulation:', err);
    return null;
  }
}

export async function fetchSafetyVerdict(loa = 8.2, hp = 9.9, time = 'tomorrow 05:00') {
  try {
    const res = await fetch(`${API_BASE}/safety/verdict?loa=${loa}&hp=${hp}&time=${encodeURIComponent(time)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Safety verdict API call failed:', err);
    return null;
  }
}

export async function fetchPfzZones(loa = 8.2, hp = 9.9) {
  try {
    const res = await fetch(`${API_BASE}/pfz/zones?loa=${loa}&hp=${hp}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('PFZ API call failed:', err);
    return null;
  }
}

export async function fetchPortStatus() {
  try {
    const res = await fetch(`${API_BASE}/port/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Port status API call failed:', err);
    return null;
  }
}

// NFR-9: these two broadcast actions are now real, server-enforced,
// role-gated calls (backend/lib/auth_dependencies.py) — the bearer session
// token AuthContext stores in localStorage must be attached, or the
// backend correctly rejects with 401/403 rather than silently succeeding.
export function authHeaders() {
  try {
    const token = localStorage.getItem('orca_session_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function broadcastPortVhf() {
  try {
    const res = await fetch(`${API_BASE}/port/vhf-broadcast`, { method: 'POST', headers: authHeaders() });
    if (!res.ok) return { error: true, status: res.status, detail: (await res.json().catch(() => ({}))).detail };
    return await res.json();
  } catch (err) {
    console.warn('Port VHF broadcast call failed:', err);
    return null;
  }
}

export async function fetchDdmoStatus() {
  try {
    const res = await fetch(`${API_BASE}/ddmo/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('DDMO status API call failed:', err);
    return null;
  }
}

export async function broadcastDdmoSms(zone = 'Zone 04', language = 'ta', alertType = 'HIGH WAVE') {
  try {
    const res = await fetch(`${API_BASE}/ddmo/sms-broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ zone, language, alert_type: alertType }),
    });
    if (!res.ok) return { error: true, status: res.status, detail: (await res.json().catch(() => ({}))).detail };
    return await res.json();
  } catch (err) {
    console.warn('DDMO SMS broadcast call failed:', err);
    return null;
  }
}

export async function fetchResearcherClimatology() {
  try {
    const res = await fetch(`${API_BASE}/researcher/climatology`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Researcher climatology API call failed:', err);
    return null;
  }
}

export async function fetchActiveWarnings() {
  try {
    const res = await fetch(`${API_BASE}/v1/warnings/active`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Cache for the FR-6.11 offline geofence check (guests have no other
    // alert path, so this cache must survive a lost connection).
    try { localStorage.setItem('orca_cached_warnings', JSON.stringify(data)); } catch {}
    return data;
  } catch (err) {
    console.warn('Active warnings fetch failed, using cached set if available:', err);
    try {
      const cached = localStorage.getItem('orca_cached_warnings');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }
}

export async function issueExecutiveDirective(actionName) {
  try {
    const res = await fetch(`${API_BASE}/v1/directives/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ action_name: actionName }),
    });
    if (!res.ok) return { error: true, status: res.status, detail: (await res.json().catch(() => ({}))).detail };
    return await res.json();
  } catch (err) {
    console.warn('Executive directive issuance failed:', err);
    return { error: true, detail: 'Backend unreachable' };
  }
}

export async function recalculateVesselLimits(profile) {
  try {
    const res = await fetch(`${API_BASE}/vessel/calculate-limits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return await res.json();
  } catch (err) {
    console.warn('Vessel recalculation API call failed:', err);
    return null;
  }
}
