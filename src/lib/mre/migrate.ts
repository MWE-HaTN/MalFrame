/**
 * Migration functions for MRE Dashboard data
 * Handles converting old data formats to the current format
 */

import { generateId } from "@/lib/utils";
import { extractLogText } from "@/lib/export/helpers";
import { createInitialCodeAnalysisData, createInitialDeepDiveData } from "@/components/CodeAnalysisGroups";
import { initialRuntimeBehavior, RuntimeBehaviorData } from "@/components/runtime-behavior";
import type { UnpackLayer, PESectionData } from "@/types/dashboard";
import type { REData } from "@/types/mre";
import { initialREData } from "./constants";

/**
 * Migrate old unpackNotes to unpackLayers format
 */
function migrateUnpackLayers(layers: unknown): UnpackLayer[] {
  if (Array.isArray(layers) && layers.length > 0) {
    return layers.map((layer: Record<string, unknown>) => ({
      id: (layer.id as string) || generateId(),
      layerNumber: (layer.layerNumber as number) || 1,
      packerType: (layer.packerType as string) || "",
      oep: (layer.oep as string) || "",
      unpackingMethod: (layer.unpackingMethod as string) || "",
      outputType: (layer.outputType as string) || (layer.outputLocation as string) || "",
      tools: (layer.tools as string) || "",
      antiAnalysis: (layer.antiAnalysis as string) || "",
      indicators: (layer.indicators as string) || "",
      cleanedHash: (layer.cleanedHash as string) || "",
    }));
  }
  return [];
}

/**
 * Migrate old peSections to new format
 */
function migratePeSections(saved: Record<string, unknown>): PESectionData[] {
  const staticAnalysis = saved.staticAnalysis as Record<string, unknown> | undefined;
  
  if (Array.isArray(staticAnalysis?.peSections)) {
    return staticAnalysis.peSections as PESectionData[];
  }
  
  // Migrate from old peSectionsEntropyLog format
  if (Array.isArray(staticAnalysis?.peSectionsEntropyLog)) {
    return (staticAnalysis.peSectionsEntropyLog as Record<string, unknown>[]).map((entry) => ({
      id: (entry.id as string) || generateId(),
      sectionName: "",
      size: "",
      entropy: "",
      permissions: "",
      sectionHash: "",
      comments: (entry.text as string) || "",
      images: (entry.images as string[]) || [],
      timestamp: (entry.timestamp as string) || new Date().toISOString(),
    })) as unknown as PESectionData[];
  }
  return [];
}

/**
 * Migrate runtimeBehavior from nested format
 */
function migrateRuntimeBehavior(rb: Record<string, unknown> | undefined): RuntimeBehaviorData {
  if (!rb) return initialRuntimeBehavior;
  
  // Check if it's the new nested format
  const antiAnalysis = (rb.antiAnalysisEvasion || {}) as Record<string, unknown>;
  const execBehavior = (rb.executionBehavior || {}) as Record<string, unknown>;
  const techRuntime = (rb.technicalRuntime || {}) as Record<string, unknown>;
  
  return {
    triggers: (antiAnalysis.triggers || rb.triggers || []) as RuntimeBehaviorData['triggers'],
    triggersEnabled: (antiAnalysis.triggersEnabled ?? rb.triggersEnabled ?? false) as boolean,
    antiDebug: (antiAnalysis.antiDebug || rb.antiDebug || []) as RuntimeBehaviorData['antiDebug'],
    antiDebugEnabled: (antiAnalysis.antiDebugEnabled ?? rb.antiDebugEnabled ?? false) as boolean,
    antiVM: (antiAnalysis.antiVM || rb.antiVM || []) as RuntimeBehaviorData['antiVM'],
    antiVMEnabled: (antiAnalysis.antiVMEnabled ?? rb.antiVMEnabled ?? false) as boolean,
    executionFlow: (execBehavior.executionFlow || rb.executionFlow || []) as RuntimeBehaviorData['executionFlow'],
    executionFlowEnabled: (execBehavior.executionFlowEnabled ?? rb.executionFlowEnabled ?? false) as boolean,
    systemArtifacts: (execBehavior.systemArtifacts || rb.systemArtifacts || []) as RuntimeBehaviorData['systemArtifacts'],
    systemArtifactsEnabled: (execBehavior.systemArtifactsEnabled ?? rb.systemArtifactsEnabled ?? false) as boolean,
    persistence: (execBehavior.persistence || rb.persistence || []) as RuntimeBehaviorData['persistence'],
    persistenceEnabled: (execBehavior.persistenceEnabled ?? rb.persistenceEnabled ?? false) as boolean,
    network: (techRuntime.network || rb.network || []) as RuntimeBehaviorData['network'],
    networkEnabled: (techRuntime.networkEnabled ?? rb.networkEnabled ?? false) as boolean,
    memory: (techRuntime.memory || rb.memory || []) as RuntimeBehaviorData['memory'],
    memoryEnabled: (techRuntime.memoryEnabled ?? rb.memoryEnabled ?? false) as boolean,
    processInjection: (techRuntime.processInjection || rb.processInjection || []) as RuntimeBehaviorData['processInjection'],
    processInjectionEnabled: (techRuntime.processInjectionEnabled ?? rb.processInjectionEnabled ?? false) as boolean,
  };
}

/**
 * Migrate deepDive from nested format
 */
function migrateDeepDive(dd: Record<string, unknown> | undefined): ReturnType<typeof createInitialDeepDiveData> {
  if (!dd) return createInitialDeepDiveData();
  
  const executionStages = dd.executionStages as ReturnType<typeof createInitialDeepDiveData>['executionStages'] | undefined;
  
  return {
    executionStages: executionStages?.length ? executionStages : createInitialDeepDiveData().executionStages,
    // Support both old "cryptoEntries" and new "cryptographyAnalysis"
    cryptoEntries: (dd.cryptographyAnalysis || dd.cryptoEntries || []) as ReturnType<typeof createInitialDeepDiveData>['cryptoEntries'],
    microBehaviors: (dd.microBehaviors || []) as ReturnType<typeof createInitialDeepDiveData>['microBehaviors'],
  };
}

/**
 * Migrate codeAnalysis from old format (object) to new format (array)
 */
function migrateCodeAnalysis(codeAnalysis: Record<string, unknown> | undefined) {
  if (!codeAnalysis) return createInitialCodeAnalysisData();

  // Migrate staticCodeAnalysis
  const staticData = (codeAnalysis.staticCodeAnalysis || {}) as Record<string, unknown>;
  const controlFlow = staticData.controlFlow;
  
  const migratedStatic = {
    interestingFunctions: (staticData.interestingFunctions || []) as unknown[],
    // Convert old controlFlow object to array
    controlFlow: Array.isArray(controlFlow) 
      ? controlFlow 
      : (controlFlow && typeof controlFlow === 'object' && 
         ((controlFlow as Record<string, unknown>).loopBranchNotes || 
          (controlFlow as Record<string, unknown>).cfgObservations || 
          (controlFlow as Record<string, unknown>).stringDecryptionRoutines))
        ? [{ id: generateId(), ...controlFlow as object }]
        : [],
    apiUsage: (staticData.apiUsage || []) as unknown[],
    obfuscation: (staticData.obfuscation || []) as unknown[],
  };

  // Migrate dynamicCodeAnalysis
  const dynamicData = (codeAnalysis.dynamicCodeAnalysis || {}) as Record<string, unknown>;
  const registerStack = dynamicData.registerStack;
  
  const migratedDynamic = {
    breakpointEvents: (dynamicData.breakpointEvents || []) as unknown[],
    memoryRegions: (dynamicData.memoryRegions || []) as unknown[],
    runtimeApiTrace: (dynamicData.runtimeApiTrace || []) as unknown[],
    // Convert old registerStack object to array
    registerStack: Array.isArray(registerStack)
      ? registerStack
      : (registerStack && typeof registerStack === 'object' && 
         ((registerStack as Record<string, unknown>).registersModified || 
          (registerStack as Record<string, unknown>).stackPatterns || 
          (registerStack as Record<string, unknown>).notes))
        ? [{ id: generateId(), ...registerStack as object }]
        : [],
  };

  return {
    staticCodeAnalysis: migratedStatic,
    dynamicCodeAnalysis: migratedDynamic,
  } as ReturnType<typeof createInitialCodeAnalysisData>;
}

/**
 * Main migration function - converts saved data to current format
 */
export function migrateREData(saved: unknown): REData {
  if (!saved) return initialREData;
  
  const savedData = saved as Record<string, unknown>;

  // Support both old flat format and new nested format
  const sa = (savedData.staticAnalysis || {}) as Record<string, unknown>;
  const osint = (sa.osintLookup || {}) as Record<string, string>;
  const basicInfo = (sa.basicFileInfo || {}) as Record<string, string>;
  const peInfo = (sa.portableExecutableInfo || {}) as Record<string, string>;
  const security = (sa.securityPosture || {}) as Record<string, unknown>;
  const packing = (sa.packingAnalysis || {}) as Record<string, unknown>;

  // Handle DLL mitigations migration
  let dllMitigations: string[] = [];
  if (Array.isArray(security.dllMitigations)) {
    dllMitigations = security.dllMitigations as string[];
  } else if (Array.isArray(sa.dllMitigations)) {
    dllMitigations = sa.dllMitigations as string[];
  } else if (typeof sa.dllMitigations === 'object' && sa.dllMitigations !== null) {
    const mitigationsObj = sa.dllMitigations as Record<string, boolean>;
    const labels: Record<string, string> = { 
      aslr: 'ASLR', 
      dep: 'DEP (NX)', 
      cfg: 'CFG', 
      highEntropyVA: 'High Entropy VA', 
      noSEH: 'No SEH', 
      forceIntegrity: 'Force Integrity' 
    };
    dllMitigations = Object.entries(mitigationsObj)
      .filter(([_, v]) => v)
      .map(([k]) => labels[k] || k);
  }

  const background = (savedData.background || {}) as Record<string, string>;
  const codeBehavior = savedData.codeBehavior as Record<string, unknown> | undefined;
  const detection = savedData.detection as Record<string, unknown> | undefined;

  return {
    background: { ...initialREData.background, ...background },
    staticAnalysis: {
      // OSINT Lookup - support both nested and flat
      virusTotal: osint.virusTotal || (sa.virusTotal as string) || "",
      malwareBazaar: osint.malwareBazaar || (sa.malwareBazaar as string) || "",
      anyRun: osint.anyRun || (sa.anyRun as string) || "",
      tiNotes: osint.tiNotes || (sa.tiNotes as string) || extractLogText(sa.osintLookup || sa.osintLookupLog, "\n"),
      // Basic File Info - support both nested and flat
      sha256: basicInfo.sha256 || (sa.sha256 as string) || "",
      impHash: basicInfo.impHash || (sa.impHash as string) || "",
      fileType: basicInfo.fileType || (sa.fileType as string) || ((sa.basicInfo as string)?.split('\n')[0]?.replace('File: ', '') || ""),
      magicBytes: basicInfo.magicBytes || (sa.magicBytes as string) || "",
      fileSize: basicInfo.fileSize || (sa.fileSize as string) || "",
      fileEntropy: basicInfo.fileEntropy || (sa.fileEntropy as string) || "",
      compileTime: basicInfo.compileTime || (sa.compileTime as string) || "",
      fileProperties: basicInfo.fileProperties || (sa.fileProperties as string) || "",
      // PE Info - support both nested and flat
      entryPoint: peInfo.entryPoint || (sa.entryPoint as string) || "",
      imageBase: peInfo.imageBase || (sa.imageBase as string) || "",
      architecture: peInfo.architecture || (sa.architecture as string) || "",
      numberOfSections: peInfo.numberOfSections || (sa.numberOfSections as string) || "",
      machine: peInfo.machine || (sa.machine as string) || "",
      characteristics: peInfo.characteristics || (sa.characteristics as string) || "",
      subsystem: peInfo.subsystem || (sa.subsystem as string) || "",
      // Security Posture - support both nested and flat
      signatureStatus: (security.signatureStatus as string) || (sa.signatureStatus as string) || "",
      dllMitigations,
      // Packing Analysis - support both nested and flat
      isPacked: (packing.isPacked as string) || (sa.isPacked as string) || "",
      packerSuspected: (packing.packerSuspected as string) || (sa.packerSuspected as string) || "",
      unpackLayers: migrateUnpackLayers(packing.unpackLayers || sa.unpackLayers),
      // PE Sections
      peSections: migratePeSections(savedData),
      // Additional fields
      stringsDetection: extractLogText(sa.stringsDetection || sa.stringsEntropyLog || sa.stringsEntropy, "\n"),
      importsExports: extractLogText(sa.importsExports || sa.importsExportsLog, "\n"),
    },
    codeBehavior: {
      runtimeBehavior: migrateRuntimeBehavior(
        (savedData.runtimeBehavior || codeBehavior?.runtimeBehavior) as Record<string, unknown> | undefined
      ),
      codeAnalysis: migrateCodeAnalysis(
        (savedData.codeAnalysis || codeBehavior?.codeAnalysis) as Record<string, unknown> | undefined
      ),
    },
    deepDive: migrateDeepDive(
      ((savedData.codeAnalysis as Record<string, unknown>)?.deepDive || savedData.deepDive) as Record<string, unknown> | undefined
    ),
    detection: {
      mbcMapping: ((savedData.malwareBehaviorMapping || detection?.mbcMapping) as REData['detection']['mbcMapping']) || [],
      yaraSignature: ((savedData.yaraSignature ?? detection?.yaraSignature) as string) ?? "",
      iocs: ((savedData.iocTable || detection?.iocs) as REData['detection']['iocs']) || [],
      summary: ((savedData.summary || detection?.summary) as REData['detection']['summary']) || {
        malwareFamily: ((detection?.conclusionLog as unknown[])?.[0] as Record<string, string>)?.text || (detection?.conclusion as string) || "",
        keyFunctionality: "",
        purpose: "",
        persistence: "",
        environmentImpact: "",
        rootCause: "",
        attribution: "",
        note: "",
      },
    },
  };
}
