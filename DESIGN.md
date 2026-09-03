# ORCA Marine Intelligence — Design DNA & Specification
**Project Identifier:** `projects/701698788993766399`  
**System:** ORCA Marine Intelligence Platform (SIH 2026 · PS-26176)  
**Institutions:** ISRO (SAC, MOSDAC) · INCOIS · IMD · Indian Coast Guard · Department of Fisheries  
**Design Status:** Complete Specification from 11 Production Stitch Screens  

---

## 1. Executive Overview & Design Philosophy

The **ORCA Marine Intelligence Platform** is engineered to bridge cutting-edge Earth observation satellite data (Oceansat-3, INSAT-3D, Sentinel-3) and deterministic oceanographic forecasting (INCOIS OSF, WAVEWATCH-III, SWAN) directly into the hands of coastal communities, vessel skippers, disaster management officers, port authorities, and maritime researchers.

### The Two Core Pillars

```
┌──────────────────────────────────────────────────────────────┐
│                    ORCA DESIGN FOUNDATION                    │
├──────────────────────────────┬───────────────────────────────┤
│      TACTILE PRECISION       │      SCIENTIFIC TRUST &       │
│  (Extreme Field Ergonomics)  │     DETERMINISTIC SAFETY      │
├──────────────────────────────┼───────────────────────────────┤
│ • Sunlight-readable contrast │ • Explicit agency provenance  │
│ • Wet-hand touch targets     │ • Confidence score meters (%) │
│ • Multi-script legibility    │ • Deterministic rule engine   │
│ • No layout jitter (tabular) │ • "Verdict Before Detail"     │
└──────────────────────────────┴───────────────────────────────┘
```

1. **Tactile Precision (Extreme Field Ergonomics):**
   - Designed for high-glare sea spray, direct tropical sunlight, pitching boat decks, and wet fingers.
   - Every interactive element maintains a minimum touch target of `48px` (`touch-min: 3rem`).
   - High-contrast visual hierarchy prevents ambiguity even on low-cost Android handsets under full sun.

2. **Scientific Trust & Deterministic Safety:**
   - **"Verdict Before Detail" Doctrine:** The mariner receives a crisp, unambiguous operational verdict (`SAFE`, `CAUTION`, or `DO NOT VENTURE`) before any complex charts or sensor curves are presented.
   - **Explicit Provenance:** Every metric displays its origin agency (`INCOIS OSF`, `MOSDAC`, `IMD`), satellite sensor (`INSAT-3D Imager`, `Oceansat-3 OCM`), timestamp, and confidence interval.
   - **Deterministic Boundaries:** Probabilistic AI responses are strictly bound by physical craft limits (e.g., vessel length LOA, engine HP, hull threshold vs. breaker wave height).

---

## 2. Master Screen Inventory & Route Mapping

The Stitch project contains **11 primary production screens** spanning mobile field interfaces and high-density desktop command dashboards:

| # | Stitch Screen ID | Screen Title | Device Target | Intended Application Route | Target User Persona |
|---|---|---|---|---|---|
| **01** | `dfc2ee9b89594aad8f8b4cdff549b15d` | ORCA - Marine Intelligence & Safety Home | Mobile (`390×884` / `780×4370`) | `/` or `/home` | Artisanal Fishermen, Vessel Skippers |
| **02** | `6be31e99c10545a187adbbd53f4d2ce7` | ORCA - Dedicated Marine Safety Assessment | Mobile (`390×884` / `780×7786`) | `/safety` | Artisanal Fishermen, Crew Captains |
| **03** | `fab1d900543a4a9088d35b1ee86556ff` | ORCA - Nearest Potential Fishing Zone (PFZ) & Route Safety | Mobile (`390×884` / `780×5904`) | `/pfz` | Commercial & Artisanal Fishermen |
| **04** | `9ae60ca525a84fac9854f25b8f6518a2` | ORCA - Full Marine Intelligence GIS Map | Mobile (`390×884` / `780×3002`) | `/map` | Navigators, Field Operators, Fishermen |
| **05** | `ff505b1e58c44b0998d324ef50edb7fc` | ORCA - Conversational Marine Assistant | Mobile (`390×884` / `780×3858`) | `/assistant` or `/chat` | Fishermen (Tamil / Hindi / English voice) |
| **06** | `18d7192155f6465c9b881e8c12b08cdf` | ORCA - Fisherman Profile & Vessel Configuration | Mobile (`390×884` / `780×6424`) | `/profile` or `/vessel` | Vessel Owners, Skippers |
| **07** | `c494d09aec1b45e8b47fd4e5b8d6ee7f` | ORCA - Marine Intelligence Settings | Mobile (`390×884` / `780×9358`) | `/settings` | All Users & Field Administrators |
| **08** | `3396150d56eb4959afa4332a8e9b0f34` | ORCA - DDMO Marine Situational Awareness & Disaster Operations Dashboard | Desktop (`2560×5196`) | `/dashboard/ddmo` | District Disaster Management Officers (DDMO) |
| **09** | `12a0ed6513a5487cb22d8b8644f0b850` | ORCA - Port Operator Marine & Vessel Operations Dashboard | Desktop (`2714×7224`) | `/dashboard/port` | Port Authorities, Harbour Masters |
| **10** | `8866663f225f49ae85644e7423291775` | ORCA - Researcher Marine Analytics & Climatology Workspace | Desktop (`2560×4848`) | `/dashboard/researcher` | ISRO/INCOIS Oceanographers, Climatologists |
| **11** | `67ddc1af3c284b649fae917cf33c97fa` | ORCA - Authority & Senior Maritime Oversight Command Dashboard | Desktop (`2560×5664`) | `/dashboard/authority` | State Disaster Authority, Coast Guard DG |

---

## 3. Color Palette & Tonal Design Tokens

The color architecture is built around **deep bathymetric ocean blues** contrasted with **international maritime safety semantic hues**.

### 3.1 Core Brand Palette (HEX & CSS Variables)

```css
:root {
  /* Primary Bathymetric Scale */
  --color-primary: #001026;                  /* Deep Abyssal Navy (Brand Base) */
  --color-primary-container: #0b2545;        /* Command Navy (Headers, Elevated Containers) */
  --color-on-primary: #ffffff;
  --color-on-primary-container: #778db2;      /* Slate Blue Muted Text */
  --color-primary-fixed: #d5e3ff;
  --color-primary-fixed-dim: #b1c7f0;
  --color-on-primary-fixed: #001c3b;
  --color-on-primary-fixed-variant: #314769;

  /* Secondary Maritime & Coastal Azure Scale */
  --color-secondary: #006399;                /* Coastal Azure (Interactive, Nav, Icons) */
  --color-secondary-container: #67bafd;      /* Active Soft Azure Tint */
  --color-on-secondary: #ffffff;
  --color-on-secondary-container: #004972;
  --color-secondary-fixed: #cde5ff;
  --color-secondary-fixed-dim: #94ccff;
  --color-on-secondary-fixed: #001d32;
  --color-on-secondary-fixed-variant: #004b74;

  /* Tertiary Indigo & Sensor Evidence Scale */
  --color-tertiary: #030049;                /* Deep Source / Midnight Indigo */
  --color-tertiary-container: #0b0087;
  --color-on-tertiary: #ffffff;
  --color-on-tertiary-container: #7a7dff;
  --color-tertiary-fixed: #e1e0ff;
  --color-tertiary-fixed-dim: #c0c1ff;
  --color-on-tertiary-fixed: #07006c;
  --color-on-tertiary-fixed-variant: #2f2ebe;

  /* Surface & Canvas Foundations */
  --color-surface: #faf8ff;                  /* Mist Light Canvas */
  --color-surface-dim: #d2d9f4;
  --color-surface-bright: #faf8ff;
  --color-surface-variant: #dae2fd;
  --color-surface-container-lowest: #ffffff;  /* Pure Elevated Card White */
  --color-surface-container-low: #f2f3ff;
  --color-surface-container: #eaedff;
  --color-surface-container-high: #e2e7ff;
  --color-surface-container-highest: #dae2fd;
  --color-surface-tint: #495f82;

  /* Typography & Contrast */
  --color-on-surface: #131b2e;              /* Command Charcoal / Dark Navy Text */
  --color-on-surface-variant: #44474e;      /* Muted Slate Body Text */
  --color-outline: #74777f;                 /* Boundary Lines */
  --color-outline-variant: #c4c6cf;         /* Card Dividing Dividers */

  /* Inverted Surfaces */
  --color-inverse-surface: #283044;
  --color-inverse-on-surface: #eef0ff;
  --color-inverse-primary: #b1c7f0;

  /* International Maritime Hazard Red */
  --color-error: #ba1a1a;                   /* Danger Red Solid */
  --color-error-container: #ffdad6;         /* High Hazard Light Tint */
  --color-on-error: #ffffff;
  --color-on-error-container: #93000a;
}
```

### 3.2 Dark Theme (Night Watch / Wheelhouse Bridge Mode)

Engineered for bridge watchkeeping in zero ambient light without destroying dark-adapted night vision:

```css
.dark {
  --color-surface: #090d16;                  /* Abyssal Black Canvas */
  --color-surface-dim: #05080e;
  --color-surface-bright: #151b2a;
  --color-surface-container-lowest: #0c121e;  /* Deep Night Watch Deck */
  --color-surface-container-low: #111827;     /* Elevated Card Level 1 */
  --color-surface-container: #172033;         /* Card Level 2 */
  --color-surface-container-high: #1e293b;    /* High Contrast Hover */
  --color-surface-container-highest: #26334d;
  --color-on-surface: #f8fafc;               /* Crisp Polar White */
  --color-on-surface-variant: #94a3b8;       /* Subtle Starlight Muted */
  --color-outline: #334155;
  --color-outline-variant: #1e293b;
  --color-primary: #38bdf8;                  /* Luminescent Cyan */
  --color-primary-container: #0f2744;
  --color-secondary: #38bdf8;
  --color-secondary-container: #03456b;
  --color-on-secondary-container: #bae6fd;
}
```

### 3.3 Semantic Safety Triage Matrix

The interface relies on strict, instant visual triage for marine safety:

| State | Solid Accent | Surface Tint | 2px Border Stroke | High-Contrast Text | Icon | English Label | Tamil Label (தமிழ்) | Hindi Label (हिन्दी) |
|---|---|---|---|---|---|---|---|---|
| **SAFE** | `#10B981` (Emerald) | `#ECFDF5` (`bg-sky-50`) | `#059669` / `#10B981` | `#065F46` / `#0C4A6E` | `check_circle` | `SAFE` | பாதுகாப்பானது | सुरक्षित |
| **CAUTION** | `#F59E0B` (Amber) | `#FEF3C7` (`bg-amber-50`)| `#D97706` / `#F59E0B` | `#92400E` / `#451A03` | `warning` | `CAUTION` | எச்சரிக்கை | चेतावनी |
| **DO NOT VENTURE** | `#EF4444` (Hazard Red)| `#FEF2F2` (`bg-red-50`) | `#DC2626` / `#EF4444` | `#991B1B` / `#450A0A` | `dangerous` | `DO NOT VENTURE` | கடலுக்கு செல்ல வேண்டாம் | समुद्र में न जाएं |
| **STALE TELEMETRY**| `#74777F` (Slate) | `#F2F3FF` (`bg-surface-low`)| `#94A3B8` | `#44474E` / `#1E293B` | `sync_problem` | `STALE TELEMETRY`| தரவு காலாவதியானது | डेटा पुराना है |

---

## 4. Typography System

The typography pairs **Space Grotesk** for structural authority, **Inter** for multi-script readability across Indian regional languages, and **JetBrains Mono** for zero-jitter telemetry readouts.

```
┌───────────────────────────────────────────────────────────────┐
│                      ORCA TYPE HIERARCHY                      │
├─────────────────────┬───────────────────┬─────────────────────┤
│    Space Grotesk    │       Inter       │   JetBrains Mono    │
│  (Headlines / HUD)  │ (Body & Language) │ (Sensor Telemetry)  │
├─────────────────────┼───────────────────┼─────────────────────┤
│ • Display & Status  │ • English Strings │ • Significant Wave  │
│ • Operational Mode  │ • Tamil (தமிழ்)   │ • Wind Knots (kt)   │
│ • Card Titles       │ • Hindi (हिन्दी)  │ • Lat/Long DGPS     │
│ • Statutory Orders  │ • Advisory Copy   │ • Timestamps & UTC  │
└─────────────────────┴───────────────────┴─────────────────────┘
```

### 4.1 Type Tokens & Font Scale

| Token Name | Font Family | Size | Line Height | Letter Spacing | Weight | Typical Usage |
|---|---|---|---|---|---|---|
| `display-lg` | Space Grotesk | `40px` (`2.5rem`) | `48px` | `-0.02em` | `700` (Bold) | Desktop hero dashboards, major state banners |
| `display-lg-mobile`| Space Grotesk | `28px` (`1.75rem`) | `36px` | `-0.01em` | `700` (Bold) | Mobile primary verdict status (`CAUTION`) |
| `headline-lg` | Space Grotesk | `30px` (`1.875rem`)| `38px` | `0em` | `600` (SemiBold) | Section hero titles, statutory advisory alerts |
| `headline-md` | Space Grotesk | `22px` (`1.375rem`)| `28px` | `0em` | `600` (SemiBold) | Card headers, workspace module titles |
| `headline-sm` | Space Grotesk | `18px` (`1.125rem`)| `24px` | `0em` | `600` (SemiBold) | Sub-section cards, dialog headers |
| `body-lg` | Inter | `17px` (`1.0625rem`)| `26px` | `0em` | `400` (Regular) | Primary plain-language advisories, assistant turn |
| `body-md` | Inter | `15px` (`0.9375rem`)| `22px` | `0em` | `400` (Regular) | Standard UI body text, lists, explanations |
| `body-sm` | Inter | `13px` (`0.8125rem`)| `18px` | `0em` | `400` (Regular) | Secondary descriptions, timestamps, micro-copy |
| `telemetry-lg` | JetBrains Mono | `28px` (`1.75rem`) | `32px` | `-0.03em` | `700` (Bold) | Live wave height (`1.8m`), wind (`24 kt`) |
| `telemetry-sm` | JetBrains Mono | `14px` (`0.875rem`)| `18px` | `+0.02em` | `600` (SemiBold) | Small sensor readout, compass bearing (`142° SE`) |
| `label-md` | JetBrains Mono | `12px` (`0.75rem`) | `16px` | `+0.04em` | `600` (SemiBold) | Metric labels, telemetry units, table headers |
| `label-sm` | JetBrains Mono | `10px` (`0.625rem`)| `14px` | `+0.06em` | `700` (Bold) | Badges, chip tags (`INCOIS OSF · 94%`), caps |

### 4.2 Multi-Script Localization Rules
- **Tabular Numerals (`tnum`):** All `telemetry-*` classes must be rendered with `font-variant-numeric: tabular-nums` to eliminate jitter during real-time updates.
- **Tamil (`தமிழ்`) & Devanagari (`हिन्दी`):** Tamil glyphs require an additional `+2px` line-height buffer (`leading-relaxed` or `leading-loose`) to prevent diacritic clipping.
- **Verdict Overrides:** `DO NOT VENTURE` verdicts require full uppercase with `0.05em` letter-spacing.

---

## 5. Spacing, Sizing & Elevation System

### 5.1 Spacing Scale

```css
/* Custom Spacing Tokens */
--pad-xs: 0.25rem;       /* 4px  - Micro chip gaps, icon margins */
--pad-sm: 0.5rem;        /* 8px  - Compact internal card padding */
--pad-md: 1.0rem;        /* 16px - Standard card padding */
--pad-lg: 1.5rem;        /* 24px - Desktop module padding */
--pad-xl: 2.0rem;        /* 32px - Section dividers */

--gutter-mobile: 1.0rem; /* 16px - Mobile screen edge margin */
--gutter-desktop: 1.5rem;/* 24px - Desktop grid column gap */
--margin-mobile: 1.0rem; /* 16px - Mobile outer container */
--margin-desktop: 2.0rem;/* 32px - Desktop outer margin */

--touch-min: 3.0rem;     /* 48px - MANDATORY MINIMUM TOUCH TARGET */
```

### 5.2 Border Radii Tokens
- `rounded-sm`: `0.25rem` (`4px`) — Data chips, micro tags, status dots.
- `rounded-md`: `0.5rem` (`8px`) — Action buttons, small badges.
- `rounded-lg`: `0.75rem` (`12px`) — Sub-cards, input boxes, select fields.
- `rounded-xl`: `1.0rem` (`16px`) — Primary cards, bento modules, modal sheets.
- `rounded-2xl`: `1.5rem` (`24px`) — Elevated floating sheets, dialog containers.
- `rounded-full`: `9999px` — Voice FAB, pill chips, avatar circles.

### 5.3 Elevation & Layering Architecture

| Elevation Level | Token / CSS | Visual Role | Application |
|---|---|---|---|
| **Level 0 (Canvas)** | `#FAF8FF` (Light) / `#090D16` (Dark) | Foundation backdrop | Background screen canvas |
| **Level 1 (Card Deck)** | `bg-surface-container-lowest` + `1px border #E2E8F0` | Flat elevated module | Bento cards, telemetry clusters, tables |
| **Level 2 (Floating Deck)** | `shadow-[0_4px_20px_-2px_rgba(11,37,69,0.08)]` | Focused interactives | Active safety cards, dropdown menus |
| **Level 3 (Emergency / Alert)**| `shadow-[0_8px_30px_-4px_rgba(239,68,68,0.2)]` + `2px border` | Critical hazard alerts | DO NOT VENTURE modal, severe squall banner |
| **Navigation Glass** | `backdrop-blur-xl bg-surface/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)]` | Persistent controls | Top header bar & bottom navigation bar |

---

## 6. Core Component Catalog

### 6.1 Buttons & Interactive Triggers

1. **Primary Action Button:**
   - Classes: `min-h-[44px] px-pad-lg py-pad-sm rounded-lg bg-primary text-on-primary font-headline-sm font-bold shadow-sm transition-all hover:bg-primary/90 active:scale-98 flex items-center justify-center gap-2`
   - Example: *"Plot Safe Route"*, *"Issue Broadcast"*.

2. **Secondary Coastal Azure Button:**
   - Classes: `min-h-[44px] px-pad-md py-pad-sm rounded-lg bg-secondary text-on-secondary font-label-md font-bold shadow-sm hover:bg-secondary/90 active:scale-98`
   - Example: *"Export NetCDF / CSV"*, *"Inspect Threat Polygon"*.

3. **Subtle Surface Outline Button:**
   - Classes: `min-h-[44px] px-pad-sm py-pad-xs rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-high text-sm font-semibold`
   - Example: *"Edit Boat Specs"*, *"VHF Ch-16"*.

4. **Floating Action Button (FAB - Center Microphone):**
   - Classes: `w-14 h-14 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-[0_4px_20px_-2px_rgba(11,37,69,0.25)] ring-4 ring-surface active:scale-95 transition-transform`
   - Pulse Behavior: Concentric oceanic ripples expanding outwards when actively listening to Tamil, Hindi, or English voice queries.

5. **Operational Segmented Control Button Cluster:**
   - Height: `40px`, Background: `bg-surface-container-low p-0.5 rounded-lg`.
   - Active Segment: `bg-primary text-on-primary shadow-sm font-bold`.
   - Inactive Segment: `text-on-surface-variant hover:text-on-surface`.

### 6.2 Primary Safety Verdict Card ("Verdict Before Detail")

Engineered with an ambient subtle ocean wave watermark (`opacity-10 text-primary` or `text-amber-900`), this card delivers immediate situational awareness:

```html
<!-- Example: Caution State Card -->
<section class="relative overflow-hidden rounded-xl p-pad-md bg-amber-50 text-amber-950 shadow-md">
  <div class="absolute -right-6 -bottom-6 opacity-10 pointer-events-none text-amber-900">
    <span class="material-symbols-outlined text-[150px]">tsunami</span>
  </div>
  <div class="relative z-10 flex flex-col gap-pad-sm">
    <!-- Top Row: Icon Badge + Bilingual Verdict -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-center gap-2.5">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500 text-white shadow-sm flex-shrink-0">
          <span class="material-symbols-outlined text-[30px]">warning</span>
        </div>
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <span class="font-headline-lg font-black tracking-tight leading-none text-amber-950">CAUTION</span>
            <span class="px-2 py-0.5 rounded-full font-label-md font-bold bg-amber-200/80 text-amber-900">எச்சரிக்கை</span>
          </div>
          <span class="font-headline-sm font-semibold text-amber-900 mt-0.5">Moderate Risk: Heightened Alert</span>
        </div>
      </div>
    </div>
    <!-- Validity Pill -->
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm self-start shadow-xs">
      <span class="material-symbols-outlined text-[16px] text-amber-700">timer</span>
      <span class="font-label-md font-semibold text-amber-950">Target Window: Tomorrow 05:00 – 10:00 IST</span>
    </div>
    <!-- Plain Language Maritime Advisory -->
    <div class="p-3 rounded-lg bg-white/90 text-amber-950 shadow-xs">
      <p class="font-body-md leading-relaxed">
        Conditions may be difficult for your <strong>8m motorized FRP vessel</strong> tomorrow morning because of elevated breaker waves (<span class="font-bold">1.8m</span>) and squalls out of Kasimedu harbour mouth.
      </p>
    </div>
    <!-- 2-Col Immediate Telemetry Readout -->
    <div class="grid grid-cols-2 gap-2 pt-1">
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100/70">
        <span class="material-symbols-outlined text-[20px] text-amber-800">waves</span>
        <div class="flex flex-col">
          <span class="font-label-sm uppercase tracking-wider text-amber-900 font-semibold">Max Wave</span>
          <span class="font-telemetry-sm font-bold text-amber-950">1.8m · SSE Swell</span>
        </div>
      </div>
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100/70">
        <span class="material-symbols-outlined text-[20px] text-amber-800">air</span>
        <div class="flex flex-col">
          <span class="font-label-sm uppercase tracking-wider text-amber-900 font-semibold">Gust Profile</span>
          <span class="font-telemetry-sm font-bold text-amber-950">24 kt Gusts (NE)</span>
        </div>
      </div>
    </div>
  </div>
</section>
```

### 6.3 Evidence & Provenance Chips

Visual proof indicators showing which scientific models, sensors, and government agencies informed the calculation:

```html
<!-- Single Provenance Chip -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA] font-label-md text-label-md font-bold tracking-wide shadow-xs">
  <span class="material-symbols-outlined text-[14px]">satellite_alt</span>
  INCOIS OSF · 94%
</span>

<!-- MOSDAC Live Chip -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-label-md text-label-md font-bold tracking-wide">
  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
  MOSDAC SATELLITE · LIVE
</span>

<!-- IMD Gale Warning Chip -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-label-md text-label-md font-bold tracking-wide">
  <span class="material-symbols-outlined text-[14px]">thunderstorm</span>
  IMD GALE · ACTIVE
</span>
```

### 6.4 Telemetry Health & Data Freshness Indicators

1. **Pulsating Live Ping:**
   - A dual-element indicator: an outer ping ring (`animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75`) and an inner solid dot (`relative inline-flex rounded-full h-2 w-2 bg-secondary`).
2. **Relative Age Indicators:**
   - `"Updated 2h ago"`, `"Synced 4m ago"`, `"Latency: 14m"`.
3. **Offline / Satellite Transponder Fallback Badge:**
   - Displays `NavIC · DGPS` when GNSS signal is authenticated, or `SMS CACHED` when operating beyond 15 NM coastal cellular reach.

### 6.5 Navigation Systems

#### A. Mobile Bottom Navigation (5-Tab Sticky Bar)
Fixed to viewport bottom with iOS/Android home-bar safe padding (`pb-safe`). Includes an elevated center action button:

1. **Tab 1: Home** (`icon: anchor`, label: `"Home"`, route: `/`)
2. **Tab 2: Map** (`icon: explore`, label: `"Map"`, route: `/map`)
3. **Center Hero Action: Ask ORCA** (`icon: mic`, elevated `-top-5`, `w-14 h-14` circular FAB, route: `/assistant`)
4. **Tab 4: Alerts** (`icon: crisis_alert`, badge counter `"1"` in `bg-error text-on-error`, route: `/safety`)
5. **Tab 5: Profile** (`icon: badge`, label: `"Profile"`, route: `/profile`)

#### B. Desktop Tactical Sidebar & Command Rail
Fixed `w-64` left navigation rail with dark maritime styling:
- **Header:** Institution logo (`ISRO · INCOIS Ecosystem`), operational jurisdiction tag (`Coromandel Zone 04`).
- **Telemetry Stream Status:** Pulsating green radar indicator.
- **Nav Group Items:**
  - `Overview` (`dashboard`)
  - `Regional Risk Triage` / `Port Conditions` (`shield` / `tsunami`)
  - `Vessel Traffic (AIS)` (`directions_boat` with live counter badge e.g. `42 Live`)
  - `Tactical GIS Map` (`map`)
  - `Official Warnings` (`warning` with urgency counter)
  - `24h Ocean Outlook` (`waves` / `air`)
  - `Ask ORCA Copilot` (`smart_toy`)
- **Footer Action:** Direct Emergency Action Button (e.g., *"Issue Siren Broadcast"* or *"Generate Situation Brief PDF"*).

---

## 7. Data Visualization, Maps, Tables & Forms

### 7.1 Maps & Vector Cartography

1. **Mobile Tactical GIS Map Preview Card:**
   - Embedded SVG / Leaflet container with 5 NM and 15 NM coastal range rings.
   - Bathymetric water depth contours: `5m` (coastal shoal), `10m` (breaker line), `20m` (inner shelf), `50m` (trawling zone).
   - Hazard Exclusion Polygon: Red diagonal crosshatch pattern (`stroke: #ef4444; stroke-dasharray: 4 4`) indicating active squall or sandbar shoaling.
   - PFZ Marker: Cyan glowing radial gradient indicating chlorophyll/thermal front confluence.
2. **Desktop Command Map:**
   - Full 12-column geospatial canvas with layer controls (SST thermal anomalies, SWAN wave heights, NavIC AIS vessel track lines, Port harbour limits).

### 7.2 Marine Charts & Time-Series Curves

1. **24-Hour Swell & Wind Curve (Screen 02):**
   - High-contrast SVG line graph with three horizontal danger thresholds:
     - Dotted Green line at `1.5m` (Safe physical craft threshold).
     - Dotted Amber line at `1.8m` (Marginal threshold).
     - Solid Red line at `2.2m` (Critical capsizing threshold).
   - Hourly scrubber nodes showing peak swell time (`07:00 IST: 1.8m SWH`).
2. **Climatology 30-Day SST Trajectory (Screen 10):**
   - Shaded anomaly polygon (`anomalyGrad: #006399` to `#CDE5FF`) comparing real-time daily satellite SST against the 30-year climatological baseline normal.
   - Upwelling thermal cool band highlighting sudden temperature drops (`27.6°C`) where pelagic fish congregate.

### 7.3 High-Density Operational Tables

Engineered for zero clutter in command centers:

```html
<!-- High-Density Table Anatomy -->
<table class="w-full text-left border-collapse">
  <thead>
    <tr class="border-b border-surface-container-highest bg-surface-container-low/50">
      <th class="py-2.5 px-3 font-label-sm text-label-sm uppercase text-on-surface-variant">Vessel / MMSI</th>
      <th class="py-2.5 px-3 font-label-sm text-label-sm uppercase text-on-surface-variant">Craft Type</th>
      <th class="py-2.5 px-3 font-label-sm text-label-sm uppercase text-on-surface-variant">Draught</th>
      <th class="py-2.5 px-3 font-label-sm text-label-sm uppercase text-on-surface-variant">Status</th>
      <th class="py-2.5 px-3 font-label-sm text-label-sm uppercase text-on-surface-variant">Action</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-surface-container font-body-sm text-body-sm">
    <tr class="hover:bg-surface-container-low transition-colors">
      <td class="py-2.5 px-3 font-bold font-telemetry-sm">MV Ocean Pride (419001284)</td>
      <td class="py-2.5 px-3">Trawler (14m)</td>
      <td class="py-2.5 px-3 font-telemetry-sm">1.8m</td>
      <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-label-sm">Bar Hold</span></td>
      <td class="py-2.5 px-3"><button class="text-secondary font-bold hover:underline">Signal VHF</button></td>
    </tr>
  </tbody>
</table>
```

### 7.4 Forms & Calibration Controls

Found extensively in **Screen 06 (Vessel Configuration)** and **Screen 07 (Settings)**:
- **Physical Vessel Inputs:** LOA (Length Overall in meters), Beam width, Draught, Outboard Motor (OBM HP), Hull Material selector (FRP / Wood / Steel).
- **Physical Threshold Auto-Calibration:** As the fisherman edits engine HP or boat length, the safety engine dynamically computes maximum safe wave height and fuel range.
- **Toggle Switches:** `w-12 h-7 rounded-full bg-surface-container-highest transition-colors` with a white circular slider `w-5 h-5 rounded-full bg-white shadow-sm`.
- **Radio Selection Cards:** Language options (English, Tamil, Hindi) styled as elevated selectable cards with checkmark badges.

---

## 8. Screen-by-Screen Detailed Design DNA

### Screen 01: Marine Intelligence & Safety Home (`dfc2ee9b89594aad8f8b4cdff549b15d`)
* **Route:** `/` or `/home`
* **Target:** Mobile skippers preparing for voyage.
* **Layout Structure:**
  - Sticky Glass Header (`h-28` with emblem, ISRO/INCOIS chips, location selector `Kasimedu 13.12°N, 80.30°E`, and `ONLINE · 4G` live ping).
  - High Hazard Warning Strip: Urgent red alert (`High Wave & Squall Alert · Valid to 18:00 IST`).
  - Primary Verdict Card: AMBER CAUTION card for tomorrow morning's feasibility tailored to the registered 8m FRP boat.
  - Voice-First Launcher: Prominent mic CTA inviting queries in Tamil or English.
  - Interactive Map Preview Card: Miniature coastal bight preview with quick route to PFZ #01.
  - Compact Telemetry 2x2 Bento: Wave height (`1.8m`), Wind speed (`24 kt`), Ocean Current (`1.2 kt`), Swell direction (`142° SE`).
  - Nearest PFZ Card: Distance `18.4 NM`, fuel savings estimate `28%`, transit warning banner.
  - Sticky Bottom Navigation bar with elevated center Voice button.

### Screen 02: Dedicated Marine Safety Assessment (`6be31e99c10545a187adbbd53f4d2ce7`)
* **Route:** `/safety`
* **Target:** In-depth safety breakdown & deterministic reasoning.
* **Layout Structure:**
  - Operational Simulation Selector: Interactive 4-state switch (`CAUTION`, `SAFE`, `VENTURE NO`, `STALE DEMO`) for testing and evaluation.
  - Dominant Verdict Card with water wave watermark.
  - Contributing Factor Bar Gauges: Significant Wave Height (`1.8m` vs `1.5m` craft limit = `25%` exceedance) and Squall Gusts (`24 kt` vs `18 kt` limit).
  - 24-Hour Swell & Wind Curve: Continuous hourly forecast graph.
  - Scientific Confidence Matrix: INCOIS OSF (94%), MOSDAC (92%), IMD (88%).
  - Transparent Reasoning Accordion ("How ORCA Reached this Result"): Agent step-by-step hydrodynamic logic.

### Screen 03: Nearest Potential Fishing Zone (PFZ) & Route Safety (`fab1d900543a4a9088d35b1ee86556ff`)
* **Route:** `/pfz`
* **Target:** Commercial catch optimization without safety compromise.
* **Layout Structure:**
  - Hero PFZ Card: PFZ #01 (SE Kasimedu, 18.4 NM, Bearing 135° SE), SST gradient (`0.6°C`), Chlorophyll-a (`0.88 mg/m³`), Species probability (Pelagic Tuna/Sardine: High 88%).
  - **Separated Transit Safety Verdict (Critical Requirement):** Unambiguously distinguishes catch zone conditions from transit corridor hazards (`CAUTION ON TRANSIT: 1.8m breaker waves in nearshore bar crossing`).
  - Route Safety Planner: "Plot Safe Route (Avoid Hazard)" button avoiding nearshore shoals.
  - Ranked Nearby PFZ Alternatives (PFZ #01, #02, #03).

### Screen 04: Full Marine Intelligence GIS Map (`9ae60ca525a84fac9854f25b8f6518a2`)
* **Route:** `/map`
* **Target:** Interactive cartographic exploration.
* **Layout Structure:**
  - Top Search HUD with voice input and GPS centering.
  - Quick Mode Switcher: Fisherman Mode vs Port Mode vs Disaster Mode.
  - Layer Pills: Bathymetric depths, SWH wave contours, PFZ polygons, Hazard crosshatches, AIS tracks, Weather radar.
  - Full-screen SVG Vector Nautical Canvas.
  - Bottom Feature Drawer: Inspects selected coordinate or PFZ zone with 1-tap route calculation.

### Screen 05: Conversational Marine Assistant (`ff505b1e58c44b0998d324ef50edb7fc`)
* **Route:** `/assistant` or `/chat`
* **Target:** Voice-first Tamil/English AI query interface.
* **Layout Structure:**
  - Welcome Banner with voice prompt instruction (`மைக் அழுத்தி பேசவும்`).
  - Speech Bubble Stream:
    - User speech audio waveform and Tamil transcription.
    - ORCA response featuring structured safety verdict cards, audio playback CTA (`volume_up`), and collapsible reasoning.
  - Horizontal Suggestion Chips: Quick follow-ups (*"When is the safest time to go?"*, *"Show 48h wave forecast"*).
  - Fixed Touch-Friendly Voice Recording Bar.

### Screen 06: Fisherman Profile & Vessel Configuration (`18d7192155f6465c9b881e8c12b08cdf`)
* **Route:** `/profile` or `/vessel`
* **Target:** Skipper vessel registration and safety threshold calibration.
* **Layout Structure:**
  - Skipper Identity Header (Kasimedu Fishing Harbour, Registration `IND-TN-02-MM-4491`).
  - Profile Calibration Gauge (`85% calibrated`).
  - Vessel Specifications Bento: LOA (`8.2m`), Beam (`2.1m`), Draught (`0.8m`), OBM (`9.9 HP`).
  - Dynamic Physical Limits Card (Max safe SWH: `1.5m`, Max safe wind: `18 kt`).
  - Gear & Safety Equipment Checklist (Lifejackets, VHF Radio, NavIC transponder).
  - Educational Explainer ("Why your craft specs matter for wave capsize modeling").

### Screen 07: Marine Intelligence Settings (`c494d09aec1b45e8b47fd4e5b8d6ee7f`)
* **Route:** `/settings`
* **Target:** System preferences, localization, and workstation role switches.
* **Layout Structure:**
  - Language Selection (English, Tamil, Hindi).
  - Appearance & Glare Filter (Light Mode, Dark Night Watch, High-Solar Glare Boost).
  - Notification Urgency & SMS Fallback toggles.
  - Voice & Dialect configuration (Chennai Coastal vs Kanyakumari accents).
  - Satellite Constellation Switch (NavIC primary vs GPS fallback, offline tile caching).
  - Active Workstation Role Switcher (instant switch to DDMO, Port, or Researcher mode).

### Screen 08: DDMO Situational Awareness & Disaster Operations Dashboard (`3396150d56eb4959afa4332a8e9b0f34`)
* **Route:** `/dashboard/ddmo`
* **Target:** District Disaster Management Officers managing extreme weather events.
* **Layout Structure:**
  - Top Operational Authority Strip: System Green, INCOIS/MOSDAC sync status.
  - Tier-1 Critical Warning Banner: `INCOIS HIGH WAVE & SQUALL ADVISORY #KSM-04`.
  - 5 High-Impact KPI Metrics: At-Risk Coastal Population (142,500), Active Craft at Sea (28), Sheltered Craft (418), Shelters Open (6), Deployed Teams (4).
  - Two-Column Workspace:
    - Left: Tactical GIS Risk Map & 24h Chronological Surge Timeline.
    - Right: Multi-agency incident log and siren/SMS mass broadcast dispatch console.

### Screen 09: Port Operator Marine & Vessel Operations Dashboard (`12a0ed6513a5487cb22d8b8644f0b850`)
* **Route:** `/dashboard/port`
* **Target:** Port authorities and harbour masters controlling channel traffic.
* **Layout Structure:**
  - Top Operational Deck: Port Status Card (`Approach Bar Shoaling Surge - AMBER CAUTION`).
  - Port KPI Cluster: Active Warnings (2), Vessels in Perimeter (42), Wave SWH (1.9m), Wind (22 kt NE), Bar Depth (-0.4m below datum), Visibility (6.2 NM).
  - Two-Column Operational Split:
    - Left: Approach Channel GIS with navigation buoy telemetry and 24h tidal curve.
    - Right: Operational Directives (Bar Crossings: HIGH RISK, Pilotage: SUSPENDED) and AIS Vessel Berth Queue Table.
  - Direct VHF Channel 16 Broadcast console & Situation Brief PDF generator.

### Screen 10: Researcher Marine Analytics & Climatology Workspace (`8866663f225f49ae85644e7423291775`)
* **Route:** `/dashboard/researcher`
* **Target:** Marine scientists, oceanographers, and climatologists analyzing satellite data.
* **Layout Structure:**
  - Top Domain Bar: Synoptic Grid (Bay of Bengal & Arabian Sea), DGPS coordinates.
  - High-Density Query Deck: Variable selector (SST, Chlorophyll-a, SWH, Salinity, Current), spatial bounding box, hindcast/forecast date range.
  - Statistical KPI Cards: Observed SST (`29.4°C`), Baseline Mean (`28.6°C`), Anomaly (`+0.8°C`), Model R² (`0.942`).
  - Climatology Time-Series SVG Chart: 30-day thermal trajectory with upwelling zones.
  - Multi-Sensor Telemetry & Latency Matrix Table (INSAT-3D, Oceansat-3, Sentinel-3, Buoy BD08).
  - Export Deck (NetCDF-4, GeoTIFF, CSV).

### Screen 11: Authority & Senior Maritime Oversight Command Dashboard (`67ddc1af3c284b649fae917cf33c97fa`)
* **Route:** `/dashboard/authority`
* **Target:** State Disaster Management Directors, Coast Guard Flag Officers.
* **Layout Structure:**
  - Multi-Role Universal Navigation Bar (instant toggle across Authority, DDMO, Port, Scientific, Vessel).
  - Strategic Threat Callout: `ELEVATED MARITIME THREAT LEVEL · ZONE 04`.
  - 6 Macro Strategic KPI Cards: Active Craft Monitored (842), Vulnerable Districts (3), Harbour Operations (12 open / 4 restricted / 1 closed), SAR Readiness (Tier-1 Ready), Advisory Reach (94.8%), Inter-Agency Agreement (98%).
  - Regional Geospatial Risk Map: Macro Coromandel coast overview with EEZ limits, fleet density heatmaps, and cyclonic storm tracks.
  - Executive Directive Console: Gazette notices, state-wide port clearance suspension, SAR deployment orders.

---

## 9. Responsive Breakpoint Rules & Cross-Device Behavior

```
┌──────────────────────────────────────────────────────────────┐
│                    RESPONSIVE ADAPTATION                     │
├──────────────────────────────┬───────────────────────────────┤
│    MOBILE (< 768px)          │    DESKTOP (>= 1024px)        │
├──────────────────────────────┼───────────────────────────────┤
│ • 4-Column fluid grid        │ • 12-Column fluid grid        │
│ • 16px margins & gutters     │ • 24px/32px margins & gutters │
│ • Sticky top header (h-28)   │ • Fixed top command bar (h-16)│
│ • Bottom 5-tab bar + FAB     │ • Fixed 64-col left rail aside│
│ • Touch target >= 48px       │ • Multi-window split layouts  │
│ • Stacked bento cards        │ • High-density telemetry decks│
└──────────────────────────────┴───────────────────────────────┘
```

1. **Mobile Viewports (`390px` to `768px`):**
   - Single vertical stack for cards.
   - Primary navigational anchor is the **Bottom Navigation Bar** with the elevated center microphone FAB.
   - Tables collapse into swipeable cards or 2-column key-value pairs.
2. **Desktop Viewports (`1024px` to `2560px+`):**
   - Bottom navigation is hidden; the **Fixed Left Rail (`w-64`)** becomes primary.
   - Main content area uses `pl-64` and `grid-cols-12` layouts.
   - High-density KPI clusters render as 4 to 6 horizontal cards.
   - Map and timeline outlooks occupy adjacent side-by-side columns (e.g. 7 cols for GIS Map, 5 cols for Live Incidents).

---

## 10. Verification & Implementation Readiness

This document defines the exact Design DNA extracted from the 11 Stitch project screens.
- **No application code has been modified or generated.**
- All CSS classes, hex values, typography scales, safety states, and route mappings are documented for pixel-perfect implementation in subsequent phases.
