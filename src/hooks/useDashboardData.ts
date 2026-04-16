import { useState, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { useUser } from "@/hooks/useUser";
import { clearAllSectionStates } from "@/lib/sectionState";
import { dbGet, dbSet, dbDelete } from "@/lib/db";
import { debugError } from "@/lib/debugLogger";
import { toast } from "sonner";

interface UseDashboardDataOptions<T> {
  storageKey: string;
  initialData: T;
  migrateData: (saved: unknown) => T;
  onClearExtra?: () => void;
  clearSuccessMessage?: string;
}

interface UseDashboardDataReturn<T> {
  data: T;
  setData: Dispatch<SetStateAction<T>>;
  clearData: () => void;
  forceCloseCounter: number;
  profileName: string;
}

// Debounce delay for IndexedDB saves (ms)
const SAVE_DEBOUNCE = 500;

export function useDashboardData<T extends { background: { analyst: string; date: string } }>(
  options: UseDashboardDataOptions<T>
): UseDashboardDataReturn<T> {
  const { profile } = useUser();
  const [forceCloseCounter, setForceCloseCounter] = useState(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start with initialData — IDB load happens async in useEffect below
  const [data, setData] = useState<T>(options.initialData);

  // Tracks whether the initial IDB load has completed — prevents saving empty state over real data
  const isLoadedRef = useRef(false);

  // Mirror of current data for use in cleanup function (avoids stale closure)
  const dataRef = useRef<T>(options.initialData);
  useEffect(() => {
    dataRef.current = data;
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
          loaded = options.migrateData(loaded);
        }

        if (!cancelled && loaded != null) {
          const loadedData = loaded as T;
          // Auto-populate analyst field from profile if empty
          if (!loadedData.background.analyst && profile.name) {
            setData({ ...loadedData, background: { ...loadedData.background, analyst: profile.name } });
          } else {
            setData(loadedData);
          }
        }
      } catch (e) {
        debugError("useDashboardData: failed to load from IDB", e);
      } finally {
        if (!cancelled) {
          isLoadedRef.current = true;
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
      dbSet("dashboard", options.storageKey, data).catch((e) =>
        debugError("useDashboardData: failed to save to IDB", e)
      );
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

  return {
    data,
    setData,
    clearData,
    forceCloseCounter,
    profileName: profile.name,
  };
}
