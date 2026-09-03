# 🌊 ORCA-AI — Marine Intelligence Platform
> **Smart India Hackathon 2026 · Problem Statement PS-26176**  
> AI-powered marine intelligence, deterministic safety verdicts, potential fishing zone (PFZ) advisory, and multi-agency situational awareness under **ISRO (MOSDAC, Oceansat-3, INSAT-3D)**, **INCOIS (OSF)**, and **IMD** frameworks.

---

## 🎯 Overview

**ORCA-AI** is a high-reliability marine intelligence platform engineered for coastal resilience, artisanal fisheries protection, port operations, and disaster management. It bridges cutting-edge Earth observation satellite telemetry with deterministic oceanographic rules to provide instant, glanceable, and trusted situational verdicts.

### ⚓ The Two Core UX Pillars
1. **Tactile Precision (Extreme Field Ergonomics):** Engineered for direct sunlight glare, sea spray, wet hands, and rolling boat decks with high-contrast color palettes and minimum `48px` tap targets.
2. **Deterministic Safety & "Verdict Before Detail":** Mariners receive unambiguous operational verdicts (`SAFE`, `CAUTION`, `DO NOT VENTURE`) before complex data curves, bound by physical craft thresholds (length LOA, engine HP, hull limits).

---

## 📱 Master Screen Inventory (All 11 Production Screens)

| # | Screen / Route | Viewport | Target Persona | Key Capabilities |
|---|---|---|---|---|
| **01** | **[Home](src/pages/01_Home.jsx)** (`/`) | Mobile | Artisanal Fishermen | High Wave warning strip, Primary Verdict Banner, Voice-first CTA, mini GIS preview, 2x2 telemetry bento, PFZ catch front card. |
| **02** | **[Safety Assessment](src/pages/02_SafetyAssessment.jsx)** (`/safety`) | Mobile | Crew Captains | Deterministic simulation switcher (`SAFE`, `CAUTION`, `VENTURE NO`, `STALE`), physical threshold exceedance bars, 24h swell/wind curve, agent reasoning accordion. |
| **03** | **[PFZ Voyage Advisor](src/pages/03_PfzAdvisor.jsx)** (`/pfz`) | Mobile | Traditional Fishers | Hero PFZ #01 card (chlorophyll front `0.88 mg/m³`, SST gradient), **Separated Transit Safety Verdict**, safe route plotting, ranked alternative zones. |
| **04** | **[Tactical GIS Map](src/pages/04_GisMapPage.jsx)** (`/map`) | Mobile | Navigators | Full-screen vector nautical cartography, layer controls (bathymetry 5m/10m/20m/50m, hazards, PFZ glow, AIS tracks), bottom feature inspector drawer. |
| **05** | **[Conversational Assistant](src/pages/05_AssistantPage.jsx)** (`/assistant`) | Mobile | Fishermen | Voice & text AI chat in Tamil (தமிழ்), Hindi (हिन्दी), and English; audio read-aloud playback; structured verdict cards with confidence ratings. |
| **06** | **[Vessel Profile](src/pages/06_VesselProfile.jsx)** (`/profile`) | Mobile | Vessel Owners | Skipper identity, 85% hydrodynamic calibration gauge, craft specs bento (LOA, beam, draft, HP), dynamic safety limit auto-recalculator. |
| **07** | **[System Settings](src/pages/07_SettingsPage.jsx)** (`/settings`) | Mobile | All Users | Multilingual selection, High-Glare Solar Filter (+15% contrast), 2G SMS emergency alerts, NavIC/GPS switch, workstation role selector. |
| **08** | **[DDMO Dashboard](src/pages/08_DdmoDashboard.jsx)** (`/dashboard/ddmo`) | Desktop | Disaster Officers | Tier-1 Critical Warning banner, 5 situational awareness KPI cards, tactical GIS risk map, 24h ocean surge timeline, Siren/SMS broadcast trigger. |
| **09** | **[Port Operations Cockpit](src/pages/09_PortDashboard.jsx)** (`/dashboard/port`) | Desktop | Harbour Masters | Approach bar shoaling surge card, port KPI deck, harbour channel GIS with navigational buoys, AIS vessel queue table, VHF-16 broadcast button. |
| **10** | **[Researcher Workspace](src/pages/10_ResearcherWorkspace.jsx)** (`/dashboard/researcher`) | Desktop | Oceanographers | Synoptic grid, horizontal high-density parameter query deck, 30-day SST climatological anomaly chart with upwelling gradient, sensor latency matrix table. |
| **11** | **[Senior Authority Command](src/pages/11_AuthorityDashboard.jsx)** (`/dashboard/authority`) | Desktop | State Disaster Authorities | Regional threat banner, 6 strategic authority KPIs (fleet size, vulnerable districts, SAR readiness), regional geospatial command map, executive directives. |

---

## 🎨 Design DNA & System Specifications

Full design tokens, color scales, typography hierarchies, and component specifications are documented in **[DESIGN.md](DESIGN.md)**:

- **Primary Colors:** `#001026` (Abyssal Navy), `#0B2545` (Command Navy Container)
- **Secondary Colors:** `#006399` (Coastal Azure), `#67BAFD` (Active Azure Tint)
- **Surface & Canvas:** `#FAF8FF` (Mist Light), `#090D16` (Night Watch Deck Dark Mode)
- **Semantic Safety Tiers:**
  - `SAFE` (`#10B981` / `#ECFDF5` / Tamil: பாதுகாப்பானது)
  - `CAUTION` (`#F59E0B` / `#FEF3C7` / Tamil: எச்சரிக்கை)
  - `DO NOT VENTURE` (`#EF4444` / `#FEF2F2` / Tamil: கடலுக்கு செல்ல வேண்டாம்)
  - `STALE TELEMETRY` (`#74777F` / `#F2F3FF` / Tamil: தரவு காலாவதியானது)
- **Typography:** Space Grotesk (Headlines), Inter (Multilingual Body), JetBrains Mono (Zero-jitter tabular telemetry `tnum`).

---

## 🚀 Quick Start & Local Run

### Prerequisites
- Node.js (v18 or newer)
- npm (v9 or newer)

### Installation
```bash
# Clone repository
git clone https://github.com/Pixel-Pioneer6/ORCA-AI.git
cd ORCA-AI

# Install dependencies
npm install

# Start local development server
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🏛️ Institutions & Frameworks
- **ISRO** (Space Applications Centre, MOSDAC, Oceansat-3, INSAT-3D)
- **INCOIS** (Ocean State Forecast, Potential Fishing Zone Advisories)
- **IMD** (India Meteorological Department Marine Bulletins)
- **Indian Coast Guard & Department of Fisheries, Government of Tamil Nadu**
