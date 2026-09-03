// Mock evidence ledger — PRD §6.3. Each entry is what a real ingestion worker
// would have recorded: source, product, grid cell, valid time, retrieval time.
// Every EvidenceChip in the UI must resolve to a record here (US-10).

const now = () => Date.now();
const hoursAgo = (h) => new Date(now() - h * 60 * 60 * 1000).toISOString();

export const EVIDENCE_LEDGER = {
  'incois-osf-wave': {
    id: 'incois-osf-wave',
    source: 'INCOIS OSF',
    agency: 'Indian National Centre for Ocean Information Services',
    product: 'Ocean State Forecast — WAVEWATCH-III',
    variable: 'significant_wave_height',
    value: 1.8,
    unit: 'm',
    grid: '8.75N, 78.10E',
    validTime: new Date(now() + 8 * 60 * 60 * 1000).toISOString(),
    retrievedTime: hoursAgo(0.2),
    confidencePct: 94,
  },
  'mosdac-scatterometer-wind': {
    id: 'mosdac-scatterometer-wind',
    source: 'MOSDAC SATELLITE',
    agency: 'ISRO Space Applications Centre',
    product: 'Scatterometer Surface Wind (SCATSAT-class)',
    variable: 'wind_speed',
    value: 24,
    unit: 'kt',
    grid: '13.12N, 80.30E',
    validTime: new Date(now() + 6 * 60 * 60 * 1000).toISOString(),
    retrievedTime: hoursAgo(0.5),
    confidencePct: 92,
  },
  'imd-gale-warning': {
    id: 'imd-gale-warning',
    source: 'IMD GALE ALERT',
    agency: 'India Meteorological Department',
    product: 'Coastal District Gale / Squall Warning',
    variable: 'gale_warning_flag',
    value: 'ACTIVE',
    unit: '',
    grid: 'North Tamil Nadu Coast Sector 04',
    validTime: new Date(now() + 3 * 60 * 60 * 1000).toISOString(),
    retrievedTime: hoursAgo(0.1),
    confidencePct: 88,
  },
  'navic-gnss': {
    id: 'navic-gnss',
    source: 'NavIC GNSS',
    agency: 'ISRO Satellite Navigation',
    product: 'NavIC/GPS Dual-Constellation Fix',
    variable: 'dgps_lock',
    value: 'LOCKED',
    unit: '',
    grid: '13.12N, 80.30E',
    validTime: new Date().toISOString(),
    retrievedTime: hoursAgo(0.01),
    confidencePct: 99,
  },
  'incois-pfz-advisory': {
    id: 'incois-pfz-advisory',
    source: 'INCOIS PFZ ADVISORY',
    agency: 'Indian National Centre for Ocean Information Services',
    product: 'Potential Fishing Zone Advisory (Daily)',
    variable: 'pfz_polygon',
    value: 'PFZ #01 — SE Kasimedu',
    unit: '',
    grid: '13.05N, 80.55E',
    validTime: new Date(now() + 18 * 60 * 60 * 1000).toISOString(),
    retrievedTime: hoursAgo(4),
    confidencePct: 90,
  },
  'oceansat3-ocm': {
    id: 'oceansat3-ocm',
    source: 'Oceansat-3 OCM',
    agency: 'ISRO Space Applications Centre',
    product: 'Ocean Colour Monitor — Chlorophyll-a',
    variable: 'chlorophyll_a',
    value: 0.88,
    unit: 'mg/m³',
    grid: '13.05N, 80.55E',
    validTime: hoursAgo(2),
    retrievedTime: hoursAgo(2.3),
    confidencePct: 91,
  },
  'imd-doppler': {
    id: 'imd-doppler',
    source: 'IMD DOPPLER',
    agency: 'India Meteorological Department',
    product: 'Doppler Weather Radar Nowcast',
    variable: 'squall_probability',
    value: 24,
    unit: 'kt gusts',
    grid: '13.12N, 80.30E',
    validTime: hoursAgo(0.1),
    retrievedTime: hoursAgo(0.13),
    confidencePct: 88,
  },
};

export function getEvidence(id) {
  return EVIDENCE_LEDGER[id] || null;
}
