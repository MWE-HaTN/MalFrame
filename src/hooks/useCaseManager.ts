import { useState, useEffect, useCallback, useRef } from "react";
import { dbGet, dbSet, dbDelete } from "@/lib/db";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { generateId } from "@/lib/utils";
import { debugError } from "@/lib/debugLogger";
import type { CaseMeta } from "@/types/cases";

type DashboardType = "mia" | "mre";

const REGISTRY_KEYS: Record<DashboardType, string> = {
  mia: STORAGE_KEYS.MIA_CASES,
  mre: STORAGE_KEYS.MRE_CASES,
};

const ACTIVE_CASE_LS_KEYS: Record<DashboardType, string> = {
  mia: STORAGE_KEYS.MIA_ACTIVE_CASE,
  mre: STORAGE_KEYS.MRE_ACTIVE_CASE,
};

export interface UseCaseManagerReturn {
  cases: CaseMeta[];
  activeCaseId: string;
  activeStorageKey: string;
  /** Creates a new case and returns its ID. Pass templateData to pre-populate before activation. */
  createCase: (templateData?: unknown) => Promise<string>;
  switchCase: (id: string) => void;
  deleteCase: (id: string) => Promise<void>;
  renameCase: (id: string, name: string) => Promise<void>;
}

/**
 * Manages a list of analysis cases per dashboard type.
 *
 * Storage layout (IndexedDB "dashboard" store):
 *   "${type}-cases"          → CaseMeta[]  (registry)
 *   "${type}-case-${id}"     → T            (case data, managed by useDashboardData)
 *
 * Active case ID is kept in localStorage for instant reads on refresh.
 *
 * Migration: on first init, if legacy single-case data exists under legacyStorageKey,
 * it is moved into the first case automatically.
 */
export function useCaseManager(
  type: DashboardType,
  legacyStorageKey: string
): UseCaseManagerReturn {
  const registryKey = REGISTRY_KEYS[type];
  const activeLSKey = ACTIVE_CASE_LS_KEYS[type];

  const [cases, setCases] = useState<CaseMeta[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string>("");
  const casesRef = useRef(cases);
  const activeCaseIdRef = useRef(activeCaseId);
  casesRef.current = cases;
  activeCaseIdRef.current = activeCaseId;
  const initDone = useRef(false);
  const opsLockRef = useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        let registry = await dbGet<CaseMeta[]>("dashboard", registryKey);

        if (!registry || registry.length === 0) {
          // First run: create Case 1 and migrate legacy single-case data if present
          const id = generateId();
          const now = new Date().toISOString();
          const firstCase: CaseMeta = { id, name: "Case 1", type, createdAt: now, updatedAt: now };

          const legacyData = await dbGet<unknown>("dashboard", legacyStorageKey);
          if (legacyData) {
            await dbSet("dashboard", `${type}-case-${id}`, legacyData);
            await dbDelete("dashboard", legacyStorageKey);
          }

          registry = [firstCase];
          await dbSet("dashboard", registryKey, registry);
        }

        if (!cancelled) {
          const savedId = localStorage.getItem(activeLSKey);
          const valid = registry.find((c) => c.id === savedId);
          const activeId = valid?.id ?? registry[0].id;

          setCases(registry);
          setActiveCaseId(activeId);
          localStorage.setItem(activeLSKey, activeId);
          initDone.current = true;
        }
      } catch (e) {
        debugError("useCaseManager: init failed", e);
        if (!cancelled) {
          initDone.current = true;
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Serialize async case operations to prevent UI/IDB desync on concurrent calls
  const withLock = useCallback(<T>(fn: () => Promise<T>): Promise<T> => {
    const next = opsLockRef.current.then(fn, fn);
    opsLockRef.current = next.then(() => {}, () => {});
    return next;
  }, []);

  const createCase = useCallback((templateData?: unknown): Promise<string> => {
    return withLock(async () => {
      if (!initDone.current) return "";
      const id = generateId();
      const now = new Date().toISOString();
      let previous: CaseMeta[] = [];
      let updated: CaseMeta[] = [];
      setCases(prev => {
        previous = prev;
        const newCase: CaseMeta = { id, name: `Case ${prev.length + 1}`, type, createdAt: now, updatedAt: now };
        updated = [...prev, newCase];
        return updated;
      });
      try {
        await dbSet("dashboard", registryKey, updated);
        if (templateData != null) {
          await dbSet("dashboard", `${type}-case-${id}`, templateData);
        }
      } catch (e) {
        debugError("useCaseManager: createCase failed", e);
        setCases(previous);
        await dbSet("dashboard", registryKey, previous).catch(() => {});
        return "";
      }
      setActiveCaseId(id);
      localStorage.setItem(activeLSKey, id);
      return id;
    });
  }, [type, registryKey, activeLSKey, withLock]);

  const switchCase = useCallback(
    (id: string) => {
      // Serialize with createCase/deleteCase to prevent switching to a case
      // that hasn't been fully written to IDB yet
      withLock(async () => {
        setActiveCaseId(id);
        localStorage.setItem(activeLSKey, id);
      });
    },
    [activeLSKey, withLock]
  );

  const deleteCase = useCallback(
    (id: string): Promise<void> => {
      return withLock(async () => {
        let previous: CaseMeta[] = [];
        let updated: CaseMeta[] = [];
        setCases(prev => {
          previous = prev;
          if (prev.length <= 1) {
            updated = prev;
            return prev;
          }
          updated = prev.filter((c) => c.id !== id);
          return updated;
        });
        if (updated.length === 0 || (updated.length === previous.length)) return;
        // Read activeCaseId after the lock is acquired to avoid stale ref
        const shouldUpdateActive = activeCaseIdRef.current === id;
        try {
          // Update registry first so a partial failure doesn't leave a ghost entry
          await dbSet("dashboard", registryKey, updated);
          await dbDelete("dashboard", `${type}-case-${id}`);

          if (shouldUpdateActive && updated.length > 0) {
            const newActive = updated[0].id;
            setActiveCaseId(newActive);
            localStorage.setItem(activeLSKey, newActive);
          }
        } catch (e) {
          debugError("useCaseManager: deleteCase failed", e);
          setCases(previous);
          await dbSet("dashboard", registryKey, previous).catch(() => {});
        }
      });
    },
    [type, registryKey, activeLSKey, withLock]
  );

  const renameCase = useCallback(
    (id: string, name: string): Promise<void> => {
      return withLock(async () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const now = new Date().toISOString();
        let previous: CaseMeta[] = [];
        let updated: CaseMeta[] = [];
        setCases(prev => {
          previous = prev;
          updated = prev.map((c) => c.id === id ? { ...c, name: trimmed, updatedAt: now } : c);
          return updated;
        });
        try {
          await dbSet("dashboard", registryKey, updated);
        } catch (e) {
          debugError("useCaseManager: renameCase failed", e);
          setCases(previous);
        }
      });
    },
    [registryKey, withLock]
  );

  const activeStorageKey = activeCaseId ? `${type}-case-${activeCaseId}` : "";

  return { cases, activeCaseId, activeStorageKey, createCase, switchCase, deleteCase, renameCase };
}
