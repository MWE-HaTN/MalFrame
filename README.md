# MalFrame — Malware Analyst Dashboard

A professional web application for **Malware Incident Analysis (MIA)** and **Malware Reverse Engineering (MRE)** workflows. Built with a dark cyber/terminal aesthetic, optimized for malware analysts and DFIR practitioners.

> 🇻🇳 **Hỗ trợ Tiếng Việt**: Vào Settings để chuyển ngôn ngữ.

![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Quick Start](#-quick-start)
- [Features Overview](#-features-overview)
- [Dashboard Usage](#-dashboard-usage)
- [Multi-Case Management](#-multi-case-management)
- [Data Management](#-data-management)
- [Export Options](#-export-options)
- [Development Scripts](#-development-scripts)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## Quick Start

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org/) |
| npm | v9+ | Included with Node.js |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

### Installation

```bash
# 1. Clone repository
git clone https://github.com/MWE-HaTN/MalFrame.git
cd MalFrame

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser → https://localhost:8088
```

> **Note**: The dev server uses a self-signed SSL certificate (required for `crypto.subtle` and file downloads). Your browser will show a security warning on first launch — click **Advanced → Proceed** to continue. When accessing from another machine on the network, use `https://<your-ip>:8088`.

### Production Build

```bash
npm run build
npm run preview
```

---

## Features Overview

| Feature | MIA | MRE | Description |
|---------|:---:|:---:|-------------|
| Multi-Case Management | ✅ | ✅ | Multiple independent cases, inline rename, tab switching |
| File Hash Generator | ✅ | ✅ | Drag & drop → SHA256 + MD5 |
| Image Paste | ✅ | ✅ | Ctrl+V screenshots into any textarea |
| MITRE ATT&CK Mapping | ✅ | ✅ | 14 tactics, live data from GitHub |
| MBC Mapping | ❌ | ✅ | Malware Behavior Catalog v3.2 |
| Micro-Behaviors | ❌ | ✅ | Granular behavior indicators |
| IOC Table | ✅ | ✅ | Virtual scrolling, 1000+ rows |
| Attack Timeline | ✅ | ❌ | Drag-reorder chronological events |
| Evidence Artifacts | ✅ | ❌ | File management with SHA256 |
| Code Analysis | ❌ | ✅ | Static, dynamic, cryptography |
| Runtime Behavior | ❌ | ✅ | Anti-analysis, execution, network |
| Unpacking Layers | ❌ | ✅ | Multi-stage unpack documentation |
| Execution Stages | ❌ | ✅ | Malware execution flow tracking |
| PE Sections | ❌ | ✅ | Section entropy visualization |
| Security Posture | ❌ | ✅ | ASLR, DEP, CFG, SEH checks |
| Export (JSON/PDF/Word) | ✅ | ✅ | Comprehensive report generation |
| Dark/Light Theme | ✅ | ✅ | Toggle between themes |
| EN/VN Language | ✅ | ✅ | Bilingual support |
| Activity Tracker | ✅ | ✅ | GitHub-style analysis heatmap |

---

## Dashboard Usage

### MIA Dashboard (`/mia`)

**Purpose**: Malware Incident Analysis for DFIR investigations.

| Section | Description |
|---------|-------------|
| Background | Case metadata and incident context |
| Sample Information | File details, hashes, signature status |
| Static Analysis | Strings, imports, PE sections with entropy |
| Behavior Analysis | Process tree, file system, registry, network |
| MITRE ATT&CK | Interactive technique mapping |
| Impact Assessment | Scope, affected accounts, risk rating |
| IOC Table | Indicators with type categorization |
| Recommendations | Short-term and long-term remediation |
| Attack Timeline | Chronological event documentation |
| Evidence Artifacts | Drag & drop files for SHA256 hash generation |
| Notes Log | Free-form notes with image support |

### MRE Dashboard (`/mre`)

**Purpose**: Malware Reverse Engineering for deep technical analysis.

| Section | Description |
|---------|-------------|
| Background | File metadata and analyst context |
| Static Analysis | Hashes, PE structure, packing detection, OSINT |
| Runtime Behavior | Anti-analysis, execution patterns, network |
| Code Analysis | Static/dynamic code review, cryptography |
| Deep Dive | Unpacking layers, execution stages, MBC mapping |
| Detection | YARA rules, IOCs, conclusion |

### Tools (`/tools`)

FLARE-VM analysis tools reference: **33 categories, 240+ tools**, searchable, with GitHub/project links.

### Settings (`/settings`)

| Setting | Description |
|---------|-------------|
| User Profile | Analyst name (used in exports and auto-fill) |
| Language | English / Tiếng Việt |
| Theme | Dark (cyber) / Light |
| Display Scale | 75% – 200% interface scaling |
| Activity | Year-view analysis heatmap |

---

## Multi-Case Management

Both dashboards support multiple independent cases stored concurrently. A tab bar at the top of each dashboard lets you switch, rename, create, and delete cases.

- Each case is stored separately in IndexedDB (`mia-case-{id}`, `mre-case-{id}`)
- Switching cases auto-saves the current case and loads the selected one
- Case names can be edited inline

---

## Data Management

### Auto-Save

All data saves automatically to **IndexedDB** with a short debounce. No manual save required.

### Storage Layout

| What | Storage | Key |
|------|---------|-----|
| MIA case registry | IndexedDB | `mia-cases` |
| MIA case data | IndexedDB | `mia-case-{id}` |
| MRE case registry | IndexedDB | `mre-cases` |
| MRE case data | IndexedDB | `mre-case-{id}` |
| Theme preference | localStorage | `cyber-analyst-theme` |
| Language setting | localStorage | `cyber-analyst-language` |
| User profile | localStorage | `cyber-analyst-user-profile` |
| MITRE ATT&CK cache | localStorage | `mitre-attack-cache` (24h TTL) |
| Active MIA case | localStorage | `mia-active-case` |
| Active MRE case | localStorage | `mre-active-case` |

> Images are embedded as **base64 strings** directly in the case JSON — no separate image storage needed. This makes each JSON export fully self-contained.

### Privacy

- **100% Local** — all data stays in your browser
- **No server** — no cloud, no telemetry, no tracking
- **No analytics** — zero external requests except MITRE ATT&CK live data

---

## Export Options

| Format | Best For |
|--------|----------|
| **JSON** | Backup, reimport, sharing between analysts |
| **PDF** | Formal reports, printing |
| **Word (.docx)** | Editable reports |

### Filename Format

```
{AnalystName}_{Date}_{FileName}_{SHA256-8chars}.{ReportType}.{ext}

Examples:
  HaTN_20260329_malware.exe_a1b2c3d4.MRE.pdf
  HaTN_20260329_sample.dll_5e6f7g8h.MIA.docx
```

### Import

Click **Import JSON** on the dashboard header. The imported data is validated against the current schema and backward-compatible with older export versions.

---

## Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server at `https://localhost:8088` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check (no emit) |

---

## Tech Stack

### Core

| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev/) | 19.x | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type safety |
| [Vite](https://vitejs.dev/) | 7.x | Build tool + dev server |
| [React Router](https://reactrouter.com/) | 7.x | Client-side routing |
| [Zod](https://zod.dev/) | 4.x | Schema validation on import |

### UI & Styling

| Technology | Purpose |
|------------|---------|
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Radix UI](https://www.radix-ui.com/) | Accessible primitives |
| [Lucide React](https://lucide.dev/) | Icons |
| [Sonner](https://sonner.emilkowal.ski/) | Toast notifications |
| [TanStack Virtual](https://tanstack.com/virtual) | Virtual scrolling for IOC table |

### Export

| Technology | Purpose |
|------------|---------|
| [jsPDF](https://github.com/parallax/jsPDF) | PDF generation |
| [docx](https://docx.js.org/) | Word document generation |

### Build & Optimization

| Technology | Purpose |
|------------|---------|
| [@vitejs/plugin-basic-ssl](https://github.com/vitejs/vite-plugin-basic-ssl) | Self-signed HTTPS for dev |
| [vite-plugin-compression](https://github.com/vbenjs/vite-plugin-compression) | Gzip/Brotli compression (production) |
| [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer) | Bundle analysis (`dist/stats.html`) |

---

## Project Structure

```
MalFrame/
├── public/
│   └── fonts/                       # Roboto fonts for PDF export
│
├── scripts/
│   └── bundle-size-report.js        # Bundle size analysis
│
├── src/
│   ├── components/
│   │   ├── ui/                      # Radix-based design system components
│   │   │   ├── button.tsx
│   │   │   ├── button-variants.ts   # CVA variants (separate from button.tsx)
│   │   │   └── ...
│   │   ├── dashboard/               # DashboardHeader
│   │   ├── header/                  # ActivityBadge, EasterEgg
│   │   └── lazy/                    # Lazy wrapper components (LazyXxx.tsx)
│   │       └── index.ts
│   │
│   ├── features/
│   │   ├── mia/                     # ALL MIA domain code
│   │   │   ├── components/          # Section components (BackgroundSection, IOCTable, etc.)
│   │   │   ├── hooks/
│   │   │   │   └── useArtifactFileDrop.ts
│   │   │   ├── services/            # constants.ts, migrate.ts, transform.ts
│   │   │   └── types.ts             # DFIRData and all MIA sub-types
│   │   │
│   │   └── mre/                     # ALL MRE domain code
│   │       ├── components/          # Section components + StaticAnalysisCards,
│   │       │   ├── runtime-behavior/    # AntiAnalysisGroup, ExecutionBehaviorGroup, etc.
│   │       │   └── code-analysis/       # StaticCodeAnalysis, DynamicCodeAnalysis, etc.
│   │       ├── hooks/
│   │       │   └── useMBCData.ts
│   │       ├── services/            # constants.ts, migrate.ts, transform.ts, codeAnalysisDefaults.ts
│   │       └── types.ts             # REData and all MRE sub-types
│   │
│   ├── contexts/                    # React Context providers (no hooks exported here)
│   │   ├── LanguageContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── UserContext.tsx
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useLanguage.ts
│   │   ├── useTheme.ts
│   │   ├── useUser.ts
│   │   ├── useDashboardData.ts      # IndexedDB load/save + auto-save
│   │   ├── useDashboardExport.ts    # Export dialog state machine
│   │   ├── useImportJSON.ts         # JSON import with Zod validation
│   │   ├── useCaseManager.ts        # Multi-case CRUD
│   │   ├── useDragReorder.ts        # Drag-to-reorder list items
│   │   ├── useToolsData.ts          # Tools list with localStorage persistence
│   │   ├── useSEO.ts                # Document title + meta tags
│   │   └── useTypingAnimation.ts    # Typing animation for landing page
│   │
│   ├── lib/
│   │   ├── export/                  # PDF + Word export (lazy-loaded)
│   │   │   ├── pdf-mia.ts
│   │   │   ├── pdf-mre.ts
│   │   │   ├── word-mia.ts
│   │   │   ├── word-mre.ts
│   │   │   ├── json.ts
│   │   │   └── helpers.ts
│   │   ├── translations/
│   │   │   ├── en.ts
│   │   │   ├── vn.ts
│   │   │   └── index.ts
│   │   ├── db.ts                    # IndexedDB async wrapper
│   │   ├── storageKeys.ts           # All localStorage key strings
│   │   ├── mitreUtils.ts            # MITRE ATT&CK fetch + cache
│   │   ├── mbcData.ts               # MBC v3.2 static dataset
│   │   ├── toolsData.ts             # FLARE-VM tools reference data
│   │   ├── validationSchemas.ts     # Zod schemas for import
│   │   ├── lazyExport.ts            # Dynamic import wrappers for export
│   │   ├── fileNameUtils.ts         # Export filename generation
│   │   ├── imageUtils.ts            # Base64 image helpers
│   │   ├── imageStorage.ts          # Image registry clear utilities
│   │   ├── sectionState.ts          # Section open/close state helpers
│   │   ├── navigation.ts            # getSavedDashboard()
│   │   ├── preloadRoutes.ts         # Lazy page components + preload
│   │   ├── semanticColors.ts        # Risk level → color mapping
│   │   ├── activityUtils.ts         # Activity tracking helpers
│   │   ├── debugLogger.ts           # debugLog/debugWarn/debugError (dev only)
│   │   └── utils.ts                 # cn(), generateId(), formatFileSize()
│   │
│   ├── pages/
│   │   ├── Index.tsx                # Landing page
│   │   ├── MIADashboard.tsx
│   │   ├── MREDashboard.tsx
│   │   ├── Tools.tsx
│   │   ├── Settings.tsx
│   │   └── NotFound.tsx
│   │
│   ├── types/
│   │   ├── cases.ts                 # CaseMeta (multi-case management)
│   │   └── dashboard.ts             # Shared types (Artifact, IOC, LogEntry, etc.)
│   │
│   ├── App.tsx                      # Root: providers + router
│   ├── main.tsx
│   └── index.css                    # Design tokens & global styles
│
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── index.html
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── eslint.config.js
└── package.json
```

---

## Troubleshooting

### Port Already in Use

```bash
npx kill-port 8088
# or change port in vite.config.ts
```

### HTTPS Certificate Warning

The dev server uses a self-signed certificate. Click **Advanced → Proceed to localhost** (or the IP address) in your browser. This is a one-time step per browser.

### Dependencies Installation Failed

```bash
rm -rf node_modules package-lock.json
npm install
```

### Data Not Saving

1. Check the browser is not in private/incognito mode (IndexedDB is disabled)
2. DevTools → Application → IndexedDB → check the `dashboard` store
3. Clear all data via **Clear Data** button on the dashboard

### MITRE ATT&CK Not Loading

1. Check internet connection (fetches live from GitHub on first load)
2. DevTools → Application → localStorage → delete `mitre-attack-cache`
3. Refresh page

### Export Not Working

1. Ensure the browser allows downloads from this origin
2. If on a network IP, make sure you're using `https://` not `http://`
3. Try JSON export first (lightest format), then PDF/Word

### Images Not Pasting

1. Click inside the textarea first to give it focus
2. Use `Ctrl+V` — only clipboard images are supported (not file paste)
3. Check DevTools console for errors

---

## Design System

### Color Tokens

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | White | Dark navy | Page background |
| `--foreground` | Dark gray | Light gray | Text |
| `--primary` | Green | Neon green `#00ff41` | Primary actions |
| `--accent` | Cyan | Cyan | Secondary highlights |
| `--destructive` | Red | Red | Errors / delete |
| `--muted` | Light gray | Dark gray | Disabled states |

### Typography

| Font | Usage |
|------|-------|
| JetBrains Mono | Code, terminal text, form values |
| Share Tech Mono | Display headings, hero text |
| Roboto | Body text in exported PDF/Word documents |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

```bash
git clone https://github.com/MWE-HaTN/MalFrame.git
cd MalFrame
npm install
git checkout -b feat/my-feature
npm run dev
```

Before opening a PR:

```bash
npm run lint       # No ESLint errors
npm run typecheck  # No TypeScript errors
npm run build      # Production build succeeds
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

**MWE HaTN**
Malware Analysis · DFIR · Reverse Engineering
GitHub: [@MWE-HaTN](https://github.com/MWE-HaTN) · LinkedIn: [ha-tran-mwesioe](https://www.linkedin.com/in/ha-tran-mwesioe)

---

## Acknowledgments

- [MITRE ATT&CK](https://attack.mitre.org/) — Threat framework
- [MBC (Malware Behavior Catalog)](https://github.com/MBCProject/mbc-markdown) — Behavior mapping
- [FLARE-VM](https://github.com/mandiant/flare-vm) — Analysis tools reference

---

<div align="center">

*Built for the cybersecurity community*

**[Report Bug](https://github.com/MWE-HaTN/MalFrame/issues)** · **[Request Feature](https://github.com/MWE-HaTN/MalFrame/issues)**

</div>
