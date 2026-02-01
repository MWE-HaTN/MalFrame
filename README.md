# 🛡️ Malware Analyst Dashboard

A professional web application for **Malware Incident Analysis (MIA)** and **Malware Reverse Engineering (MRE)** workflows. Built with a dark cyber/terminal-inspired aesthetic, optimized for malware analysts and security researchers.

> 🇻🇳 **Hỗ trợ Tiếng Việt**: Ứng dụng hỗ trợ đầy đủ tiếng Việt. Vào Settings để chuyển ngôn ngữ.

![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Table of Contents / Mục lục

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

## 🚀 Quick Start / Bắt đầu nhanh

### Prerequisites / Yêu cầu hệ thống

**Option A: Node.js + npm** (Recommended / Khuyến nghị)

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org/) |
| npm | v9+ | Included with Node.js |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

```bash
# Verify installation / Kiểm tra cài đặt
node --version   # v18+ required
npm --version    # v9+
git --version
```

**Option B: Bun** (Faster alternative / Nhanh hơn)

```bash
# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Verify / Kiểm tra
bun --version    # v1.0+
```

### Installation / Cài đặt

```bash
# 1. Clone repository / Tải mã nguồn
git clone https://github.com/MWE-HaTN/malware-analyst-dashboard.git
cd malware-analyst-dashboard

# 2. Install dependencies / Cài đặt thư viện
npm install    # hoặc: bun install

# 3. Start development server / Chạy server phát triển
npm run dev    # hoặc: bun run dev

# 4. Open browser / Mở trình duyệt
# http://localhost:8080
```

### Production Build / Build sản phẩm

```bash
# Build for production / Build cho môi trường production
npm run build

# Preview production build locally / Xem trước bản build
npm run preview

# View bundle size report / Xem báo cáo kích thước
node scripts/bundle-size-report.js
```

### Docker (Optional / Tùy chọn)

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
docker build -t malware-analyst-dashboard .
docker run -p 8080:80 malware-analyst-dashboard
```

---

## 📦 Installation Guide / Hướng dẫn cài đặt

### Required Tools / Công cụ cần thiết

| Tool | Purpose / Mục đích | Installation / Cài đặt |
|------|---------|-------------|
| **Node.js 18+** | JavaScript runtime | [Download](https://nodejs.org/) |
| **npm 9+** | Package manager | Included with Node.js |
| **Git** | Version control | [Download](https://git-scm.com/) |
| **VS Code** (optional) | Code editor | [Download](https://code.visualstudio.com/) |

### Recommended VS Code Extensions / Extensions VS Code khuyến nghị

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "dbaeumer.vscode-eslint"
  ]
}
```

### Step-by-Step Installation / Cài đặt từng bước

**Step 1: Install Node.js / Cài đặt Node.js**

Windows:
1. Download from [nodejs.org](https://nodejs.org/) (LTS version)
2. Run installer, check "Add to PATH"
3. Restart terminal

macOS:
```bash
# Using Homebrew
brew install node
```

Linux (Ubuntu/Debian):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Step 2: Clone and Install / Tải và cài đặt**

```bash
# Clone the repository
git clone https://github.com/MWE-HaTN/malware-analyst-dashboard.git

# Navigate to project folder
cd malware-analyst-dashboard

# Install all dependencies (may take 1-2 minutes)
npm install
```

**Step 3: Run the Application / Chạy ứng dụng**

```bash
# Start development server
npm run dev

# You should see:
#   VITE v7.x  ready in XXX ms
#   ➜  Local:   http://localhost:8080/
```

**Step 4: Open in Browser / Mở trên trình duyệt**

Navigate to: `http://localhost:8080`

---

## ✨ Features Overview / Tổng quan tính năng

| Feature | MIA | MRE | Description |
|---------|:---:|:---:|-------------|
| File Hash Generator | ✅ | ✅ | Drag & drop to calculate SHA256/MD5/SHA1 |
| Image Paste | ✅ | ✅ | Ctrl+V to paste screenshots in textareas |
| MITRE ATT&CK Mapping | ✅ | ✅ | Map techniques to 14 tactics (live data from GitHub) |
| MBC Mapping | ❌ | ✅ | Malware Behavior Catalog with objectives |
| Micro-Behaviors | ❌ | ✅ | Granular behavior indicators |
| IOC Table | ✅ | ✅ | Track Indicators of Compromise with virtual scrolling |
| Attack Timeline | ✅ | ❌ | Create structured event timeline with drag-reorder |
| Evidence Artifacts | ✅ | ❌ | Manage evidence files with SHA256 auto-hash |
| Code Analysis | ❌ | ✅ | Static, Dynamic, Cryptography analysis |
| Runtime Behavior | ❌ | ✅ | Anti-analysis, execution, network behavior |
| Unpacking Layers | ❌ | ✅ | Document unpacking process with stages |
| Execution Stages | ❌ | ✅ | Track malware execution flow |
| PE Sections | ❌ | ✅ | Document PE sections with entropy visualization |
| Security Posture | ❌ | ✅ | ASLR, DEP, CFG, SEH checks |
| Export (JSON/PDF/Word) | ✅ | ✅ | Generate comprehensive reports |
| Dark/Light Theme | ✅ | ✅ | Toggle between themes |
| EN/VN Language | ✅ | ✅ | Bilingual support |
| Activity Tracker | ✅ | ✅ | Track analysis days (GitHub-style) |

---

## 📖 Dashboard Usage / Hướng dẫn sử dụng

### 🔬 MIA Dashboard (`/mia`)

**Purpose**: Malware Incident Analysis for DFIR investigations

**Workflow**:
1. **Drop a malware sample** → Auto-generates SHA256, MD5, SHA1
2. **Fill background info** → Case ID, analyst, workstation, infection vector
3. **Document analysis** → Static, behavior, network, memory findings
4. **Map to MITRE ATT&CK** → Select observed techniques
5. **Collect IOCs** → Add indicators with type, value, context
6. **Create timeline** → Document events with timestamps
7. **Export report** → Generate PDF/Word/JSON

**Sections**:
| Section | Description |
|---------|-------------|
| Background | Case metadata and incident context |
| Sample Information | File details, hashes, signature status |
| Static Analysis | Strings, imports, PE sections with entropy |
| Behavior Analysis | Process tree, file system, registry, network |
| MITRE ATT&CK | Interactive technique mapping with 14 tactics |
| Impact Assessment | Scope, affected accounts, risk rating |
| IOC Table | Indicators with type categorization |
| Recommendations | Short-term and long-term remediation |
| Attack Timeline | Chronological event documentation |
| Evidence Artifacts | File management with metadata |
| Notes Log | Free-form notes with image support |

### 🔧 MRE Dashboard (`/mre`)

**Purpose**: Malware Reverse Engineering for deep technical analysis

**Workflow**:
1. **Load sample** → Auto-hash calculation
2. **Static analysis** → PE info, OSINT lookup, packing detection
3. **Code analysis** → Static/dynamic code, cryptography
4. **Runtime behavior** → Anti-analysis, execution patterns
5. **Deep dive** → Unpacking layers, execution stages
6. **Detection** → MBC mapping, YARA signatures, IOCs
7. **Export** → Comprehensive RE report

**Sections**:
| Section | Description |
|---------|-------------|
| Background | File metadata and timestamps |
| Static Analysis | Hashes, PE structure, packing, OSINT |
| Code & Behavior | Runtime behavior, code analysis groups |
| Deep Dive | Unpacking layers, execution stages |
| Detection | MBC mapping, YARA, IOCs, conclusion |

### 🛠️ Tools (`/tools`)

FLARE-VM analysis tools reference:
- **33 categories**, **232+ tools**
- Quick search and filtering
- Direct links to GitHub repositories
- Collapsible category cards

### ⚙️ Settings (`/settings`)

| Setting | Description |
|---------|-------------|
| User Profile | Analyst name, GitHub URL (appears in exports) |
| Language | English / Tiếng Việt |
| Theme | Dark (cyber) / Light mode |
| Display Scale | 75% - 200% interface scaling |
| Activity | Track analysis days with year view |

---

## ⌨️ Keyboard Shortcuts

### Dropdowns
| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open dropdown / Select option |
| `↑` / `↓` | Navigate options |
| `Home` / `End` | Jump to first / last option |
| `PageUp` / `PageDown` | Jump 10 options |
| `Escape` | Close dropdown |
| `A-Z` | Type-to-search (filters options) |

### Forms
| Key | Action |
|-----|--------|
| `Ctrl+V` | Paste image in textarea |
| `Tab` | Move to next field |
| `Shift+Tab` | Move to previous field |

### Tables (IOC, Timeline)
| Key | Action |
|-----|--------|
| `Ctrl+C` | Copy selected value |
| `Delete` | Remove selected row |

---

## 💾 Data Management

### Auto-Save
All data automatically saves to browser localStorage with **500ms debounce**. No manual save required.

### Storage Keys
| Key | Content | Approximate Size |
|-----|---------|------------------|
| `dfir-dashboard-data` | MIA Dashboard | ~50-500 KB |
| `re-dashboard-data` | MRE Dashboard | ~50-500 KB |
| `cyber-analyst-theme` | Theme preference | <1 KB |
| `cyber-analyst-language` | Language setting | <1 KB |
| `cyber-analyst-user-profile` | User profile | <1 KB |
| `mitre-attack-cache` | Cached MITRE data | ~200 KB |
| `cyber-analyst-images` | Stored images registry | Varies |

### Image Storage
- Images are stored as **base64** in localStorage
- **Quota management**: Auto-cleanup when storage is low
- **Format support**: PNG, JPEG, GIF, WebP
- **Max size**: ~5MB per image (browser limit)

### Privacy & Security
- ✅ **100% Local**: All data stays in your browser
- ✅ **No Server**: No cloud, no telemetry, no tracking
- ✅ **No Analytics**: Zero external requests except MITRE data
- ✅ **Open Source**: Full code transparency

---

## 📤 Export Options

### Formats

| Format | Best For | Features |
|--------|----------|----------|
| **JSON** | Backup, reimport, automation | Complete data with base64 images |
| **PDF** | Formal reports, printing | Formatted sections, tables, styling |
| **Word (.docx)** | Editable reports | Full document ready for modification |

### Export Filename Format
```
{AnalystName}_{Date}_{FileName}_{SHA256-8chars}.{ReportType}.{ext}

Examples:
- HaTN_20260124_malware.exe_a1b2c3d4.MRE.pdf
- HaTN_20260124_sample.dll_5e6f7g8h.MIA.json
- HaTN_20260124_unknown_no-hash.MRE.docx
```

### Post-Export Options
After export, you can choose to:
- ✅ Keep data and continue working
- 🗑️ Clear all data for a new case (optional)

### Import
- **Drag & drop** JSON file onto dashboard
- Or click **Import JSON** button
- Supports both MIA and MRE data formats
- **Backward compatible** with older export versions

---

## 📜 Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (port 8080) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |
| `npm run test:coverage` | Run tests with coverage report |

### Bundle Analysis

```bash
# Build and generate stats.html
npm run build

# Open treemap visualization
open dist/stats.html

# Generate size report
node scripts/bundle-size-report.js
```

### CI/CD Integration

The bundle size script outputs `dist/bundle-metrics.json`:
```json
{
  "timestamp": "2026-01-19T12:00:00.000Z",
  "totalJS": 450000,
  "totalJSGzip": 150000,
  "totalJSBrotli": 120000,
  "jsChunks": 35,
  "warnings": 0,
  "withinBudget": true
}
```

---

## 🔧 Tech Stack

### Core

| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev/) | 19.x | UI Framework |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type Safety |
| [Vite](https://vitejs.dev/) | 7.x | Build Tool & Dev Server |
| [React Router](https://reactrouter.com/) | 7.x | Client-side Routing |

### UI & Styling

| Technology | Purpose |
|------------|---------|
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first Styling |
| [Shadcn/ui](https://ui.shadcn.com/) | Component Library |
| [Radix UI](https://www.radix-ui.com/) | Accessible Primitives |
| [Lucide React](https://lucide.dev/) | Icons |
| [Sonner](https://sonner.emilkowal.ski/) | Toast Notifications |

### Data & State

| Technology | Purpose |
|------------|---------|
| [TanStack Query](https://tanstack.com/query) | Server State Management |
| [TanStack Virtual](https://tanstack.com/virtual) | Virtual Scrolling |
| [Zod](https://zod.dev/) | Schema Validation |

### Export & Documents

| Technology | Purpose |
|------------|---------|
| [jsPDF](https://github.com/parallax/jsPDF) | PDF Generation |
| [docx](https://docx.js.org/) | Word Document Generation |

### Build & Optimization

| Technology | Purpose |
|------------|---------|
| [vite-plugin-compression](https://github.com/vbenjs/vite-plugin-compression) | Gzip/Brotli Compression |
| [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer) | Bundle Analysis |

---

## 📁 Project Structure / Cấu trúc dự án

```
malware-analyst-dashboard/
├── 📁 public/                       # Static assets / Tài nguyên tĩnh
│   ├── fonts/                       # Roboto fonts for PDF export
│   └── sample-mia-data.json         # Sample MIA data for testing
│
├── 📁 scripts/                      # Build scripts / Scripts build
│   └── bundle-size-report.js        # Bundle analysis for CI/CD
│
├── 📁 src/                          # Source code / Mã nguồn
│   │
│   ├── 📁 components/               # React components / Các component
│   │   ├── ui/                      # Shadcn UI base components
│   │   │   ├── button.tsx           # Button variants
│   │   │   ├── portal-dropdown.tsx  # Custom accessible dropdown
│   │   │   ├── dialog.tsx           # Modal dialogs
│   │   │   └── ...                  # Other UI primitives
│   │   │
│   │   ├── code-analysis/           # MRE: Code analysis components
│   │   │   ├── StaticCodeAnalysis.tsx
│   │   │   ├── DynamicCodeAnalysis.tsx
│   │   │   └── CryptographyAnalysis.tsx
│   │   │
│   │   ├── runtime-behavior/        # MRE: Runtime behavior components
│   │   │   ├── AntiAnalysisGroup.tsx
│   │   │   ├── ExecutionBehaviorGroup.tsx
│   │   │   └── TechnicalRuntimeGroup.tsx
│   │   │
│   │   ├── dashboard/               # Shared dashboard components
│   │   ├── lazy/                    # Lazy-loaded wrappers (performance)
│   │   │
│   │   ├── Header.tsx               # Navigation header with theme/language
│   │   ├── FormField.tsx            # Form input with image paste support
│   │   ├── CollapsibleSection.tsx   # Expandable sections
│   │   ├── IOCTable.tsx             # IOC table with virtual scrolling
│   │   ├── MitreAttackMapping.tsx   # MITRE ATT&CK interactive mapping
│   │   ├── MBCMapping.tsx           # MBC behavior catalog mapping
│   │   ├── TimelineTable.tsx        # Attack timeline with drag-reorder
│   │   ├── SecurityPosture.tsx      # PE hardening analysis
│   │   └── ...                      # Other feature components
│   │
│   ├── 📁 contexts/                 # React contexts / Ngữ cảnh React
│   │   ├── LanguageContext.tsx      # i18n: English/Vietnamese
│   │   ├── ThemeContext.tsx         # Dark/Light theme switching
│   │   └── UserContext.tsx          # User profile (name, GitHub)
│   │
│   ├── 📁 hooks/                    # Custom React hooks
│   │   ├── useDashboardData.ts      # Dashboard state with auto-save
│   │   ├── useDashboardExport.ts    # Export dialog management
│   │   ├── useImportJSON.ts         # JSON import with validation
│   │   ├── useDragReorder.ts        # Drag-and-drop reordering
│   │   ├── useMBCData.ts            # Lazy-load MBC data
│   │   ├── useToolsData.ts          # Lazy-load FLARE-VM tools
│   │   ├── useTypingAnimation.ts    # Typing effect animation
│   │   ├── useSEO.ts                # SEO meta tags
│   │   └── useArtifactFileDrop.ts   # File drop handling
│   │
│   ├── 📁 lib/                      # Utilities & data / Tiện ích & dữ liệu
│   │   ├── export/                  # Export generators
│   │   │   ├── pdf-mia.ts           # MIA PDF report
│   │   │   ├── pdf-mre.ts           # MRE PDF report
│   │   │   ├── word-mia.ts          # MIA Word document
│   │   │   ├── word-mre.ts          # MRE Word document
│   │   │   ├── json.ts              # JSON export/import
│   │   │   ├── fontLoader.ts        # Font loading for PDF
│   │   │   └── helpers.ts           # Shared export utilities
│   │   │
│   │   ├── mbc/                     # MBC data processing
│   │   ├── translations/            # i18n translations
│   │   │   ├── en.ts                # English translations
│   │   │   ├── vn.ts                # Vietnamese translations
│   │   │   └── index.ts             # Translation exports
│   │   │
│   │   ├── imageStorage.ts          # Image storage management
│   │   ├── imageUtils.ts            # Paste/select handlers
│   │   ├── mitreUtils.ts            # MITRE ATT&CK utilities
│   │   ├── mbcData.ts               # MBC static data (~50KB)
│   │   ├── toolsData.ts             # FLARE-VM tools (~20KB)
│   │   ├── storageKeys.ts           # Centralized localStorage keys
│   │   ├── semanticColors.ts        # Color utilities
│   │   ├── validationSchemas.ts     # Zod validation schemas
│   │   ├── lazyExport.ts            # Lazy export loaders
│   │   ├── activityUtils.ts         # Activity tracking
│   │   ├── fileNameUtils.ts         # Export filename generation
│   │   └── utils.ts                 # General utilities (cn, generateId)
│   │
│   ├── 📁 pages/                    # Route pages / Các trang
│   │   ├── Index.tsx                # Home page with typing animation
│   │   ├── MIADashboard.tsx         # Incident Analysis dashboard
│   │   ├── MREDashboard.tsx         # Reverse Engineering dashboard
│   │   ├── Tools.tsx                # FLARE-VM tools reference
│   │   ├── Settings.tsx             # User settings page
│   │   └── NotFound.tsx             # 404 error page
│   │
│   ├── 📁 types/                    # TypeScript types / Kiểu dữ liệu
│   │   └── dashboard.ts             # Shared interfaces (IOC, Timeline, etc.)
│   │
│   ├── 📁 test/                     # Test utilities
│   │   └── setup.ts                 # Vitest setup
│   │
│   ├── App.tsx                      # Main app with routes
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Design tokens & global styles
│
├── 📄 index.html                    # HTML template
├── 📄 tailwind.config.ts            # Tailwind CSS configuration
├── 📄 vite.config.ts                # Vite build configuration
├── 📄 vitest.config.ts              # Test configuration
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 eslint.config.js              # ESLint rules
└── 📄 package.json                  # Dependencies & scripts
```

### Key Directories Explained / Giải thích các thư mục chính

| Directory | Purpose (EN) | Mục đích (VN) |
|-----------|--------------|---------------|
| `src/components/` | Reusable UI components | Component UI tái sử dụng |
| `src/components/ui/` | Base UI primitives (buttons, inputs) | Component UI cơ bản |
| `src/components/code-analysis/` | MRE code analysis features | Tính năng phân tích mã |
| `src/components/runtime-behavior/` | MRE runtime behavior analysis | Phân tích hành vi runtime |
| `src/contexts/` | Global state (theme, language, user) | State toàn cục |
| `src/hooks/` | Custom React hooks for logic reuse | Hook React tùy chỉnh |
| `src/lib/` | Utilities, data, and helpers | Tiện ích và dữ liệu |
| `src/lib/export/` | PDF, Word, JSON export generators | Tạo báo cáo xuất |
| `src/lib/translations/` | EN/VN translations | Bản dịch EN/VN |
| `src/pages/` | Route page components | Component trang |
| `src/types/` | TypeScript type definitions | Định nghĩa kiểu TS |
| `public/` | Static assets served directly | Tài nguyên tĩnh |
| `scripts/` | Build and analysis scripts | Scripts build |

---

## 🔧 Troubleshooting / Xử lý lỗi

### Common Issues

#### Port Already in Use
```bash
# Kill process on port
npx kill-port 8080

# Or use different port
npm run dev -- --port 3000
```

#### Dependencies Installation Failed
```bash
# Clean install
rm -rf node_modules package-lock.json bun.lock
npm install
```

#### Data Not Saving
1. ✅ Check localStorage is enabled in browser
2. ✅ Check not in private/incognito mode
3. ✅ Check storage quota: DevTools → Application → Storage
4. ✅ Try clearing old data: `localStorage.clear()`

#### MITRE ATT&CK Not Loading
1. Check internet connection (fetches from GitHub)
2. Clear cache: `localStorage.removeItem('mitre-attack-cache')`
3. Refresh page
4. Check console for CORS/network errors

#### PWA Not Updating
1. DevTools → Application → Service Workers
2. Click "Update" or "Unregister"
3. Clear site data: Application → Storage → Clear site data
4. Hard refresh: `Ctrl+Shift+R`

#### Export Not Working
1. Check browser allows downloads
2. For large exports, wait for processing
3. Check console for errors
4. Try JSON export first (simpler)

#### Images Not Pasting
1. Copy image to clipboard (not file)
2. Click inside textarea first
3. Press `Ctrl+V` / `Cmd+V`
4. Check console for errors

---

## 🎨 Design System

### Color Tokens
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | White | Dark navy | Page background |
| `--foreground` | Dark gray | Light gray | Text color |
| `--primary` | Green | Neon green | Primary actions |
| `--accent` | Cyan | Cyan | Secondary highlights |
| `--destructive` | Red | Red | Delete/errors |
| `--muted` | Light gray | Dark gray | Disabled states |

### Typography
| Font | Usage |
|------|-------|
| JetBrains Mono | Code, terminal text, forms |
| Share Tech Mono | Display headings, hero text |
| Inter | Body text (exports) |

### Effects
- ✨ Glow shadows on primary elements
- 📺 Subtle scanline overlay (cyber aesthetic)
- 🔲 Grid pattern backgrounds
- 🌊 Smooth 200ms transitions

---

## 🤝 Contributing

### Getting Started

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/malware-analyst-dashboard.git
cd malware-analyst-dashboard

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/amazing-feature

# Start development
npm run dev
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Components**: Functional with hooks
- **Styling**: Tailwind CSS with design tokens
- **State**: React hooks + Context API
- **Testing**: Vitest + React Testing Library

### Pull Request Process

1. Update README if needed
2. Run `npm run lint` and fix issues
3. Run `npm run test` and ensure passing
4. Run `npm run build` to verify production build
5. Check bundle size with `node scripts/bundle-size-report.js`
6. Create PR with clear description

### Commit Messages

Follow conventional commits:
```
feat: add new IOC type support
fix: resolve dropdown keyboard navigation
docs: update README installation steps
perf: optimize bundle size by removing unused deps
refactor: extract reusable form components
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 👤 Author

**MWE HaTN**
- Focus: Malware Analysis · DFIR · Reverse Engineering
- GitHub: [@mwehatn](https://github.com/mwehatn)
- LinkedIn: [ha-tran-mwesioe](https://www.linkedin.com/in/ha-tran-mwesioe)

---

## 🙏 Acknowledgments

- [MITRE ATT&CK](https://attack.mitre.org/) - Threat framework
- [MBC (Malware Behavior Catalog)](https://github.com/MBCProject/mbc-markdown) - Behavior mapping
- [FLARE-VM](https://github.com/mandiant/flare-vm) - Analysis tools reference
- [Shadcn/ui](https://ui.shadcn.com/) - Component library

---

<div align="center">

*"Take your time" - Built for the cybersecurity community* 💚

**[Report Bug](https://github.com/mwehatn/malware-analyst-dashboard/issues)** · **[Request Feature](https://github.com/mwehatn/malware-analyst-dashboard/issues)**

</div>
