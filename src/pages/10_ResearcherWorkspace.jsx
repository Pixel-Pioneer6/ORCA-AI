import React, { useState, useEffect } from 'react';
import ClimatologySstChart from '../components/charts/ClimatologySstChart';
import SensorMatrixTable from '../components/tables/SensorMatrixTable';
import EvidenceChip from '../components/common/EvidenceChip';
import { downloadCsv, downloadJson } from '../lib/download';

export default function ResearcherWorkspace() {
  const [variable, setVariable] = useState('sst');
  const [domain, setDomain] = useState('coromandel');
  const [timeRange, setTimeRange] = useState('30d');
  const [exportNotice, setExportNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  // FR-3.4: real numpy-computed anomaly/trend stats (backend/agents/analytics_agent.py),
  // not independently hand-picked constants that happened to look plausible.
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/analytics/anomaly')
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setAnalysis(data.analysis); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // FR-3.4/US-06 — a real downloadable file, including the real per-day
  // z-score/anomaly analysis, not just the raw series.
  const handleExport = async (format) => {
    setExporting(true);
    try {
      const [tsRes, anomalyRes] = await Promise.all([
        fetch('/api/v1/timeseries'),
        fetch('/api/v1/analytics/anomaly'),
      ]);
      const data = await tsRes.json();
      const anomalyData = await anomalyRes.json();
      const zByDay = Object.fromEntries((anomalyData.analysis?.series || []).map((p) => [p.index + 1, p.z_score]));
      const enrichedPoints = data.points.map((p) => ({ ...p, z_score: zByDay[p.day] ?? null }));
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'CSV') {
        downloadCsv(enrichedPoints, `orca_${variable}_${domain}_${stamp}.csv`);
      } else {
        downloadJson({ ...data, analysis: anomalyData.analysis }, `orca_${variable}_${domain}_${stamp}.json`);
      }
      setExportNotice(`Downloaded ${enrichedPoints.length} records (with anomaly z-scores) as ${format}.`);
    } catch (err) {
      setExportNotice('Export failed — backend unreachable. Try again once connectivity is restored.');
    } finally {
      setExporting(false);
      setTimeout(() => setExportNotice(''), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-pad-lg pb-16">
      {/* TOP CONTEXT & ACTIONS BAR */}
      <div id="researcher" className="scroll-mt-28 flex flex-col md:flex-row md:items-center justify-between gap-pad-sm bg-surface-container-high px-pad-md py-2.5 rounded-xl border border-surface-container-highest">
        <div className="flex items-center gap-2 text-on-surface">
          <span className="material-symbols-outlined text-secondary text-[22px]">science</span>
          <div>
            <h1 className="font-headline-sm text-sm font-bold leading-none">
              Marine Analytics & Climatology Workspace
            </h1>
            <span className="text-[11px] text-on-surface-variant font-mono">
              Bay of Bengal Synoptic Grid (12.13°N, 80.20°E) · Reference: DGPS Kasimedu
            </span>
          </div>
        </div>

        {/* Action Cluster */}
        <div id="exports" className="scroll-mt-28 flex items-center gap-2">
          <button
            onClick={() => handleExport('JSON')}
            disabled={exporting}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90 flex items-center gap-1 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px]">file_download</span>
            <span>Export Metadata (JSON)</span>
          </button>
          <button
            onClick={() => handleExport('CSV')}
            disabled={exporting}
            className="px-3 py-1.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs font-bold hover:bg-surface-container flex items-center gap-1 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px]">table_view</span>
            <span>{exporting ? 'Exporting…' : 'Download CSV'}</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2 border border-emerald-300">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{exportNotice}</span>
        </div>
      )}

      {/* HORIZONTAL HIGH-DENSITY QUERY DECK */}
      <div id="map" className="scroll-mt-28 rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-pad-md">
        {/* Variable Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-on-surface-variant mb-1">
            Oceanographic Variable
          </label>
          <select
            value={variable}
            onChange={(e) => setVariable(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-surface-container-high bg-surface-container-low font-semibold text-on-surface"
          >
            <option value="sst">Sea Surface Temperature (SST - °C)</option>
            <option value="chl">Chlorophyll-a Concentration (mg/m³)</option>
            <option value="swh">Significant Wave Height (SWH - m)</option>
            <option value="salinity">Sea Surface Salinity (SSS - PSU)</option>
            <option value="current">Geostrophic Current Velocity (m/s)</option>
          </select>
        </div>

        {/* Spatial Extent */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-on-surface-variant mb-1">
            Spatial Bounding Domain
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-surface-container-high bg-surface-container-low font-semibold text-on-surface"
          >
            <option value="coromandel">Coromandel Coast (11.0°N - 14.5°N)</option>
            <option value="kasimedu">Kasimedu Coastal Bight (25 NM)</option>
            <option value="palk">Palk Strait & Gulf of Mannar</option>
            <option value="bob_central">Central Bay of Bengal Synoptic Basin</option>
          </select>
        </div>

        {/* Temporal Horizon */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-on-surface-variant mb-1">
            Temporal Horizon & Baseline
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-surface-container-high bg-surface-container-low font-semibold text-on-surface"
          >
            <option value="30d">Last 30 Days Hindcast + 72h SWAN Forecast</option>
            <option value="7d">Last 7 Days High-Res Ingest</option>
            <option value="climatology">30-Year Climatological Mean Comparison</option>
          </select>
        </div>
      </div>

      {/* 3. KEY STATISTICAL KPI DECK */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-pad-sm">
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Observed SST</span>
          <div className="font-telemetry-lg text-xl font-bold text-on-surface mt-1">
            {analysis ? `${analysis.observed_mean}°C` : '…'}
          </div>
          <span className="text-[10px] text-amber-700 font-bold">
            {analysis ? `${analysis.mean_anomaly >= 0 ? '+' : ''}${analysis.mean_anomaly}°C Thermal Anomaly` : 'Loading…'}
          </span>
        </div>
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Baseline Mean</span>
          <div className="font-telemetry-lg text-xl font-bold text-secondary mt-1">
            {analysis ? `${analysis.climatological_mean}°C` : '…'}
          </div>
          <span className="text-[10px] text-on-surface-variant">INCOIS Reanalysis</span>
        </div>
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Anomalous Days (|z|≥2)</span>
          <div className="font-telemetry-lg text-xl font-bold text-emerald-700 mt-1">
            {analysis ? analysis.anomalous_day_count : '…'}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">of {analysis ? analysis.n_observations : 30} days</span>
        </div>
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Trend Fit (R²)</span>
          <div className="font-telemetry-lg text-xl font-bold text-secondary mt-1">
            {analysis ? analysis.trend_r_squared : '…'}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">
            {analysis ? `${analysis.trend_per_day >= 0 ? '+' : ''}${analysis.trend_per_day}°C/day trend` : 'Loading…'}
          </span>
        </div>
      </div>

      {/* Time-Series Climatological Chart */}
      <ClimatologySstChart />

      {/* Sensor Provenance Matrix Table */}
      <div id="provenance" className="scroll-mt-28">
        <SensorMatrixTable />
      </div>

      {/* Institutional Evidence Badges */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <EvidenceChip source="ISRO MOSDAC" metric="SAC LEVEL-3" type="default" />
        <EvidenceChip source="INCOIS OSF" metric="WAVEWATCH-III" type="live" />
        <EvidenceChip source="SENTINEL-3 OLCI" metric="PASS VALIDATED" type="default" />
        <EvidenceChip source="IMD SATELLITE" metric="INSAT-3D" type="live" />
      </div>
    </div>
  );
}
