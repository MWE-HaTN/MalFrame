import { dbGet } from "@/lib/db";
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
): void {
  if (obj == null || typeof obj === "number" || typeof obj === "boolean") return;

  if (typeof obj === "string") {
    if (obj.toLowerCase().includes(query)) {
      results.push({ caseId, caseName, caseType, field: path, value: obj, match: query });
    }
    return;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      searchObject(obj[i], `${path}[${i}]`, query, results, caseId, caseName, caseType);
    }
    return;
  }

  if (typeof obj === "object") {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const nextPath = path ? `${path}.${key}` : key;
      searchObject(val, nextPath, query, results, caseId, caseName, caseType);
    }
  }
}

/**
 * Search across all MIA and MRE cases for a query string.
 * Loads case registries from IndexedDB, then fetches each case's data.
 */
export async function searchAcrossCases(query: string): Promise<SearchResult[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const [miaCases, mreCases] = await Promise.all([
    dbGet<CaseMeta[]>("dashboard", "mia-cases"),
    dbGet<CaseMeta[]>("dashboard", "mre-cases"),
  ]);

  const allCases: CaseMeta[] = [
    ...(miaCases ?? []),
    ...(mreCases ?? []),
  ];

  const results: SearchResult[] = [];

  // Fetch all case data in parallel
  const caseDataPromises = allCases.map(async (c) => {
    const data = await dbGet<Record<string, unknown>>("dashboard", `${c.type}-case-${c.id}`);
    return { meta: c, data };
  });

  const caseDataList = await Promise.all(caseDataPromises);

  for (const { meta, data } of caseDataList) {
    if (!data) continue;
    searchObject(data, "", q, results, meta.id, meta.name, meta.type);
  }

  return results;
}
