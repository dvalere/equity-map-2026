# EquityMap

**AI-Powered Resource Navigation for Washington, D.C.**

EquityMap is a geospatial platform that helps D.C. residents navigate food assistance, healthcare, and community resources. Inspired by the 2026 federal budget changes, the platform addresses the growing "Access Gap" by mapping verified SNAP retailers and primary care facilities across the District.

## The Problem

Federal budget changes in 2026 have introduced stricter eligibility requirements for SNAP and Medicaid, projected to impact over 5 million Americans. New work requirements, tightened income thresholds, and reduced funding for community health programs have created "Benefit Deserts" areas where residents struggle to locate and access the resources they need. EquityMap starts with Washington, D.C. as a proof of concept.

## Our Solution

EquityMap provides three core layers:

### 1. Resource Map (Service Layer)
An interactive Leaflet.js map displaying **450+ verified resource locations** across all of D.C., loaded from real government datasets:
- **SNAP Retailers** (green markers) — Supermarkets, grocery stores, farmers' markets, convenience stores, and specialty food shops authorized to accept EBT
- **Primary Care Facilities** (red markers) O— Community health centers, clinics, and FQHCs with real data on services, hours, languages, and insurance accepted

Users can filter by **Accepts EBT**, **Accepts Medicaid**, and **Walk-ins OK** to find exactly what they need. Each location includes a **Get Directions** link (Google Maps) and a **Details** panel with educational context and facility-specific information.

### 2. EquityGuide (Truth Layer)
An AI-powered chat assistant that helps residents understand policy changes and navigate benefit eligibility. Built with Google's Generative AI API (Gemini 2.5 Flash), EquityGuide:
- Explains the 80-hour work requirement and qualifying activities
- Reminds students that Federal Work-Study counts toward SNAP eligibility
- Provides empathetic, factual guidance on SNAP, Medicaid, and local resources
- Falls back to curated responses if the AI service is unavailable

### 3. Community Contributions
A multi-step contribution flow allowing community members to submit new resource locations with AI-assisted verification, supporting a crowd-sourced approach to keeping the map current.

## Data Sources

| Dataset | Source | Records |
|---------|--------|---------|
| DC Active SNAP Retailers 2026 | USDA Food & Nutrition Service | ~400 locations |
| Primary Care Facilities | DC GIS / Department of Health | ~50 facilities |
| ACS 5-Year Economic Characteristics | U.S. Census Bureau | 200+ census tracts |

All data is loaded client-side from static CSVs using PapaParse. Health facility coordinates are converted from Web Mercator (EPSG:3857) to WGS84 lat/lng.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui (Radix primitives) |
| Map | Leaflet.js, react-leaflet, CartoDB Positron tiles |
| AI | Google Generative AI API (Gemini 2.5 Flash) |
| Data | PapaParse (CSV parsing), static datasets |
| Icons | Lucide React |

## Getting Started

### Prerequisites
- Node.js 18+
- A Google AI Studio API key ([aistudio.google.com](https://aistudio.google.com))

### Setup

```bash
git clone https://github.com/your-repo/EquityMap.git
cd EquityMap
npm install
```

Create a `.env` file in the project root:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

### Run

```bash
npm run dev
```

Open localhost:8080 in your browser.

### Build

```bash
npm run build
```
## Mission

- **Transparency** — EquityGuide translates complex federal policy into plain-language guidance, helping residents understand how budget changes affect their benefits
- **Access** — The resource map connects communities to verified food and healthcare access points, with real facility data (hours, phone, services, languages) pulled directly from government datasets

## License

MIT
