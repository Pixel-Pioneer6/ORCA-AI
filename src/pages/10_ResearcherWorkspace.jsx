import React, { useState } from 'react';
import ClimatologySstChart from '../components/charts/ClimatologySstChart';
import SensorMatrixTable from '../components/tables/SensorMatrixTable';
import EvidenceChip from '../components/common/EvidenceChip';

export default function ResearcherWorkspace() {
  const [variable, setVariable] = useState('sst');
  const [domain, setDomain] = useState('coromandel');
  const [timeRange, setTimeRange] = useState('30d');
  const [exportNotice, setExportNotice] = useState('');

  const handleExport = (format) => {
    setExportNotice(`Exporting dataset in ${format} format...`);
    setTimeout(() => setExportNotice(''), 3000);
  };

  return (
    <div className="flex flex-col gap-pad-lg pb-16">
      {/* TOP CONTEXT & ACTIONS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-pad-sm bg-surface-container-high px-pad-md py-2.5 rounded-xl border border-surface-container-highest">
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('NetCDF-4')}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">file_download</span>
            <span>Export NetCDF-4</span>
          </button>
          <button
            onClick={() => handleExport('CSV')}
            className="px-3 py-1.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs font-bold hover:bg-surface-container flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">table_view</span>
            <span>CSV Table</span>
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
      <div className="rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-pad-md">
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
          <div className="font-telemetry-lg text-xl font-bold text-on-surface mt-1">29.4°C</div>
          <span className="text-[10px] text-amber-700 font-bold">+0.8°C Thermal Anomaly</span>
        </div>
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">30-Yr Baseline Mean</span>
          <div className="font-telemetry-lg text-xl font-bold text-secondary mt-1">28.6°C</div>
          <span className="text-[10px] text-on-surface-variant">INCOIS Reanalysis</span>
        </div>
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Chlorophyll-a Peak</span>
          <div className="font-telemetry-lg text-xl font-bold text-emerald-700 mt-1">1.14 mg/m³</div>
          <span className="text-[10px] text-emerald-700 font-medium">Active Coastal Upwelling</span>
        </div>
        <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Model Convergence (R²)</span>
          <div className="font-telemetry-lg text-xl font-bold text-secondary mt-1">0.942</div>
          <span className="text-[10px] text-emerald-700 font-medium">98.2% Confidence</span>
        </div>
      </div>

      {/* Time-Series Climatological Chart */}
      <ClimatologySstChart />

      {/* Sensor Provenance Matrix Table */}
      <SensorMatrixTable />

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
