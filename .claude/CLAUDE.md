# MalFrame — Architecture Reference for Claude Code

## Stack

- **React 19** + **TypeScript 5.8** + **Vite 7** + **Tailwind 3**
- **Routing**: react-router-dom v7
- **Validation**: Zod v4
- **UI base**: Radix UI primitives + shadcn-style components in `src/components/ui/`
- **Export**: jsPDF (PDF) + docx (Word) — lazy-loaded on demand
- **i18n**: Custom context, EN and VN, keys in `src/lib/translations/`
- **Storage**: IndexedDB (dashboard data) + localStorage (settings, UI state, MITRE cache)
- **Build output**: `dist/` — GitHub Pages deploy at `/MalFrame/`

---

## Critical Architecture Rule — HMR Fast Refresh

**Each file must export ONLY React components OR ONLY non-component utilities — never mixed.**

Violating this causes Vite to fall back to full page reload (HMR "export is incompatible" warning).

| Pattern | Correct location |
|---------|-----------------|
| React component | `src/components/` or `src/pages/` |
| Custom hook (`useXxx`) | `src/hooks/useXxx.ts` |
| Context provider (class component) | `src/contexts/XxxContext.tsx` — export provider + type only |
| Context accessor hook | `src/hooks/useXxx.ts` — imports from context |
| Utility function | `src/lib/` |
| CVA variants without JSX | `src/components/ui/button-variants.ts` (separate from button.tsx) |
| Style constants without JSX | `src/components/runtime-behavior/styles.ts` |

### Contexts — import rule

**NEVER import hooks from context files directly.** Context files only export the Provider and the Context object.

```ts
// CORRECT
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme }    from "@/hooks/useTheme";
import { useUser }     from "@/hooks/useUser";

// WRONG — breaks HMR
import { useLanguage } from "@/contexts/LanguageContext";
```

---

## Directory Structure

```
src/
├── App.tsx                    # Root: providers + router (no lazy imports here)
├── main.tsx                   # Entry point
├── components/
│   ├── ui/                    # Radix-based design system components
│   │   ├── button.tsx         # Re-exports buttonVariants from button-variants.ts
│   │   └── button-variants.ts # CVA definition (non-JSX, separate file)
│   ├── dashboard/             # DashboardHeader component
│   ├── header/                # Header sub-components (ActivityBadge, EasterEgg)
│   └── lazy/                  # Lazy wrapper components (LazyXxx.tsx)
│       └── index.ts           # Re-exports all LazyXxx wrappers
├── features/
│   ├── mia/                   # ← ALL MIA domain code in one place
│   │   ├── components/        # Section components + IOCTable, MitreAttackMapping,
│   │   │                      #   EvidenceArtifacts, TimelineTable
│   │   ├── hooks/             # useArtifactFileDrop.ts
│   │   ├── services/          # constants.ts, migrate.ts, transform.ts, index.ts
│   │   └── types.ts           # DFIRData and all MIA sub-types
│   └── mre/                   # ← ALL MRE domain code in one place
│       ├── components/        # Section components + StaticAnalysisCards,
│       │   │                  #   SecurityPosture, PESectionEntry, PackedDropdown,
│       │   │                  #   PackerSuspectedDropdown, MBCMapping, CodeAnalysisGroups,
│       │   │                  #   FileInfoField
│       │   ├── runtime-behavior/  # AntiAnalysisGroup, ExecutionBehaviorGroup,
│       │   │                      #   TechnicalRuntimeGroup, RuntimeBehavior, ui-components,
│       │   │                      #   styles.ts, types.ts, constants.ts, index.ts
│       │   └── code-analysis/     # StaticCodeAnalysis, DynamicCodeAnalysis,
│       │                          #   CryptographyAnalysis, MicroBehaviorsSection,
│       │                          #   shared.tsx, types.ts, index.ts
│       ├── hooks/             # useMBCData.ts
│       ├── services/          # constants.ts, migrate.ts, transform.ts,
│       │                      #   codeAnalysisDefaults.ts, index.ts
│       └── types.ts           # REData and all MRE sub-types
├── contexts/
│   ├── LanguageContext.tsx    # LanguageProvider + LanguageContext (NO useLanguage)
│   ├── ThemeContext.tsx       # ThemeProvider + ThemeContext (NO useTheme)
│   └── UserContext.tsx        # UserProvider + UserContext (NO useUser)
├── hooks/
│   ├── useLanguage.ts         # useContext(LanguageContext)
│   ├── useTheme.ts            # useContext(ThemeContext)
│   ├── useUser.ts             # useContext(UserContext)
│   ├── useDashboardData.ts    # IndexedDB load/save + analyst auto-fill + clearData
│   ├── useDashboardExport.ts  # Export dialog state machine
│   ├── useImportJSON.ts       # JSON import with Zod validation
│   ├── useCaseManager.ts      # Multi-case CRUD (used by both dashboards)
│   ├── useDragReorder.ts      # Drag-to-reorder for list items
│   ├── useToolsData.ts        # Tools list with localStorage persistence
│   ├── useSEO.ts              # Document title + meta tags
│   └── useTypingAnimation.ts  # Typing animation for landing page
├── lib/
│   ├── db.ts                  # IndexedDB async wrapper (dbGet/dbSet/dbDelete/dbClear)
│   ├── storageKeys.ts         # ALL localStorage key strings (single source of truth)
│   ├── imageStorage.ts        # Image registry clear utilities (clearAllImages)
│   ├── sectionState.ts        # clearAllSectionStates() — clears section open/close state
│   ├── navigation.ts          # getSavedDashboard() — reads LAST_DASHBOARD from localStorage
│   ├── preloadRoutes.ts       # Lazy page components + preloadAllRoutes()
│   ├── lazyExport.ts          # lazyExportJSON/PDF/Word — dynamic import wrappers
│   ├── lazyPrefetch.ts        # prefetchXxx() — warm up lazy component chunks
│   ├── fileNameUtils.ts       # generateFileName(analyst, fileName, sha256, ext)
│   ├── utils.ts               # cn(), generateId(), and other shared utils
│   ├── validationSchemas.ts   # Zod schemas for import validation
│   ├── semanticColors.ts      # Risk level → color mapping
│   ├── mitreUtils.ts          # MITRE ATT&CK data fetch + cache (IDB-aware)
│   ├── mbcData.ts             # MBC (Malware Behavior Catalog) data
│   ├── toolsData.ts           # Tools reference data
│   ├── activityUtils.ts       # Activity tracking helpers
│   ├── debugLogger.ts         # debugLog/debugWarn/debugError (no-ops in production)
│   ├── imageUtils.ts          # Base64 image helpers
│   ├── export/                # PDF + Word export implementations (lazy-loaded)
│   │   ├── helpers.ts         # Shared formatting helpers
│   │   ├── json.ts            # JSON export
│   │   ├── pdf-mia.ts         # jsPDF MIA report
│   │   ├── pdf-mre.ts         # jsPDF MRE report
│   │   ├── word-mia.ts        # docx MIA report
│   │   └── word-mre.ts        # docx MRE report
│   ├── mbc/                   # MBC types + index
│   └── translations/          # en.ts, vn.ts, index.ts (re-exports both)
├── pages/
│   ├── Index.tsx              # Landing page
│   ├── MIADashboard.tsx       # Malware Incident Analysis dashboard
│   ├── MREDashboard.tsx       # Malware Reverse Engineering dashboard
│   ├── Tools.tsx              # Tools reference page
│   ├── Settings.tsx           # User settings page
│   └── NotFound.tsx           # 404 page
└── types/
    ├── cases.ts               # CaseMeta (multi-case management)
    └── dashboard.ts           # LogEntry, shared dashboard types (UnpackLayer, PESectionData)
```

---

## Multi-Case Management

Both MIA and MRE dashboards support multiple independent cases stored concurrently.

### Architecture

```
MIADashboard (outer)
  useCaseManager("mia", MIA_STORAGE_KEY)
  → cases: CaseMeta[], activeCaseId, activeStorageKey
  → renders <CaseSwitcher> + <MIADashboardBody key={activeCaseId} storageKey={activeStorageKey} />

MIADashboardBody (inner, remounts on case switch via key prop)
  useDashboardData({ storageKey })  ← dynamic per case
```

The `key` prop causes React to fully remount the body on case switch, which triggers the unmount flush in `useDashboardData` (saves current case immediately) before loading the new case fresh.

### IDB storage layout for cases

| Key | Value |
|-----|-------|
| `"mia-cases"` | `CaseMeta[]` registry |
| `"mia-case-{id}"` | Full `DFIRData` for that case |
| `"mre-cases"` | `CaseMeta[]` registry |
| `"mre-case-{id}"` | Full `REData` for that case |

Active case ID: localStorage `"mia-active-case"` / `"mre-active-case"` (fast read on refresh).

### Relevant files

| File | Role |
|------|------|
| `src/types/cases.ts` | `CaseMeta` type |
| `src/hooks/useCaseManager.ts` | Case CRUD, registry, legacy migration |
| `src/components/CaseSwitcher.tsx` | Tab bar: switch / inline rename / delete / new case |

---

## Data Flow — Dashboard

```
IndexedDB (db.ts)
    ↕ async load/save (useDashboardData.ts)
React state: data: T
    ↕ prop drilling
Section components (mia/, mre/)
    → setData((prev) => ({ ...prev, field: newValue }))
```

**Migration path**: On first load, `useDashboardData` checks IndexedDB. If empty, falls back to localStorage (old format), migrates via `migrateXxxData()`, saves to IDB, removes from localStorage.

### Storage split

| What | Where |
|------|-------|
| Dashboard data (MIA/MRE JSON + embedded base64 images) | **IndexedDB** `dashboard` store |
| Settings: theme, language, user profile, display scale | **localStorage** |
| UI state: section open/close, hints, runtime groups | **localStorage** |
| MITRE ATT&CK cache | **localStorage** (intentionally survives data clear) |
| Tools data | **localStorage** |
| Activity data | **localStorage** |

---

## Key Patterns

### Adding a new dashboard section

1. Add fields to the type in `src/types/mia.ts` or `src/types/mre.ts`
2. Add initial values in `src/lib/mia/constants.ts` (or mre)
3. Add migration in `src/lib/mia/migrate.ts` to handle old saved data
4. Create section component in `src/components/mia/` following existing pattern
5. Add translation keys to `src/lib/translations/en.ts` and `vn.ts`
6. Wire up in `src/pages/MIADashboard.tsx`

### Lazy component pattern

```tsx
// src/components/lazy/LazyMyComponent.tsx
import { lazy, Suspense } from "react";
const MyComponent = lazy(() => import("@/components/MyComponent"));
export function LazyMyComponent(props: Props) {
  return <Suspense fallback={<SectionSkeleton />}><MyComponent {...props} /></Suspense>;
}
```

### i18n

```ts
const { t } = useLanguage();
// t("section.key") → looks up in translations/en.ts or vn.ts
```

Add keys to BOTH `en.ts` and `vn.ts` — TypeScript enforces matching shape via type inference in `translations/index.ts`.

---

## Commands

```bash
npm run dev          # Dev server at http://localhost:8080
npm run build        # Production build → dist/
npm run typecheck    # tsc --noEmit (0 errors expected)
npm run lint         # ESLint
npm run preview      # Preview production build locally
```

---

## Known constraints

- **Images are embedded as base64 strings** directly in the dashboard data JSON. This was intentional for portability (single JSON export contains everything). IndexedDB handles the larger payload compared to the old localStorage approach.
- **No test suite** — vitest was removed (no test files existed). Manual testing only.
- **GitHub Pages deploy** — `base: "/MalFrame/"` in vite.config.ts. Local dev uses `base: "/"`.
- **Two languages** — all user-facing strings must have EN + VN translations before merging.
