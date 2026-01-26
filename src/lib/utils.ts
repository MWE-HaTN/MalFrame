import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique ID using crypto.randomUUID with fallback
 */
export function generateId(prefix?: string): string {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Format bytes to human readable string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const BYTES_PER_UNIT = 1024;
  const SIZE_UNITS = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT));
  const sizeInUnit = bytes / Math.pow(BYTES_PER_UNIT, unitIndex);
  
  return parseFloat(sizeInUnit.toFixed(2)) + " " + SIZE_UNITS[unitIndex];
}

/**
 * Parse size string (e.g., "1.5 MB") back to bytes
 */
export function parseSizeToBytes(sizeStr: string): number {
  if (!sizeStr || sizeStr === "—") return 0;
  const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = (match[2] || "B").toUpperCase();
  const multipliers: Record<string, number> = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  return value * (multipliers[unit] || 1);
}

/**
 * Truncate a string with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Copy text to clipboard with optional toast notification
 */
export function copyToClipboard(text: string, label?: string): Promise<void> {
  return navigator.clipboard.writeText(text).then(() => {
    if (label) {
      toast.success(`${label} copied`);
    }
  });
}

/**
 * Format current date/time for report headers
 * Returns { date: "YYYY-MM-DD", time: "HH:MM", headerText: "YYYY-MM-DD HH:MM · AnalystName" }
 */
export function formatReportHeader(analyst: string): { date: string; time: string; headerText: string } {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  const sanitizedAnalyst = (analyst || "Analyst").replace(/\s+/g, "-");
  return { date, time, headerText: `${date} ${time} · ${sanitizedAnalyst}` };
}
