// Word Export for MRE (Malware Reverse Engineering) - v3
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Header, Footer, PageNumber, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ExternalHyperlink } from "docx";
import { generateFileName } from "@/lib/fileNameUtils";
import { formatReportHeader } from "@/lib/utils";
import {
  extractUnpackLayers,
  formatSignatureStatus,
  formatDllMitigations,
  SEMANTIC_COLORS_HEX,
  getRWXSemanticLevel,
  getEntropySemanticLevel,
  getFieldSemanticLevel,
  hasContentInKeys,
  hasAnyMeaningfulValue,
  downloadBlob,
} from "./helpers";
import type { PESectionData, UnpackLayer } from "@/types/dashboard";
import type { CodeAnalysisData, DeepDiveData } from "@/features/mre/components/CodeAnalysisGroups";
import type { InterestingFunction, ControlFlowEntry, APIUsageEntry, ObfuscationEntry, BreakpointEvent, MemoryRegion, RuntimeAPITrace, CryptoEntry } from "@/features/mre/components/code-analysis/types";
import type { ExecutionStage } from "@/components/ExecutionStages";
import type { RuntimeBehaviorData, TriggerEntry, AntiDebugEntry, AntiVMEntry, ExecutionFlowEntry, SystemArtifactEntry, PersistenceEntry, NetworkBehaviorEntry, MemoryBehaviorEntry, ProcessInjectionEntry } from "@/features/mre/components/runtime-behavior";
import type { REData } from "@/features/mre/types";

const HEADER_COLOR = "006450"; // Teal/Green
const LABEL_COLOR = "000000"; // Black

// Get hex color from semantic level
function getSemanticHex(level: keyof typeof SEMANTIC_COLORS_HEX | null): string | null {
  return level ? SEMANTIC_COLORS_HEX[level] : null;
}

// Get semantic color for RWX permissions
function getRWXColorHex(permissions: string): string | null {
  return getSemanticHex(getRWXSemanticLevel(permissions));
}

// Get semantic color for entropy values
function getEntropyColorHex(entropy: string): string | null {
  return getSemanticHex(getEntropySemanticLevel(entropy));
}

// Get semantic color for a field based on label and value
function getSemanticColorHex(label: string, value: string): string | null {
  return getSemanticHex(getFieldSemanticLevel(label, value));
}

// Helper to extract code analysis (with new field: role)
// Filters out entries that have no meaningful content
function extractCodeAnalysis(codeAnalysis: CodeAnalysisData): Record<string, string> {
  if (!codeAnalysis) return {};
  const extractedResult: Record<string, string> = {};
  const staticCodeData = codeAnalysis.staticCodeAnalysis;
  const dynamicCodeData = codeAnalysis.dynamicCodeAnalysis;


  if (staticCodeData?.interestingFunctions?.length > 0) {
    const filtered = staticCodeData.interestingFunctions
      .filter((e: InterestingFunction) => hasContentInKeys(e, ['functionName', 'rvaAddress', 'role', 'notes']))
      .map((funcEntry: InterestingFunction) => {
        let formattedLine = `${funcEntry.functionName} @ ${funcEntry.rvaAddress}`;
        if (funcEntry.role) formattedLine += ` [Role: ${funcEntry.role}]`;
        if (funcEntry.notes) formattedLine += `: ${funcEntry.notes}`;
        return formattedLine;
      })
      .filter((lineText: string) => lineText.trim() !== " @ ");
    if (filtered.length) extractedResult.interestingFunctions = filtered.join("\n");
  }
  if (staticCodeData?.controlFlow?.length > 0) {
    const filtered = staticCodeData.controlFlow
      .filter((e: ControlFlowEntry) => hasContentInKeys(e, ['loopBranchNotes', 'cfgObservations']))
      .map((cfEntry: ControlFlowEntry) => `Loops/Branch: ${cfEntry.loopBranchNotes}, CFG: ${cfEntry.cfgObservations}`)
      .filter((lineText: string) => lineText.replace(/Loops\/Branch: , CFG: /g, "").trim());
    if (filtered.length) extractedResult.controlFlow = filtered.join("\n");
  }
  if (staticCodeData?.apiUsage?.length > 0) {
    const filtered = staticCodeData.apiUsage
      .filter((e: APIUsageEntry) => hasContentInKeys(e, ['apiName', 'purposeBehavior']))
      .map((apiEntry: APIUsageEntry) => `${apiEntry.apiName}: ${apiEntry.purposeBehavior}`)
      .filter((lineText: string) => lineText.trim() !== ":");
    if (filtered.length) extractedResult.apiUsage = filtered.join("\n");
  }
  if (staticCodeData?.obfuscation?.length > 0) {
    const filtered = staticCodeData.obfuscation
      .filter((e: ObfuscationEntry) => hasContentInKeys(e, ['technique', 'evidence']))
      .map((obfEntry: ObfuscationEntry) => `${obfEntry.technique}: ${obfEntry.evidence}`)
      .filter((lineText: string) => lineText.trim() !== ":");
    if (filtered.length) extractedResult.obfuscation = filtered.join("\n");
  }
  if (dynamicCodeData?.breakpointEvents?.length > 0) {
    const filtered = dynamicCodeData.breakpointEvents
      .filter((e: BreakpointEvent) => hasContentInKeys(e, ['eventType', 'whereTriggered', 'notes']))
      .map((bpEntry: BreakpointEvent) => `[${bpEntry.eventType}] ${bpEntry.whereTriggered}: ${bpEntry.notes}`)
      .filter((lineText: string) => lineText.trim() !== "[] :");
    if (filtered.length) extractedResult.breakpointEvents = filtered.join("\n");
  }
  if (dynamicCodeData?.memoryRegions?.length > 0) {
    const filtered = dynamicCodeData.memoryRegions
      .filter((e: MemoryRegion) => hasContentInKeys(e, ['allocation', 'address', 'behavior']))
      .map((memEntry: MemoryRegion) => `[${memEntry.allocation}] ${memEntry.address}: ${memEntry.behavior}`)
      .filter((lineText: string) => lineText.trim() !== "[] :");
    if (filtered.length) extractedResult.memoryRegions = filtered.join("\n");
  }
  if (dynamicCodeData?.runtimeApiTrace?.length > 0) {
    const filtered = dynamicCodeData.runtimeApiTrace
      .filter((e: RuntimeAPITrace) => hasContentInKeys(e, ['api', 'arguments', 'returnValue']))
      .map((traceEntry: RuntimeAPITrace) => `${traceEntry.api}(${traceEntry.arguments}) → ${traceEntry.returnValue}`)
      .filter((lineText: string) => lineText.trim() !== "() →");
    if (filtered.length) extractedResult.runtimeAPITrace = filtered.join("\n");
  }
  return extractedResult;
}

// Helper to extract deep dive data (with new field: analystHypothesis, entryCondition, etc.)
function extractDeepDive(deepDive: DeepDiveData & { microBehaviors?: { id: string; name: string; objectiveName: string; pathToMd?: string }[] }, unpackLayers: UnpackLayer[]): Record<string, string> {
  const extractedResult: Record<string, string> = {};
  const unpackText = extractUnpackLayers(unpackLayers);
  if (unpackText && unpackText.trim()) extractedResult.unpackingLayers = unpackText;
  
  if (deepDive?.executionStages?.length > 0) {
    const stagesText = deepDive.executionStages
      .map((stageEntry: ExecutionStage) => {
        const hasStageContent =
          (stageEntry.entryCondition && stageEntry.entryCondition.trim()) ||
          (stageEntry.actions && stageEntry.actions.trim()) ||
          (stageEntry.exitCondition && stageEntry.exitCondition.trim()) ||
          (stageEntry.failureAbortBehavior && stageEntry.failureAbortBehavior.trim()) ||
          (stageEntry.entryPoint && stageEntry.entryPoint.trim()) ||
          (stageEntry.purpose && stageEntry.purpose.trim()) ||
          (stageEntry.transitionMethod && stageEntry.transitionMethod.trim()) ||
          (stageEntry.apisUsed && stageEntry.apisUsed.trim()) ||
          (stageEntry.artifacts && stageEntry.artifacts.trim()) ||
          (stageEntry.ioc && stageEntry.ioc.trim());

        if (!hasStageContent) return "";

        const stageParts = [`${stageEntry.stageName}:`];
        if (stageEntry.entryCondition?.trim()) stageParts.push(`  Entry Condition: ${stageEntry.entryCondition}`);
        if (stageEntry.actions?.trim()) stageParts.push(`  Actions: ${stageEntry.actions}`);
        if (stageEntry.exitCondition?.trim()) stageParts.push(`  Exit Condition: ${stageEntry.exitCondition}`);
        if (stageEntry.failureAbortBehavior?.trim()) stageParts.push(`  Failure/Abort: ${stageEntry.failureAbortBehavior}`);
        if (stageEntry.entryPoint?.trim()) stageParts.push(`  Entry Point: ${stageEntry.entryPoint}`);
        if (stageEntry.purpose?.trim()) stageParts.push(`  Purpose: ${stageEntry.purpose}`);
        return stageParts.join("\n");
      })
      .filter((lineText: string) => Boolean(lineText?.trim()))
      .join("\n\n");
    
    if (stagesText.trim()) extractedResult.executionStages = stagesText;
  }
  if (deepDive?.cryptoEntries?.length > 0) {
    const cryptoText = deepDive.cryptoEntries
      .map((cryptoEntry: CryptoEntry) => {
        // Check if has meaningful content
        const hasAlgo = cryptoEntry.algorithm && cryptoEntry.algorithm.trim();
        const hasKeyIv = cryptoEntry.keyIv && cryptoEntry.keyIv.trim();
        const hasApis = cryptoEntry.cryptoApis && cryptoEntry.cryptoApis.trim();
        if (!hasAlgo && !hasKeyIv && !hasApis) return "";
        
        let formattedLine = `${cryptoEntry.algorithm || '-'}: Key/IV=${cryptoEntry.keyIv || '-'}, APIs=${cryptoEntry.cryptoApis || '-'}`;
        if (cryptoEntry.analystHypothesis?.trim()) formattedLine += `\n  [Analyst Hypothesis] ${cryptoEntry.analystHypothesis}`;
        return formattedLine;
      })
      .filter((lineText: string) => lineText.trim() && !lineText.startsWith("-: Key/IV=-, APIs=-"))
      .join("\n");
    
    if (cryptoText.trim()) extractedResult.cryptography = cryptoText;
  }
  if (deepDive?.microBehaviors?.length > 0) {
    const microText = deepDive.microBehaviors
      .filter((microEntry: { id: string; name: string; objectiveName: string; pathToMd?: string }) => microEntry.id && microEntry.id.trim() && microEntry.name && microEntry.name.trim())
      .map((microEntry: { id: string; name: string; objectiveName: string; pathToMd?: string }) => {
        const objectiveSlug = (microEntry.objectiveName || '').toLowerCase().replace(/\s+/g, '-');
        const behaviorUrl = microEntry.pathToMd 
          ? `https://github.com/MBCProject/mbc-markdown/blob/main/${microEntry.pathToMd}`
          : `https://github.com/MBCProject/mbc-markdown/blob/main/micro-behaviors/${objectiveSlug}/${microEntry.id.toLowerCase()}.md`;
        return `[${microEntry.id}](${behaviorUrl}) (${microEntry.name}) - ${microEntry.objectiveName || '-'}`;
      })
      .join("\n");
    
    if (microText.trim()) extractedResult.microBehaviors = microText;
  }
  return extractedResult;
}

// Helper to extract runtime behavior (with new field: effect)
// Filters out entries that have no meaningful content
function extractRuntimeBehaviorWithEffect(runtimeBehavior: RuntimeBehaviorData): Record<string, string> {
  if (!runtimeBehavior) return {};
  const extractedResult: Record<string, string> = {};

  if (runtimeBehavior.triggersEnabled && runtimeBehavior.triggers?.length > 0) {
    const filtered = runtimeBehavior.triggers
      .filter((e: TriggerEntry) => hasContentInKeys(e, ['name', 'description']))
      .map((triggerEntry: TriggerEntry) => `${triggerEntry.name}: ${triggerEntry.description}`)
      .filter((lineText: string) => lineText.trim() !== ":");
    if (filtered.length) extractedResult.triggers = filtered.join("\n");
  }
  if (runtimeBehavior.antiDebugEnabled && runtimeBehavior.antiDebug?.length > 0) {
    const filtered = runtimeBehavior.antiDebug
      .filter((e: AntiDebugEntry) => hasContentInKeys(e, ['categoryTags', 'apis', 'effect', 'notes']))
      .map((debugEntry: AntiDebugEntry) => {
        let formattedLine = `[${debugEntry.categoryTags?.join(", ")}] APIs: ${debugEntry.apis?.join(", ")}`;
        if (debugEntry.effect) formattedLine += ` | Effect: ${debugEntry.effect}`;
        if (debugEntry.notes) formattedLine += ` - ${debugEntry.notes}`;
        return formattedLine;
      })
      .filter((lineText: string) => lineText.trim() && lineText !== "[] APIs: ");
    if (filtered.length) extractedResult.antiDebug = filtered.join("\n");
  }
  if (runtimeBehavior.antiVMEnabled && runtimeBehavior.antiVM?.length > 0) {
    const filtered = runtimeBehavior.antiVM
      .filter((e: AntiVMEntry) => hasContentInKeys(e, ['methodTags', 'indicator', 'effect', 'notes']))
      .map((vmEntry: AntiVMEntry) => {
        let formattedLine = `[${vmEntry.methodTags?.join(", ")}] ${vmEntry.indicator}`;
        if (vmEntry.effect) formattedLine += ` | Effect: ${vmEntry.effect}`;
        if (vmEntry.notes) formattedLine += ` - ${vmEntry.notes}`;
        return formattedLine;
      })
      .filter((lineText: string) => lineText.trim() && lineText !== "[] ");
    if (filtered.length) extractedResult.antiVM = filtered.join("\n");
  }
  if (runtimeBehavior.executionFlowEnabled && runtimeBehavior.executionFlow?.length > 0) {
    const filtered = runtimeBehavior.executionFlow
      .filter((e: ExecutionFlowEntry) => hasContentInKeys(e, ['stepName', 'description']))
      .map((flowEntry: ExecutionFlowEntry) => `${flowEntry.stepName}: ${flowEntry.description}`)
      .filter((lineText: string) => lineText.trim() !== ":");
    if (filtered.length) extractedResult.executionFlow = filtered.join("\n");
  }
  if (runtimeBehavior.systemArtifactsEnabled && runtimeBehavior.systemArtifacts?.length > 0) {
    const filtered = runtimeBehavior.systemArtifacts
      .filter((e: SystemArtifactEntry) => hasContentInKeys(e, ['typeTags', 'path', 'notes']))
      .map((artifactEntry: SystemArtifactEntry) => `[${artifactEntry.typeTags?.join(", ")}] ${artifactEntry.path} - ${artifactEntry.notes}`)
      .filter((lineText: string) => lineText.trim() && lineText !== "[]  - ");
    if (filtered.length) extractedResult.systemArtifacts = filtered.join("\n");
  }
  if (runtimeBehavior.persistenceEnabled && runtimeBehavior.persistence?.length > 0) {
    const filtered = runtimeBehavior.persistence
      .filter((e: PersistenceEntry) => hasContentInKeys(e, ['typeTags', 'path', 'notes']))
      .map((persistEntry: PersistenceEntry) => `[${persistEntry.typeTags?.join(", ")}] ${persistEntry.path} - ${persistEntry.notes}`)
      .filter((lineText: string) => lineText.trim() && lineText !== "[]  - ");
    if (filtered.length) extractedResult.persistence = filtered.join("\n");
  }
  if (runtimeBehavior.networkEnabled && runtimeBehavior.network?.length > 0) {
    const filtered = runtimeBehavior.network
      .filter((e: NetworkBehaviorEntry) => hasContentInKeys(e, ['behaviorTags', 'indicator', 'notes']))
      .map((netEntry: NetworkBehaviorEntry) => `[${netEntry.behaviorTags?.join(", ")}] ${netEntry.indicator} - ${netEntry.notes}`)
      .filter((lineText: string) => lineText.trim() && lineText !== "[]  - ");
    if (filtered.length) extractedResult.networkBehavior = filtered.join("\n");
  }
  if (runtimeBehavior.memoryEnabled && runtimeBehavior.memory?.length > 0) {
    const filtered = runtimeBehavior.memory
      .filter((e: MemoryBehaviorEntry) => hasContentInKeys(e, ['eventTags', 'region', 'notes']))
      .map((memEntry: MemoryBehaviorEntry) => `[${memEntry.eventTags?.join(", ")}] ${memEntry.region} - ${memEntry.notes}`)
      .filter((lineText: string) => lineText.trim() && lineText !== "[]  - ");
    if (filtered.length) extractedResult.memoryBehavior = filtered.join("\n");
  }
  if (runtimeBehavior.processInjectionEnabled && runtimeBehavior.processInjection?.length > 0) {
    const filtered = runtimeBehavior.processInjection
      .filter((e: ProcessInjectionEntry) => hasContentInKeys(e, ['techniqueTags', 'targetProcess', 'apiChain', 'notes']))
      .map((injectionEntry: ProcessInjectionEntry) => `[${injectionEntry.techniqueTags?.join(", ")}] Target: ${injectionEntry.targetProcess}, APIs: ${injectionEntry.apiChain?.join(" → ")} - ${injectionEntry.notes}`)
      .filter((lineText: string) => lineText.trim() && lineText !== "[] Target: , APIs:  - ");
    if (filtered.length) extractedResult.processInjection = filtered.join("\n");
  }
  return extractedResult;
}

// Roman numeral conversion
const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// Section counter for Roman numerals
let sectionCounter = 0;

function resetSectionCounter() {
  sectionCounter = 0;
}

// Create section header paragraph with Roman numeral (like "I. BACKGROUND")
function createSectionHeader(title: string): Paragraph {
  const romanNumeral = ROMAN_NUMERALS[sectionCounter] || String(sectionCounter + 1);
  sectionCounter++;
  
  return new Paragraph({
    children: [
      new TextRun({ text: `${romanNumeral}. ${title.toUpperCase()}`, bold: true, color: HEADER_COLOR, size: 26 }),
    ],
    spacing: { before: 300, after: 150 },
  });
}

// Create subsection header paragraph
function createSubsectionHeader(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: title.toUpperCase(), bold: true, color: HEADER_COLOR, size: 22 }),
    ],
    spacing: { before: 200, after: 100 },
  });
}

// Create a two-column table for fields with semantic colors
// Only creates rows where at least one field has data - no empty rows
function createTwoColumnFields(fields: Array<{ label: string; value: string }>): Table | null {
  const invisibleBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const tableRows: TableRow[] = [];
  
  // Filter to only fields with values
  const filteredFields = fields.filter(f => f.value?.trim());
  
  // If no data, return null
  if (filteredFields.length === 0) return null;
  
  // If only one field, use single column layout
  if (filteredFields.length === 1) {
    const field = filteredFields[0];
    const semanticColor = getSemanticColorHex(field.label, field.value || "");
    tableRows.push(new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: field.label.toUpperCase(), bold: true, color: LABEL_COLOR, size: 18 })],
            }),
            new Paragraph({
              children: [new TextRun({ 
                text: field.value, 
                size: 20, 
                color: semanticColor || "000000",
                bold: semanticColor !== null,
              })],
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: invisibleBorder, bottom: invisibleBorder, left: invisibleBorder, right: invisibleBorder },
        }),
      ],
    }));
  } else {
    // Two column layout
    for (let fieldIndex = 0; fieldIndex < filteredFields.length; fieldIndex += 2) {
      const leftField = filteredFields[fieldIndex];
      const rightField = filteredFields[fieldIndex + 1];
      
      const rowCells: TableCell[] = [];
      
      // Left cell with semantic color
      const leftSemanticColor = getSemanticColorHex(leftField.label, leftField.value || "");
      rowCells.push(new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: leftField.label.toUpperCase(), bold: true, color: LABEL_COLOR, size: 18 })],
          }),
          new Paragraph({
            children: [new TextRun({ 
              text: leftField.value, 
              size: 20, 
              color: leftSemanticColor || "000000",
              bold: leftSemanticColor !== null,
            })],
          }),
        ],
        width: { size: rightField ? 50 : 100, type: WidthType.PERCENTAGE },
        borders: { top: invisibleBorder, bottom: invisibleBorder, left: invisibleBorder, right: invisibleBorder },
      }));
      
      // Right cell - only add if exists
      if (rightField) {
        const rightSemanticColor = getSemanticColorHex(rightField.label, rightField.value || "");
        rowCells.push(new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: rightField.label.toUpperCase(), bold: true, color: LABEL_COLOR, size: 18 })],
            }),
            new Paragraph({
              children: [new TextRun({ 
                text: rightField.value, 
                size: 20,
                color: rightSemanticColor || "000000",
                bold: rightSemanticColor !== null,
              })],
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: { top: invisibleBorder, bottom: invisibleBorder, left: invisibleBorder, right: invisibleBorder },
        }));
      }
      
      tableRows.push(new TableRow({ children: rowCells }));
    }
  }
  
  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// Create two sections side by side (like Basic File Info + Execution Context)
// If only one section has data, render it at full width
function createSideBySideSections(
  leftTitle: string,
  leftFields: Array<{ label: string; value: string }>,
  rightTitle: string,
  rightFields: Array<{ label: string; value: string }>
): Table | null {
  const invisibleBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  
  // Filter fields
  const leftFiltered = leftFields.filter(f => f.value?.trim());
  const rightFiltered = rightFields.filter(f => f.value?.trim());
  
  // If no data at all, return null
  if (leftFiltered.length === 0 && rightFiltered.length === 0) return null;
  
  const hasBothSections = leftFiltered.length > 0 && rightFiltered.length > 0;
  
  // Helper to build section paragraphs
  const buildSectionParagraphs = (title: string, fields: Array<{ label: string; value: string }>): Paragraph[] => {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        children: [new TextRun({ text: title.toUpperCase(), bold: true, color: HEADER_COLOR, size: 20 })],
        spacing: { after: 100 },
      }),
    ];
    for (const fieldEntry of fields) {
      const semanticColor = getSemanticColorHex(fieldEntry.label, fieldEntry.value);
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: fieldEntry.label.toUpperCase(), bold: true, color: LABEL_COLOR, size: 18 })],
          spacing: { before: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ 
            text: fieldEntry.value, 
            size: 20,
            color: semanticColor || "000000",
            bold: semanticColor !== null,
          })],
        })
      );
    }
    return paragraphs;
  };
  
  if (!hasBothSections) {
    // Single section mode - full width
    const title = leftFiltered.length > 0 ? leftTitle : rightTitle;
    const fields = leftFiltered.length > 0 ? leftFiltered : rightFiltered;
    const sectionParagraphs = buildSectionParagraphs(title, fields);
    
    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: sectionParagraphs,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: invisibleBorder, bottom: invisibleBorder, left: invisibleBorder, right: invisibleBorder },
            }),
          ],
        }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  }
  
  // Two sections side by side
  const leftSectionParagraphs = buildSectionParagraphs(leftTitle, leftFiltered);
  const rightSectionParagraphs = buildSectionParagraphs(rightTitle, rightFiltered);
  
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: leftSectionParagraphs,
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: { top: invisibleBorder, bottom: invisibleBorder, left: invisibleBorder, right: invisibleBorder },
          }),
          new TableCell({
            children: rightSectionParagraphs,
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: { top: invisibleBorder, bottom: invisibleBorder, left: invisibleBorder, right: invisibleBorder },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// Create PE Sections table with semantic colors for Entropy and RWX
function createPESectionsTable(sections: PESectionData[]): Table {
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const columnHeaders = ["#", "NAME", "SIZE", "ENTROPY", "RWX", "HASH"];
  
  const headerCells = columnHeaders.map((headerText, columnIndex) => 
    new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: headerText, bold: true, color: "000000", size: 18 })],
      })],
      width: { size: columnIndex === 0 ? 5 : columnIndex === 1 ? 20 : 15, type: WidthType.PERCENTAGE },
      borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
    })
  );
  
  const tableRows = [new TableRow({ children: headerCells })];
  
  sections.forEach((sectionData, sectionIndex) => {
    const entropyColor = getEntropyColorHex(sectionData.entropy || "");
    const rwxColor = getRWXColorHex(sectionData.permissions || "");
    
    const cellConfigs = [
      { text: String(sectionIndex + 1), color: null as string | null, bold: false },
      { text: sectionData.sectionName || "-", color: null, bold: false },
      { text: sectionData.size || "-", color: null, bold: false },
      { text: sectionData.entropy || "-", color: entropyColor, bold: entropyColor !== null },
      { text: sectionData.permissions || "-", color: rwxColor, bold: rwxColor !== null },
      { text: sectionData.sectionHash || "-", color: null, bold: false },
    ];
    
    const dataCells = cellConfigs.map((cellConfig, columnIndex) => 
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ 
            text: cellConfig.text, 
            size: 20, 
            color: cellConfig.color || "000000",
            bold: cellConfig.bold,
          })],
        })],
        width: { size: columnIndex === 0 ? 5 : columnIndex === 1 ? 20 : 15, type: WidthType.PERCENTAGE },
        borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
      })
    );
    tableRows.push(new TableRow({ children: dataCells }));
  });
  
  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// Create key-value paragraphs with semantic colors for anti-analysis fields
// Parse markdown-style links [text](url) into ExternalHyperlink elements
function parseMarkdownLinks(text: string): (TextRun | ExternalHyperlink)[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const result: (TextRun | ExternalHyperlink)[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      result.push(new TextRun({ text: text.slice(lastIndex, match.index), size: 20 }));
    }
    
    // Add the hyperlink
    result.push(new ExternalHyperlink({
      children: [new TextRun({ text: match[1], color: "006450", underline: { type: "single" }, size: 20 })],
      link: match[2],
    }));
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last link
  if (lastIndex < text.length) {
    result.push(new TextRun({ text: text.slice(lastIndex), size: 20 }));
  }
  
  return result.length > 0 ? result : [new TextRun({ text, size: 20 })];
}

function createKeyValueParagraphs(content: Record<string, string>): Paragraph[] {
  const resultParagraphs: Paragraph[] = [];
  
  Object.entries(content).forEach(([fieldKey, fieldValue]) => {
    if (!fieldValue?.trim()) return;
    
    const formattedLabel = fieldKey
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, charStr => charStr.toUpperCase())
      .trim();
    
    // Check if value contains markdown links
    const containsLinks = /\[([^\]]+)\]\(([^)]+)\)/.test(fieldValue);
    
    // Apply semantic color for anti-analysis fields (only if no links)
    const semanticColor = containsLinks ? null : getSemanticColorHex(formattedLabel, fieldValue);
    
    if (containsLinks) {
      // Parse markdown links and render as hyperlinks
      resultParagraphs.push(new Paragraph({
        children: [
          new TextRun({ text: `${formattedLabel}: `, bold: true, color: LABEL_COLOR, size: 20 }),
          ...parseMarkdownLinks(fieldValue),
        ],
        spacing: { after: 80 },
      }));
    } else {
      resultParagraphs.push(new Paragraph({
        children: [
          new TextRun({ text: `${formattedLabel}: `, bold: true, color: LABEL_COLOR, size: 20 }),
          new TextRun({ 
            text: fieldValue, 
            size: 20, 
            color: semanticColor || "000000",
            bold: semanticColor !== null,
          }),
        ],
        spacing: { after: 80 },
      }));
    }
  });
  
  return resultParagraphs;
}

export async function exportREWord(reportData: REData, analystName: string, fileName: string, fileHash: string): Promise<void> {
  // Reset section counter for Roman numerals
  resetSectionCounter();
  
  const documentChildren: (Paragraph | Table)[] = [];
  documentChildren.push(new Paragraph({
    children: [
      new TextRun({ text: "Malware Reverse Engineering Report", bold: true, color: HEADER_COLOR, size: 36 }),
    ],
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
  }));


  const backgroundFields = [
    { label: "Analyst", value: reportData.background?.analyst || "" },
    { label: "Date", value: reportData.background?.date || "" },
    { label: "Workstation", value: reportData.background?.workstation || "" },
    { label: "File Name", value: reportData.background?.fileName || "" },
    { label: "File Location", value: reportData.background?.fileLocation || "" },
    { label: "Operating System", value: reportData.background?.os || "" },
  ];

  if (hasAnyMeaningfulValue(backgroundFields)) {
    documentChildren.push(createSectionHeader("Background"));
    const bgTable = createTwoColumnFields(backgroundFields);
    if (bgTable) documentChildren.push(bgTable);
  }

  // ===== STATIC ANALYSIS =====

  const osintFields = [
    { label: "VirusTotal", value: reportData.staticAnalysis?.virusTotal || "" },
    { label: "MalwareBazaar", value: reportData.staticAnalysis?.malwareBazaar || "" },
    { label: "Any.Run", value: reportData.staticAnalysis?.anyRun || "" },
    { label: "TI Notes", value: reportData.staticAnalysis?.tiNotes || "" },
  ];
  const basicFileInfoFields = [
    { label: "SHA256", value: reportData.staticAnalysis?.sha256 || "" },
    { label: "ImpHash", value: reportData.staticAnalysis?.impHash || "" },
    { label: "File Type", value: reportData.staticAnalysis?.fileType || "" },
    { label: "File Size", value: reportData.staticAnalysis?.fileSize || "" },
    { label: "Compile Time", value: reportData.staticAnalysis?.compileTime || "" },
    { label: "Overall Entropy", value: reportData.staticAnalysis?.fileEntropy || "" },
  ];
  const peInfoFields = [
    { label: "Entry Point", value: reportData.staticAnalysis?.entryPoint || "" },
    { label: "Image Base", value: reportData.staticAnalysis?.imageBase || "" },
    { label: "Architecture", value: reportData.staticAnalysis?.architecture || "" },
    { label: "Num of Sections", value: reportData.staticAnalysis?.numberOfSections || "" },
    { label: "Characteristics", value: reportData.staticAnalysis?.characteristics || "" },
    { label: "Subsystem", value: reportData.staticAnalysis?.subsystem || "" },
  ];
  const securityPostureFields = [
    { label: "Digital Signature", value: formatSignatureStatus(reportData.staticAnalysis?.signatureStatus) },
    { label: "DLL Mitigations", value: formatDllMitigations(reportData.staticAnalysis?.dllMitigations) },
  ];
  const packingFields = [
    { label: "Packed?", value: reportData.staticAnalysis?.isPacked || "" },
    { label: "Packer Suspected", value: reportData.staticAnalysis?.packerSuspected || "" },
    { label: "Strings Detection", value: reportData.staticAnalysis?.stringsDetection || "" },
    { label: "Imports/Exports", value: reportData.staticAnalysis?.importsExports || "" },
  ];

  // Check if any static analysis data exists
  const hasOsint = hasAnyMeaningfulValue(osintFields);
  const hasBasicInfo = hasAnyMeaningfulValue(basicFileInfoFields) || hasAnyMeaningfulValue(peInfoFields);
  const hasSecurityPosture = hasAnyMeaningfulValue(securityPostureFields);
  const hasPacking = hasAnyMeaningfulValue(packingFields);
  const peSectionsData = reportData.staticAnalysis?.peSections ?? [];
  const meaningfulPeSections = peSectionsData.filter(
    (section) => section.sectionName || section.size || section.entropy || section.permissions || section.sectionHash
  );

  const hasAnyStaticAnalysis = hasOsint || hasBasicInfo || hasSecurityPosture || hasPacking || meaningfulPeSections.length > 0;

  if (hasAnyStaticAnalysis) {
    documentChildren.push(createSectionHeader("Static Analysis"));
    
    // OSINT LOOKUP
    if (hasOsint) {
      documentChildren.push(createSubsectionHeader("OSINT Lookup"));
      const osintTable = createTwoColumnFields(osintFields);
      if (osintTable) documentChildren.push(osintTable);
    }
    
    // BASIC FILE INFO + PE STRUCT side by side
    if (hasBasicInfo) {
      const sideBySideTable = createSideBySideSections("Basic File Info", basicFileInfoFields, "Portable Executable Info", peInfoFields);
      if (sideBySideTable) documentChildren.push(sideBySideTable);
    }
    
    // SECURITY POSTURE
    if (hasSecurityPosture) {
      documentChildren.push(createSubsectionHeader("Security Posture"));
      const securityTable = createTwoColumnFields(securityPostureFields);
      if (securityTable) documentChildren.push(securityTable);
    }
    
    // PE SECTIONS
    if (meaningfulPeSections.length > 0) {
      documentChildren.push(createSubsectionHeader("PE Sections"));
      documentChildren.push(createPESectionsTable(meaningfulPeSections));
    }
    
    // PACKING ANALYSIS
    if (hasPacking) {
      documentChildren.push(createSubsectionHeader("Packing Analysis"));
      const packingTable = createTwoColumnFields(packingFields);
      if (packingTable) documentChildren.push(packingTable);
    }
  }

  // ===== RUNTIME BEHAVIOR =====
  const runtimeBehaviorData = extractRuntimeBehaviorWithEffect(reportData.codeBehavior?.runtimeBehavior);
  if (Object.keys(runtimeBehaviorData).length > 0) {
    documentChildren.push(createSectionHeader("Runtime Behavior"));
    documentChildren.push(...createKeyValueParagraphs(runtimeBehaviorData));
  }

  // ===== CODE ANALYSIS =====
  const codeAnalysisData = extractCodeAnalysis(reportData.codeBehavior?.codeAnalysis);
  if (Object.keys(codeAnalysisData).length > 0) {
    documentChildren.push(createSectionHeader("Code Analysis"));
    documentChildren.push(...createKeyValueParagraphs(codeAnalysisData));
  }

  // ===== DEEP DIVE =====
  const deepDiveExtracted = extractDeepDive(reportData.deepDive, reportData.staticAnalysis?.unpackLayers);
  if (Object.keys(deepDiveExtracted).length > 0) {
    documentChildren.push(createSectionHeader("Deep Dive"));
    documentChildren.push(...createKeyValueParagraphs(deepDiveExtracted));
  }

  // ===== MBC MAPPING =====
  const meaningfulMbc = (reportData.detection?.mbcMapping || []).filter((mbcItem: { id: string; name: string; objectiveName: string; pathToMd?: string }) => {
    const hasId = mbcItem.id && mbcItem.id.trim() && mbcItem.id.trim() !== '-';
    const hasName = mbcItem.name && mbcItem.name.trim() && mbcItem.name.trim() !== '-';
    return hasId || hasName;
  });

  if (meaningfulMbc.length > 0) {
    documentChildren.push(createSectionHeader("MBC Mapping"));
    const groupedByObjective: Record<string, { id: string; name: string; objectiveName: string; pathToMd?: string }[]> = {};
    meaningfulMbc.forEach((mbcItem: { id: string; name: string; objectiveName: string; pathToMd?: string }) => {
      const objectiveKey = mbcItem.objectiveName || "Other";
      if (!groupedByObjective[objectiveKey]) groupedByObjective[objectiveKey] = [];
      groupedByObjective[objectiveKey].push(mbcItem);
    });
    Object.entries(groupedByObjective).forEach(([objectiveName, behaviorsList]: [string, { id: string; name: string; objectiveName: string; pathToMd?: string }[]]) => {
      const objectiveSlug = objectiveName.toLowerCase().replace(/\s+/g, '-');
      // Use tree/main for folder navigation
      const objectiveUrl = `https://github.com/MBCProject/mbc-markdown/tree/main/${objectiveSlug}`;

      // Build behavior links
      const behaviorLinkElements: (TextRun | ExternalHyperlink)[] = [];
      behaviorsList.forEach((behaviorEntry: { id: string; name: string; pathToMd?: string }, behaviorIndex: number) => {
        // Use blob/main for file view
        const behaviorUrl = behaviorEntry.pathToMd 
          ? `https://github.com/MBCProject/mbc-markdown/blob/main/${behaviorEntry.pathToMd}`
          : `https://github.com/MBCProject/mbc-markdown/blob/main/${objectiveSlug}/${behaviorEntry.id.toLowerCase()}.md`;
        behaviorLinkElements.push(
          new ExternalHyperlink({
            children: [new TextRun({ text: behaviorEntry.id, color: "006450", underline: { type: "single" }, size: 20 })],
            link: behaviorUrl,
          })
        );
        behaviorLinkElements.push(new TextRun({ text: ` (${behaviorEntry.name})${behaviorIndex < behaviorsList.length - 1 ? ", " : ""}`, size: 20 }));
      });
      
      documentChildren.push(new Paragraph({
        children: [
          new ExternalHyperlink({
            children: [new TextRun({ text: `${objectiveName}: `, bold: true, color: "006450", underline: { type: "single" }, size: 20 })],
            link: objectiveUrl,
          }),
          ...behaviorLinkElements,
        ],
        spacing: { after: 80 },
      }));
    });
  }

  // ===== YARA SIGNATURE =====
  const yaraContent = reportData.detection?.yaraSignature?.trim();
  if (yaraContent && yaraContent !== '-') {
    documentChildren.push(createSectionHeader("YARA Signature"));
    documentChildren.push(new Paragraph({
      children: [new TextRun({ text: yaraContent, size: 20 })],
    }));
  }

  // ===== IOCs =====
  const meaningfulIocs = (reportData.detection?.iocs || []).filter((iocEntry: { type: string; value: string; description: string }) => {
    const hasType = iocEntry.type && iocEntry.type.trim() && iocEntry.type.trim() !== '-';
    const hasValue = iocEntry.value && iocEntry.value.trim() && iocEntry.value.trim() !== '-';
    const hasDescription = iocEntry.description && iocEntry.description.trim() && iocEntry.description.trim() !== '-';
    return hasType || hasValue || hasDescription;
  });

  if (meaningfulIocs.length > 0) {
    documentChildren.push(createSectionHeader("Indicators of Compromise"));
    meaningfulIocs.forEach((iocEntry: { type: string; value: string; description: string }) => {
      documentChildren.push(new Paragraph({
        children: [new TextRun({ text: `[${iocEntry.type || '-'}] ${iocEntry.value || '-'} - ${iocEntry.description || '-'}`, size: 20 })],
        spacing: { after: 50 },
      }));
    });
  }

  // ===== SUMMARY =====
  const summaryFieldsData = {
    malwareFamily: reportData.detection?.summary?.malwareFamily || "",
    keyFunctionality: reportData.detection?.summary?.keyFunctionality || "",
    purpose: reportData.detection?.summary?.purpose || "",
    persistence: reportData.detection?.summary?.persistence || "",
    environmentImpact: reportData.detection?.summary?.environmentImpact || "",
    rootCause: reportData.detection?.summary?.rootCause || "",
    attribution: reportData.detection?.summary?.attribution || "",
    note: reportData.detection?.summary?.note || "",
  };
  const hasSummaryContent = Object.values(summaryFieldsData).some(fieldValue => fieldValue && fieldValue.trim());
  if (hasSummaryContent) {
    documentChildren.push(createSectionHeader("Summary"));
    documentChildren.push(...createKeyValueParagraphs(summaryFieldsData));
  }

  const { headerText: headerFooterText } = formatReportHeader(analystName);

  const wordDocument = new Document({
    sections: [{
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: headerFooterText, size: 18, color: "666666", italics: true }),
              ],
              alignment: AlignmentType.LEFT,
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Page ", size: 18, color: "666666" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "666666" }),
                new TextRun({ text: " of ", size: 18, color: "666666" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "666666" }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
        }),
      },
      children: documentChildren,
    }],
  });

  const documentBlob = await Packer.toBlob(wordDocument);
  const exportFileName = generateFileName(analystName, fileName, fileHash, "docx");
  downloadBlob(documentBlob, exportFileName);
}
