// Data-freshness/staleness contract — PRD §12.6.
// "An expired safety number is more dangerous than no number" — hard-expired
// values must be hidden, not merely greyed out.

export const STALENESS_THRESHOLDS = {
  safetyVerdict: { amberHours: 6, hardExpiryHours: 12 },
  warnings: { amberHours: 3, hardExpiryHours: 12 },
  forecast: { amberHours: 6, hardExpiryHours: 12 },
  tide: { amberHours: 48, hardExpiryHours: Infinity },
  pfz: { amberHours: null, hardExpiryHours: null }, // governed by advisory validity window instead
};

function formatAge(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m ago` : `${hours}h ago`;
}

/**
 * @param {string|number|Date} retrievedTime
 * @param {keyof STALENESS_THRESHOLDS} category
 * @param {Date} [nowDate] - injectable for demo time-skip controls
 */
export function getStaleness(retrievedTime, category, nowDate = new Date()) {
  const thresholds = STALENESS_THRESHOLDS[category] || STALENESS_THRESHOLDS.forecast;
  const retrieved = new Date(retrievedTime);
  const ageMs = nowDate.getTime() - retrieved.getTime();
  const ageHours = ageMs / (60 * 60 * 1000);

  let badgeState = 'fresh';
  if (thresholds.hardExpiryHours != null && ageHours >= thresholds.hardExpiryHours) {
    badgeState = 'expired';
  } else if (thresholds.amberHours != null && ageHours >= thresholds.amberHours) {
    badgeState = 'amber';
  }

  return {
    ageLabel: formatAge(ageMs),
    ageHours,
    badgeState,
    isHardExpired: badgeState === 'expired',
  };
}
