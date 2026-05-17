/**
 * Async Export Wrappers (with module preloading + caching)
 *
 * These functions lazy-load the heavy export utilities only when actually needed.
 * This reduces the bundle size of dashboard pages by deferring jsPDF, docx, file-saver loading.
 *
 * IMPORTANT: Import directly from specific modules (not barrel exports) for optimal tree-shaking.
 */

import type { ReportType } from "@/lib/fileNameUtils";

// Export data shape varies by caller (MIA vs MRE) and migration state.
// The actual export functions handle both formats internally.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExportData = any;

// ---- Module caches (so exports can run synchronously once preloaded) ----

type JSONModule = typeof import("@/lib/export/json");
let jsonModule: JSONModule | null = null;
let jsonModulePromise: Promise<JSONModule> | null = null;
const loadJSONModule = () => {
  if (jsonModule) return Promise.resolve(jsonModule);
  if (!jsonModulePromise) {
    jsonModulePromise = import("@/lib/export/json").then((m) => (jsonModule = m, m)).catch((err) => { jsonModulePromise = null; throw err; });
  }
  return jsonModulePromise;
};

type DFIRPDFModule = typeof import("@/lib/export/pdf-mia");
let dfirPdfModule: DFIRPDFModule | null = null;
let dfirPdfModulePromise: Promise<DFIRPDFModule> | null = null;
const loadDFIRPDFModule = () => {
  if (dfirPdfModule) return Promise.resolve(dfirPdfModule);
  if (!dfirPdfModulePromise) {
    dfirPdfModulePromise = import("@/lib/export/pdf-mia").then((m) => (dfirPdfModule = m, m)).catch((err) => { dfirPdfModulePromise = null; throw err; });
  }
  return dfirPdfModulePromise;
};

type DFIRWordModule = typeof import("@/lib/export/word-mia");
let dfirWordModule: DFIRWordModule | null = null;
let dfirWordModulePromise: Promise<DFIRWordModule> | null = null;
const loadDFIRWordModule = () => {
  if (dfirWordModule) return Promise.resolve(dfirWordModule);
  if (!dfirWordModulePromise) {
    dfirWordModulePromise = import("@/lib/export/word-mia").then((m) => (dfirWordModule = m, m)).catch((err) => { dfirWordModulePromise = null; throw err; });
  }
  return dfirWordModulePromise;
};

type REPDFModule = typeof import("@/lib/export/pdf-mre");
let rePdfModule: REPDFModule | null = null;
let rePdfModulePromise: Promise<REPDFModule> | null = null;
const loadREPDFModule = () => {
  if (rePdfModule) return Promise.resolve(rePdfModule);
  if (!rePdfModulePromise) {
    rePdfModulePromise = import("@/lib/export/pdf-mre").then((m) => (rePdfModule = m, m)).catch((err) => { rePdfModulePromise = null; throw err; });
  }
  return rePdfModulePromise;
};

type REWordModule = typeof import("@/lib/export/word-mre");
let reWordModule: REWordModule | null = null;
let reWordModulePromise: Promise<REWordModule> | null = null;
const loadREWordModule = () => {
  if (reWordModule) return Promise.resolve(reWordModule);
  if (!reWordModulePromise) {
    reWordModulePromise = import("@/lib/export/word-mre").then((m) => (reWordModule = m, m)).catch((err) => { reWordModulePromise = null; throw err; });
  }
  return reWordModulePromise;
};

// ---- Optional preloading helpers (call before user clicks final Export) ----

export function preloadDFIRPDF(): void {
  void loadDFIRPDFModule().catch(() => undefined);
}

export function preloadDFIRWord(): void {
  void loadDFIRWordModule().catch(() => undefined);
}

export function preloadREPDF(): void {
  void loadREPDFModule().catch(() => undefined);
}

export function preloadREWord(): void {
  void loadREWordModule().catch(() => undefined);
}

/**
 * Lazy export to JSON - loads file-saver only when called
 */
export async function lazyExportJSON(
  data: ExportData,
  analyst: string,
  fileName: string,
  hash: string,
  reportType?: ReportType
): Promise<void> {
  if (jsonModule) {
    await jsonModule.exportJSON(data, analyst, fileName, hash, reportType);
    return;
  }

  const { exportJSON } = await loadJSONModule();
  await exportJSON(data, analyst, fileName, hash, reportType);
}

/**
 * Lazy export to PDF for MIA (DFIR) - loads jsPDF and fonts when called
 */
export async function lazyExportDFIRPDF(
  data: ExportData,
  analyst: string,
  fileName: string,
  hash: string
): Promise<void> {
  // Load fonts first (for Unicode support)
  const { loadFonts } = await import("@/lib/export/fontLoader");
  await loadFonts();

  if (dfirPdfModule) {
    await dfirPdfModule.exportDFIRPDF(data, analyst, fileName, hash);
    return;
  }

  const { exportDFIRPDF } = await loadDFIRPDFModule();
  await exportDFIRPDF(data, analyst, fileName, hash);
}

/**
 * Lazy export to Word for MIA (DFIR) - loads docx only when called
 */
export async function lazyExportDFIRWord(
  data: ExportData,
  analyst: string,
  fileName: string,
  hash: string
): Promise<void> {
  if (dfirWordModule) {
    await dfirWordModule.exportDFIRWord(data, analyst, fileName, hash);
    return;
  }

  const { exportDFIRWord } = await loadDFIRWordModule();
  await exportDFIRWord(data, analyst, fileName, hash);
}

/**
 * Lazy export to PDF for MRE - loads jsPDF and fonts when called
 */
export async function lazyExportREPDF(
  data: ExportData,
  analyst: string,
  fileName: string,
  hash: string
): Promise<void> {
  // Load fonts first (for Unicode support)
  const { loadFonts } = await import("@/lib/export/fontLoader");
  await loadFonts();
  
  if (rePdfModule) {
    await rePdfModule.exportREPDF(data, analyst, fileName, hash);
    return;
  }

  const { exportREPDF } = await loadREPDFModule();
  await exportREPDF(data, analyst, fileName, hash);
}

/**
 * Lazy export to Word for MRE - loads docx only when called
 */
export async function lazyExportREWord(
  data: ExportData,
  analyst: string,
  fileName: string,
  hash: string
): Promise<void> {
  if (reWordModule) {
    await reWordModule.exportREWord(data, analyst, fileName, hash);
    return;
  }

  const { exportREWord } = await loadREWordModule();
  await exportREWord(data, analyst, fileName, hash);
}
