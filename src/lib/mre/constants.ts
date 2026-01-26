/**
 * Constants and initial data for MRE Dashboard
 */

import { generateId } from "@/lib/utils";
import { createInitialCodeAnalysisData, createInitialDeepDiveData } from "@/components/CodeAnalysisGroups";
import { initialRuntimeBehavior } from "@/components/runtime-behavior";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import type { REData, SummaryData } from "@/types/mre";

// ============================================
// Storage Key
// ============================================

export const MRE_STORAGE_KEY = STORAGE_KEYS.MRE_DASHBOARD_DATA;

// ============================================
// Default Summary
// ============================================

export const defaultSummary: SummaryData = {
  malwareFamily: "",
  keyFunctionality: "",
  purpose: "",
  persistence: "",
  environmentImpact: "",
  rootCause: "",
  attribution: "",
  note: "",
};

// ============================================
// Initial Data
// ============================================

export const initialREData: REData = {
  background: {
    analyst: "",
    date: new Date().toISOString().split("T")[0],
    workstation: "",
    fileName: "",
    fileLocation: "",
    fileTimestampCreated: "",
    fileTimestampModified: "",
    fileTimestampAccessed: "",
    os: "",
    notificationVector: "",
  },
  staticAnalysis: {
    sha256: "",
    impHash: "",
    compileTime: "",
    signatureStatus: "",
    virusTotal: "",
    malwareBazaar: "",
    anyRun: "",
    tiNotes: "",
    isPacked: "",
    packerSuspected: "",
    unpackLayers: [],
    fileType: "",
    magicBytes: "",
    fileSize: "",
    fileEntropy: "",
    fileProperties: "",
    entryPoint: "",
    imageBase: "",
    numberOfSections: "",
    machine: "",
    architecture: "",
    characteristics: "",
    dllMitigations: [],
    subsystem: "",
    peSections: [{ 
      id: generateId(), 
      sectionName: "", 
      size: "", 
      entropy: "", 
      permissions: "", 
      sectionHash: "", 
      images: [], 
      timestamp: new Date().toISOString() 
    }],
    stringsDetection: "",
    importsExports: "",
  },
  codeBehavior: {
    runtimeBehavior: initialRuntimeBehavior,
    codeAnalysis: createInitialCodeAnalysisData(),
  },
  deepDive: createInitialDeepDiveData(),
  detection: {
    mbcMapping: [],
    yaraSignature: "",
    iocs: [],
    summary: { ...defaultSummary },
  },
};
