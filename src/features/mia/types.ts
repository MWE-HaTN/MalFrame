/**
 * Type definitions for MIA (Malware Incident Analysis) Dashboard
 */

import type { LogEntry, Artifact, IOC, TimelineEvent } from "@/types/dashboard";

export interface BackgroundData {
  caseId: string;
  analyst: string;
  date: string;
  workstation: string;
  source: string;
  infectionVector: string;
}

export interface SampleInfoData {
  fileName: string;
  filePath: string;
  fileSize: string;
  fileType: string;
  sha256: string;
  signature: string;
  compileTime: string;
  avDetection: string;
}

export interface StaticAnalysisData {
  strings: string;
  importsExports: string;
  embeddedUrls: string;
  suspiciousMetadata: string;
  peSectionsEntropyLog: LogEntry[];
}

export interface BehaviorAnalysisData {
  // A. Process Tree
  processTree: string;
  processTreeImages?: string[];
  // B. File System Modifications
  fileSystemMods: string;
  fileSystemModsImages?: string[];
  // C. Registry / Persistence
  registryPersistence: string;
  registryPersistenceImages?: string[];
  // D. Network Activity
  networkActivity: string;
  networkActivityImages?: string[];
  // E. Memory Artifacts
  memoryArtifacts: string;
  memoryArtifactsImages?: string[];
  // F. System Changes
  systemChanges: string;
  systemChangesImages?: string[];
}

export interface ImpactData {
  scopeOfInfection: string;
  userAccountsAffected: string;
  dataAccessedStolen: string;
  persistenceLikelihood: string;
  riskRating: string;
}

export interface RecommendationsData {
  shortTerm: string;
  longTerm: string;
}

export interface DFIRData {
  background: BackgroundData;
  sampleInfo: SampleInfoData;
  staticAnalysis: StaticAnalysisData;
  behaviorAnalysis: BehaviorAnalysisData;
  mitreMapping: Record<string, { id: string; name: string }[]>;
  impact: ImpactData;
  iocs: IOC[];
  recommendations: RecommendationsData;
  timeline: TimelineEvent[];
  artifacts: Artifact[];
}
