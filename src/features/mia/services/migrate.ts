/**
 * Migration functions for MIA Dashboard data
 */

import { toLogEntries } from "@/lib/export/helpers";
import { generateId } from "@/lib/utils";
import { createInitialDFIRData } from "./constants";
import type { DFIRData } from "@/features/mia/types";

/**
 * Migrate old data format to current DFIRData structure
 * Supports both old flat format and new nested export format
 */
export function migrateDFIRData(saved: unknown): DFIRData {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return createInitialDFIRData();
  // Migration handles arbitrary historical data formats from localStorage
  const s = saved as Record<string, unknown>;

  // Support both old flat format and new nested export format
  const rawSampleInfo = s.sampleInformation || s.sampleInfo || {};
  const sampleInfo = (rawSampleInfo && typeof rawSampleInfo === "object" && !Array.isArray(rawSampleInfo))
    ? rawSampleInfo as Record<string, string>
    : {};
  const staticAnalysis = (s.staticAnalysis || {}) as Record<string, unknown>;
  const behaviorAnalysis = (s.behaviorAnalysis || {}) as Record<string, unknown>;
  const processTree = behaviorAnalysis.processTree as Record<string, unknown> | string | undefined;
  const fileSystemMods = behaviorAnalysis.fileSystemModifications as Record<string, unknown> | string | undefined;
  const registryPersistence = behaviorAnalysis.registryPersistence as Record<string, unknown> | string | undefined;
  const networkActivity = behaviorAnalysis.networkActivity as Record<string, unknown> | string | undefined;
  const memoryArtifacts = behaviorAnalysis.memoryArtifacts as Record<string, unknown> | string | undefined;
  const systemChanges = behaviorAnalysis.systemChanges as Record<string, unknown> | string | undefined;

  const defaults = createInitialDFIRData();
  return {
    background: {
      ...defaults.background,
      ...(s.background && typeof s.background === "object" && !Array.isArray(s.background) ? s.background : {}),
    },
    sampleInfo: { ...defaults.sampleInfo, ...sampleInfo },
    staticAnalysis: {
      strings: typeof (staticAnalysis.interestingStrings ?? staticAnalysis.strings) === "string" ? (staticAnalysis.interestingStrings ?? staticAnalysis.strings) as string : "",
      importsExports: typeof staticAnalysis.importsExports === "string" ? staticAnalysis.importsExports : "",
      embeddedUrls: typeof staticAnalysis.embeddedUrls === "string" ? staticAnalysis.embeddedUrls : "",
      suspiciousMetadata: typeof staticAnalysis.suspiciousMetadata === "string" ? staticAnalysis.suspiciousMetadata : "",
      peSectionsEntropyLog: toLogEntries(
        staticAnalysis.peSectionsEntropy ||
        staticAnalysis.peSectionsEntropyLog
      ),
    },
    behaviorAnalysis: {
      processTree: (typeof processTree === "object" && processTree ? (typeof processTree.notes === "string" ? processTree.notes : "") : typeof processTree === "string" ? processTree : "") || "",
      processTreeImages: (typeof processTree === "object" && processTree ? (Array.isArray(processTree.images) ? processTree.images : []) : (Array.isArray(behaviorAnalysis.processTreeImages) ? behaviorAnalysis.processTreeImages : [])) as string[],
      fileSystemMods: (typeof fileSystemMods === "object" && fileSystemMods ? (typeof fileSystemMods.notes === "string" ? fileSystemMods.notes : "") : typeof fileSystemMods === "string" ? fileSystemMods : "") || "",
      fileSystemModsImages: (typeof fileSystemMods === "object" && fileSystemMods ? (Array.isArray(fileSystemMods.images) ? fileSystemMods.images : []) : (Array.isArray(behaviorAnalysis.fileSystemModsImages) ? behaviorAnalysis.fileSystemModsImages : [])) as string[],
      registryPersistence: (typeof registryPersistence === "object" && registryPersistence ? (typeof registryPersistence.notes === "string" ? registryPersistence.notes : "") : typeof registryPersistence === "string" ? registryPersistence : "") || "",
      registryPersistenceImages: (typeof registryPersistence === "object" && registryPersistence ? (Array.isArray(registryPersistence.images) ? registryPersistence.images : []) : (Array.isArray(behaviorAnalysis.registryPersistenceImages) ? behaviorAnalysis.registryPersistenceImages : [])) as string[],
      networkActivity: (typeof networkActivity === "object" && networkActivity ? (typeof networkActivity.notes === "string" ? networkActivity.notes : "") : typeof networkActivity === "string" ? networkActivity : "") || "",
      networkActivityImages: (typeof networkActivity === "object" && networkActivity ? (Array.isArray(networkActivity.images) ? networkActivity.images : []) : (Array.isArray(behaviorAnalysis.networkActivityImages) ? behaviorAnalysis.networkActivityImages : [])) as string[],
      memoryArtifacts: (typeof memoryArtifacts === "object" && memoryArtifacts ? (typeof memoryArtifacts.notes === "string" ? memoryArtifacts.notes : "") : typeof memoryArtifacts === "string" ? memoryArtifacts : "") || "",
      memoryArtifactsImages: (typeof memoryArtifacts === "object" && memoryArtifacts ? (Array.isArray(memoryArtifacts.images) ? memoryArtifacts.images : []) : (Array.isArray(behaviorAnalysis.memoryArtifactsImages) ? behaviorAnalysis.memoryArtifactsImages : [])) as string[],
      systemChanges: (typeof systemChanges === "object" && systemChanges ? (typeof systemChanges.notes === "string" ? systemChanges.notes : "") : typeof systemChanges === "string" ? systemChanges : "") || "",
      systemChangesImages: (typeof systemChanges === "object" && systemChanges ? (Array.isArray(systemChanges.images) ? systemChanges.images : []) : (Array.isArray(behaviorAnalysis.systemChangesImages) ? behaviorAnalysis.systemChangesImages : [])) as string[],
    },
    mitreMapping: (s.mitreAttackMapping || s.mitreMapping || {}) as Record<string, { id: string; name: string }[]>,
    impact: {
      scopeOfInfection: "",
      userAccountsAffected: "",
      dataAccessedStolen: "",
      persistenceLikelihood: "",
      riskRating: "",
      ...(s.impactAssessment as Record<string, unknown> || s.impact as Record<string, unknown> || {}),
    } as DFIRData["impact"],
    iocs: (Array.isArray(s.iocTable) ? s.iocTable : Array.isArray(s.iocs) ? s.iocs : []) as DFIRData["iocs"],
    recommendations: {
      shortTerm: "",
      longTerm: "",
      ...(s.recommendations as Record<string, unknown> || {}),
    } as DFIRData["recommendations"],
    timeline: (Array.isArray(s.attackTimeline) ? s.attackTimeline : Array.isArray(s.timeline) ? s.timeline : []) as DFIRData["timeline"],
    artifacts: (Array.isArray(s.evidenceArtifacts) ? s.evidenceArtifacts : Array.isArray(s.artifacts) ? s.artifacts : []).map((a: Record<string, unknown>) => ({
      id: (typeof a.id === "string" ? a.id : "") || generateId(),
      name: (typeof a.name === "string" ? a.name : "") || "Unknown",
      type: (typeof a.type === "string" ? a.type : "") || "Unclassified",
      sha256: typeof a.sha256 === "string" ? a.sha256 : "",
      md5: typeof a.md5 === "string" ? a.md5 : "",
      size: typeof a.size === "string" ? a.size : "",
      addedAt: (typeof a.addedAt === "string" ? a.addedAt : "") || new Date().toISOString(),
      usedIn: Array.isArray(a.usedIn) ? a.usedIn.filter((u): u is string => typeof u === "string") : [],
    })) as DFIRData["artifacts"],
  };
}
