/**
 * Transform functions for MRE Dashboard data export
 */

import type { REData } from "@/features/mre/types";

/**
 * Transform internal data structure to nested export format matching UI layout
 */
export function transformForExport(data: REData) {
  const sa = data.staticAnalysis;
  const rb = data.codeBehavior?.runtimeBehavior;
  const sca = data.codeBehavior?.codeAnalysis?.staticCodeAnalysis;
  const dca = data.codeBehavior?.codeAnalysis?.dynamicCodeAnalysis;
  const dd = data.deepDive;
  return {
    // Section 1: Background
    background: data.background,

    // Section 2: Static Analysis
    staticAnalysis: {
      osintLookup: {
        virusTotal: sa?.virusTotal,
        malwareBazaar: sa?.malwareBazaar,
        anyRun: sa?.anyRun,
        tiNotes: sa?.tiNotes,
      },
      basicFileInfo: {
        sha256: sa?.sha256,
        impHash: sa?.impHash,
        fileType: sa?.fileType,
        magicBytes: sa?.magicBytes,
        fileSize: sa?.fileSize,
        fileEntropy: sa?.fileEntropy,
        compileTime: sa?.compileTime,
        fileProperties: sa?.fileProperties,
      },
      portableExecutableInfo: {
        entryPoint: sa?.entryPoint,
        imageBase: sa?.imageBase,
        architecture: sa?.architecture,
        numberOfSections: sa?.numberOfSections,
        machine: sa?.machine,
        characteristics: sa?.characteristics,
        subsystem: sa?.subsystem,
      },
      securityPosture: {
        signatureStatus: sa?.signatureStatus,
        dllMitigations: sa?.dllMitigations,
      },
      peSections: sa?.peSections ?? [],
      packingAnalysis: {
        isPacked: sa?.isPacked,
        packerSuspected: sa?.packerSuspected,
        unpackLayers: sa?.unpackLayers ?? [],
      },
      stringsDetection: sa?.stringsDetection,
      importsExports: sa?.importsExports,
    },

    // Section 3: Runtime Behavior
    runtimeBehavior: {
      antiAnalysisEvasion: {
        triggers: rb?.triggers ?? [],
        triggersEnabled: rb?.triggersEnabled ?? false,
        antiDebug: rb?.antiDebug ?? [],
        antiDebugEnabled: rb?.antiDebugEnabled ?? false,
        antiVM: rb?.antiVM ?? [],
        antiVMEnabled: rb?.antiVMEnabled ?? false,
      },
      executionBehavior: {
        executionFlow: rb?.executionFlow ?? [],
        executionFlowEnabled: rb?.executionFlowEnabled ?? false,
        systemArtifacts: rb?.systemArtifacts ?? [],
        systemArtifactsEnabled: rb?.systemArtifactsEnabled ?? false,
        persistence: rb?.persistence ?? [],
        persistenceEnabled: rb?.persistenceEnabled ?? false,
      },
      technicalRuntime: {
        network: rb?.network ?? [],
        networkEnabled: rb?.networkEnabled ?? false,
        memory: rb?.memory ?? [],
        memoryEnabled: rb?.memoryEnabled ?? false,
        processInjection: rb?.processInjection ?? [],
        processInjectionEnabled: rb?.processInjectionEnabled ?? false,
      },
    },

    // Section 4: Code Analysis
    codeAnalysis: {
      staticCodeAnalysis: {
        interestingFunctions: sca?.interestingFunctions ?? [],
        controlFlow: sca?.controlFlow ?? [],
        apiUsage: sca?.apiUsage ?? [],
        obfuscation: sca?.obfuscation ?? [],
      },
      dynamicCodeAnalysis: {
        breakpointEvents: dca?.breakpointEvents ?? [],
        memoryRegions: dca?.memoryRegions ?? [],
        runtimeApiTrace: dca?.runtimeApiTrace ?? [],
        registerStack: dca?.registerStack ?? [],
      },
      deepDive: {
        executionStages: dd?.executionStages ?? [],
        cryptographyAnalysis: dd?.cryptoEntries ?? [],
        microBehaviors: dd?.microBehaviors ?? [],
      },
    },

    // Section 5: Malware Behavior Mapping
    malwareBehaviorMapping: data.detection?.mbcMapping ?? [],

    // Section 6: YARA Signature
    yaraSignature: data.detection?.yaraSignature ?? "",

    // Section 7: IOC Table
    iocTable: data.detection?.iocs ?? [],

    // Section 8: Summary
    summary: data.detection?.summary ?? {},
  };
}
