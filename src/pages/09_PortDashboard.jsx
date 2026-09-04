import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import TacticalGisMap from '../components/maps/TacticalGisMap';
import SwellWindCurve from '../components/charts/SwellWindCurve';
import VesselTrafficTable from '../components/tables/VesselTrafficTable';
import EvidenceChip from '../components/common/EvidenceChip';
import { useAuth } from '../context/AuthContext';
import { broadcastPortVhf } from '../services/api';

export default function PortDashboard() {
  const { heldRoles, openAuth } = useAuth();
  const isVerifiedPort = heldRoles.includes('port');
  const [vhfAlertSent, setVhfAlertSent] = useState(false);
  const [vhfError, setVhfError] = useState('');
  const [generatingBrief, setGeneratingBrief] = useState(false);

  // Real PDF generation from live data — previously alert('...PDF
  // generated.') with no file ever produced.
  const downloadSituationBrief = async () => {
    setGeneratingBrief(true);
    try {
      const res = await fetch('/api/port/status');
      const data = await res.json();
      const doc = new jsPDF();
      let y = 18;
      doc.setFontSize(14);
      doc.text('ORCA Port Situation Brief', 14, y);
      y += 8;
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toISOString()}`, 14, y);
      y += 10;
      doc.setFontSize(11);
      doc.text(`${data.port_name}`, 14, y); y += 6;
      doc.text(`Status: ${data.status_verdict}`, 14, y); y += 6;
      doc.text(`Tide phase: ${data.tide_phase}`, 14, y); y += 6;
      doc.text(`Depth over bar: ${data.current_depth_datum}m  ·  Next high tide: ${data.next_high_tide}`, 14, y); y += 6;
      doc.text(`Visibility: ${data.visibility_nm} NM  ·  VHF: ${data.direct_vhf_channel}`, 14, y); y += 10;

      doc.setFontSize(12);
      doc.text('Vessels in perimeter', 14, y); y += 7;
      doc.setFontSize(9);
      data.vessels.forEach((v) => {
        doc.text(`${v.name} (${v.mmsi}) — ${v.vessel_type} — ${v.status} @ ${v.berth}`, 14, y);
        y += 5.5;
      });
      y += 4;
      doc.setFontSize(12);
      doc.text('Directives', 14, y); y += 7;
      doc.setFontSize(9);
      data.warnings.forEach((w) => {
        const lines = doc.splitTextToSize(`• ${w}`, 180);
        doc.text(lines, 14, y);
        y += 5.5 * lines.length;
      });

      doc.save(`orca_port_situation_brief_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch {
      setVhfError('Could not generate the brief — backend unreachable.');
      setTimeout(() => setVhfError(''), 4000);
    } finally {
      setGeneratingBrief(false);
    }
  };

  return (
    <div className="flex flex-col gap-pad-lg pb-16">
      {vhfError && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container border border-error/30 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px]">block</span>
          <span>Broadcast rejected by server: {vhfError}</span>
        </div>
      )}

      {/* 1. TOP BANNER: OPERATIONAL STATE & HIGH-DENSITY PORT SUMMARY DECK */}
      <section id="port" className="scroll-mt-28 grid grid-cols-1 lg:grid-cols-12 gap-pad-md">
        {/* Port Status Verdict Card (5 cols) */}
        <div id="conditions" className="scroll-mt-28 lg:col-span-5 bg-surface-container-lowest p-pad-md rounded-xl border border-amber-300 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between gap-pad-sm mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
              <span className="font-label-sm text-[10px] font-bold text-on-surface uppercase">
                HARBOUR WATCH · TIDE RISING
              </span>
            </div>
            <span className="font-mono text-xs text-on-surface-variant font-bold">
              DATUM: -0.4m
            </span>
          </div>

          <div className="flex items-start gap-3 my-1">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[28px]">crisis_alert</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display-lg-mobile text-lg font-bold text-on-surface">
                  Approach Bar Shoaling Surge
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-label-sm text-[10px] font-bold">
                  CAUTION
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Shallow outer bar has breaking breakers (<span className="font-bold">1.9m</span>). Non-mechanized craft restricted from transiting until high-tide (+1.2m) at 14:30 IST.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-surface-container mt-2">
            <button
              onClick={async () => {
                if (!isVerifiedPort) return openAuth('port');
                // NFR-9: a real, server-role-gated call — the backend
                // independently verifies the Port session itself.
                const res = await broadcastPortVhf();
                if (res?.error) {
                  setVhfError(res.detail || `Broadcast rejected (HTTP ${res.status})`);
                  setTimeout(() => setVhfError(''), 4000);
                  return;
                }
                setVhfAlertSent(true);
                setTimeout(() => setVhfAlertSent(false), 3000);
              }}
              className="flex-grow py-2 px-3 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">{isVerifiedPort ? 'podcasts' : 'lock'}</span>
              <span>{vhfAlertSent ? 'BROADCAST LOGGED!' : 'Issue VHF Ch-16 Broadcast'}</span>
            </button>
            <button
              onClick={downloadSituationBrief}
              disabled={generatingBrief}
              className="p-2 rounded-lg border border-surface-container-high text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
              title="Download Port Situation Brief (PDF)"
            >
              <span className="material-symbols-outlined text-[18px]">{generatingBrief ? 'hourglass_top' : 'picture_as_pdf'}</span>
            </button>
          </div>
        </div>

        {/* Port KPI Cluster (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-pad-sm">
          <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">Active Warnings</span>
            <div className="font-telemetry-lg text-xl font-bold text-amber-700">02 Notices</div>
            <span className="text-[10px] text-on-surface-variant">Bar Shoal & Squall</span>
          </div>
          <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">Vessels in Perimeter</span>
            <div className="font-telemetry-lg text-xl font-bold text-secondary">42 Active</div>
            <span className="text-[10px] text-emerald-700 font-medium">18 Inbound Fairway</span>
          </div>
          <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">Outer Wave SWH</span>
            <div className="font-telemetry-lg text-xl font-bold text-amber-700">1.9m</div>
            <span className="text-[10px] text-on-surface-variant">Period: 8.8s</span>
          </div>
          <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">Wind Velocity</span>
            <div className="font-telemetry-lg text-xl font-bold text-on-surface">22 kt NE</div>
            <span className="text-[10px] text-on-surface-variant">Gusts to 26 kt</span>
          </div>
          <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">Channel Depth</span>
            <div className="font-telemetry-lg text-xl font-bold text-secondary">-0.4m</div>
            <span className="text-[10px] text-emerald-700 font-medium">Tide +1.4m @ 14:30</span>
          </div>
          <div className="p-pad-sm rounded-xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">Visibility</span>
            <div className="font-telemetry-lg text-xl font-bold text-on-surface">6.2 NM</div>
            <span className="text-[10px] text-emerald-700 font-medium">Optimal Radar Line</span>
          </div>
        </div>
      </section>

      {/* Two-Column Port Operations Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-pad-md">
        {/* Left Column: Harbour Approach GIS & Tide Curve (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-pad-md">
          <div id="map" className="scroll-mt-28 rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-pad-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">map</span>
                <h2 className="font-headline-sm text-sm font-bold text-on-surface">
                  Tactical Harbour & Approach Channel GIS
                </h2>
              </div>
              <span className="text-[11px] font-mono text-secondary font-bold">
                Kasimedu Channel Buoy 02 Active
              </span>
            </div>
            <TacticalGisMap height="320px" showLayers={true} />
          </div>

          <div id="forecast" className="scroll-mt-28">
            <SwellWindCurve />
          </div>
        </div>

        {/* Right Column: Statutory Warnings & AIS Queue Table (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-pad-md">
          {/* Statutory Directives Card */}
          <div id="safety" className="scroll-mt-28 rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high/80 shadow-sm flex flex-col gap-2">
            <h2 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">gavel</span>
              <span>Port Operational Directives</span>
            </h2>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-800 mt-0.5">block</span>
                <div>
                  <strong className="text-amber-950">Small Craft Bar Restriction:</strong>
                  <p className="text-[11px] text-amber-900">Vessels under 12m prohibited from crossing outer bar until 14:00 IST tide crest.</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5">anchor</span>
                <div>
                  <strong className="text-sky-950">Tug Escort Mandate:</strong>
                  <p className="text-[11px] text-sky-900">Mechanized trawlers draft &gt; 2.0m must maintain 500m distance from Dredger D-01.</p>
                </div>
              </div>
            </div>
          </div>

          {/* AIS Traffic & Berth Queue Table */}
          <div id="traffic" className="scroll-mt-28">
            <VesselTrafficTable />
          </div>

          {/* Evidence Audit Strip */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <EvidenceChip source="INCOIS HARBOUR OSF" metric="30m SYNC" type="default" />
            <EvidenceChip source="PORT RADAR AIS" metric="LIVE" type="live" />
          </div>
        </div>
      </div>
    </div>
  );
}
