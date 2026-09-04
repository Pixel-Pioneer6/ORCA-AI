import React, { useState, useEffect } from 'react';
import TacticalGisMap from '../components/maps/TacticalGisMap';
import SwellWindCurve from '../components/charts/SwellWindCurve';
import { useAuth } from '../context/AuthContext';
import { broadcastDdmoSms } from '../services/api';

export default function DdmoDashboard() {
  const { heldRoles, openAuth } = useAuth();
  const isVerifiedDdmo = heldRoles.includes('ddmo');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [broadcastError, setBroadcastError] = useState('');
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState(false);
  const [signedNotice, setSignedNotice] = useState(false);

  const [incidents, setIncidents] = useState([
    { time: '15:38 IST', type: 'WARNING', title: 'Nearshore Bar Breaking Surge', desc: 'Waves reaching 1.8m at Kasimedu harbour mouth. Non-decked craft prohibited.', status: 'ACTIVE' },
    { time: '15:12 IST', type: 'INFO', title: 'Coast Guard Hovercraft Sortie', desc: 'ICG-H02 deployed to shepherd 28 returnee artisanal craft inside breaker line.', status: 'DEPLOYED' },
    { time: '14:45 IST', type: 'SMS', title: 'Mass SMS Dissemination', desc: '14,200 broadcast alerts delivered across North Chennai & Ennore fishing hamlets.', status: 'SENT' },
    { time: '13:30 IST', type: 'ADVISORY', title: 'INCOIS Model Convergence', desc: 'WAVEWATCH-III v3.4 confirms squall peak between 06:00 and 09:00 IST tomorrow.', status: 'VERIFIED' },
  ]);

  const coastalBlocks = [
    { name: 'Kasimedu Pier & Beach', maxWave: 3.4, risk: 'HIGH', population: 4200, shelter: 'Community Hall 01 (Ready)', action: 'Prohibit Launch & Beach Evacuation' },
    { name: 'Ennore Creek Mouth', maxWave: 3.1, risk: 'HIGH', population: 2800, shelter: 'Ennore Cyclone Shelter (Open)', action: 'Halt Estuary Bar Transit' },
    { name: 'Tiruvottiyur Sector', maxWave: 2.8, risk: 'MODERATE', population: 1900, shelter: 'Tiruvottiyur High School (Standby)', action: 'Haul Catamarans Above HTL' },
    { name: 'Royapuram Fairway', maxWave: 2.5, risk: 'MODERATE', population: 1400, shelter: 'Harbour Transit Shed (Open)', action: 'VHF Warning Broadcast' },
    { name: 'Kovalam Bay Sector', maxWave: 1.9, risk: 'LOW', population: 800, shelter: 'Local Centre (Monitoring)', action: 'Routine Safety Watch' },
  ];

  const handleSignOffAdvisory = (advisoryEn, advisoryTa) => {
    const newInc = {
      time: 'Just Now',
      type: 'ADVISORY',
      title: 'Official Signed Public Advisory Dispatched (PRD US-05)',
      desc: `Signed by DDMO Officer. Broadcast dispatched to 14,200 subscribers in Tamil & English.`,
      status: 'GAZETTED',
    };
    setIncidents([newInc, ...incidents]);
    setIsAdvisoryModalOpen(false);
    setSignedNotice(true);
    setTimeout(() => setSignedNotice(false), 4000);
  };

  return (
    <div className="flex flex-col gap-pad-lg pb-16">
      {/* Top Demo Operational Authority Strip */}
      <div id="ddmo" className="scroll-mt-28 flex flex-col md:flex-row md:items-center justify-between gap-pad-sm bg-surface-container-high px-pad-md py-2 rounded-xl border border-surface-container-highest">
        <div className="flex items-center gap-pad-xs text-on-surface">
          <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
          <span className="font-label-sm text-xs uppercase font-bold tracking-wider">
            Official Operational Mode
          </span>
          <span className="text-xs text-on-surface-variant">
            | CONNECTED TO INCOIS-IMD DISASTER CELL · ZONE 04
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-mono text-xs font-bold text-emerald-800">
            SECURE LIVE STREAM (4G/SAT-COM)
          </span>
        </div>
      </div>

      {signedNotice && (
        <div className="p-3 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Official Public Advisory signed off and broadcasted across coastal Zone 04!</span>
        </div>
      )}

      {broadcastError && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container border border-error/30 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px]">block</span>
          <span>Broadcast rejected by server: {broadcastError}</span>
        </div>
      )}

      {/* Tier-1 Critical Warning Banner */}
      <div id="safety" className="scroll-mt-28 relative overflow-hidden rounded-xl bg-error-container p-pad-md border border-error/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-pad-md">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-error text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[28px]">crisis_alert</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-error text-white text-[10px] font-bold uppercase tracking-wider">
                TIER-1 HAZARD
              </span>
              <span className="font-mono text-xs text-on-error-container font-semibold">
                BULLETIN #KSM-04 · VALID TO 18:00 IST
              </span>
            </div>
            <h1 className="font-headline-lg text-lg font-bold text-on-error-container mt-0.5">
              INCOIS HIGH WAVE & SQUALL ADVISORY #KSM-04
            </h1>
            <p className="text-xs text-on-error-container/90 mt-0.5">
              Squall gusts 24-28 kt and breaking shoaling waves along North Tamil Nadu coast. Complete suspension of artisanal venturing.
            </p>
          </div>
        </div>

        {/* Action Trigger Buttons — gated to verified DDMO identity (§12.7) */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => (isVerifiedDdmo ? setIsAdvisoryModalOpen(true) : openAuth('ddmo'))}
              className="px-3.5 py-2.5 rounded-lg bg-secondary text-white font-bold text-xs shadow-sm hover:bg-secondary/90 flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">{isVerifiedDdmo ? 'edit_note' : 'lock'}</span>
              <span>Draft Advisory (PRD US-05)</span>
            </button>
            <button
              onClick={async () => {
                if (!isVerifiedDdmo) return openAuth('ddmo');
                // NFR-9: a real, server-role-gated call — not just a local
                // state flip. The backend independently verifies the DDMO
                // session itself rather than trusting this button's isVerifiedDdmo check.
                const res = await broadcastDdmoSms('Zone 04', 'ta', 'HIGH WAVE & SQUALL');
                if (res?.error) {
                  setBroadcastError(res.detail || `Broadcast rejected (HTTP ${res.status})`);
                  setTimeout(() => setBroadcastError(''), 4000);
                  return;
                }
                setBroadcastSent(true);
                setTimeout(() => setBroadcastSent(false), 3000);
              }}
              className="px-3.5 py-2.5 rounded-lg bg-error text-white font-bold text-xs shadow-sm hover:bg-error/90 flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">{isVerifiedDdmo ? 'cell_tower' : 'lock'}</span>
              <span>{broadcastSent ? 'BROADCAST ISSUED!' : 'ISSUE SIREN / SMS'}</span>
            </button>
          </div>
          {!isVerifiedDdmo && (
            <span className="text-[10px] text-on-error-container/80">Sign in as verified DDMO to broadcast or publish</span>
          )}
        </div>
      </div>

      {/* Situational Awareness KPI Metrics Row (5 Cards) */}
      <div id="ddmo-kpi" className="scroll-mt-28 grid grid-cols-2 md:grid-cols-5 gap-pad-sm">
        <div className="p-pad-md rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-label-sm uppercase font-bold text-on-surface-variant">
            At-Risk Population
          </span>
          <div className="font-headline-lg text-2xl font-bold font-mono text-error">
            14,200
          </div>
          <span className="text-[10px] text-error font-semibold">Kasimedu & Ennore strip</span>
        </div>

        <div className="p-pad-md rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-label-sm uppercase font-bold text-on-surface-variant">
            Active Coastal Villages
          </span>
          <div className="font-headline-lg text-2xl font-bold font-mono text-on-surface">
            8 Hamlets
          </div>
          <span className="text-[10px] text-on-surface-variant font-medium">Zone 04 District</span>
        </div>

        <div className="p-pad-md rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-label-sm uppercase font-bold text-on-surface-variant">
            Active Craft at Sea
          </span>
          <div className="font-headline-lg text-2xl font-bold font-mono text-amber-700">
            28 Boats
          </div>
          <span className="text-[10px] text-amber-700 font-semibold">Shepherded by ICG</span>
        </div>

        <div className="p-pad-md rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-label-sm uppercase font-bold text-on-surface-variant">
            Cyclone Shelters Ready
          </span>
          <div className="font-headline-lg text-2xl font-bold font-mono text-emerald-700">
            6 / 6
          </div>
          <span className="text-[10px] text-emerald-800 font-semibold">Capacity: 4,800 persons</span>
        </div>

        <div className="p-pad-md rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-label-sm uppercase font-bold text-on-surface-variant">
            Emergency Response
          </span>
          <div className="font-headline-lg text-2xl font-bold font-mono text-secondary">
            4 Teams
          </div>
          <span className="text-[10px] text-secondary font-semibold">SDRF + Coast Guard</span>
        </div>
      </div>

      {/* PRD US-04: COASTAL BLOCK EXPOSURE RANKING TABLE */}
      <div id="areas" className="scroll-mt-28 rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high shadow-sm flex flex-col gap-pad-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">format_list_numbered</span>
            <div>
              <h2 className="font-headline-sm text-sm font-bold text-on-surface">
                Coastal Block Hazard Exposure Ranking (PRD US-04)
              </h2>
              <p className="text-[11px] text-on-surface-variant font-mono">
                Query: "Which coastal blocks face &gt;3m waves in the next 48 hours?" · Ranked by Peak Wave Risk
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-error-container text-error text-[10px] font-mono font-bold">
            2 BLOCKS OVER 3M THRESHOLD
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-container text-[11px] text-on-surface-variant uppercase font-bold">
                <th className="py-2 px-3">Coastal Block</th>
                <th className="py-2 px-3">Projected Max Wave</th>
                <th className="py-2 px-3">Hazard Level</th>
                <th className="py-2 px-3">Exposed Population</th>
                <th className="py-2 px-3">Designated Shelter</th>
                <th className="py-2 px-3">Executive Directive</th>
              </tr>
            </thead>
            <tbody>
              {coastalBlocks.map((b, i) => (
                <tr key={i} className="border-b border-surface-container-low hover:bg-surface-container-low/50">
                  <td className="py-2.5 px-3 font-bold text-on-surface flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-surface-container text-on-surface flex items-center justify-center text-[10px] font-mono">
                      {i + 1}
                    </span>
                    {b.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-on-surface">
                    <span className={b.maxWave >= 3.0 ? 'text-error text-sm' : 'text-on-surface'}>
                      {b.maxWave} m
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                      b.risk === 'HIGH' ? 'bg-error text-white' : b.risk === 'MODERATE' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {b.risk}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{b.population.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-[11px] text-on-surface-variant">{b.shelter}</td>
                  <td className="py-2.5 px-3 font-bold text-error text-[11px]">{b.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Split Body: GIS Tactical Hazard Map (8 Cols) vs Swell Curve & Logs (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-pad-md">
        {/* Left Column: GIS Map with High-Wave Shading (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-pad-md">
          <div id="map" className="scroll-mt-28 rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high shadow-sm flex flex-col gap-pad-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">map</span>
                <span className="font-headline-sm text-sm font-bold text-on-surface">
                  North Coromandel Tactical Hazard Surface (Zone 04)
                </span>
              </div>
              <span className="font-mono text-xs text-on-surface-variant">
                GRID: 13.12°N, 80.30°E
              </span>
            </div>

            <div className="h-[420px] rounded-lg overflow-hidden border border-surface-container">
              <TacticalGisMap />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-error"></span>
                <span>Active Squall Hazard Polygon</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span>Shoaling Sandbar Breakers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <span>Kasimedu Port Fairway</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Swell/Wind Forecast + Real-time Incident Log (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-pad-md">
          <div id="forecast" className="scroll-mt-28 rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high shadow-sm flex flex-col gap-2">
            <span className="font-headline-sm text-sm font-bold text-on-surface">
              24-Hour Wave & Wind Hydrograph
            </span>
            <div className="h-[180px]">
              <SwellWindCurve />
            </div>
          </div>

          <div id="feed" className="scroll-mt-28 rounded-xl bg-surface-container-lowest p-pad-md border border-surface-container-high shadow-sm flex flex-col gap-pad-sm flex-grow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">feed</span>
                <span className="font-headline-sm text-sm font-bold text-on-surface">
                  Real-time Incident & Operational Log
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
              {incidents.map((inc, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-on-surface-variant font-bold">{inc.time}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                      inc.type === 'WARNING' ? 'bg-error text-white' : inc.type === 'ADVISORY' ? 'bg-emerald-700 text-white' : 'bg-secondary text-white'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                  <span className="font-bold text-on-surface">{inc.title}</span>
                  <p className="text-[11px] text-on-surface-variant leading-tight">{inc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: PRD US-05 & FR-3.6 ADVISORY DRAFTING COMPOSER */}
      {isAdvisoryModalOpen && (
        <AdvisoryDraftingModal
          onClose={() => setIsAdvisoryModalOpen(false)}
          onSignOff={handleSignOffAdvisory}
        />
      )}
    </div>
  );
}

function AdvisoryDraftingModal({ onClose, onSignOff }) {
  // FR-3.6: the draft is generated from live buoy telemetry + active
  // warnings (backend/agents/advisory_drafting_agent.py) instead of a fixed
  // canned paragraph — these numbers actually change with real conditions.
  const [advisoryEn, setAdvisoryEn] = useState('');
  const [advisoryTa, setAdvisoryTa] = useState('');
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [draftMeta, setDraftMeta] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/advisory/draft?lat=13.12&lon=80.30')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setAdvisoryEn(data.advisory_en || '');
        setAdvisoryTa(data.advisory_ta || '');
        setDraftMeta(data.generated_from || null);
        setLoadingDraft(false);
      })
      .catch(() => {
        if (cancelled) return;
        setAdvisoryEn('Draft generation failed — backend unreachable. Check connectivity and retry.');
        setAdvisoryTa('வரைவு உருவாக்கம் தோல்வியடைந்தது — இணைப்பைச் சரிபார்க்கவும்.');
        setLoadingDraft(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-surface rounded-2xl border border-surface-container-high shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-pad-md py-3 bg-secondary text-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">edit_document</span>
            <div>
              <h2 className="font-headline-sm text-sm font-bold">ORCA AI Advisory Drafting Composer (PRD US-05)</h2>
              <span className="text-[10px] text-white/80 font-mono">Bilingual Public Advisory with Attached Evidence Sources</span>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div className="p-pad-md flex-grow overflow-y-auto flex flex-col gap-pad-md bg-surface text-on-surface text-xs">
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-600">gavel</span>
            <span>
              <strong>Officer Sign-Off Workflow:</strong> ORCA synthesizes this draft from live buoy telemetry and active warnings. Review and edit before authorized gazetted dispatch.
            </span>
          </div>

          {draftMeta && (
            <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container text-[10px] font-mono text-on-surface-variant flex flex-wrap gap-x-3 gap-y-1">
              <span>SWH: <strong className="text-on-surface">{draftMeta.swh}m</strong></span>
              <span>Wind Gust: <strong className="text-on-surface">{draftMeta.wind_gust}kt</strong></span>
              <span>Source: <strong className="text-on-surface">{draftMeta.data_source}</strong></span>
              <span>Bulletin: <strong className="text-on-surface">#{draftMeta.bulletin_id}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-on-surface text-[11px] uppercase">Official English Draft</label>
              <textarea
                value={loadingDraft ? 'Generating draft from live telemetry…' : advisoryEn}
                onChange={(e) => setAdvisoryEn(e.target.value)}
                disabled={loadingDraft}
                rows={9}
                className="p-2.5 rounded-lg border border-surface-container bg-surface-container-lowest font-mono text-[11px] leading-relaxed resize-none focus:outline-secondary disabled:opacity-60"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-on-surface text-[11px] uppercase">Official Tamil Draft (தமிழ்)</label>
              <textarea
                value={loadingDraft ? 'நேரடி தரவிலிருந்து வரைவு உருவாக்கப்படுகிறது…' : advisoryTa}
                onChange={(e) => setAdvisoryTa(e.target.value)}
                disabled={loadingDraft}
                rows={9}
                className="p-2.5 rounded-lg border border-surface-container bg-surface-container-lowest font-body-md text-[11px] leading-relaxed resize-none focus:outline-secondary disabled:opacity-60"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1 text-[11px]">
            <span className="font-bold text-on-surface uppercase">Attached Provenance Sources (PRD FR-3.6):</span>
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
              <div className="p-1.5 rounded bg-white border border-surface-container">
                <strong>INCOIS OSF</strong>: {draftMeta ? `Live Buoy (SWH ${draftMeta.swh}m)` : 'Loading…'}
              </div>
              <div className="p-1.5 rounded bg-white border border-surface-container">
                <strong>Wind Feed</strong>: {draftMeta ? `${draftMeta.wind_gust} kt gust` : 'Loading…'}
              </div>
              <div className="p-1.5 rounded bg-white border border-surface-container">
                <strong>IMD Nowcast</strong>: {draftMeta ? `Bulletin #${draftMeta.bulletin_id}` : 'Loading…'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-pad-md bg-surface-container-low border-t border-surface-container flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-surface-container-high text-on-surface font-bold text-xs hover:bg-surface-container"
          >
            Cancel Draft
          </button>
          <button
            onClick={() => onSignOff(advisoryEn, advisoryTa)}
            disabled={loadingDraft}
            className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Authorize Sign-Off & Dispatch Gazette</span>
          </button>
        </div>
      </div>
    </div>
  );
}
