import { useState, useEffect, useCallback } from "react";
import { dbGet, dbSet, dbDelete } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { debugError } from "@/lib/debugLogger";
import type { CaseMeta } from "@/types/cases";

type DashboardType = "mia" | "mre";

const REGISTRY_KEYS: Record<DashboardType, string> = {
  mia: "mia-cases",
  mre: "mre-cases",
};

const ACTIVE_CASE_LS_KEYS: Record<DashboardType, string> = {
  mia: "mia-active-case",
  mre: "mre-active-case",
};

export interface UseCaseManagerReturn {
  cases: CaseMeta[];
  activeCaseId: string;
  activeStorageKey: string;
  createCase: (templateId?: string) => Promise<void>;
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
        }
      } catch (e) {
        debugError("useCaseManager: init failed", e);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createCase = useCallback(async () => {
    const id = generateId();
    const now = new Date().toISOString();
    const newCase: CaseMeta = {
      id,
      name: `Case ${cases.length + 1}`,
      type,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...cases, newCase];
    try {
      await dbSet("dashboard", registryKey, updated);
      setCases(updated);
      setActiveCaseId(id);
      localStorage.setItem(activeLSKey, id);
    } catch (e) {
      debugError("useCaseManager: createCase failed", e);
    }
  }, [cases, type, registryKey, activeLSKey]);

  const switchCase = useCallback(
    (id: string) => {
      setActiveCaseId(id);
      localStorage.setItem(activeLSKey, id);
    },
    [activeLSKey]
  );

  const deleteCase = useCallback(
    async (id: string) => {
      if (cases.length <= 1) return;
      try {
        await dbDelete("dashboard", `${type}-case-${id}`);
        const updated = cases.filter((c) => c.id !== id);
        await dbSet("dashboard", registryKey, updated);
        setCases(updated);

        if (activeCaseId === id) {
          const newActive = updated[0].id;
          setActiveCaseId(newActive);
          localStorage.setItem(activeLSKey, newActive);
        }
      } catch (e) {
        debugError("useCaseManager: deleteCase failed", e);
      }
    },
    [cases, type, registryKey, activeCaseId, activeLSKey]
  );

  const renameCase = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const updated = cases.map((c) =>
        c.id === id ? { ...c, name: trimmed, updatedAt: new Date().toISOString() } : c
      );
      try {
        await dbSet("dashboard", registryKey, updated);
        setCases(updated);
      } catch (e) {
        debugError("useCaseManager: renameCase failed", e);
      }
    },
    [cases, registryKey]
  );

  const activeStorageKey = activeCaseId ? `${type}-case-${activeCaseId}` : "";

  return { cases, activeCaseId, activeStorageKey, createCase, switchCase, deleteCase, renameCase };
}
