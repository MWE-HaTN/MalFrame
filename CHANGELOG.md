# Changelog

All notable changes to MalFrame are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

*Changes not yet released will be listed here.*

---

## [1.0.1] — 2026-03-29

### Fixed

#### HMR Fast Refresh — separated mixed exports
Each file now exports only React components **or** only utilities, never both. This eliminates Vite HMR "export is incompatible" warnings that caused full page reloads during development.

Extracted to dedicated files:
- `src/hooks/useLanguage.ts` — `useLanguage()` hook (was in `LanguageContext.tsx`)
- `src/hooks/useTheme.ts` — `useTheme()` hook (was in `ThemeContext.tsx`)
- `src/hooks/useUser.ts` — `useUser()` hook (was in `UserContext.tsx`)
- `src/lib/preloadRoutes.ts` — lazy page components + `preloadRoutes` / `preloadAllRoutes` (was in `App.tsx`)
- `src/lib/navigation.ts` — `getSavedDashboard()` (was in `Header.tsx`)
- `src/lib/sectionState.ts` — `clearAllSectionStates()` (was in `CollapsibleSection.tsx`)
- `src/lib/mre/codeAnalysisDefaults.ts` — `createInitialCodeAnalysisData()` / `createInitialDeepDiveData()` (was in `CodeAnalysisGroups.tsx`)
- `src/components/ui/button-variants.ts` — `buttonVariants` CVA definition (was in `button.tsx`)
- `src/components/runtime-behavior/styles.ts` — `inputStyles` / `textareaBaseStyles` (was in `ui-components.tsx`)

#### Rollup circular chunk warning
Consolidated all `@radix-ui/*` packages into a single `vendor-radix` chunk instead of 4 separate rules that caused circular dependency warnings.

#### Deprecated Rollup API
Replaced `assetInfo.name` (deprecated in Rollup v4) with `assetInfo.names?.[0]` in `vite.config.ts`.

#### TypeScript `vi` not found in test setup
Added `tsconfig.test.json` with `"types": ["vitest/globals"]` for proper VS Code integration when test files exist.

### Removed
- `src/test/setup.ts` — orphaned setup file with no corresponding test files
- `tsconfig.test.json` — removed when test folder was deleted (no test files in project)
- `vitest.config.ts` — merged into `vite.config.ts` under `test:` block

---

## [1.0.0] — 2026-03-28

Initial public release.

### Added

#### Core Dashboards
- **MIA Dashboard** (`/mia`) — Malware Incident Analysis workflow with auto-save to localStorage
- **MRE Dashboard** (`/mre`) — Malware Reverse Engineering with full PE analysis
- **Tools Page** (`/tools`) — FLARE-VM tools reference, 33 categories, 240+ tools
- **Settings Page** (`/settings`) — User profile, language, theme, display scale

#### MIA Dashboard Sections
- Background — Case ID, analyst, infection vector metadata
- Sample Information — File details with drag-and-drop SHA256/MD5/SHA1 hashing
- Static Analysis — Strings, imports, PE sections with entropy bars
- Behavior Analysis — Process tree, file system, registry, network findings
- MITRE ATT&CK Mapping — Interactive technique selection (14 tactics, live data)
- Impact Assessment — Scope, affected accounts, risk rating
- Recommendations — Short-term and long-term remediation fields
- IOC Table — Indicators with type categorization, virtual scrolling for 1000+ rows
- Attack Timeline — Chronological events with drag-reorder
- Evidence Artifacts — File management with SHA256 auto-hash
- Notes Log — Free-form notes with image paste (Ctrl+V) support

#### MRE Dashboard Sections
- Background — File metadata and analyst context
- Static Analysis — Hashes, PE structure, packing detection, OSINT lookup
- Runtime Behavior — Anti-analysis, execution patterns, technical behavior groups
- Code Analysis — Static code, dynamic code, cryptography analysis
- Unpacking Layers — Document unpacking workflow with stages
- MBC Mapping — Malware Behavior Catalog v3.2 objectives and behaviors
- YARA Rules — Signature documentation
- IOC Table — Shared component with virtual scrolling
- Execution Stages — Malware execution flow tracking
- PE Sections — Section entropy visualization
- Security Posture — ASLR, DEP, CFG, SEH analysis
- Micro-Behaviors — Granular behavior indicators

#### Data & Export
- JSON export/import with full backward compatibility
- PDF export (MIA + MRE) using jsPDF with Roboto fonts
- Word (.docx) export with structured sections
- Drag-and-drop JSON import on dashboard
- Activity Tracker — GitHub-style contribution heatmap

#### Integrations
- MITRE ATT&CK — Live fetch from `mitre-attack/attack-stix-data`, 24h localStorage cache
- MBC v3.2 — Static bundled dataset (objectives, behaviors, methods, micro-behaviors)
- FLARE-VM tools — Static reference, version `2026.03.28`

#### UI & UX
- Dark cyber/terminal aesthetic with light mode toggle
- Bilingual support: English / Tiếng Việt
- Collapsible sections with per-section state persistence
- Inline hints system (ℹ button) — expert guidance per section
- Display scale 75%–200%
- Accessible keyboard navigation (Radix UI primitives)
- Skip-to-content link for screen readers

#### Performance
- Code splitting: 30+ lazy-loaded chunks
- Gzip + Brotli compression in production
- Virtual scrolling for IOC tables (TanStack Virtual)
- 500ms debounced localStorage writes
- Memoized contexts and callbacks
- Route preloading on hover

#### Developer Experience
- TypeScript throughout
- Zod schema validation for all imported data
- ESLint v9 with TypeScript plugin
- Vite 7 with SWC transform
- Bundle visualizer (`dist/stats.html`)
- Bundle size report script (`scripts/bundle-size-report.js`)
- CI workflow (GitHub Actions)
- CONTRIBUTING.md, SECURITY.md, issue templates, PR template

---

[Unreleased]: https://github.com/MWE-HaTN/MalFrame/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/MWE-HaTN/MalFrame/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/MWE-HaTN/MalFrame/releases/tag/v1.0.0
