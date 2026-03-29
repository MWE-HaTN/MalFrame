/**
 * Constants for MIA (Malware Incident Analysis) Dashboard
 */

import { generateId } from "@/lib/utils";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import type { DFIRData } from "@/features/mia/types";
import type { LogEntry } from "@/types/dashboard";

export const MIA_STORAGE_KEY = STORAGE_KEYS.MIA_DASHBOARD_DATA;

/** Helper to create initial log entry */
export const createInitialEntry = (text: string = ""): LogEntry => ({
  id: generateId(),
  text,
  images: [],
  timestamp: new Date().toISOString(),
});

export const initialDFIRData: DFIRData = {
  background: {
    caseId: "",
    analyst: "",
    date: new Date().toISOString().split("T")[0],
    workstation: "",
    source: "",
    infectionVector: "",
  },
  sampleInfo: {
    fileName: "",
    filePath: "",
    fileSize: "",
    fileType: "",
    sha256: "",
    signature: "",
    compileTime: "",
    avDetection: "",
  },
  staticAnalysis: {
    strings: "",
    importsExports: "",
    embeddedUrls: "",
    suspiciousMetadata: "",
    peSectionsEntropyLog: [createInitialEntry()],
  },
  behaviorAnalysis: {
    processTree: "",
    processTreeImages: [],
    fileSystemMods: "",
    fileSystemModsImages: [],
    registryPersistence: "",
    registryPersistenceImages: [],
    networkActivity: "",
    networkActivityImages: [],
    memoryArtifacts: "",
    memoryArtifactsImages: [],
    systemChanges: "",
    systemChangesImages: [],
  },
  mitreMapping: {},
  impact: {
    scopeOfInfection: "",
    userAccountsAffected: "",
    dataAccessedStolen: "",
    persistenceLikelihood: "",
    riskRating: "",
  },
  iocs: [],
  recommendations: {
    shortTerm: "",
    longTerm: "",
  },
  timeline: [],
  artifacts: [],
};
