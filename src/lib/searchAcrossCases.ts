import { dbGet } from "@/lib/db";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import type { CaseMeta } from "@/types/cases";

export interface SearchResult {
  caseId: string;
  caseName: string;
  caseType: "mia" | "mre";
  field: string;
  value: string;
  match: string;
}

/**
 * Recursively search all string fields in an object.
 * Returns matches where the field value contains the query (case-insensitive).
 */
function searchObject(
  obj: unknown,
  path: string,
  query: string,
  results: SearchResult[],
  caseId: string,
  caseName: string,
  caseType: "mia" | "mre",
  depth = 0,
): void {
  if (depth > 20) return;
  if (obj == null || typeof obj === "number" || typeof obj === "boolean") return;

  if (typeof obj === "string") {
    if (obj.toLowerCase().includes(query)) {
      results.push({ caseId, caseName, caseType, field: path, value: obj, match: query });
    }
    return;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      searchObject(obj[i], `${path}[${i}]`, query, results, caseId, caseName, caseType, depth + 1);
    }
    return;
  }

  if (typeof obj === "object") {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const nextPath = path ? `${path}.${key}` : key;
      searchObject(val, nextPath, query, results, caseId, caseName, caseType, depth + 1);
    }
  }
}

/**
 * Search across all MIA and MRE cases for a query string.
 * Loads case registries from IndexedDB, then fetches each case's data.
 */
export async function searchAcrossCases(query: string): Promise<SearchResult[]> {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const registryResults = await Promise.allSettled([
    dbGet<CaseMeta[]>("dashboard", STORAGE_KEYS.MIA_CASES),
    dbGet<CaseMeta[]>("dashboard", STORAGE_KEYS.MRE_CASES),
  ]);
  const miaCases = registryResults[0].status === "fulfilled" ? registryResults[0].value : null;
  const mreCases = registryResults[1].status === "fulfilled" ? registryResults[1].value : null;

  const allCases: CaseMeta[] = [
    ...(miaCases ?? []),
    ...(mreCases ?? []),
  ];

  const results: SearchResult[] = [];

  // Fetch all case data in parallel (allSettled so one bad case doesn't abort the search)
  const caseDataPromises = allCases.map(async (c) => {
    const data = await dbGet<Record<string, unknown>>("dashboard", `${c.type}-case-${c.id}`);
    return { meta: c, data };
  });

  const caseDataList = await Promise.allSettled(caseDataPromises);

  for (const result of caseDataList) {
    if (result.status !== "fulfilled") continue;
    const { meta, data } = result.value;
    if (!data) continue;
    searchObject(data, "", q, results, meta.id, meta.name, meta.type);
  }

  return results;
}
