import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// PRD §11 — a real interactive Leaflet map over real OpenStreetMap tiles.
// Three real modes (GisMapPage.jsx's "Fisherman View / Harbour Channel /
// Disaster Hazard" pills) — previously that mode state existed but was
// never passed down here, so all three buttons rendered the exact same
// map. Each mode now fetches and plots genuinely different real data:
//  - fisher: vessel position + PFZ zones + hazard polygons (the default).
//  - port: AIS vessel roster (backend/agents/port_agent.py — illustrative
//    positions, no live transponder feed; see PRD §15.3) plotted at real
//    points along the actual approach channel, zoomed into the harbour.
//  - disaster: DDMO coastal-block risk exposure (backend/agents/
//    disaster_agent.py), plotted at each block's real named locality,
//    zoomed out to show the whole Ennore-to-Kovalam stretch.

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const KASIMEDU = [13.12, 80.30];
const NM_TO_M = 1852;
const SEVERITY_COLOR = { WATCH: '#f59e0b', ALERT: '#f97316', WARNING: '#ef4444' };
const VESSEL_STATUS_COLOR = { safe: '#10B981', caution: '#f59e0b', danger: '#ef4444' };
const RISK_COLOR = { HIGH: '#ef4444', MODERATE: '#f59e0b', LOW: '#10B981' };

// Real haversine distance in km — used only to tell the user honestly when
// a search result is far outside this prototype's actual data coverage
// (a handful of real Chennai-area points), rather than silently showing
// an empty-looking map with no explanation.
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function TacticalGisMap({ height = '340px', showLayers = true, mode = 'fisher', focusOverride = null }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupsRef = useRef({});
  const searchMarkerRef = useRef(null);
  const [activeLayers, setActiveLayers] = useState({ range: true, hazards: true, pfz: true, vessels: true, blocks: true });
  const [warnings, setWarnings] = useState([]);
  const [pfzZones, setPfzZones] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [coastalBlocks, setCoastalBlocks] = useState([]);

  // Map init — runs once.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    // attributionControl.prefix: false drops Leaflet's own "Leaflet |"
    // branding text, keeping just the OSM credit the tile usage actually
    // requires — shorter and less visually dominant on the compact
    // Home-page embed (180px tall), where the full default string crowded
    // out most of the visible map area.
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false }).setView(KASIMEDU, 10);
    L.control.attribution({ prefix: false }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    L.marker(KASIMEDU).addTo(map).bindPopup('My Vessel — Kasimedu Pier (13.12°N, 80.30°E)');

    layerGroupsRef.current.range = L.layerGroup([
      L.circle(KASIMEDU, { radius: 5 * NM_TO_M, color: '#38BDF8', weight: 1, fill: false, dashArray: '4 4' }),
      L.circle(KASIMEDU, { radius: 15 * NM_TO_M, color: '#38BDF8', weight: 1, fill: false, dashArray: '4 4' }),
    ]).addTo(map);
    layerGroupsRef.current.hazards = L.layerGroup().addTo(map);
    layerGroupsRef.current.pfz = L.layerGroup().addTo(map);
    layerGroupsRef.current.vessels = L.layerGroup().addTo(map);
    layerGroupsRef.current.blocks = L.layerGroup().addTo(map);

    mapRef.current = map;
    fetch('/api/v1/warnings/active').then((r) => r.json()).then(setWarnings).catch(() => setWarnings([]));

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Mode switch — real per-mode fetch + real re-framing of the view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (mode === 'port') {
      map.setView([13.115, 80.303], 13);
      fetch('/api/port/status').then((r) => r.json()).then((d) => setVessels(d.vessels || [])).catch(() => setVessels([]));
      setPfzZones([]);
      setCoastalBlocks([]);
    } else if (mode === 'disaster') {
      map.setView([13.0, 80.30], 10);
      fetch('/api/ddmo/status').then((r) => r.json()).then((d) => setCoastalBlocks(d.coastal_blocks || [])).catch(() => setCoastalBlocks([]));
      setVessels([]);
      setPfzZones([]);
    } else {
      map.setView(KASIMEDU, 10);
      fetch('/api/pfz/zones').then((r) => r.json()).then((d) => setPfzZones(d.zones || [])).catch(() => setPfzZones([]));
      setVessels([]);
      setCoastalBlocks([]);
    }
  }, [mode]);

  // Real search/voice/GPS focus. The mode's actual data (AIS vessels,
  // DDMO coastal blocks, PFZ zones) is a small, real-but-fixed set of
  // points near Chennai — there's no live feed to conjure new markers
  // wherever someone searches. A plain flyTo() to a distant search result
  // used to leave the mode looking empty (the real data was still there,
  // just off-screen). Instead this frames the search point TOGETHER WITH
  // the mode's nearest actual data, so it's visually honest: "you searched
  // here" and "the app's real coverage is over there" are both shown, not
  // one silently hidden.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusOverride) return;
    const { lat, lon, label } = focusOverride;

    const modePoints =
      mode === 'port' ? vessels.filter((v) => v.lat != null).map((v) => [v.lat, v.lon]) :
      mode === 'disaster' ? coastalBlocks.filter((b) => b.lat != null).map((b) => [b.lat, b.lon]) :
      pfzZones.filter((z) => z.coordinates).map((z) => [z.coordinates.lat, z.coordinates.lon]);

    const nearestKm = Math.min(...[...modePoints, KASIMEDU].map(([mLat, mLon]) => haversineKm(lat, lon, mLat, mLon)));
    const modeName = mode === 'port' ? 'AIS vessel' : mode === 'disaster' ? 'DDMO coastal-block' : 'PFZ/safety';
    const coverageNote = nearestKm > 15
      ? `<br/><em style="color:#b45309">No ${modeName} data near here (~${Math.round(nearestKm)} km from nearest covered point) — this prototype's live data covers the Chennai/Kasimedu coastal area.</em>`
      : '';

    if (searchMarkerRef.current) map.removeLayer(searchMarkerRef.current);
    const marker = L.marker([lat, lon], {
      icon: L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#f59e0b;border:2px solid white;box-shadow:0 0 0 4px rgba(245,158,11,0.35)"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    })
      .addTo(map)
      .bindPopup(`<strong>${label || 'Searched location'}</strong><br/>${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E${coverageNote}`)
      .openPopup();
    searchMarkerRef.current = marker;

    const allPoints = [[lat, lon], ...modePoints, KASIMEDU];
    if (allPoints.length > 1) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50], maxZoom: 13 });
    } else {
      map.flyTo([lat, lon], 13, { duration: 1.2 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusOverride]);

  useEffect(() => {
    const group = layerGroupsRef.current.hazards;
    if (!group) return;
    group.clearLayers();
    warnings.forEach((w) => {
      const latlngs = (w.coordinates || []).map((c) => [c.lat, c.lon]);
      if (latlngs.length < 3) return;
      L.polygon(latlngs, { color: SEVERITY_COLOR[w.severity] || '#ef4444', weight: 2, fillOpacity: 0.25 })
        .bindPopup(`<strong>${w.title}</strong><br/>${w.severity} · ${w.hazard_type}<br/>${w.description}`)
        .addTo(group);
    });
  }, [warnings]);

  useEffect(() => {
    const group = layerGroupsRef.current.pfz;
    if (!group) return;
    group.clearLayers();
    pfzZones.forEach((z) => {
      if (!z.coordinates) return;
      L.circleMarker([z.coordinates.lat, z.coordinates.lon], {
        radius: 8, color: '#10B981', fillColor: '#10B981', fillOpacity: 0.6, weight: 1.5,
      })
        .bindPopup(`<strong>${z.name}</strong><br/>${z.distance_nm} NM · ${z.probability_pct}% catch probability<br/>${z.species}`)
        .addTo(group);
    });
  }, [pfzZones]);

  useEffect(() => {
    const group = layerGroupsRef.current.vessels;
    if (!group) return;
    group.clearLayers();
    vessels.forEach((v) => {
      if (v.lat == null || v.lon == null) return;
      L.circleMarker([v.lat, v.lon], {
        radius: 7, color: VESSEL_STATUS_COLOR[v.status_level] || '#38BDF8',
        fillColor: VESSEL_STATUS_COLOR[v.status_level] || '#38BDF8', fillOpacity: 0.7, weight: 1.5,
      })
        .bindPopup(`<strong>${v.name}</strong> (${v.mmsi})<br/>${v.vessel_type}<br/>${v.status} — ${v.berth}<br/><em>${v.action_required}</em>`)
        .addTo(group);
    });
  }, [vessels]);

  useEffect(() => {
    const group = layerGroupsRef.current.blocks;
    if (!group) return;
    group.clearLayers();
    coastalBlocks.forEach((b) => {
      if (b.lat == null || b.lon == null) return;
      const color = RISK_COLOR[b.risk_level] || '#ef4444';
      L.circle([b.lat, b.lon], {
        radius: Math.max(600, Math.sqrt(b.population_exposed) * 40),
        color, fillColor: color, fillOpacity: 0.3, weight: 1.5,
      })
        .bindPopup(
          `<strong>${b.block_name}</strong><br/>${b.risk_level} risk · ${b.projected_max_wave}m projected wave<br/>` +
          `${b.population_exposed.toLocaleString()} exposed<br/>${b.shelter_status}<br/><em>${b.alert_action}</em>`
        )
        .addTo(group);
    });
  }, [coastalBlocks]);

  const toggleLayer = (key) => {
    const map = mapRef.current;
    const group = layerGroupsRef.current[key];
    setActiveLayers((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (group && map) {
        if (next[key]) group.addTo(map); else map.removeLayer(group);
      }
      return next;
    });
  };

  const modeLabel = mode === 'port' ? 'Harbour Channel' : mode === 'disaster' ? 'Disaster Hazard' : 'Kasimedu Bight';

  return (
    // isolate is load-bearing here, not decorative: Leaflet's internal
    // panes use z-index values up to ~700 (marker/popup/tooltip panes),
    // and without a new stacking context those values compare directly
    // against the app's fixed header/masthead (z-index 50-70) at the ROOT
    // level — meaning once the page scrolls so this card's top edge is
    // near the fixed header, the map's internal layers paint OVER the
    // header instead of staying tucked underneath it, exactly backwards
    // from how a fixed nav is supposed to behave. `isolate` contains every
    // Leaflet z-index inside this element's own stacking context, so it
    // can never escape and outrank page-level fixed elements.
    <div className="relative isolate z-0 rounded-xl overflow-hidden bg-[#0A1626] border border-surface-container-high shadow-md">
      <div className="absolute top-2 left-2 right-2 z-[1100] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/10 pointer-events-auto">
          <span className="material-symbols-outlined text-[14px] text-secondary-container">radar</span>
          <span className="font-label-sm text-[11px] font-bold">{modeLabel} · Live OSM Map</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-emerald-400 border border-white/10 text-[10px] font-mono pointer-events-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{warnings.length} Active Warning{warnings.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {showLayers && (
        <div className="absolute bottom-2 left-2 z-[1100] flex items-center gap-1 overflow-x-auto pointer-events-auto max-w-[calc(100%-1rem)]">
          <button
            onClick={() => toggleLayer('range')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all whitespace-nowrap ${
              activeLayers.range ? 'bg-secondary text-white' : 'bg-black/60 text-white/60 border border-white/10'
            }`}
          >
            Range Rings
          </button>
          <button
            onClick={() => toggleLayer('hazards')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all whitespace-nowrap ${
              activeLayers.hazards ? 'bg-error text-white' : 'bg-black/60 text-white/60 border border-white/10'
            }`}
          >
            Hazard Polygons ({warnings.length})
          </button>
          {mode === 'fisher' && (
            <button
              onClick={() => toggleLayer('pfz')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all whitespace-nowrap ${
                activeLayers.pfz ? 'bg-emerald-600 text-white' : 'bg-black/60 text-white/60 border border-white/10'
              }`}
            >
              PFZ Zones ({pfzZones.length})
            </button>
          )}
          {mode === 'port' && (
            <button
              onClick={() => toggleLayer('vessels')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all whitespace-nowrap ${
                activeLayers.vessels ? 'bg-secondary text-white' : 'bg-black/60 text-white/60 border border-white/10'
              }`}
            >
              AIS Vessels ({vessels.length})
            </button>
          )}
          {mode === 'disaster' && (
            <button
              onClick={() => toggleLayer('blocks')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all whitespace-nowrap ${
                activeLayers.blocks ? 'bg-error text-white' : 'bg-black/60 text-white/60 border border-white/10'
              }`}
            >
              Coastal Blocks ({coastalBlocks.length})
            </button>
          )}
        </div>
      )}

      <div ref={containerRef} style={{ height, width: '100%' }} />
    </div>
  );
}
