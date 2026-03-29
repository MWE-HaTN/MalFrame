# Contributing to MalFrame

Thank you for your interest in contributing. MalFrame is built for the malware analysis and DFIR community — all skill levels are welcome.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Architecture Rules](#architecture-rules)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/MalFrame.git
   cd MalFrame
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/MWE-HaTN/MalFrame.git
   ```

---

## Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18+ |
| npm | v9+ |
| Git | Latest |

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:8080)
npm run dev

# Verify build works
npm run lint
npm run typecheck
npm run build
```

### Keeping Your Fork Up to Date

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## Architecture Rules

These rules are enforced to keep Vite HMR Fast Refresh working correctly.

### One concern per file

Each file must export **only React components** OR **only non-component utilities** — never both.

**Wrong:**
```tsx
// LanguageContext.tsx — mixing provider + hook
export function LanguageProvider(...) { ... }
export function useLanguage() { ... }  // ❌ breaks HMR
```

**Correct:**
```tsx
// LanguageContext.tsx — provider only
export function LanguageProvider(...) { ... }

// hooks/useLanguage.ts — hook only
export function useLanguage() { ... }  // ✅
```

### Correct import paths

Always import hooks from `src/hooks/`, not directly from context files:

```tsx
import { useLanguage } from "@/hooks/useLanguage";   // ✅
import { useTheme }    from "@/hooks/useTheme";       // ✅
import { useUser }     from "@/hooks/useUser";         // ✅

import { useLanguage } from "@/contexts/LanguageContext"; // ❌
```

Other utility imports:

```tsx
import { clearAllSectionStates } from "@/lib/sectionState";     // ✅
import { getSavedDashboard }     from "@/lib/navigation";        // ✅
import { preloadRoutes }         from "@/lib/preloadRoutes";     // ✅
import { buttonVariants }        from "@/components/ui/button-variants"; // ✅
import { inputStyles }           from "@/components/runtime-behavior/styles"; // ✅
```

---

## Project Structure

```
src/
├── components/
│   ├── mia/             # MIA section components
│   ├── mre/             # MRE section components
│   ├── ui/              # Shadcn/Radix primitives
│   ├── runtime-behavior/
│   │   └── styles.ts    # inputStyles, textareaBaseStyles
│   └── ...
├── contexts/            # Providers only — no hooks exported here
├── hooks/               # One hook per file
├── lib/
│   ├── export/          # PDF/Word/JSON generators
│   ├── mia/             # MIA constants + migration
│   ├── mre/             # MRE constants + migration
│   ├── translations/    # EN/VN strings
│   ├── preloadRoutes.ts
│   ├── navigation.ts
│   └── sectionState.ts
├── pages/               # Route-level components
└── types/               # TypeScript interfaces
```

---

## Coding Standards

### TypeScript

- Define interfaces in `src/types/` for shared data shapes
- Use named exports (avoid `export default` for types)

### React

- Functional components only
- Wrap components with `memo` to prevent unnecessary re-renders
- Lazy-load heavy components via `src/components/lazy/`

### Styling

- **Tailwind CSS** utility classes only
- Color tokens are defined in `src/index.css` — do not hardcode hex colors
- Use `ease-standard` instead of arbitrary `ease-[cubic-bezier(...)]`

### Translations

Every user-visible string must have both EN and VN translations:

```typescript
// src/lib/translations/en.ts
"section.myKey": "My English text",

// src/lib/translations/vn.ts
"section.myKey": "Nội dung tiếng Việt",
```

Use `useLanguage()` from `@/hooks/useLanguage`:

```tsx
import { useLanguage } from "@/hooks/useLanguage";

const { t } = useLanguage();
return <span>{t("section.myKey")}</span>;
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add YARA rule syntax highlighting
fix: resolve IOC table scroll position reset
docs: update MBC data to v3.2
perf: lazy-load MBC mapping component
refactor: extract shared export helpers
chore: update toolsData version to 2026.03
```

---

## Submitting Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make changes** — keep commits focused and atomic

3. **Verify before pushing**:
   ```bash
   npm run lint       # No ESLint errors
   npm run typecheck  # No TypeScript errors
   npm run build      # Production build succeeds
   ```

4. **Push** to your fork:
   ```bash
   git push origin feat/my-feature
   ```

5. **Open a Pull Request** against `main` — fill in the PR template

### PR Guidelines

- One PR per logical change
- Describe *what* changed and *why*
- Reference related issues: `Closes #123`
- Both EN and VN translations must be updated together
- Screenshots for UI changes are appreciated

---

## Reporting Bugs

Use the [Bug Report template](https://github.com/MWE-HaTN/MalFrame/issues/new?template=bug_report.yml). Include:

- Steps to reproduce
- Expected vs actual behavior
- Browser and OS version
- Console errors (F12 → Console)

---

## Feature Requests

Use the [Feature Request template](https://github.com/MWE-HaTN/MalFrame/issues/new?template=feature_request.yml). Describe:

- The analyst workflow it solves
- How it fits into MIA or MRE analysis
- Any relevant standards (MITRE, MBC, etc.)

---

## Areas Where Help is Welcome

- 🌐 **Translations** — Improve Vietnamese or add new languages
- 🛡️ **MITRE/MBC accuracy** — Corrections to technique mappings
- 🔧 **Tools data** — New tools in `src/lib/toolsData.ts`
- 📄 **Export quality** — PDF/Word formatting improvements
- ⚡ **Performance** — Bundle size reductions, render optimizations
- 🐛 **Bug fixes** — Check open issues

---

*Questions? Open a [Discussion](https://github.com/MWE-HaTN/MalFrame/discussions) or an Issue.*
