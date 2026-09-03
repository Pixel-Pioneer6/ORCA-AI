// Frontend API Service connecting to the ORCA Multi-Agent Backend

const API_BASE = '/api';

export async function chatWithOrca({ query, vesselLoa = 8.2, vesselHp = 9.9, language = 'en' }) {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, vessel_loa: vesselLoa, vessel_hp: vesselHp, language }),
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

export async function broadcastPortVhf() {
  try {
    const res = await fetch(`${API_BASE}/port/vhf-broadcast`, { method: 'POST' });
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone, language, alert_type: alertType }),
    });
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
