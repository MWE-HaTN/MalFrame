// Export Helper Functions
import type { LogEntry, UnpackLayer } from "@/types/dashboard";

// ============================================
// SEMANTIC COLORS - Shared across PDF/Word exports
// ============================================
export const SEMANTIC_COLORS_RGB = {
  NEUTRAL: [55, 65, 81] as [number, number, number],   // #374151 gray
  GOOD: [21, 128, 61] as [number, number, number],     // #15803D green
  SUSPICIOUS: [217, 119, 6] as [number, number, number], // #D97706 amber
  HIGH_RISK: [185, 28, 28] as [number, number, number], // #B91C1C red
};

export const SEMANTIC_COLORS_HEX = {
  NEUTRAL: "374151",   // gray
  GOOD: "15803D",      // green
  SUSPICIOUS: "D97706", // amber
  HIGH_RISK: "B91C1C", // red
};

// ============================================
// SEMANTIC COLOR HELPERS
// ============================================

/** Check if a label relates to anti-analysis fields (internal use) */
function isAntiAnalysisField(label: string): boolean {
  const normalized = label.toLowerCase();
  return normalized.includes("anti") || 
         normalized.includes("debug") || 
         normalized.includes("vm") ||
         normalized.includes("sandbox") ||
         normalized.includes("evasion");
}

/** Check if value indicates presence (not empty/none) */
function hasValue(value: string): boolean {
  const trimmed = (value || "").trim().toLowerCase();
  return trimmed !== "" && trimmed !== "-" && trimmed !== "none" && trimmed !== "no";
}

/** Get color for Packed field value */
export function getPackedSemanticLevel(value: string): "HIGH_RISK" | "GOOD" | null {
  const normalized = value.trim().toUpperCase();
  if (normalized === "YES" || normalized === "TRUE" || normalized === "PACKED") {
    return "HIGH_RISK";
  }
  if (normalized === "NO" || normalized === "FALSE" || normalized === "NOT PACKED") {
    return "GOOD";
  }
  return null;
}

/** Get color for Packer name field */
export function getPackerSemanticLevel(value: string): "SUSPICIOUS" | null {
  return hasValue(value) ? "SUSPICIOUS" : null;
}

/** Get color for RWX permissions */
export function getRWXSemanticLevel(permissions: string): "HIGH_RISK" | "SUSPICIOUS" | "GOOD" | null {
  const normalized = permissions.trim().toUpperCase();
  if (normalized.includes("RWX") || (normalized.includes("R") && normalized.includes("W") && normalized.includes("X"))) {
    return "HIGH_RISK";
  }
  if (normalized.includes("RW") || (normalized.includes("R") && normalized.includes("W"))) {
    return "SUSPICIOUS";
  }
  if (normalized.includes("R") && normalized.includes("X")) {
    return "GOOD";
  }
  return null;
}

/** Get color for entropy values */
export function getEntropySemanticLevel(entropy: string): "HIGH_RISK" | "SUSPICIOUS" | "NEUTRAL" | null {
  const value = parseFloat(entropy);
  if (isNaN(value)) return null;
  if (value > 7.2) return "HIGH_RISK";
  if (value >= 6.5) return "SUSPICIOUS";
  return "NEUTRAL";
}

/** Get semantic level for a field based on label and value */
export function getFieldSemanticLevel(label: string, value: string): keyof typeof SEMANTIC_COLORS_RGB | null {
  const normalizedLabel = label.toLowerCase();
  
  if (normalizedLabel.includes("packed") && !normalizedLabel.includes("packer")) {
    return getPackedSemanticLevel(value);
  }
  if (normalizedLabel.includes("packer")) {
    return getPackerSemanticLevel(value);
  }
  if (isAntiAnalysisField(label) && hasValue(value)) {
    return "SUSPICIOUS";
  }
  return null;
}

// ============================================
// TEXT EXTRACTION HELPERS
// ============================================

/**
 * Convert LogEntry array, string or unknown value to plain string
 * Used for PDF/Word export and data migration/normalization
 * @param value - LogEntry[], string, or unknown value
 * @param separator - Join separator (default: "\n\n" for export, use "\n" for migration)
 */
export function extractLogText(value: LogEntry[] | string | unknown, separator = "\n\n"): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((e: { text?: string }) => e.text || "").filter(Boolean).join(separator);
  }
  return "";
}


/**
 * Convert array/string to LogEntry array (for data migration)
 */
export function toLogEntries(value: unknown): LogEntry[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return [{ id, text: value, images: [], timestamp: new Date().toISOString() }];
  }
  return [];
}

export function extractUnpackLayers(layers: UnpackLayer[] | undefined): string {
  if (!layers || layers.length === 0) return "";
  return layers.map(layer => {
    const details = [];
    if (layer.packerType) details.push(`Packer: ${layer.packerType}`);
    if (layer.unpackingMethod) details.push(`Method: ${layer.unpackingMethod}`);
    if (layer.oep) details.push(`OEP: ${layer.oep}`);
    if (layer.tools) details.push(`Tools: ${layer.tools}`);
    if (layer.cleanedHash) details.push(`Hash: ${layer.cleanedHash}`);
    return `[Layer ${layer.layerNumber}] ${details.join(" | ")}`;
  }).join("\n");
}

// ============================================
// LABEL FORMATTING HELPERS
// ============================================

/** Format camelCase key to readable label */
export function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Format label with colon and non-breaking space (for PDF) */
export function formatLabelWithColon(label: string): string {
  const trimmed = (label ?? "").trim();
  if (!trimmed) return "";
  const base = trimmed.endsWith(":") ? trimmed.slice(0, -1) : trimmed;
  return `${base}\u00A0:`;
}


// ============================================
// DATA FORMAT HELPERS
// ============================================

/** Format signature status to readable text */
export function formatSignatureStatus(status: string | undefined): string {
  if (!status) return "";
  const statusMap: Record<string, string> = {
    signed_valid: "Signed (Valid)",
    unsigned: "Unsigned",
    unknown: "Unknown",
    not_applicable: "Not Applicable",
  };
  return statusMap[status] || status;
}

/** Format DLL mitigations array to readable text */
export function formatDllMitigations(mitigations: string[] | undefined): string {
  if (!mitigations || !Array.isArray(mitigations) || mitigations.length === 0) {
    return "None";
  }
  return mitigations.join(", ");
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Check if all values in an object are empty */
export function isAllEmpty(obj: Record<string, unknown>): boolean {
  return Object.values(obj).every(value => !value || (typeof value === "string" && !value.trim()));
}

// ============================================
// SHARED VALUE HELPERS
// ============================================

/** Check if value is meaningful (not empty, not "-", not "none", not "n/a") */
export function isMeaningful(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const str = String(value).trim().toLowerCase();
  return str !== '' && str !== '-' && str !== 'none' && str !== 'n/a';
}

/** Check if any fields in array have meaningful data */
export function hasAnyMeaningfulValue(fields: Array<{ label: string; value: string }>): boolean {
  return fields.some(f => isMeaningful(f.value));
}

/** Check if entry has content in specified keys (supports arrays) */
export function hasContentInKeys(entry: object, keys: string[]): boolean {
  const rec = entry as Record<string, unknown>;
  return keys.some(key => {
    const val = rec[key];
    if (Array.isArray(val)) return val.length > 0 && val.some((v: unknown) => typeof v === 'string' && v.trim());
    return typeof val === 'string' && Boolean(val.trim());
  });
}

/** Native browser file download */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
