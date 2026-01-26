/**
 * Transform functions for MRE Dashboard data export
 */

import type { REData } from "@/types/mre";

/**
 * Transform internal data structure to nested export format matching UI layout
 */
export function transformForExport(data: REData) {
  return {
    // Section 1: Background
    background: data.background,
    
    // Section 2: Static Analysis
    staticAnalysis: {
      osintLookup: {
        virusTotal: data.staticAnalysis.virusTotal,
        malwareBazaar: data.staticAnalysis.malwareBazaar,
        anyRun: data.staticAnalysis.anyRun,
        tiNotes: data.staticAnalysis.tiNotes,
      },
      basicFileInfo: {
        sha256: data.staticAnalysis.sha256,
        impHash: data.staticAnalysis.impHash,
        fileType: data.staticAnalysis.fileType,
        magicBytes: data.staticAnalysis.magicBytes,
        fileSize: data.staticAnalysis.fileSize,
        fileEntropy: data.staticAnalysis.fileEntropy,
        compileTime: data.staticAnalysis.compileTime,
        fileProperties: data.staticAnalysis.fileProperties,
      },
      portableExecutableInfo: {
        entryPoint: data.staticAnalysis.entryPoint,
        imageBase: data.staticAnalysis.imageBase,
        architecture: data.staticAnalysis.architecture,
        numberOfSections: data.staticAnalysis.numberOfSections,
        machine: data.staticAnalysis.machine,
        characteristics: data.staticAnalysis.characteristics,
        subsystem: data.staticAnalysis.subsystem,
      },
      securityPosture: {
        signatureStatus: data.staticAnalysis.signatureStatus,
        dllMitigations: data.staticAnalysis.dllMitigations,
      },
      peSections: data.staticAnalysis.peSections,
      packingAnalysis: {
        isPacked: data.staticAnalysis.isPacked,
        packerSuspected: data.staticAnalysis.packerSuspected,
        unpackLayers: data.staticAnalysis.unpackLayers,
      },
      stringsDetection: data.staticAnalysis.stringsDetection,
      importsExports: data.staticAnalysis.importsExports,
    },
    
    // Section 3: Runtime Behavior
    runtimeBehavior: {
      antiAnalysisEvasion: {
        triggers: data.codeBehavior.runtimeBehavior.triggers,
        triggersEnabled: data.codeBehavior.runtimeBehavior.triggersEnabled,
        antiDebug: data.codeBehavior.runtimeBehavior.antiDebug,
        antiDebugEnabled: data.codeBehavior.runtimeBehavior.antiDebugEnabled,
        antiVM: data.codeBehavior.runtimeBehavior.antiVM,
        antiVMEnabled: data.codeBehavior.runtimeBehavior.antiVMEnabled,
      },
      executionBehavior: {
        executionFlow: data.codeBehavior.runtimeBehavior.executionFlow,
        executionFlowEnabled: data.codeBehavior.runtimeBehavior.executionFlowEnabled,
        systemArtifacts: data.codeBehavior.runtimeBehavior.systemArtifacts,
        systemArtifactsEnabled: data.codeBehavior.runtimeBehavior.systemArtifactsEnabled,
        persistence: data.codeBehavior.runtimeBehavior.persistence,
        persistenceEnabled: data.codeBehavior.runtimeBehavior.persistenceEnabled,
      },
      technicalRuntime: {
        network: data.codeBehavior.runtimeBehavior.network,
        networkEnabled: data.codeBehavior.runtimeBehavior.networkEnabled,
        memory: data.codeBehavior.runtimeBehavior.memory,
        memoryEnabled: data.codeBehavior.runtimeBehavior.memoryEnabled,
        processInjection: data.codeBehavior.runtimeBehavior.processInjection,
        processInjectionEnabled: data.codeBehavior.runtimeBehavior.processInjectionEnabled,
      },
    },
    
    // Section 4: Code Analysis
    codeAnalysis: {
      staticCodeAnalysis: {
        interestingFunctions: data.codeBehavior.codeAnalysis.staticCodeAnalysis.interestingFunctions,
        controlFlow: data.codeBehavior.codeAnalysis.staticCodeAnalysis.controlFlow,
        apiUsage: data.codeBehavior.codeAnalysis.staticCodeAnalysis.apiUsage,
        obfuscation: data.codeBehavior.codeAnalysis.staticCodeAnalysis.obfuscation,
      },
      dynamicCodeAnalysis: {
        breakpointEvents: data.codeBehavior.codeAnalysis.dynamicCodeAnalysis.breakpointEvents,
        memoryRegions: data.codeBehavior.codeAnalysis.dynamicCodeAnalysis.memoryRegions,
        runtimeApiTrace: data.codeBehavior.codeAnalysis.dynamicCodeAnalysis.runtimeApiTrace,
        registerStack: data.codeBehavior.codeAnalysis.dynamicCodeAnalysis.registerStack,
      },
      deepDive: {
        executionStages: data.deepDive.executionStages,
        cryptographyAnalysis: data.deepDive.cryptoEntries,
        microBehaviors: data.deepDive.microBehaviors,
      },
    },
    
    // Section 5: Malware Behavior Mapping
    malwareBehaviorMapping: data.detection?.mbcMapping || [],
    
    // Section 6: YARA Signature
    yaraSignature: data.detection?.yaraSignature || "",
    
    // Section 7: IOC Table
    iocTable: data.detection?.iocs || [],
    
    // Section 8: Summary
    summary: data.detection?.summary || {},
  };
}
