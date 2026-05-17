/**
 * Shared utilities for dashboard export functionality.
 */

/** Normalize an unknown error into a user-readable string. */
export function formatExportError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Check if an object has any meaningful data beyond metadata fields.
 * Used to filter out empty entries before export.
 */
export function hasData<T extends object>(
  obj: T,
  excludeKeys = ["id", "timestamp", "images"]
): boolean {
  return Object.entries(obj).some(([key, value]) => {
    if (excludeKeys.includes(key)) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) return Object.keys(value).length > 0;
    return Boolean(value);
  });
}
