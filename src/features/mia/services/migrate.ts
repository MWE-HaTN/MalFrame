/**
 * Migration functions for MIA Dashboard data
 */

import { toLogEntries } from "@/lib/export/helpers";
import { initialDFIRData } from "./constants";
import type { DFIRData } from "@/features/mia/types";

/**
 * Migrate old data format to current DFIRData structure
 * Supports both old flat format and new nested export format
 */
export function migrateDFIRData(saved: unknown): DFIRData {
  if (!saved || typeof saved !== "object") return initialDFIRData;
  // Migration handles arbitrary historical data formats from localStorage
  const s = saved as Record<string, unknown>;

  // Support both old flat format and new nested export format
  const sampleInfo = (s.sampleInformation || s.sampleInfo || {}) as Record<string, string>;
  const staticAnalysis = (s.staticAnalysis || {}) as Record<string, unknown>;
  const behaviorAnalysis = (s.behaviorAnalysis || {}) as Record<string, unknown>;
  const processTree = behaviorAnalysis.processTree as Record<string, unknown> | string | undefined;
  const fileSystemMods = behaviorAnalysis.fileSystemModifications as Record<string, unknown> | string | undefined;
  const registryPersistence = behaviorAnalysis.registryPersistence as Record<string, unknown> | string | undefined;
  const networkActivity = behaviorAnalysis.networkActivity as Record<string, unknown> | string | undefined;
  const memoryArtifacts = behaviorAnalysis.memoryArtifacts as Record<string, unknown> | string | undefined;
  const systemChanges = behaviorAnalysis.systemChanges as Record<string, unknown> | string | undefined;

  return {
    background: { ...initialDFIRData.background, ...(s.background as object) },
    sampleInfo: { ...initialDFIRData.sampleInfo, ...sampleInfo },
    staticAnalysis: {
      strings: (staticAnalysis.interestingStrings || staticAnalysis.strings || "") as string,
      importsExports: (staticAnalysis.importsExports || "") as string,
      embeddedUrls: (staticAnalysis.embeddedUrls || "") as string,
      suspiciousMetadata: (staticAnalysis.suspiciousMetadata || "") as string,
      peSectionsEntropyLog: toLogEntries(
        staticAnalysis.peSectionsEntropy ||
        staticAnalysis.peSectionsEntropyLog ||
        (s.staticAnalysis as Record<string, unknown>)?.peSectionsEntropy
      ),
    },
    behaviorAnalysis: {
      processTree: (typeof processTree === "object" && processTree ? (processTree.notes as string) : processTree as string) || "",
      processTreeImages: (typeof processTree === "object" && processTree ? (processTree.images as string[]) : (behaviorAnalysis.processTreeImages as string[])) || [],
      fileSystemMods: (typeof fileSystemMods === "object" && fileSystemMods ? (fileSystemMods.notes as string) : fileSystemMods as string) || "",
      fileSystemModsImages: (typeof fileSystemMods === "object" && fileSystemMods ? (fileSystemMods.images as string[]) : (behaviorAnalysis.fileSystemModsImages as string[])) || [],
      registryPersistence: (typeof registryPersistence === "object" && registryPersistence ? (registryPersistence.notes as string) : registryPersistence as string) || "",
      registryPersistenceImages: (typeof registryPersistence === "object" && registryPersistence ? (registryPersistence.images as string[]) : (behaviorAnalysis.registryPersistenceImages as string[])) || [],
      networkActivity: (typeof networkActivity === "object" && networkActivity ? (networkActivity.notes as string) : networkActivity as string) || "",
      networkActivityImages: (typeof networkActivity === "object" && networkActivity ? (networkActivity.images as string[]) : (behaviorAnalysis.networkActivityImages as string[])) || [],
      memoryArtifacts: (typeof memoryArtifacts === "object" && memoryArtifacts ? (memoryArtifacts.notes as string) : memoryArtifacts as string) || "",
      memoryArtifactsImages: (typeof memoryArtifacts === "object" && memoryArtifacts ? (memoryArtifacts.images as string[]) : (behaviorAnalysis.memoryArtifactsImages as string[])) || [],
      systemChanges: (typeof systemChanges === "object" && systemChanges ? (systemChanges.notes as string) : systemChanges as string) || "",
      systemChangesImages: (typeof systemChanges === "object" && systemChanges ? (systemChanges.images as string[]) : (behaviorAnalysis.systemChangesImages as string[])) || [],
    },
    mitreMapping: (s.mitreAttackMapping || s.mitreMapping || {}) as Record<string, { id: string; name: string }[]>,
    impact: (s.impactAssessment || s.impact || {
      scopeOfInfection: "",
      userAccountsAffected: "",
      dataAccessedStolen: "",
      persistenceLikelihood: "",
      riskRating: "",
    }) as DFIRData["impact"],
    iocs: (s.iocTable || s.iocs || []) as DFIRData["iocs"],
    recommendations: (s.recommendations || {
      shortTerm: "",
      longTerm: "",
    }) as DFIRData["recommendations"],
    timeline: (s.attackTimeline || s.timeline || []) as DFIRData["timeline"],
    artifacts: ((s.evidenceArtifacts || s.artifacts || []) as Record<string, unknown>[]).map((a) => ({
      ...a,
      sha256: (a.sha256 as string) || "",
    })) as DFIRData["artifacts"],
  };
}
