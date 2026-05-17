/**
 * Migration functions for MRE Dashboard data
 * Handles converting old data formats to the current format
 */

import { generateId } from "@/lib/utils";
import { extractLogText } from "@/lib/export/helpers";
import { createInitialCodeAnalysisData, createInitialDeepDiveData } from "@/features/mre/services/codeAnalysisDefaults";
import { createInitialRuntimeBehavior, RuntimeBehaviorData } from "@/features/mre/components/runtime-behavior";
import type { UnpackLayer, PESectionData } from "@/types/dashboard";
import type { REData } from "@/features/mre/types";
import { createInitialREData } from "./constants";

/**
 * Migrate old unpackNotes to unpackLayers format
 */
function migrateUnpackLayers(layers: unknown): UnpackLayer[] {
  if (Array.isArray(layers) && layers.length > 0) {
    return layers.map((layer: Record<string, unknown>) => ({
      id: typeof layer.id === "string" ? layer.id : generateId(),
      layerNumber: Number(layer.layerNumber) || 1,
      packerType: typeof layer.packerType === "string" ? layer.packerType : "",
      oep: typeof layer.oep === "string" ? layer.oep : "",
      unpackingMethod: typeof layer.unpackingMethod === "string" ? layer.unpackingMethod : "",
      outputType: typeof layer.outputType === "string" ? layer.outputType : typeof layer.outputLocation === "string" ? layer.outputLocation : "",
      tools: typeof layer.tools === "string" ? layer.tools : "",
      antiAnalysis: typeof layer.antiAnalysis === "string" ? layer.antiAnalysis : "",
      indicators: typeof layer.indicators === "string" ? layer.indicators : "",
      cleanedHash: typeof layer.cleanedHash === "string" ? layer.cleanedHash : "",
    }));
  }
  return [];
}

/**
 * Migrate old peSections to new format
 */
function migratePeSections(saved: Record<string, unknown>): PESectionData[] {
  const rawSA = saved.staticAnalysis;
  const staticAnalysis = (rawSA && typeof rawSA === "object" && !Array.isArray(rawSA)) ? rawSA as Record<string, unknown> : undefined;

  if (Array.isArray(staticAnalysis?.peSections)) {
    return staticAnalysis.peSections as PESectionData[];
  }

  // Migrate from old peSectionsEntropyLog format
  if (Array.isArray(staticAnalysis?.peSectionsEntropyLog)) {
    return (staticAnalysis.peSectionsEntropyLog as Record<string, unknown>[]).map((entry) => ({
      id: (typeof entry.id === "string" ? entry.id : "") || generateId(),
      sectionName: "",
      size: "",
      entropy: "",
      permissions: "",
      sectionHash: "",
      images: Array.isArray(entry.images) ? entry.images.filter((i): i is string => typeof i === "string") : [],
      timestamp: (typeof entry.timestamp === "string" ? entry.timestamp : "") || new Date().toISOString(),
    }));
  }
  return [];
}

/**
 * Migrate runtimeBehavior from nested format
 */
function migrateRuntimeBehavior(rb: Record<string, unknown> | undefined): RuntimeBehaviorData {
  if (!rb) return createInitialRuntimeBehavior();

  // Check if it's the new nested format
  const rawAA = rb.antiAnalysisEvasion;
  const antiAnalysis = (rawAA && typeof rawAA === "object" && !Array.isArray(rawAA)) ? rawAA as Record<string, unknown> : {};
  const rawEB = rb.executionBehavior;
  const execBehavior = (rawEB && typeof rawEB === "object" && !Array.isArray(rawEB)) ? rawEB as Record<string, unknown> : {};
  const rawTR = rb.technicalRuntime;
  const techRuntime = (rawTR && typeof rawTR === "object" && !Array.isArray(rawTR)) ? rawTR as Record<string, unknown> : {};

  const getArray = <T>(...sources: unknown[]): T[] => {
    for (const s of sources) {
      if (Array.isArray(s)) return s as T[];
    }
    return [];
  };
  const getBool = (...sources: unknown[]): boolean => {
    for (const s of sources) {
      if (typeof s === "boolean") return s;
    }
    return false;
  };

  return {
    triggers: getArray<RuntimeBehaviorData['triggers'][number]>(antiAnalysis.triggers, rb.triggers),
    triggersEnabled: getBool(antiAnalysis.triggersEnabled, rb.triggersEnabled),
    antiDebug: getArray<RuntimeBehaviorData['antiDebug'][number]>(antiAnalysis.antiDebug, rb.antiDebug),
    antiDebugEnabled: getBool(antiAnalysis.antiDebugEnabled, rb.antiDebugEnabled),
    antiVM: getArray<RuntimeBehaviorData['antiVM'][number]>(antiAnalysis.antiVM, rb.antiVM),
    antiVMEnabled: getBool(antiAnalysis.antiVMEnabled, rb.antiVMEnabled),
    executionFlow: getArray<RuntimeBehaviorData['executionFlow'][number]>(execBehavior.executionFlow, rb.executionFlow),
    executionFlowEnabled: getBool(execBehavior.executionFlowEnabled, rb.executionFlowEnabled),
    systemArtifacts: getArray<RuntimeBehaviorData['systemArtifacts'][number]>(execBehavior.systemArtifacts, rb.systemArtifacts),
    systemArtifactsEnabled: getBool(execBehavior.systemArtifactsEnabled, rb.systemArtifactsEnabled),
    persistence: getArray<RuntimeBehaviorData['persistence'][number]>(execBehavior.persistence, rb.persistence),
    persistenceEnabled: getBool(execBehavior.persistenceEnabled, rb.persistenceEnabled),
    network: getArray<RuntimeBehaviorData['network'][number]>(techRuntime.network, rb.network),
    networkEnabled: getBool(techRuntime.networkEnabled, rb.networkEnabled),
    memory: getArray<RuntimeBehaviorData['memory'][number]>(techRuntime.memory, rb.memory),
    memoryEnabled: getBool(techRuntime.memoryEnabled, rb.memoryEnabled),
    processInjection: getArray<RuntimeBehaviorData['processInjection'][number]>(techRuntime.processInjection, rb.processInjection),
    processInjectionEnabled: getBool(techRuntime.processInjectionEnabled, rb.processInjectionEnabled),
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
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return createInitialREData();

  const savedData = saved as Record<string, unknown>;

  // Support both old flat format and new nested format
  const rawSA = savedData.staticAnalysis;
  const sa = (rawSA && typeof rawSA === "object" && !Array.isArray(rawSA)) ? rawSA as Record<string, unknown> : {};
  const rawOsint = sa.osintLookup;
  const osint = (rawOsint && typeof rawOsint === "object" && !Array.isArray(rawOsint)) ? rawOsint as Record<string, string> : {};
  const rawBI = sa.basicFileInfo;
  const basicInfo = (rawBI && typeof rawBI === "object" && !Array.isArray(rawBI)) ? rawBI as Record<string, string> : {};
  const rawPE = sa.portableExecutableInfo;
  const peInfo = (rawPE && typeof rawPE === "object" && !Array.isArray(rawPE)) ? rawPE as Record<string, string> : {};
  const rawSec = sa.securityPosture;
  const security = (rawSec && typeof rawSec === "object" && !Array.isArray(rawSec)) ? rawSec as Record<string, unknown> : {};
  const rawPack = sa.packingAnalysis;
  const packing = (rawPack && typeof rawPack === "object" && !Array.isArray(rawPack)) ? rawPack as Record<string, unknown> : {};

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

  const rawBg = savedData.background;
  const background = (rawBg && typeof rawBg === "object" && !Array.isArray(rawBg)) ? rawBg as Record<string, string> : {};
  const rawCB = savedData.codeBehavior;
  const codeBehavior = (rawCB && typeof rawCB === "object" && !Array.isArray(rawCB)) ? rawCB as Record<string, unknown> : undefined;
  const rawDet = savedData.detection;
  const detection = (rawDet && typeof rawDet === "object" && !Array.isArray(rawDet)) ? rawDet as Record<string, unknown> : undefined;

  return {
    background: { ...createInitialREData().background, ...background },
    staticAnalysis: {
      // OSINT Lookup - support both nested and flat
      virusTotal: osint.virusTotal ?? (sa.virusTotal as string) ?? "",
      malwareBazaar: osint.malwareBazaar ?? (sa.malwareBazaar as string) ?? "",
      anyRun: osint.anyRun ?? (sa.anyRun as string) ?? "",
      tiNotes: osint.tiNotes ?? (sa.tiNotes as string) ?? extractLogText(sa.osintLookup || sa.osintLookupLog, "\n"),
      // Basic File Info - support both nested and flat
      sha256: basicInfo.sha256 ?? (sa.sha256 as string) ?? "",
      impHash: basicInfo.impHash ?? (sa.impHash as string) ?? "",
      fileType: basicInfo.fileType ?? (sa.fileType as string) ?? ((sa.basicInfo as string)?.split('\n')[0]?.replace('File: ', '') ?? ""),
      magicBytes: basicInfo.magicBytes ?? (sa.magicBytes as string) ?? "",
      fileSize: basicInfo.fileSize ?? (sa.fileSize as string) ?? "",
      fileEntropy: basicInfo.fileEntropy ?? (sa.fileEntropy as string) ?? "",
      compileTime: basicInfo.compileTime ?? (sa.compileTime as string) ?? "",
      fileProperties: basicInfo.fileProperties ?? (sa.fileProperties as string) ?? "",
      // PE Info - support both nested and flat
      entryPoint: peInfo.entryPoint ?? (sa.entryPoint as string) ?? "",
      imageBase: peInfo.imageBase ?? (sa.imageBase as string) ?? "",
      architecture: peInfo.architecture ?? (sa.architecture as string) ?? "",
      numberOfSections: peInfo.numberOfSections ?? (sa.numberOfSections as string) ?? "",
      machine: peInfo.machine ?? (sa.machine as string) ?? "",
      characteristics: peInfo.characteristics ?? (sa.characteristics as string) ?? "",
      subsystem: peInfo.subsystem ?? (sa.subsystem as string) ?? "",
      // Security Posture - support both nested and flat
      signatureStatus: (security.signatureStatus as string) ?? (sa.signatureStatus as string) ?? "",
      dllMitigations,
      // Packing Analysis - support both nested and flat
      isPacked: (packing.isPacked as string) ?? (sa.isPacked as string) ?? "",
      packerSuspected: (packing.packerSuspected as string) ?? (sa.packerSuspected as string) ?? "",
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
      mbcMapping: ((savedData.malwareBehaviorMapping ?? detection?.mbcMapping) as REData['detection']['mbcMapping']) ?? [],
      yaraSignature: ((savedData.yaraSignature ?? detection?.yaraSignature) as string) ?? "",
      iocs: ((savedData.iocTable ?? detection?.iocs) as REData['detection']['iocs']) ?? [],
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
