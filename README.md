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
- [New Features](#-new-features)
- [Multi-Case Management](#-multi-case-management)
- [Data Management](#-data-management)
- [Export Options](#-export-options)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
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
| PWA | ✅ | ✅ | Installable, service worker with update prompt |
| Keyboard Shortcuts | ✅ | ✅ | `?` to view all shortcuts |
| Command Palette | ✅ | ✅ | `Ctrl+K` — navigation, actions, settings, export |
| Cross-case Search | ✅ | ✅ | `Ctrl+Shift+X` — search across all cases |
| Clipboard IOC Parser | ✅ | ✅ | Paste raw text → auto-detect IOCs (hashes, IPs, URLs, domains) |
| Timeline Visualization | ✅ | ❌ | Toggle table/timeline view for attack events |
| YARA Rule Editor | ❌ | ✅ | CodeMirror 6 with YARA syntax highlighting |
| Case Templates | ✅ | ✅ | Pre-fill cases: Ransomware, Phishing, APT, Info-Stealer |
| IOC Cross-Reference | ✅ | ✅ | `Ctrl+Shift+I` — find shared IOCs across cases |
| Graph Visualization | ✅ | ❌ | Interactive MITRE ATT&CK mapping graph (ReactFlow) |
| Auto MITRE Suggestion | ✅ | ❌ | Behavior-based technique suggestions with confidence levels |
| Auto MBC Suggestion | ❌ | ✅ | Runtime behavior-based MBC behavior suggestions |
| Export Reminder | ✅ | ✅ | Toast warning when data not exported in 7+ days |
| Shortcut Hint Bar | ✅ | ✅ | Fixed icon buttons in bottom-left corner |
| Undo / Redo | ✅ | ✅ | `Ctrl+Z` / `Ctrl+Shift+Z` — rolling history (20 snapshots) |
| Section Navigation | ✅ | ✅ | `Ctrl+Shift+↓/↑` jump between sections, `Ctrl+Shift+A` expand/collapse all |
| Save Status Indicator | ✅ | ✅ | Auto-save status in dashboard header (saving/saved/failed) |

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

## New Features

### Clipboard IOC Parser

**Where**: IOC Table section (both MIA and MRE dashboards)

1. Open the IOC Table section in any dashboard
2. Click the **Paste & Extract** button (clipboard icon) next to "Copy All"
3. Paste raw text from logs, sandbox reports, or threat intel feeds into the textarea
4. Click **Parse** — IOCs are auto-detected and classified (SHA256/SHA1/MD5, IPv4/IPv6, URLs, domains, emails, file paths, mutexes)
5. Review the parsed results in the preview table, remove any false positives
6. Click **Add All** to append them to your IOC table

### Timeline Visualization

**Where**: Attack Timeline section (MIA dashboard only)

1. Open the Attack Timeline section
2. You'll see two toggle buttons in the header: **Table** (default) and **Timeline**
3. Click **Timeline** to switch to the vertical timeline view
4. Events are displayed as cards with severity-colored dots (info/warning/critical)
5. Hover over an event to reveal the delete button
6. The add form works in both views — switch freely between them

### YARA Rule Editor

**Where**: Detection > YARA section (MRE dashboard only)

1. Open the MRE Dashboard and navigate to the Detection section
2. The YARA editor replaces the plain textarea with a full code editor
3. Syntax highlighting is automatic: keywords, `$variables`, hex strings `{ }`, regex `/ /`, meta keys, comments
4. Write your YARA rules directly — the editor supports standard YARA syntax
5. Data persists with your case on save

### Case Templates

**Where**: Both MIA and MRE dashboards

1. Click the **+** (New Case) button in the case tab bar
2. A template dialog appears with options:
   - **Blank** — empty case
   - **Ransomware** — pre-fills impact, timeline, recommendations (MIA)
   - **Phishing** — pre-fills infection vector, MITRE T1566 (MIA)
   - **APT** — pre-fills MITRE techniques T1071/T1059/T1055 (MIA)
   - **Info-Stealer** — pre-fills summary and MBC mappings (MRE)
   - **Custom** — blank case for manual setup
3. Select a template — the case is created with pre-filled data
4. Edit the pre-filled values as needed for your investigation

### IOC Cross-Reference

**Where**: IOC Table section (both dashboards), Command Palette, or keyboard shortcut

1. **Via IOC Table**: Open the IOC Table section in MIA or MRE dashboard → click **Cross-Reference** button in the header
2. **Via Command Palette**: Press `Ctrl+K` → type "ioc" → select "IOC Cross-Reference"
3. **Via keyboard**: Press `Ctrl+Shift+I`
4. Click **Scan All Cases** to analyze all MIA and MRE cases
5. Results show IOCs that appear in 2+ cases — click any case name to navigate to it

### Graph Visualization

**Where**: MITRE ATT&CK section (MIA dashboard only)

1. Open the MITRE ATT&CK Mapping section in the MIA dashboard
2. Select techniques by clicking them in the tactic columns
3. Once you have selected techniques, the **Visualize** button (git-branch icon) becomes active
4. Click **Visualize** to open the interactive graph dialog
5. The graph shows tactic nodes with their selected techniques as children
6. Use mouse to pan/zoom, MiniMap for overview, and fit-view controls

### Auto MITRE Suggestion

**Where**: MITRE ATT&CK Mapping section (MIA dashboard)

1. Enter behavior data in the Behavior Analysis section (process tree, file system, registry, network, memory, system changes)
2. Open the MITRE ATT&CK Mapping section — suggested techniques appear automatically above the tactic grid
3. Each suggestion shows technique ID, name, source field, and confidence level (green/amber/gray dot)
4. Hover over a suggestion to reveal **Accept** (adds to mapping) and **Dismiss** (hides from list) buttons
5. Suggestions already in your mapping are filtered out automatically
6. **Force Refresh** button bypasses all caches and fetches fresh MITRE data from GitHub

### Auto MBC Suggestion

**Where**: MBC Mapping section (MRE dashboard)

1. Add runtime behavior entries (anti-debug, anti-VM, persistence, network, memory, injection, artifacts)
2. Open the MBC Mapping section — suggested behaviors appear automatically above the objectives grid
3. Each suggestion shows behavior ID, name, objective, source, and confidence level
4. Accept or dismiss suggestions as needed
5. **Update** button checks GitHub for newer MBC versions and shows a link if available

### Undo / Redo

**Where**: Both MIA and MRE dashboards

- `Ctrl+Z` to undo, `Ctrl+Shift+Z` to redo
- Stores up to 20 snapshots of your data state
- Also accessible via the `?` shortcuts dialog
- Works with all section edits, imports, and template fills

### Section Keyboard Navigation

**Where**: Both MIA and MRE dashboards

- `Ctrl+Shift+↓` — jump to next section
- `Ctrl+Shift+↑` — jump to previous section
- `Ctrl+Shift+A` — expand or collapse all sections at once
- Sections scroll into view smoothly and focus the header for accessibility

### Save Status Indicator

**Where**: Dashboard header (both MIA and MRE)

- Shows real-time auto-save status next to the subtitle
- States: **Saving...** (yellow spinner), **Saved** (green check), **Save failed** (red alert)
- Data auto-saves to IndexedDB every 500ms after changes

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

### Offline Capability

The app registers a service worker (via vite-plugin-pwa + Workbox) that caches all static assets. Once loaded, the app works without an internet connection — dashboards, export, import, search, tools reference are all available offline. The only exception is the initial MITRE ATT&CK data fetch, which requires one online load and is then cached for 24 hours in localStorage.

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

## Keyboard Shortcuts

Press `?` anywhere to view all shortcuts. Key bindings:

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open command palette |
| `Ctrl+Z` | Undo (dashboard only) |
| `Ctrl+Shift+Z` | Redo (dashboard only) |
| `Ctrl+Shift+X` | Search across all cases |
| `Ctrl+Shift+I` | IOC Cross-Reference — find shared IOCs across cases |
| `Ctrl+Shift+N` | New case |
| `Ctrl+Shift+←` / `→` | Switch to previous / next case |
| `Ctrl+Shift+↓` / `↑` | Jump to next / previous section |
| `Ctrl+Shift+A` | Expand / collapse all sections |
| `Ctrl+Shift+E` | Export data |
| `Ctrl+Shift+1` | Go to MIA dashboard |
| `Ctrl+Shift+2` | Go to MRE dashboard |
| `Ctrl+Shift+T` | Go to Tools |
| `Ctrl+Shift+S` | Go to Settings |
| `?` | Show keyboard shortcuts dialog |

> Shortcuts are disabled while typing in text fields (except `Ctrl+K` which always works).

---

## Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server at `https://localhost:8088` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run test` | Run unit tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |

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
| [CodeMirror 6](https://codemirror.net/) | YARA rule editor with syntax highlighting |
| [React Flow](https://reactflow.dev/) | MITRE ATT&CK graph visualization |

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
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | PWA support + service worker (Workbox) |
| [workbox-window](https://developer.chrome.com/docs/workbox/modules/workbox-window) | Service worker registration + update prompt |
| [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer) | Bundle analysis (`dist/stats.html`) |

### Testing

| Technology | Purpose |
|------------|---------|
| [Vitest](https://vitest.dev/) | Unit testing framework |
| [jsdom](https://github.com/jsdom/jsdom) | DOM environment for tests |

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
│   │   ├── SearchDialog.tsx         # Cross-case search dialog
│   │   ├── CommandPalette.tsx       # Command palette (Ctrl+K)
│   │   ├── ShortcutsDialog.tsx      # Keyboard shortcuts reference (?)
│   │   ├── ShortcutsHintBar.tsx     # Fixed shortcut icon buttons
│   │   ├── ReloadPrompt.tsx         # PWA update prompt
│   │   ├── IOCPasteDialog.tsx       # Paste & extract IOCs from text
│   │   ├── IOCCrossReferenceDialog.tsx  # Cross-case IOC analysis
│   │   ├── CaseTemplateDialog.tsx   # New case template picker
│   │   ├── CaseSwitcher.tsx         # Tab bar: switch/rename/delete cases
│   │   ├── CollapsibleSection.tsx   # Section wrapper with persistence
│   │   ├── GraphView.tsx            # ReactFlow MITRE graph visualization
│   │   ├── ScrollToTop.tsx          # Scroll restoration
│   │   ├── SectionErrorBoundary.tsx # Error boundary for sections
│   │   └── lazy/                    # Lazy wrapper components (LazyXxx.tsx)
│   │       ├── index.ts
│   │       ├── LazyGraphView.tsx
│   │       └── LazyYaraEditor.tsx
│   │
│   ├── features/
│   │   ├── mia/                     # ALL MIA domain code
│   │   │   ├── components/          # Section components (BackgroundSection, IOCTable, TimelineVisual, etc.)
│   │   │   ├── hooks/
│   │   │   │   └── useArtifactFileDrop.ts
│   │   │   ├── services/            # constants.ts, migrate.ts, transform.ts
│   │   │   └── types.ts             # DFIRData and all MIA sub-types
│   │   │
│   │   └── mre/                     # ALL MRE domain code
│   │       ├── components/          # Section components + StaticAnalysisCards, YaraEditor,
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
│   │   ├── useDashboardData.ts      # IndexedDB load/save + auto-save + undo/redo
│   │   ├── useDashboardActions.ts   # Shared export/import/undo actions for dashboards
│   │   ├── useDashboardExport.ts    # Export dialog state machine
│   │   ├── useImportJSON.ts         # JSON import with Zod validation
│   │   ├── useCaseManager.ts        # Multi-case CRUD
│   │   ├── useSectionNavigation.ts  # Keyboard navigation between sections
│   │   ├── useDragReorder.ts        # Drag-to-reorder list items
│   │   ├── useToolsData.ts          # Tools list with localStorage persistence
│   │   ├── useKeyboardShortcuts.ts  # Keyboard shortcut bindings
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
│   │   ├── searchAcrossCases.ts     # Cross-case search logic
│   │   ├── mitreUtils.ts            # MITRE ATT&CK fetch + cache
│   │   ├── mitreSuggestion.ts       # MITRE keyword→technique suggestion engine
│   │   ├── mbcSuggestion.ts         # MBC tag→behavior suggestion engine + version check
│   │   ├── mbcData.ts               # MBC v3.2 static dataset
│   │   ├── parseIOCs.ts             # Regex-based IOC extraction from text
│   │   ├── crossReferenceIOCs.ts    # Find shared IOCs across cases
│   │   ├── caseTemplates.ts         # Pre-built case templates
│   │   ├── graphBuilders.ts         # ReactFlow node/edge builders
│   │   ├── yaraLanguage.ts          # CodeMirror YARA syntax support
│   │   ├── toolsData.ts             # FLARE-VM tools reference data
│   │   ├── validationSchemas.ts     # Zod schemas for import
│   │   ├── lazyExport.ts            # Dynamic import wrappers for export
│   │   ├── lazyPrefetch.ts          # Prefetch heavy component chunks on hover
│   │   ├── dashboardExportUtils.ts  # Export helpers (hasData, formatExportError)
│   │   ├── fileNameUtils.ts         # Export filename generation
│   │   ├── imageUtils.ts            # Base64 image helpers
│   │   ├── imageStorage.ts          # Image registry clear utilities
│   │   ├── sectionState.ts          # Section open/close state helpers
│   │   ├── preloadRoutes.ts         # Lazy page components + preload
│   │   ├── semanticColors.ts        # Risk level → color mapping
│   │   ├── activityUtils.ts         # Activity tracking helpers
│   │   ├── debugLogger.ts           # debugLog/debugWarn/debugError (dev only)
│   │   └── utils.ts                 # cn(), generateId(), formatFileSize()
│   │
│   │   └── __tests__/               # Unit tests (vitest)
│   │       ├── parseIOCs.test.ts
│   │       ├── helpers.test.ts
│   │       └── mitreSuggestion.test.ts
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
├── vitest.config.ts
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
GitHub: [@MWE-HaTN](https://github.com/MWE-HaTN).

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
