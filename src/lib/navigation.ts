import { STORAGE_KEYS } from "@/lib/storageKeys";

export function getSavedDashboard(): string {
  return localStorage.getItem(STORAGE_KEYS.LAST_DASHBOARD) || "/mia";
}
