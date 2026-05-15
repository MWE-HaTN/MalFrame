import { useState, useEffect } from "react";
import type { ToolCategory } from "@/lib/toolsData";

let toolsDataCache: { data: ToolCategory[]; version: string } | null = null;
let loadingPromise: Promise<{ data: ToolCategory[]; version: string }> | null = null;

/**
 * Dynamically loads Tools data only when needed.
 * This reduces initial bundle size by ~20KB.
 */
export async function loadToolsData(): Promise<{ data: ToolCategory[]; version: string }> {
  if (toolsDataCache) return toolsDataCache;
  
  if (!loadingPromise) {
    loadingPromise = import("@/lib/toolsData").then(module => {
      toolsDataCache = {
        data: module.defaultToolsData,
        version: module.TOOLS_DATA_VERSION
      };
      return toolsDataCache;
    });
  }
  
  return loadingPromise;
}

/**
 * Hook to lazily load Tools data.
 * Returns null while loading, then the data once loaded.
 */
export function useToolsData() {
  const [data, setData] = useState<ToolCategory[] | null>(toolsDataCache?.data ?? null);
  const [version, setVersion] = useState<string | null>(toolsDataCache?.version ?? null);
  const [isLoading, setIsLoading] = useState(!toolsDataCache);

  useEffect(() => {
    if (!toolsDataCache) {
      loadToolsData().then(loaded => {
        setData(loaded.data);
        setVersion(loaded.version);
        setIsLoading(false);
      });
    }
  }, []);

  return { toolsData: data, version, isLoading };
}

/**
 * Get cached Tools data synchronously (returns null if not loaded yet).
 */
function _getCachedToolsData(): { data: ToolCategory[]; version: string } | null {
  return toolsDataCache;
}
