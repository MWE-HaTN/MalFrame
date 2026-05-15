# Changelog

All notable changes to MalFrame are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added

#### Auto MITRE Suggestion
- Scans MIA behavior fields (process tree, file system, registry, network, memory, system changes) and suggests relevant MITRE ATT&CK techniques
- Keyword-to-technique mapping engine with ~60 rules covering all 14 tactics
- Confidence levels (high/medium/low) with color-coded indicators
- Collapsible suggestion section in MITRE ATT&CK Mapping with Accept/Dismiss buttons
- Filters out techniques already in the mapping
- Uses React 19 `useDeferredValue` for non-blocking computation during typing

#### Auto MBC Suggestion
- Scans MRE runtime behavior tags (anti-debug, anti-VM, persistence, network, memory, injection, artifacts) and suggests relevant MBC behaviors
- Tag-to-behavior mapping engine covering all MBC objectives
- Collapsible suggestion section in MBC Mapping with Accept/Dismiss buttons
- Deduplication by behavior ID with highest confidence kept

#### MITRE Force Refresh
- "Force Refresh" button in MITRE ATT&CK Mapping header to bypass all caches and fetch fresh data from GitHub
- Displays last fetch time relative to now (e.g., "2h ago")
- Clears in-memory, localStorage, and promise lock caches before refetching

#### MBC Version Check
- "Update" button now checks GitHub MBC repo for newer versions via GitHub API
- Shows remote version with link to releases page when a newer version is available
- 24h cache for version check results to avoid rate limiting

#### Clipboard IOC Parser
- Paste raw text from logs, sandbox reports, or threat intel feeds
- Auto-detects and classifies: SHA256/SHA1/MD5, IPv4/IPv6, URLs, domains, emails, file paths, mutexes
- False positive filtering for localhost, common domains, file extensions
- One-click "Add All" to append parsed IOCs to the IOC table

#### Timeline Visualization
- Toggle between table and vertical timeline views for attack events
- Severity-colored dots (info/warning/critical) with hover-reveal delete buttons
- Shared add form between both views

#### YARA Rule Editor (MRE)
- CodeMirror 6 editor with custom YARA syntax highlighting
- Cyber-themed colors: keywords, `$variables`, hex strings `{ }`, regex `/ /`, meta keys
- Lazy-loaded (~90KB gzipped, separate chunk)

#### Case Templates
- Template dialog when creating new cases: Blank, Ransomware, Phishing, APT, Info-Stealer, Custom
- Pre-fills relevant fields (risk level, MITRE techniques, recommendations, MBC mappings)
- Available for both MIA and MRE dashboards

#### IOC Cross-Reference (`Ctrl+Shift+I`)
- Scans all MIA and MRE cases to find IOCs shared across multiple cases
- Clickable case names navigate directly to the case
- Accessible from IOC Table section (both dashboards), Command Palette, and keyboard shortcut

#### Command Palette — New Actions
- Switch language (EN/VN) — toggles between English and Vietnamese
- Toggle dark/light theme
- Change display scale — cycles through 75% → 100% → 125% → 150%
- Track activity for today — manually record activity for the heatmap

#### Graph Visualization (MIA)
- Interactive ReactFlow graph for MITRE ATT&CK technique mappings
- Tactic nodes with technique children, auto-layout
- MiniMap, zoom controls, cyber-themed node styling
- Lazy-loaded (~48KB gzipped, separate chunk)

#### Cross-case Search (`Ctrl+Shift+X`)
- Search across all MIA and MRE cases from a single dialog
- Results grouped by case with expandable match lists
- Matched text highlighting and field path formatting

#### Command Palette (`Ctrl+K`)
- Keyboard-driven navigation and actions via fuzzy search
- Groups: Navigation, Search, Cases, Export, Tools, Help
- Arrow key + Enter selection, Escape to close

#### Export Reminder
- Toast warning when case data hasn't been exported in 7+ days
- Per-case tracking via `localStorage` timestamp
- Only shown when case has meaningful content

#### Keyboard Shortcut Hint Bar
- Fixed icon buttons in bottom-left corner (Command Palette, Search, Shortcuts)
- Click to expand, click again or use action to collapse back to single keyboard icon
- Always visible as part of the page (no auto-hide)

#### PWA Support
- Installable as a Progressive Web App
- Service worker with Workbox for offline caching
- Update prompt via `ReloadPrompt` component

### Changed

#### Performance Optimization
- **MIA Dashboard**: Wrapped `handleExportJSON`, `handleExportPDF`, `handleExportWord`, `countLogImages`, `getTotalImageCount`, `getReportName`, `downloadAllImages`, `handleConfirmExport` in `useCallback`; memoized `exportOptions` array with `useMemo`
- **MRE Dashboard**: Wrapped `handleHashGenerated`, `handleExportJSON`, `handleExportPDF`, `handleExportWord`, `getReportName`, `handleConfirmExport` in `useCallback`; memoized `exportOptions` array with `useMemo`
- **BehaviorAnalysisSection**: Extracted 6 inline `onImagesChange` callbacks into stable `useCallback` hooks; replaced `|| []` fallback with module-level `EMPTY_IMAGES` constant to preserve `FormField` memoization
- **MitreAttackMapping**: Wrapped `allSelectedTechniques` computation in `useMemo` with `[mapping, mitreTactics]` dependencies

#### Timeline Sort Order
- Most recent events at top (descending time)
- Same time → critical > warning > info severity priority
- Same time + severity → alphabetical by content

#### Code Quality — `useCallback` / `useMemo`
- Wrapped all section `onChange` handlers in `useCallback` (both dashboards) to prevent unnecessary re-renders via `React.memo`
- Added `useMemo` for `existingHashes` computation in MIA

#### MRE Migration Fix
- Fixed double-cast in `migrate.ts` line 57 — removed `comments` field not in `PESectionData` interface

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
