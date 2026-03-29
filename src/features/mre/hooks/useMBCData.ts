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

  useEffect(() => {
    if (!mbcDataCache) {
      loadMBCData().then(loaded => {
        setData(loaded);
        setIsLoading(false);
      });
    }
  }, []);

  return { mbcData: data, isLoading };
}

/**
 * Get cached MBC data synchronously (returns null if not loaded yet).
 */
export function getCachedMBCData(): MBCData | null {
  return mbcDataCache;
}
