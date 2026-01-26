/**
 * Centralized type definitions for dashboard components
 * These types are shared across MIA and MRE dashboards
 */

// ============================================
// Log Entry - Used in NotesLog and export
// ============================================

export interface LogEntry {
  id: string;
  text: string;
  images: string[];
  timestamp: string;
  imageName?: string;
}

// ============================================
// PE Section Data - Used in PESectionEntry
// ============================================

export interface PESectionData {
  id: string;
  sectionName: string;
  size: string;
  entropy: string;
  permissions: string;
  sectionHash: string;
  images: string[];
  timestamp: string;
}

// ============================================
// Unpack Layer - Used in PackedDropdown and UnpackingLayers
// ============================================

export interface UnpackLayer {
  id: string;
  layerNumber: number;
  packerType: string;
  oep: string;
  unpackingMethod: string;
  outputType: string;
  tools: string;
  antiAnalysis: string;
  indicators: string;
  cleanedHash: string;
}


// ============================================
// Evidence Artifact - Used in EvidenceArtifacts (MIA)
// ============================================

export interface Artifact {
  id: string;
  name: string;
  type: string;
  size: string;
  md5: string;
  sha256: string;
  addedAt: string;
  usedIn: string[];
}

// ============================================
// IOC - Used in IOCTable
// ============================================

export interface IOC {
  id: string;
  type: string;
  value: string;
  description: string;
}

// ============================================
// Timeline Event - Used in TimelineTable
// ============================================

export interface TimelineEvent {
  id: string;
  time: string;
  content: string;
  severity: "info" | "warning" | "critical";
}

