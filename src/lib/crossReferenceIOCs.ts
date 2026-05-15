/**
 * Cross-reference IOCs across all MIA and MRE cases.
 * Finds IOC values that appear in multiple cases.
 */
import { dbGet } from "@/lib/db";
import type { CaseMeta } from "@/types/cases";

export interface IOCCrossRefResult {
  type: string;
  value: string;
  cases: {
    caseId: string;
    caseName: string;
    caseType: "mia" | "mre";
  }[];
}

// Extract IOCs from MIA case data
function extractMIAIOCs(data: unknown): { type: string; value: string }[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  const iocs = d.iocs;
  if (!Array.isArray(iocs)) return [];
  return iocs
    .filter((ioc: unknown) => {
      if (!ioc || typeof ioc !== "object") return false;
      const obj = ioc as Record<string, unknown>;
      return typeof obj.type === "string" && typeof obj.value === "string" && obj.value.trim() !== "";
    })
    .map((ioc: unknown) => {
      const obj = ioc as Record<string, unknown>;
      return { type: obj.type as string, value: obj.value as string };
    });
}

// Extract IOCs from MRE case data
function extractMREIOCs(data: unknown): { type: string; value: string }[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  const detection = d.detection;
  if (!detection || typeof detection !== "object") return [];
  const iocs = (detection as Record<string, unknown>).iocs;
  if (!Array.isArray(iocs)) return [];
  return iocs
    .filter((ioc: unknown) => {
      if (!ioc || typeof ioc !== "object") return false;
      const obj = ioc as Record<string, unknown>;
      return typeof obj.type === "string" && typeof obj.value === "string" && obj.value.trim() !== "";
    })
    .map((ioc: unknown) => {
      const obj = ioc as Record<string, unknown>;
      return { type: obj.type as string, value: obj.value as string };
    });
}

export async function crossReferenceIOCs(): Promise<IOCCrossRefResult[]> {
  const [miaCases, mreCases] = await Promise.all([
    dbGet<CaseMeta[]>("dashboard", "mia-cases"),
    dbGet<CaseMeta[]>("dashboard", "mre-cases"),
  ]);

  // Map: "type:value" -> { type, value, cases[] }
  const iocMap = new Map<string, IOCCrossRefResult>();

  const processCase = async (
    caseMeta: CaseMeta,
    extractFn: (data: unknown) => { type: string; value: string }[],
  ) => {
    const key = `${caseMeta.type}-case-${caseMeta.id}`;
    const data = await dbGet<unknown>("dashboard", key);
    if (!data) return;

    const iocs = extractFn(data);
    for (const ioc of iocs) {
      const mapKey = `${ioc.type}:${ioc.value.toLowerCase()}`;
      const existing = iocMap.get(mapKey);
      if (existing) {
        // Only add if this case isn't already listed
        const alreadyListed = existing.cases.some(
          (c) => c.caseId === caseMeta.id && c.caseType === caseMeta.type
        );
        if (!alreadyListed) {
          existing.cases.push({
            caseId: caseMeta.id,
            caseName: caseMeta.name,
            caseType: caseMeta.type,
          });
        }
      } else {
        iocMap.set(mapKey, {
          type: ioc.type,
          value: ioc.value,
          cases: [{
            caseId: caseMeta.id,
            caseName: caseMeta.name,
            caseType: caseMeta.type,
          }],
        });
      }
    }
  };

  // Process all cases in parallel
  const promises: Promise<void>[] = [];
  if (miaCases) {
    for (const c of miaCases) {
      promises.push(processCase(c, extractMIAIOCs));
    }
  }
  if (mreCases) {
    for (const c of mreCases) {
      promises.push(processCase(c, extractMREIOCs));
    }
  }
  await Promise.all(promises);

  // Filter: only return IOCs that appear in 2+ cases
  const results: IOCCrossRefResult[] = [];
  for (const entry of iocMap.values()) {
    if (entry.cases.length >= 2) {
      results.push(entry);
    }
  }

  // Sort by number of cases (descending), then by type
  results.sort((a, b) => b.cases.length - a.cases.length || a.type.localeCompare(b.type));

  return results;
}
