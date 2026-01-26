/**
 * Migration functions for MIA Dashboard data
 */

import { toLogEntries } from "@/lib/export/helpers";
import { initialDFIRData } from "./constants";
import type { DFIRData } from "@/types/mia";

/**
 * Migrate old data format to current DFIRData structure
 * Supports both old flat format and new nested export format
 */
export function migrateDFIRData(saved: any): DFIRData {
  if (!saved) return initialDFIRData;

  // Support both old flat format and new nested export format
  const sampleInfo = saved.sampleInformation || saved.sampleInfo || {};
  const staticAnalysis = saved.staticAnalysis || {};
  const behaviorAnalysis = saved.behaviorAnalysis || {};

  return {
    background: { ...initialDFIRData.background, ...saved.background },
    sampleInfo: { ...initialDFIRData.sampleInfo, ...sampleInfo },
    staticAnalysis: {
      strings: staticAnalysis.interestingStrings || staticAnalysis.strings || "",
      importsExports: staticAnalysis.importsExports || "",
      embeddedUrls: staticAnalysis.embeddedUrls || "",
      suspiciousMetadata: staticAnalysis.suspiciousMetadata || "",
      peSectionsEntropyLog: toLogEntries(
        staticAnalysis.peSectionsEntropy || 
        staticAnalysis.peSectionsEntropyLog || 
        saved.staticAnalysis?.peSectionsEntropy
      ),
    },
    behaviorAnalysis: {
      processTree: behaviorAnalysis.processTree?.notes || behaviorAnalysis.processTree || "",
      processTreeImages: behaviorAnalysis.processTree?.images || behaviorAnalysis.processTreeImages || [],
      fileSystemMods: behaviorAnalysis.fileSystemModifications?.notes || behaviorAnalysis.fileSystemMods || "",
      fileSystemModsImages: behaviorAnalysis.fileSystemModifications?.images || behaviorAnalysis.fileSystemModsImages || [],
      registryPersistence: behaviorAnalysis.registryPersistence?.notes || behaviorAnalysis.registryPersistence || "",
      registryPersistenceImages: behaviorAnalysis.registryPersistence?.images || behaviorAnalysis.registryPersistenceImages || [],
      networkActivity: behaviorAnalysis.networkActivity?.notes || behaviorAnalysis.networkActivity || "",
      networkActivityImages: behaviorAnalysis.networkActivity?.images || behaviorAnalysis.networkActivityImages || [],
      memoryArtifacts: behaviorAnalysis.memoryArtifacts?.notes || behaviorAnalysis.memoryArtifacts || "",
      memoryArtifactsImages: behaviorAnalysis.memoryArtifacts?.images || behaviorAnalysis.memoryArtifactsImages || [],
      systemChanges: behaviorAnalysis.systemChanges?.notes || behaviorAnalysis.systemChanges || "",
      systemChangesImages: behaviorAnalysis.systemChanges?.images || behaviorAnalysis.systemChangesImages || [],
    },
    mitreMapping: saved.mitreAttackMapping || saved.mitreMapping || {},
    impact: saved.impactAssessment || saved.impact || {
      scopeOfInfection: "",
      userAccountsAffected: "",
      dataAccessedStolen: "",
      persistenceLikelihood: "",
      riskRating: "",
    },
    iocs: saved.iocTable || saved.iocs || [],
    recommendations: saved.recommendations || {
      shortTerm: "",
      longTerm: "",
    },
    timeline: saved.attackTimeline || saved.timeline || [],
    artifacts: (saved.evidenceArtifacts || saved.artifacts || []).map((a: any) => ({
      ...a,
      sha256: a.sha256 || "",
    })),
  };
}
