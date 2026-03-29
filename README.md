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

- [Quick Start / Bắt đầu nhanh](#-quick-start--bắt-đầu-nhanh)
- [Installation Guide / Hướng dẫn cài đặt](#-installation-guide--hướng-dẫn-cài-đặt)
- [Features Overview / Tổng quan tính năng](#-features-overview--tổng-quan-tính-năng)
- [Dashboard Usage / Hướng dẫn sử dụng](#-dashboard-usage--hướng-dẫn-sử-dụng)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Data Management](#-data-management)
- [Export Options](#-export-options)
- [Development Scripts](#-development-scripts)
- [Tech Stack](#-tech-stack)
- [Project Structure / Cấu trúc dự án](#-project-structure--cấu-trúc-dự-án)
- [Troubleshooting / Xử lý lỗi](#-troubleshooting--xử-lý-lỗi)
- [Contributing](#-contributing)

---

## Quick Start

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org/) |
| npm | v9+ | Included with Node.js |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

**Bun** (faster alternative):

```bash
# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# macOS / Linux
curl -fsSL https://bun.sh/install | bash
```

### Installation

```bash
# 1. Clone repository
git clone https://github.com/MWE-HaTN/MalFrame.git
cd MalFrame

# 2. Install dependencies
npm install    # or: bun install

# 3. Start development server
npm run dev    # or: bun run dev

# 4. Open browser → http://localhost:8080
```

### Production Build

```bash
npm run build
npm run preview

# Bundle size report
node scripts/bundle-size-report.js
```

### Docker (Optional)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t malframe .
docker run -p 8080:80 malframe
```

---

## Features Overview

| Feature | MIA | MRE | Description |
|---------|:---:|:---:|-------------|
| File Hash Generator | ✅ | ✅ | Drag & drop → SHA256/MD5/SHA1 |
| Image Paste | ✅ | ✅ | Ctrl+V screenshots into textareas |
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
| Evidence Artifacts | File management with metadata |
| Notes Log | Free-form notes with image support |

### MRE Dashboard (`/mre`)

**Purpose**: Malware Reverse Engineering for deep technical analysis.

| Section | Description |
|---------|-------------|
| Background | File metadata and analyst context |
| Static Analysis | Hashes, PE structure, packing, OSINT |
| Runtime Behavior | Anti-analysis, execution patterns, technical groups |
| Code Analysis | Static/dynamic code, cryptography |
| Deep Dive | Unpacking layers, execution stages, crypto entries |
| Detection | MBC mapping, YARA, IOCs, conclusion |

### Tools (`/tools`)

FLARE-VM analysis tools reference: **33 categories, 240+ tools**, searchable, with GitHub links.

### Settings (`/settings`)

| Setting | Description |
|---------|-------------|
| User Profile | Analyst name and GitHub URL (used in exports) |
| Language | English / Tiếng Việt |
| Theme | Dark (cyber) / Light |
| Display Scale | 75% – 200% interface scaling |
| Activity | Year-view analysis heatmap |

---

## Keyboard Shortcuts

### Dropdowns
| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open / select |
| `↑` / `↓` | Navigate options |
| `Home` / `End` | First / last option |
| `Escape` | Close |
| `A–Z` | Type-to-search |

### Forms
| Key | Action |
|-----|--------|
| `Ctrl+V` | Paste image into textarea |
| `Tab` / `Shift+Tab` | Next / previous field |

---

## Data Management

### Auto-Save

All data saves automatically to localStorage with **500ms debounce**. No manual save required.

### Storage Keys

| Key | Content |
|-----|---------|
| `dfir-dashboard-data` | MIA Dashboard |
| `re-dashboard-data` | MRE Dashboard |
| `cyber-analyst-theme` | Theme preference |
| `cyber-analyst-language` | Language setting |
| `cyber-analyst-user-profile` | User profile |
| `mitre-attack-cache` | Cached MITRE data (~200 KB, 24h TTL) |
| `cyber-analyst-images` | Image registry |

### Privacy

- **100% Local** — all data stays in your browser
- **No server** — no cloud, no telemetry, no tracking
- **No analytics** — zero external requests except MITRE ATT&CK data

---

## Export Options

| Format | Best For |
|--------|----------|
| **JSON** | Backup, reimport, automation |
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

Drag & drop a JSON file onto the dashboard, or click **Import JSON**. Backward compatible with older export versions.

---

## 📜 Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (port 8080) |
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

### UI & Styling

| Technology | Purpose |
|------------|---------|
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Shadcn/ui](https://ui.shadcn.com/) | Component library |
| [Radix UI](https://www.radix-ui.com/) | Accessible primitives |
| [Lucide React](https://lucide.dev/) | Icons |
| [Sonner](https://sonner.emilkowal.ski/) | Toast notifications |

### Data & State

| Technology | Purpose |
|------------|---------|
| [TanStack Virtual](https://tanstack.com/virtual) | Virtual scrolling for large lists |
| [Zod](https://zod.dev/) | Schema validation on import |

### Export

| Technology | Purpose |
|------------|---------|
| [jsPDF](https://github.com/parallax/jsPDF) | PDF generation |
| [docx](https://docx.js.org/) | Word document generation |

### Build & Optimization

| Technology | Purpose |
|------------|---------|
| [vite-plugin-compression](https://github.com/vbenjs/vite-plugin-compression) | Gzip/Brotli compression |
| [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer) | Bundle analysis |

---

## Project Structure

```
MalFrame/
├── public/
│   ├── fonts/                       # Roboto fonts for PDF export
│   └── sample-mia-data.json         # Sample MIA data
│
├── scripts/
│   └── bundle-size-report.js        # Bundle size analysis
│
├── src/
│   ├── components/
│   │   ├── ui/                      # Shadcn/Radix primitives
│   │   │   ├── button.tsx
│   │   │   ├── button-variants.ts   # buttonVariants (CVA) — separate from Button
│   │   │   ├── portal-dropdown.tsx
│   │   │   └── ...
│   │   │
│   │   ├── code-analysis/           # MRE: code analysis components
│   │   ├── runtime-behavior/        # MRE: runtime behavior components
│   │   │   ├── styles.ts            # inputStyles, textareaBaseStyles
│   │   │   └── ...
│   │   ├── mia/                     # MIA section components
│   │   ├── mre/                     # MRE section components
│   │   ├── dashboard/               # Shared dashboard components
│   │   ├── header/                  # Header sub-components
│   │   ├── lazy/                    # Lazy-load wrappers
│   │   │
│   │   ├── Header.tsx
│   │   ├── FormField.tsx            # Input with image paste support
│   │   ├── CollapsibleSection.tsx   # Expandable sections
│   │   ├── IOCTable.tsx
│   │   ├── MitreAttackMapping.tsx
│   │   ├── MBCMapping.tsx
│   │   ├── TimelineTable.tsx
│   │   └── ...
│   │
│   ├── contexts/                    # React Context providers (no hooks exported)
│   │   ├── LanguageContext.tsx      # LanguageProvider
│   │   ├── ThemeContext.tsx         # ThemeProvider
│   │   └── UserContext.tsx          # UserProvider
│   │
│   ├── hooks/                       # Custom React hooks (one hook per file)
│   │   ├── useLanguage.ts           # i18n hook
│   │   ├── useTheme.ts              # Theme hook
│   │   ├── useUser.ts               # User profile hook
│   │   ├── useDashboardData.ts      # Dashboard state + auto-save
│   │   ├── useDashboardExport.ts    # Export dialog management
│   │   ├── useImportJSON.ts         # JSON import with validation
│   │   ├── useDragReorder.ts        # Drag-and-drop reordering
│   │   ├── useMBCData.ts            # Lazy-load MBC data
│   │   ├── useToolsData.ts          # Lazy-load tools data
│   │   ├── useTypingAnimation.ts    # Typing effect animation
│   │   ├── useSEO.ts                # Meta tag management
│   │   └── useArtifactFileDrop.ts   # File drop handling
│   │
│   ├── lib/
│   │   ├── export/                  # Export generators
│   │   │   ├── pdf-mia.ts
│   │   │   ├── pdf-mre.ts
│   │   │   ├── word-mia.ts
│   │   │   ├── word-mre.ts
│   │   │   ├── json.ts
│   │   │   └── helpers.ts
│   │   │
│   │   ├── mia/                     # MIA constants + migration
│   │   │   ├── constants.ts
│   │   │   └── migrate.ts
│   │   │
│   │   ├── mre/                     # MRE constants + migration
│   │   │   ├── constants.ts
│   │   │   ├── migrate.ts
│   │   │   ├── transform.ts
│   │   │   └── codeAnalysisDefaults.ts  # createInitialCodeAnalysisData/DeepDiveData
│   │   │
│   │   ├── translations/
│   │   │   ├── en.ts
│   │   │   ├── vn.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── preloadRoutes.ts         # Lazy page components + preload functions
│   │   ├── navigation.ts            # getSavedDashboard()
│   │   ├── sectionState.ts          # clearAllSectionStates()
│   │   ├── mitreUtils.ts
│   │   ├── mbcData.ts               # MBC v3.2 static dataset
│   │   ├── toolsData.ts             # FLARE-VM tools v2026.03.28
│   │   ├── storageKeys.ts
│   │   ├── validationSchemas.ts
│   │   ├── imageStorage.ts
│   │   ├── imageUtils.ts
│   │   ├── lazyExport.ts
│   │   ├── fileNameUtils.ts
│   │   └── utils.ts
│   │
│   ├── pages/
│   │   ├── Index.tsx
│   │   ├── MIADashboard.tsx
│   │   ├── MREDashboard.tsx
│   │   ├── Tools.tsx
│   │   ├── Settings.tsx
│   │   └── NotFound.tsx
│   │
│   ├── types/
│   │   ├── dashboard.ts             # Shared types (IOC, Timeline, etc.)
│   │   ├── mia.ts
│   │   └── mre.ts
│   │
│   ├── App.tsx                      # Root with providers + router
│   ├── main.tsx
│   └── index.css                    # Design tokens & global styles
│
├── .github/
│   ├── workflows/ci.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── index.html
├── tailwind.config.ts
├── vite.config.ts                   # Vite + Vitest config
├── tsconfig.json
├── tsconfig.app.json
├── eslint.config.js
└── package.json
```

---

## Troubleshooting

### Port Already in Use

```bash
npx kill-port 8080
# or
npm run dev -- --port 3000
```

### Dependencies Installation Failed

```bash
rm -rf node_modules package-lock.json
npm install
```

### Data Not Saving

1. Check localStorage is enabled (not in private/incognito mode)
2. DevTools → Application → Storage — check quota
3. Clear old data: `localStorage.clear()`

### MITRE ATT&CK Not Loading

1. Check internet connection (fetches live from GitHub)
2. Clear cache: `localStorage.removeItem('mitre-attack-cache')`
3. Refresh page and check console for network errors

### Export Not Working

1. Check browser allows file downloads
2. Try JSON export first (simplest format)
3. Check DevTools console for errors

### Images Not Pasting

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
| Inter | Body text in exported documents |

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

- [MITRE ATT&CK](https://attack.mitre.org/) - Threat framework
- [MBC (Malware Behavior Catalog)](https://github.com/MBCProject/mbc-markdown) - Behavior mapping
- [FLARE-VM](https://github.com/mandiant/flare-vm) - Analysis tools reference

---

<div align="center">

*Built for the cybersecurity community* 💚

**[Report Bug](https://github.com/MWE-HaTN/MalFrame/issues)** · **[Request Feature](https://github.com/MWE-HaTN/MalFrame/issues)**

</div>
