import { STORAGE_KEYS } from "@/lib/storageKeys";

// Clear all section states (reset to first visit behavior)
// IMPORTANT: Does NOT clear MITRE cache - that persists across data clears
export function clearAllSectionStates() {
  localStorage.removeItem(STORAGE_KEYS.SECTION_STATES);
  localStorage.removeItem(STORAGE_KEYS.FIRST_VISIT);
}
