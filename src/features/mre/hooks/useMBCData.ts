import { useState, useEffect } from "react";
import type { MBCData } from "@/lib/mbc/types";

let mbcDataCache: MBCData | null = null;
let loadingPromise: Promise<MBCData> | null = null;

/**
 * Dynamically loads MBC data only when needed.
 * This reduces initial bundle size by ~1400 lines (~50KB).
 */
export async function loadMBCData(): Promise<MBCData> {
  if (mbcDataCache) return mbcDataCache;
  
  if (!loadingPromise) {
    loadingPromise = import("@/lib/mbcData").then(module => {
      mbcDataCache = module.mbcData;
      return mbcDataCache;
    }).catch((err) => {
      loadingPromise = null;
      throw err;
    });
  }
  
  return loadingPromise;
}

/**
 * Hook to lazily load MBC data.
 * Returns null while loading, then the data once loaded.
 */
export function useMBCData() {
  const [data, setData] = useState<MBCData | null>(mbcDataCache);
  const [isLoading, setIsLoading] = useState(!mbcDataCache);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!mbcDataCache) {
      let cancelled = false;
      loadMBCData()
        .then(loaded => {
          if (cancelled) return;
          setData(loaded);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => { cancelled = true; };
    }
  }, []);

  return { mbcData: data, isLoading, error };
}
