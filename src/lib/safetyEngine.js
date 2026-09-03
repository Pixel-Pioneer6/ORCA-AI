// Deterministic safety rule engine — PRD §9.
// The verdict is always computed from thresholds; nothing upstream may override it directly.

export const VESSEL_CLASSES = {
  nonMotorized: {
    label: 'Non-motorized / Catamaran',
    doNotVenture: { wave: 1.5, wind: 20 },
    caution: { wave: 1.0, wind: 15 },
  },
  motorized: {
    label: 'Motorized (< 10m)',
    doNotVenture: { wave: 2.5, wind: 25 },
    caution: { wave: 1.5, wind: 18 },
  },
  mechanized: {
    label: 'Mechanized (10-20m)',
    doNotVenture: { wave: 3.5, wind: 34 },
    caution: { wave: 2.5, wind: 25 },
  },
};

export function classifyVessel(loaMeters) {
  if (loaMeters >= 10) return 'mechanized';
  if (loaMeters >= 6) return 'motorized';
  return 'nonMotorized';
}

/**
 * evaluateSafety — pure function, no side effects.
 * @param {object} params
 * @param {number} params.wave - significant wave height, meters
 * @param {number} params.wind - sustained/gust wind, knots
 * @param {number} params.loaMeters - vessel length overall, used to pick the threshold band
 * @param {object} [params.overrides] - absolute-override flags (any true forces DO_NOT_VENTURE)
 * @param {boolean} [params.dataMissing] - required variables unavailable
 * @returns {{verdict: 'SAFE'|'CAUTION'|'DO_NOT_VENTURE'|'INSUFFICIENT_DATA', drivers: string[], exceedance: {wave: number, wind: number}, vesselClass: string, thresholds: object}}
 */
export function evaluateSafety({ wave, wind, loaMeters, overrides = {}, dataMissing = false }) {
  const vesselClass = classifyVessel(loaMeters);
  const thresholds = VESSEL_CLASSES[vesselClass];

  if (dataMissing) {
    return {
      verdict: 'INSUFFICIENT_DATA',
      drivers: ['Required forecast variables unavailable — no acceptable fallback'],
      exceedance: { wave: 0, wind: 0 },
      vesselClass,
      thresholds,
    };
  }

  const overrideDrivers = [];
  if (overrides.cycloneOrSquallWarning) overrideDrivers.push('Active IMD cyclone/squall warning covering this point/time');
  if (overrides.highWaveOrSwellSurge) overrideDrivers.push('INCOIS high-wave / swell-surge alert for this coastal segment');
  if (overrides.tsunamiBulletin) overrideDrivers.push('Tsunami bulletin in effect');

  const waveExceedance = thresholds.doNotVenture.wave > 0 ? wave / thresholds.doNotVenture.wave : 0;
  const windExceedance = thresholds.doNotVenture.wind > 0 ? wind / thresholds.doNotVenture.wind : 0;
  const exceedance = {
    wave: Math.round(Math.min(waveExceedance, 1.2) * 100),
    wind: Math.round(Math.min(windExceedance, 1.2) * 100),
  };

  if (overrideDrivers.length > 0) {
    return { verdict: 'DO_NOT_VENTURE', drivers: overrideDrivers, exceedance, vesselClass, thresholds };
  }

  const drivers = [];
  const hitsDoNotVenture = wave >= thresholds.doNotVenture.wave || wind >= thresholds.doNotVenture.wind;
  const hitsCaution = wave >= thresholds.caution.wave || wind >= thresholds.caution.wind;

  if (wave >= thresholds.caution.wave) drivers.push(`Wave height ${wave.toFixed(1)}m vs ${thresholds.caution.wave}m craft threshold`);
  if (wind >= thresholds.caution.wind) drivers.push(`Wind ${Math.round(wind)}kt vs ${thresholds.caution.wind}kt craft threshold`);

  let verdict = 'SAFE';
  if (hitsDoNotVenture) verdict = 'DO_NOT_VENTURE';
  else if (hitsCaution) verdict = 'CAUTION';

  return {
    verdict,
    drivers: drivers.slice(0, 2),
    exceedance,
    vesselClass,
    thresholds,
  };
}
