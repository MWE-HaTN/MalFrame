import { z } from "zod";
import { debugWarn, debugError } from "@/lib/debugLogger";
import type { DFIRData } from "@/features/mia/types";
import type { REData } from "@/features/mre/types";

// Maximum file size for imports (5MB)
const MAX_IMPORT_SIZE = 5 * 1024 * 1024;

// Maximum size for a single base64 image (1MB - reduced for quota enforcement)
const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];

// ============================================
// Base64 Image Validation
// ============================================

/**
 * Validate a base64 data URI for images
 * Checks format, MIME type, and approximate size
 */
function validateBase64Image(dataUri: string): { valid: boolean; error?: string } {
  if (!dataUri || typeof dataUri !== 'string') {
    return { valid: false, error: 'Invalid data URI' };
  }

  // Check data URI format
  const dataUriRegex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-+.]+)?;base64,/;
  const match = dataUri.match(dataUriRegex);
  
  if (!match) {
    return { valid: false, error: 'Invalid data URI format' };
  }

  // Extract and validate MIME type
  const mimeType = match[1] || 'image/png';
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return { valid: false, error: `Unsupported image type: ${mimeType}` };
  }

  // Check approximate size (base64 is ~33% larger than binary)
  const base64Part = dataUri.split(',')[1];
  if (!base64Part) {
    return { valid: false, error: 'Missing base64 data' };
  }

  const approximateSize = (base64Part.length * 3) / 4;
  if (approximateSize > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Image too large (max ${MAX_IMAGE_SIZE / 1024 / 1024}MB)` };
  }

  // Validate base64 characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64Part)) {
    return { valid: false, error: 'Invalid base64 encoding' };
  }

  return { valid: true };
}

/**
 * Sanitize an array of base64 images, removing invalid ones
 * Internal use only - used by schema transforms
 */
function sanitizeBase64Images(images: unknown[]): string[] {
  if (!Array.isArray(images)) return [];
  
  return images.filter((img): img is string => {
    if (typeof img !== 'string') return false;
    const result = validateBase64Image(img);
    if (!result.valid) {
      debugWarn('Removed invalid image:', result.error);
    }
    return result.valid;
  });
}

/**
 * Validate file size before parsing
 * Internal use only
 */
function validateFileSize(content: string): boolean {
  return new Blob([content]).size <= MAX_IMPORT_SIZE;
}


// ============================================

/**
 * Safe JSON parse with prototype pollution protection
 */
export function safeJsonParse<T>(jsonString: string): T {
  const parsed = JSON.parse(jsonString);
  
  // Remove dangerous keys that could cause prototype pollution
  const sanitize = (obj: unknown): unknown => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);
    
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      // Skip prototype pollution vectors
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      result[key] = sanitize((obj as Record<string, unknown>)[key]);
    }
    return result;
  };
  
  return sanitize(parsed) as T;
}


// ============================================
// Helper Schemas
// ============================================

export const LogEntrySchema = z.object({
  id: z.string(),
  text: z.string(),
  images: z.array(z.string()).optional().default([]).transform(sanitizeBase64Images),
  timestamp: z.string().optional(),
});

export const PESectionDataSchema = z.object({
  id: z.string(),
  sectionName: z.string(),
  size: z.string(),
  entropy: z.string(),
  permissions: z.string(),
  sectionHash: z.string(),
  images: z.array(z.string()).optional().default([]).transform(sanitizeBase64Images),
  timestamp: z.string().optional(),
});

export const UnpackLayerSchema = z.object({
  id: z.string(),
  layerNumber: z.number(),
  packerType: z.string(),
  oep: z.string(),
  unpackingMethod: z.string(),
  outputType: z.string(),
  tools: z.string(),
  antiAnalysis: z.string(),
  indicators: z.string(),
  cleanedHash: z.string(),
});

export const IOCSchema = z.object({
  id: z.string(),
  type: z.string(),
  value: z.string(),
  description: z.string(),
});

export const MBCMappingSchema = z.object({
  id: z.string(),
  name: z.string(),
  objectiveId: z.string(),
  objectiveName: z.string(),
  type: z.enum(['behavior', 'micro', 'enhanced', 'sub-technique']),
});

export const TimelineEntrySchema = z.object({
  id: z.string(),
  time: z.string(),
  content: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
});

// Runtime Behavior schemas
const RuntimeEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  value: z.string(),
  description: z.string().optional().default(""),
});

const RuntimeGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  enabled: z.boolean(),
  entries: z.array(RuntimeEntrySchema),
});

const RuntimeSubitemSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  subitem: z.string(),
  enabled: z.boolean(),
  entries: z.array(RuntimeEntrySchema),
});

export const RuntimeBehaviorDataSchema = z.object({
  groups: z.array(RuntimeGroupSchema),
  subitems: z.array(RuntimeSubitemSchema),
});

// Code Analysis schemas (relaxed for complex nested structure)
export const CodeAnalysisDataSchema = z.record(z.string(), z.unknown());
export const DeepDiveDataSchema = z.record(z.string(), z.unknown());

// ============================================
// Image Registry Schema
// ============================================

const StoredImageSchema = z.object({
  id: z.string().max(100),
  data: z.string().refine(
    (val) => validateBase64Image(val).valid,
    { message: 'Invalid base64 image data' }
  ),
  fieldName: z.string().max(100),
  index: z.number().int().min(0).max(1000),
  hash: z.string().max(20),
  timestamp: z.number(),
});

const ImageRegistrySchema = z.object({
  images: z.array(StoredImageSchema).max(50), // Limit to 50 images (reduced for quota)
  lastUpdated: z.number(),
});

// ============================================
// User Profile Schema
// ============================================

export const UserProfileSchema = z.object({
  name: z.string().max(100),
  githubUrl: z.string().max(200),
});

// ============================================
// Activity Data Schema
// ============================================

export const ActivityDataSchema = z.object({
  activities: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(1000),
});

// ============================================
// Tools Data Schema
// ============================================

const ToolSchema = z.object({
  name: z.string().max(100),
  description: z.string().max(500),
  projectUrl: z.string().url().optional().or(z.literal("")),
});

const ToolCategorySchema = z.object({
  name: z.string().max(100),
  tools: z.array(ToolSchema).max(100),
});

export const ToolsDataSchema = z.array(ToolCategorySchema).max(50);

// ============================================
// MRE Dashboard Data Schema
// ============================================

// NOTE: Normalization is handled by dashboard's migrateData function
// These normalize functions were removed to reduce code duplication

// Relaxed schema for import - allows both flat and nested formats
// The dashboard's migrateData function handles the actual normalization
export const REDataSchema = z.object({
  background: z.object({
    analyst: z.string().optional().default(""),
    date: z.string().optional().default(""),
    workstation: z.string().optional().default(""),
    fileName: z.string().optional().default(""),
    fileLocation: z.string().optional().default(""),
    fileTimestampCreated: z.string().optional().default(""),
    fileTimestampModified: z.string().optional().default(""),
    fileTimestampAccessed: z.string().optional().default(""),
    os: z.string().optional().default(""),
    notificationVector: z.string().optional().default(""),
  }).passthrough(),
  // Allow any structure for staticAnalysis - migrateData will handle it
  staticAnalysis: z.record(z.string(), z.unknown()).optional().default({}),
  // Allow any structure for codeBehavior/runtimeBehavior/codeAnalysis
  codeBehavior: z.record(z.string(), z.unknown()).optional().default({}),
  runtimeBehavior: z.record(z.string(), z.unknown()).optional(),
  codeAnalysis: z.record(z.string(), z.unknown()).optional(),
  deepDive: z.record(z.string(), z.unknown()).optional().default({}),
  // Detection section - allow various field names
  // z.any() is intentional: array item shapes vary by user input and app version;
  // migrateData normalizes them after validation.
  detection: z.object({
    mbcMapping: z.array(z.any()).optional().default([]),
    yaraSignature: z.string().optional().default(""),
    iocs: z.array(z.any()).optional().default([]),
    summary: z.record(z.string(), z.unknown()).optional(),
    conclusionLog: z.array(z.any()).optional(),
  }).optional(),
  // Legacy field names at root level
  malwareBehaviorMapping: z.array(z.any()).optional(),
  yaraSignature: z.string().optional(),
  iocTable: z.array(z.any()).optional(),
  summary: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

// MIA Dashboard Data Schema
export const MitreTechniqueSchema = z.object({
  id: z.string(), 
  name: z.string() 
});

// Artifact schema for MIA Dashboard - flexible to handle different formats
export const ArtifactSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.string(),
  md5: z.string().optional().default(""),
  sha256: z.string(),
  addedAt: z.string().optional().default(""),
  usedIn: z.array(z.string()).optional().default([]),
  notes: z.string().optional(), // Legacy field from sample data
});

// NOTE: DFIR normalization is handled by MIADashboard's migrateData function
// These normalize functions were removed to reduce code duplication

// Relaxed schema for import - allows both flat and nested formats
// The dashboard's internal logic handles the actual normalization
export const DFIRDataSchema = z.object({
  background: z.object({
    caseId: z.string().optional().default(""),
    analyst: z.string().optional().default(""),
    date: z.string().optional().default(""),
    workstation: z.string().optional().default(""),
    source: z.string().optional().default(""),
    infectionVector: z.string().optional().default(""),
  }).passthrough(),
  // Allow both sampleInfo and sampleInformation
  sampleInfo: z.record(z.string(), z.unknown()).optional(),
  sampleInformation: z.record(z.string(), z.unknown()).optional(),
  // Allow any structure for staticAnalysis
  staticAnalysis: z.record(z.string(), z.unknown()).optional().default({}),
  // Allow any structure for behaviorAnalysis  
  behaviorAnalysis: z.record(z.string(), z.unknown()).optional().default({}),
  // Allow both mitreMapping and mitreAttackMapping
  // z.any() is intentional: technique objects vary by format version; migrateData normalizes.
  mitreMapping: z.record(z.string(), z.array(z.any())).optional(),
  mitreAttackMapping: z.record(z.string(), z.array(z.any())).optional(),
  // Allow both impact and impactAssessment
  impact: z.record(z.string(), z.unknown()).optional(),
  impactAssessment: z.record(z.string(), z.unknown()).optional(),
  // Allow both iocs and iocTable
  // z.any() is intentional: item shapes vary by user input; migrateData normalizes.
  iocs: z.array(z.any()).optional().default([]),
  iocTable: z.array(z.any()).optional(),
  recommendations: z.object({
    shortTerm: z.string().optional().default(""),
    longTerm: z.string().optional().default(""),
  }).optional().default({ shortTerm: "", longTerm: "" }),
  // Allow both timeline and attackTimeline
  // z.any() is intentional: item shapes vary by user input; migrateData normalizes.
  timeline: z.array(z.any()).optional().default([]),
  attackTimeline: z.array(z.any()).optional(),
  // Allow both artifacts and evidenceArtifacts
  // z.any() is intentional: item shapes vary by user input; migrateData normalizes.
  artifacts: z.array(z.any()).optional().default([]),
  evidenceArtifacts: z.array(z.any()).optional(),
}).passthrough();

// ============================================
// MITRE STIX Bundle Schema (detailed for mitreUtils.ts)
// ============================================

// Zod schemas for STIX data validation
const ExternalReferenceSchema = z.object({
  external_id: z.string().optional(),
  source_name: z.string(),
  url: z.string().optional(),
}).passthrough();

const KillChainPhaseSchema = z.object({
  kill_chain_name: z.string(),
  phase_name: z.string(),
}).passthrough();

// MITRE STIX objects - define known fields with proper types for TypeScript inference
export const MitreStixObjectSchema = z.object({
  type: z.string(),
  id: z.string(),
  name: z.string().optional(),
  external_references: z.array(ExternalReferenceSchema).optional(),
  x_mitre_deprecated: z.boolean().optional(),
  revoked: z.boolean().optional(),
  x_mitre_is_subtechnique: z.boolean().optional(),
  x_mitre_version: z.string().optional(),
  kill_chain_phases: z.array(KillChainPhaseSchema).optional(),
}).passthrough(); // Allow all additional fields - STIX objects are highly varied

export const MitreStixBundleSchema = z.object({
  type: z.string(),
  id: z.string(),
  objects: z.array(MitreStixObjectSchema),
}).passthrough(); // Allow spec_version and other fields at bundle level

// TypeScript types inferred from Zod schemas
export type MitreStixObject = z.infer<typeof MitreStixObjectSchema>;
export type MitreStixBundle = z.infer<typeof MitreStixBundleSchema>;


// ============================================
// Validation Functions
// ============================================

/**
 * Format Zod validation issues into a human-readable error message.
 * Shows up to 5 specific field errors with their paths.
 */
export function formatZodErrors(issues: z.ZodIssue[]): string {
  if (issues.length === 0) return "Unknown validation error";

  const formatted = issues.slice(0, 5).map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });

  const summary = issues.length > 5
    ? ` (${issues.length} total issues)`
    : "";

  return `Validation failed${summary}:\n${formatted.join("\n")}`;
}

/**
 * Check if data structure matches MRE format
 * MRE has: staticAnalysis with sha256/impHash, codeBehavior/runtimeBehavior, detection
 */
function isMREStructure(data: Record<string, unknown>): boolean {
  // Check for MRE-specific sections
  const staticAnalysis = data.staticAnalysis as Record<string, unknown> | undefined;
  const hasCodeBehavior = Boolean(data.codeBehavior || data.runtimeBehavior || data.codeAnalysis);
  const hasDetection = Boolean(data.detection || data.malwareBehaviorMapping || data.yaraSignature);
  
  // Check for MRE-specific staticAnalysis fields
  if (staticAnalysis) {
    const hasOsintLookup = Boolean(staticAnalysis.osintLookup || staticAnalysis.virusTotal);
    const hasPackingAnalysis = Boolean(staticAnalysis.packingAnalysis || staticAnalysis.isPacked);
    const hasBasicFileInfo = Boolean(staticAnalysis.basicFileInfo || staticAnalysis.sha256);
    
    if (hasOsintLookup || hasPackingAnalysis || hasBasicFileInfo || hasCodeBehavior || hasDetection) {
      return true;
    }
  }
  
  return hasCodeBehavior || hasDetection;
}

/**
 * Check if data structure matches MIA format
 * MIA has: sampleInfo/sampleInformation, behaviorAnalysis, mitreMapping, impact, timeline, artifacts
 */
function isMIAStructure(data: Record<string, unknown>): boolean {
  // Check for MIA-specific sections
  const hasSampleInfo = Boolean(data.sampleInfo || data.sampleInformation);
  const hasBehaviorAnalysis = Boolean(data.behaviorAnalysis);
  const hasMitreMapping = Boolean(data.mitreMapping || data.mitreAttackMapping);
  const hasImpact = Boolean(data.impact || data.impactAssessment);
  const hasTimeline = Boolean(data.timeline || data.attackTimeline);
  const hasArtifacts = Boolean(data.artifacts || data.evidenceArtifacts);
  
  // MIA requires at least sampleInfo or multiple MIA-specific sections
  return hasSampleInfo || (hasBehaviorAnalysis && hasMitreMapping) || 
         (hasImpact && hasTimeline) || hasArtifacts;
}

/**
 * Validate and parse RE data from file import
 * Uses relaxed schema - dashboard's migrateData handles normalization
 * Also validates that the data structure matches MRE format
 */
export function validateREData(jsonString: string): { success: true; data: REData } | { success: false; error: string } {
  try {
    if (!validateFileSize(jsonString)) {
      return { success: false, error: "File too large (max 5MB)" };
    }
    
    const parsed = safeJsonParse<Record<string, unknown>>(jsonString);
    
    // Basic structure check - must have background
    if (!parsed.background || typeof parsed.background !== 'object') {
      return { success: false, error: "Missing required 'background' section" };
    }
    
    // Check if this looks like MIA data instead of MRE
    if (isMIAStructure(parsed) && !isMREStructure(parsed)) {
      return { success: false, error: "This appears to be a MIA report. Please import it in the MIA dashboard." };
    }
    
    const result = REDataSchema.safeParse(parsed);

    if (!result.success) {
      debugError("RE validation errors:", result.error.issues);
      return { success: false, error: formatZodErrors(result.error.issues) };
    }

    return { success: true, data: result.data as unknown as REData };
  } catch (e) {
    debugError("JSON parse error:", e);
    return { success: false, error: "Invalid JSON file" };
  }
}

/**
 * Validate and parse DFIR data from file import
 * Uses relaxed schema - dashboard's internal logic handles normalization
 * Also validates that the data structure matches MIA format
 */
export function validateDFIRData(jsonString: string): { success: true; data: DFIRData } | { success: false; error: string } {
  try {
    if (!validateFileSize(jsonString)) {
      return { success: false, error: "File too large (max 5MB)" };
    }
    
    const parsed = safeJsonParse<Record<string, unknown>>(jsonString);
    
    // Basic structure check - must have background
    if (!parsed.background || typeof parsed.background !== 'object') {
      return { success: false, error: "Missing required 'background' section" };
    }
    
    // Check if this looks like MRE data instead of MIA
    if (isMREStructure(parsed) && !isMIAStructure(parsed)) {
      return { success: false, error: "This appears to be a MRE report. Please import it in the MRE dashboard." };
    }
    
    const result = DFIRDataSchema.safeParse(parsed);

    if (!result.success) {
      debugError("DFIR validation errors:", result.error.issues);
      return { success: false, error: formatZodErrors(result.error.issues) };
    }

    return { success: true, data: result.data as unknown as DFIRData };
  } catch (e) {
    debugError("JSON parse error:", e);
    return { success: false, error: "Invalid JSON file" };
  }
}

/**
 * Validate image registry from localStorage
 */
export function validateImageRegistry(data: unknown): z.infer<typeof ImageRegistrySchema> | null {
  const result = ImageRegistrySchema.safeParse(data);
  if (!result.success) {
    debugWarn("Image registry validation failed:", result.error.issues);
    return null;
  }
  return result.data;
}
