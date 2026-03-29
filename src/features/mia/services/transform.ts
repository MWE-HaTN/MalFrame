/**
 * Transform functions for MIA Dashboard data export
 */

import type { DFIRData } from "@/features/mia/types";

/**
 * Transform internal data structure to nested export format matching UI layout
 */
export function transformForExport(data: DFIRData) {
  return {
    // Section 1: Background
    background: data.background,
    
    // Section 2: Sample Information
    sampleInformation: data.sampleInfo,
    
    // Section 3: Evidence & Artifacts
    evidenceArtifacts: data.artifacts,
    
    // Section 4: Static Analysis
    staticAnalysis: {
      peSectionsEntropy: data.staticAnalysis.peSectionsEntropyLog,
      interestingStrings: data.staticAnalysis.strings,
      importsExports: data.staticAnalysis.importsExports,
      embeddedUrls: data.staticAnalysis.embeddedUrls,
      suspiciousMetadata: data.staticAnalysis.suspiciousMetadata,
    },
    
    // Section 5: Behavior Analysis
    behaviorAnalysis: {
      processTree: {
        notes: data.behaviorAnalysis.processTree,
        images: data.behaviorAnalysis.processTreeImages,
      },
      fileSystemModifications: {
        notes: data.behaviorAnalysis.fileSystemMods,
        images: data.behaviorAnalysis.fileSystemModsImages,
      },
      registryPersistence: {
        notes: data.behaviorAnalysis.registryPersistence,
        images: data.behaviorAnalysis.registryPersistenceImages,
      },
      networkActivity: {
        notes: data.behaviorAnalysis.networkActivity,
        images: data.behaviorAnalysis.networkActivityImages,
      },
      memoryArtifacts: {
        notes: data.behaviorAnalysis.memoryArtifacts,
        images: data.behaviorAnalysis.memoryArtifactsImages,
      },
      systemChanges: {
        notes: data.behaviorAnalysis.systemChanges,
        images: data.behaviorAnalysis.systemChangesImages,
      },
    },
    
    // Section 6: MITRE ATT&CK Mapping
    mitreAttackMapping: data.mitreMapping,
    
    // Section 7: Impact Assessment
    impactAssessment: data.impact,
    
    // Section 8: IOC Table
    iocTable: data.iocs,
    
    // Section 9: Recommendations
    recommendations: data.recommendations,
    
    // Section 10: Attack Timeline
    attackTimeline: data.timeline,
  };
}
