import { useState, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { useUser } from "@/contexts/UserContext";
import { clearAllSectionStates } from "@/components/CollapsibleSection";
import { toast } from "sonner";

interface UseDashboardDataOptions<T> {
  storageKey: string;
  initialData: T;
  migrateData: (saved: any) => T;
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

// Debounce delay for localStorage saves (ms)
const SAVE_DEBOUNCE = 500;

export function useDashboardData<T extends { background: { analyst: string; date: string } }>(
  options: UseDashboardDataOptions<T>
): UseDashboardDataReturn<T> {
  const { profile } = useUser();
  const [forceCloseCounter, setForceCloseCounter] = useState(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [data, setData] = useState<T>(() => {
    const saved = localStorage.getItem(options.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return options.migrateData(parsed);
      } catch {
        return options.initialData;
      }
    }
    return options.initialData;
  });

  // Auto-populate analyst field from user profile
  useEffect(() => {
    if (!data.background.analyst && profile.name) {
      setData((prev) => ({
        ...prev,
        background: { ...prev.background, analyst: profile.name },
      }));
    }
  }, [profile.name, data.background.analyst]);

  // Debounced persist to localStorage
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(options.storageKey, JSON.stringify(data));
    }, SAVE_DEBOUNCE);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, options.storageKey]);

  // Cleanup timeout on unmount (data is already saved by debounced effect)
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
    localStorage.removeItem(options.storageKey);
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
