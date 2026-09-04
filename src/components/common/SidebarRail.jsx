import React, { useState, useEffect, useRef } from 'react';
import { useMarine } from '../../context/MarineContext';

// Each desktop dashboard (DdmoDashboard, PortDashboard, ResearcherWorkspace,
// AuthorityDashboard) is one long scrolling page, not separate routes. This
// rail previously called setCurrentRoute(item.id) for ids like 'forecast'/
// 'areas'/'feed'/'brief' that map to no route at all (silent no-op), and
// others ('map', 'safety') that resolved to a URL with no matching desktop
// <Route>, falling back to the same Overview page every time — every click
// looked broken. It's real in-page navigation now: clicking scrolls to the
// matching section (see the `id="..."` anchors added to each dashboard
// page), and a live IntersectionObserver highlights whichever section is
// actually on screen as you scroll, not just whatever was last clicked.
export default function SidebarRail() {
  const { currentRole, setIsVoiceOpen } = useMarine();
  const [activeSection, setActiveSection] = useState(null);
  const observerRef = useRef(null);

  const getNavItems = () => {
    switch (currentRole) {
      case 'ddmo':
        return {
          title: 'DDMO COMMAND RAIL',
          badge: 'ACTIVE ZONE SEC-04',
          items: [
            { id: 'ddmo', label: 'Overview', icon: 'dashboard' },
            { id: 'map', label: 'Tactical Risk Map', icon: 'map' },
            { id: 'safety', label: 'Active Alerts (3)', icon: 'warning', alert: true },
            { id: 'forecast', label: 'Forecast Outlook', icon: 'waves' },
            { id: 'areas', label: 'Affected Areas', icon: 'flood' },
            { id: 'feed', label: 'Incident Feed', icon: 'crisis_alert' },
            { id: 'brief', label: 'Situation Brief', anchor: 'ddmo-kpi', icon: 'description' },
          ],
        };
      case 'port':
        return {
          title: 'ORCA PORT RAIL',
          badge: 'Sector Grid SEC-CH-04',
          items: [
            { id: 'port', label: 'Overview', icon: 'dashboard' },
            { id: 'conditions', label: 'Port Conditions', icon: 'tsunami' },
            { id: 'traffic', label: 'Vessel Traffic (AIS)', icon: 'directions_boat', count: '42 Live' },
            { id: 'map', label: 'Harbour Map', icon: 'map' },
            { id: 'safety', label: 'Official Warnings (2)', icon: 'warning', alert: true },
            { id: 'forecast', label: '24h Forecast', icon: 'air' },
            { id: 'berths', label: 'Berth Allocations', anchor: 'traffic', icon: 'dock' },
          ],
        };
      case 'researcher':
        return {
          title: 'SCIENTIFIC MODULES',
          badge: 'Synoptic Grid BoB-01',
          items: [
            { id: 'researcher', label: 'Analytics Workspace', icon: 'analytics' },
            { id: 'map', label: 'Map Explorer', icon: 'explore' },
            { id: 'queries', label: 'Saved Queries (3)', anchor: 'map', icon: 'bookmark' },
            { id: 'exports', label: 'Data Exports CSV/NetCDF', icon: 'file_download' },
            { id: 'provenance', label: 'Sensor Provenance', icon: 'verified' },
          ],
        };
      case 'authority':
      default:
        return {
          title: 'COMMAND RAIL',
          badge: 'Coromandel Zone 04',
          items: [
            { id: 'authority', label: 'Command Overview', icon: 'grid_view' },
            { id: 'triage', label: 'Regional Risk Triage', icon: 'shield' },
            { id: 'map', label: 'Marine Cartography', icon: 'map' },
            { id: 'safety', label: 'Warnings (5)', anchor: 'authority', icon: 'warning', alert: true },
            { id: 'ports', label: 'Ports Monitored (19)', anchor: 'triage', icon: 'anchor' },
            { id: 'fisheries', label: 'Fisheries Readiness', anchor: 'triage', icon: 'sailing' },
            { id: 'directives', label: 'Executive Directives', icon: 'gavel' },
          ],
        };
    }
  };

  const nav = getNavItems();

  // Scroll-spy: whichever section is nearest the top of the viewport wins.
  // Re-runs whenever the nav config changes (role switch) since the anchor
  // ids on the page differ per role.
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const anchorIds = Array.from(new Set(nav.items.map((i) => i.anchor || i.id)));
    const elements = anchorIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
          setActiveSection(topMost.target.id);
        }
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    observerRef.current = observer;
    setActiveSection(elements[0].id);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole]);

  const handleNavClick = (item) => {
    const targetId = item.anchor || item.id;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(targetId);
    }
  };

  return (
    <aside className="fixed left-0 top-24 bottom-0 w-64 bg-primary-container text-white border-r border-white/10 flex flex-col justify-between py-pad-md z-40 shadow-xl overflow-y-auto">
      <div className="flex flex-col gap-pad-md px-pad-sm">
        {/* Radar Telemetry Header */}
        <div className="flex items-center justify-between px-pad-xs py-1.5 rounded-lg bg-black/20 border border-white/5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-300">
              Telemetry Stream
            </span>
          </div>
          <span className="text-[10px] text-white/50 font-mono">LIVE</span>
        </div>

        {/* Section Label */}
        <div className="flex flex-col px-pad-xs">
          <span className="text-[10px] font-label-sm uppercase tracking-wider text-secondary-container font-bold">
            {nav.title}
          </span>
          <span className="text-[11px] text-white/60 font-medium">{nav.badge}</span>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1">
          {nav.items.map((item) => {
            const isActive = activeSection === (item.anchor || item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between transition-colors text-xs font-semibold ${
                  isActive
                    ? 'bg-secondary text-white shadow-sm font-bold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.count && (
                  <span className="px-1.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary-container text-[10px] font-bold">
                    {item.count}
                  </span>
                )}
                {item.alert && (
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Emergency / Assistant Action */}
      <div className="px-pad-sm flex flex-col gap-2 pt-pad-md border-t border-white/10">
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="w-full py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/10"
        >
          <span className="material-symbols-outlined text-[18px] text-secondary-container">smart_toy</span>
          <span>Ask ORCA Copilot</span>
        </button>

        <div className="text-[10px] text-white/40 text-center font-mono">
          MOSDAC · INCOIS OSF v3.4
        </div>
      </div>
    </aside>
  );
}
