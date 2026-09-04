import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMarine } from '../../context/MarineContext';
import { fetchActiveWarnings } from '../../services/api';
import { findIntersectingWarnings } from '../../lib/geofence';

// FR-6.11 — the ONLY alert mechanism available to a guest (no push/SMS
// without a stored identity, FR-6.9): on every app launch, check the last
// known device position against the cached warning-polygon set and show a
// full-screen banner if it intersects.
export default function GeofenceAlertBanner() {
  const { isGuest } = useAuth();
  const { activeLocation } = useMarine();
  const [hit, setHit] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isGuest) return;

    let cancelled = false;

    const runCheck = async (lat, lon) => {
      const warnings = await fetchActiveWarnings();
      if (cancelled || !Array.isArray(warnings) || warnings.length === 0) return;
      const intersecting = findIntersectingWarnings(lat, lon, warnings);
      if (intersecting.length > 0) setHit(intersecting[0]);
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => runCheck(pos.coords.latitude, pos.coords.longitude),
        () => runCheck(activeLocation.lat, activeLocation.lon), // permission denied — fall back to saved home port
        { timeout: 5000 }
      );
    } else {
      runCheck(activeLocation.lat, activeLocation.lon);
    }

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  if (!isGuest || !hit || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-error/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
      <span className="material-symbols-outlined text-[64px] mb-2">crisis_alert</span>
      <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-3">
        {hit.severity} · {hit.hazard_type}
      </span>
      <h1 className="text-2xl font-bold mb-2">{hit.title}</h1>
      <p className="text-sm text-white/90 max-w-md mb-1">{hit.description}</p>
      <p className="text-xs text-white/70 mb-6">
        Valid until {new Date(hit.valid_until).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} &middot; {hit.agency}
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          onClick={() => setDismissed(true)}
          className="py-3 rounded-lg bg-white text-error font-bold text-sm shadow-lg"
        >
          I understand — return to shore
        </button>
        <p className="text-[10px] text-white/70">
          Sign in to receive this as a push/SMS alert automatically next time.
        </p>
      </div>
    </div>
  );
}
