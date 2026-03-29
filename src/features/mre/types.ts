/**
 * Type definitions for MRE (Malware Reverse Engineering) Dashboard
 */

import type { UnpackLayer, PESectionData } from "@/types/dashboard";
import type { RuntimeBehaviorData } from "@/features/mre/components/runtime-behavior";
import type { CodeAnalysisData, DeepDiveData } from "@/features/mre/components/CodeAnalysisGroups";

// ============================================
// MBC Mapping Item
// ============================================

export interface MBCMappingItem {
  id: string;
  name: string;
  objectiveId: string;
  objectiveName: string;
  type: 'behavior' | 'micro' | 'enhanced' | 'sub-technique';
}

// ============================================
// IOC Item
// ============================================

export interface IOCItem {
  id: string;
  type: string;
  value: string;
  description: string;
}

// ============================================
// Summary Data
// ============================================

export interface SummaryData {
  malwareFamily: string;
  keyFunctionality: string;
  purpose: string;
  persistence: string;
  environmentImpact: string;
  rootCause: string;
  attribution: string;
  note: string;
}

// ============================================
// Background Data
// ============================================

export interface BackgroundData {
  analyst: string;
  date: string;
  workstation: string;
  fileName: string;
  fileLocation: string;
  fileTimestampCreated: string;
  fileTimestampModified: string;
  fileTimestampAccessed: string;
  os: string;
  notificationVector: string;
}

// ============================================
// Static Analysis Data
// ============================================

export interface StaticAnalysisData {
  // Hashes & Signature
  sha256: string;
  impHash: string;
  compileTime: string;
  signatureStatus: string;
  // OSINT Lookup
  virusTotal: string;
  malwareBazaar: string;
  anyRun: string;
  tiNotes: string;
  // PACKED & Packer
  isPacked: string;
  packerSuspected: string;
  unpackLayers: UnpackLayer[];
  // Basic File Info
  fileType: string;
  magicBytes: string;
  fileSize: string;
  fileEntropy: string;
  fileProperties: string;
  // PE Structure
  entryPoint: string;
  imageBase: string;
  numberOfSections: string;
  machine: string;
  architecture: string;
  characteristics: string;
  dllMitigations: string[];
  subsystem: string;
  // PE Sections table
  peSections: PESectionData[];
  // Additional
  stringsDetection: string;
  importsExports: string;
}

// ============================================
// Code Behavior Data
// ============================================

export interface CodeBehaviorData {
  runtimeBehavior: RuntimeBehaviorData;
  codeAnalysis: CodeAnalysisData;
}

// ============================================
// Detection Data
// ============================================

export interface DetectionData {
  mbcMapping: MBCMappingItem[];
  yaraSignature: string;
  iocs: IOCItem[];
  summary: SummaryData;
}

// ============================================
// Main REData Interface
// ============================================

export interface REData {
  background: BackgroundData;
  staticAnalysis: StaticAnalysisData;
  codeBehavior: CodeBehaviorData;
  deepDive: DeepDiveData;
  detection: DetectionData;
}
