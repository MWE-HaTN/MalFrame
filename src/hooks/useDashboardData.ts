import { useState, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { useUser } from "@/hooks/useUser";
import { clearAllSectionStates } from "@/lib/sectionState";
import { dbGet, dbSet, dbDelete, isUsingLocalStorage } from "@/lib/db";
import { debugError } from "@/lib/debugLogger";
import { getLastExportTime } from "@/lib/export/helpers";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { translations, type Language } from "@/lib/translations";
import { toast } from "sonner";

interface UseDashboardDataOptions<T> {
  storageKey: string;
  initialData: T;
  migrateData: (saved: unknown) => T;
  onClearExtra?: () => void;
  clearSuccessMessage?: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

interface UseDashboardDataReturn<T> {
  data: T;
  setData: Dispatch<SetStateAction<T>>;
  clearData: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  forceCloseCounter: number;
  profileName: string;
  saveStatus: SaveStatus;
}

// Undo/redo history size
const MAX_HISTORY = 20;

// Debounce delay for IndexedDB saves (ms)
const SAVE_DEBOUNCE = 500;

// Export reminder threshold (7 days in ms)
const EXPORT_REMINDER_DAYS = 7;
const EXPORT_REMINDER_MS = EXPORT_REMINDER_DAYS * 24 * 60 * 60 * 1000;

/** Check if export reminder should be shown and show it */
function checkExportReminder(storageKey: string): void {
  try {
    const lastExport = getLastExportTime(storageKey);
    if (lastExport === 0) return; // Never exported — don't nag on first use
    const elapsed = Date.now() - lastExport;
    if (elapsed < EXPORT_REMINDER_MS) return;

    const days = Math.floor(elapsed / (24 * 60 * 60 * 1000));
    const lang = (localStorage.getItem(STORAGE_KEYS.LANGUAGE) || "en") as Language;
    const t = translations[lang] || translations.en;
    const template = t["export.reminder"] || "Data hasn't been exported in {days} days. Consider backing up.";
    toast.warning(template.replace("{days}", String(days)));
  } catch {
    // Ignore errors
  }
}

export function useDashboardData<T extends { background: { analyst: string; date: string } }>(
  options: UseDashboardDataOptions<T>
): UseDashboardDataReturn<T> {
  const { profile } = useUser();
  const [forceCloseCounter, setForceCloseCounter] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start with initialData — IDB load happens async in useEffect below
  const [data, setData] = useState<T>(options.initialData);

  // Tracks whether the initial IDB load has completed — prevents saving empty state over real data
  const isLoadedRef = useRef(false);

  // Undo/redo: history stores all visited states, index points to current
  const historyRef = useRef<T[]>([options.initialData]);
  const historyIndexRef = useRef(0);
  const isUndoRedoRef = useRef(false);
  const [_historyVersion, setHistoryVersion] = useState(0);

  // Mirror of current data for use in cleanup function (avoids stale closure)
  const dataRef = useRef<T>(options.initialData);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Track data changes for undo/redo history
  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const history = historyRef.current;
    const idx = historyIndexRef.current;

    // User edit: truncate redo states, push current state, advance index
    const truncated = history.slice(0, idx + 1);
    truncated.push(data);
    if (truncated.length > MAX_HISTORY) {
      truncated.splice(0, truncated.length - MAX_HISTORY);
    }
    historyRef.current = truncated;
    historyIndexRef.current = truncated.length - 1;
    setHistoryVersion((v) => v + 1);
  }, [data]);

  // Capture storageKey at mount — stable within component lifetime (parent uses key prop for case switching)
  const storageKeyRef = useRef(options.storageKey);

  // Load from IndexedDB on mount, with fallback migration from localStorage
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let loaded = await dbGet<unknown>("dashboard", options.storageKey);

        if (loaded == null) {
          // Migrate from localStorage if this is the first time using IDB
          const lsRaw = localStorage.getItem(options.storageKey);
          if (lsRaw) {
            try {
              const parsed = JSON.parse(lsRaw) as unknown;
              loaded = options.migrateData(parsed);
              await dbSet("dashboard", options.storageKey, loaded);
              localStorage.removeItem(options.storageKey);
            } catch {
              // Corrupted localStorage data — ignore, use initialData
            }
          }
        } else {
          try {
            loaded = options.migrateData(loaded);
          } catch (e) {
            debugError("useDashboardData: migration failed, using initial data", e);
            toast.warning("Data migration failed. Starting with a fresh template.");
            loaded = null;
          }
        }

        if (!cancelled && loaded != null) {
          const loadedData = loaded as T;

          // Basic structural validation — ensure background exists
          if (!loadedData.background || typeof loadedData.background !== "object") {
            debugError("useDashboardData: invalid data structure, missing background");
            toast.warning("Saved data appears corrupted. Starting with a fresh template.");
            setData(options.initialData);
            return;
          }
          // Auto-populate analyst field from profile if empty
          if (!loadedData.background.analyst && profile.name) {
            setData({ ...loadedData, background: { ...loadedData.background, analyst: profile.name } });
          } else {
            setData(loadedData);
          }
          // Reset history with loaded state
          historyRef.current = [loadedData];
          historyIndexRef.current = 0;
        }
      } catch (e) {
        debugError("useDashboardData: failed to load from IDB", e);
        toast.error("Failed to load saved data. Starting with a fresh template.");
      } finally {
        if (!cancelled) {
          isLoadedRef.current = true;
          if (isUsingLocalStorage()) {
            toast.warning("Running in limited storage mode. Data may not persist across sessions.");
          }
          // Check export reminder
          checkExportReminder(options.storageKey);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount — storageKey is stable per component instance (key prop controls remount)


  // Debounced persist to IndexedDB — skips until initial load is done
  useEffect(() => {
    if (!isLoadedRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saving");
      dbSet("dashboard", options.storageKey, data)
        .then(() => setSaveStatus("saved"))
        .catch((e) => {
          debugError("useDashboardData: failed to save to IDB", e);
          setSaveStatus("failed");
          toast.error("Failed to save data. Your changes may not persist.");
        });
    }, SAVE_DEBOUNCE);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, options.storageKey]);

  // Flush pending save immediately on unmount (e.g., when user switches cases)
  useEffect(() => {
    // Capture refs at effect time so cleanup sees stable values
    const storageKey = storageKeyRef.current;
    const saveTimeout = saveTimeoutRef;
    const isLoaded = isLoadedRef;
    const dataSnap = dataRef;
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      if (isLoaded.current) {
        dbSet("dashboard", storageKey, dataSnap.current).catch(() => {});
      }
    };
  }, []); // Mount only — uses refs to avoid stale closures

  const clearData = useCallback(() => {
    const resetData: T = {
      ...options.initialData,
      background: {
        ...options.initialData.background,
        analyst: profile.name,
        date: new Date().toISOString().split("T")[0],
      },
    };

    setData(resetData);
    dbDelete("dashboard", options.storageKey).catch((e) =>
      debugError("useDashboardData: failed to delete from IDB", e)
    );
    clearAllSectionStates();
    setForceCloseCounter((counter) => counter + 1);
    options.onClearExtra?.();
    toast.success(options.clearSuccessMessage || "Data cleared!");
  }, [options, profile.name]);

  const undo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx <= 0) return;
    const prev = historyRef.current[idx - 1];
    historyIndexRef.current = idx - 1;
    isUndoRedoRef.current = true;
    setData(prev);
    setHistoryVersion((v) => v + 1);
  }, [setData]);

  const redo = useCallback(() => {
    const idx = historyIndexRef.current;
    const history = historyRef.current;
    if (idx >= history.length - 1) return;
    const next = history[idx + 1];
    historyIndexRef.current = idx + 1;
    isUndoRedoRef.current = true;
    setData(next);
    setHistoryVersion((v) => v + 1);
  }, [setData]);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  return {
    data,
    setData,
    clearData,
    undo,
    redo,
    canUndo,
    canRedo,
    forceCloseCounter,
    profileName: profile.name,
    saveStatus,
  };
}
