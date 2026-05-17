// PDF Export for MRE (Malware Reverse Engineering) - v3
import { jsPDF } from "jspdf";
import { generateFileName } from "@/lib/fileNameUtils";
import { formatReportHeader } from "@/lib/utils";
import {
  extractUnpackLayers,
  formatSignatureStatus,
  formatDllMitigations,
  formatLabelWithColon as formatLabel,
  clamp,
  SEMANTIC_COLORS_RGB,
  getRWXSemanticLevel,
  getEntropySemanticLevel,
  getFieldSemanticLevel,
  hasContentInKeys,
  hasAnyMeaningfulValue,
} from "./helpers";
import { registerFonts, getFontFamily } from "./fontLoader";
import type { PESectionData, UnpackLayer } from "@/types/dashboard";
import type { CodeAnalysisData, DeepDiveData } from "@/features/mre/components/CodeAnalysisGroups";
import type { InterestingFunction, ControlFlowEntry, APIUsageEntry, ObfuscationEntry, BreakpointEvent, MemoryRegion, RuntimeAPITrace, CryptoEntry } from "@/features/mre/components/code-analysis/types";
import type { ExecutionStage } from "@/components/ExecutionStages";
import type { RuntimeBehaviorData, TriggerEntry, AntiDebugEntry, AntiVMEntry, ExecutionFlowEntry, SystemArtifactEntry, PersistenceEntry, NetworkBehaviorEntry, MemoryBehaviorEntry, ProcessInjectionEntry } from "@/features/mre/components/runtime-behavior";
import type { REData } from "@/features/mre/types";

// Colors for PDF export
const HEADER_COLOR: [number, number, number] = [0, 100, 80]; // Teal/Green
const BLACK: [number, number, number] = [0, 0, 0];
const GRAY: [number, number, number] = [100, 100, 100];

// Get RGB color from semantic level
function getSemanticRGB(level: keyof typeof SEMANTIC_COLORS_RGB | null): [number, number, number] {
  return level ? SEMANTIC_COLORS_RGB[level] : BLACK;
}

// Get semantic color for RWX permissions
function getRWXColor(permissions: string): [number, number, number] {
  return getSemanticRGB(getRWXSemanticLevel(permissions));
}

// Get semantic color for entropy values
function getEntropyColor(entropy: string): [number, number, number] {
  return getSemanticRGB(getEntropySemanticLevel(entropy));
}

// Get semantic color for a field based on label and value
function getSemanticColorForField(label: string, value: string): [number, number, number] | null {
  const level = getFieldSemanticLevel(label, value);
  return level ? SEMANTIC_COLORS_RGB[level] : null;
}

// Dynamic font family (will be "Roboto" if loaded, "helvetica" otherwise)
let FONT_FAMILY = "helvetica";

// Spacing constants for section gaps
const SPACING = {
  SECTION_GAP: 10,      // Gap before main section headers
  SUBSECTION_GAP: 8,    // Gap before subsection headers  
  AFTER_TABLE: 2,       // Small gap after tables (before next element)
  SECTION_AFTER: 4,     // Gap after section content
} as const;

/**
 * Fix orphan punctuation: if a line ends up being just punctuation (e.g. ":" or "."),
 * merge it with the previous line.
 */
function fixOrphanPunctuation(lines: string[]): string[] {
  if (!lines || lines.length <= 1) return lines;

  const resultLines: string[] = [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const currentLine = lines[lineIndex];
    // Check if line is just punctuation (one or two chars, all punctuation/space)
    if (/^[\s.:,;!?]+$/.test(currentLine) && resultLines.length > 0) {
      // Merge with previous line
      resultLines[resultLines.length - 1] = resultLines[resultLines.length - 1].trimEnd() + currentLine;
    } else {
      resultLines.push(currentLine);
    }
  }
  return resultLines;
}

/**
 * Wrapper around jsPDF splitTextToSize that also fixes orphan punctuation
 * Handles multi-line input (with \n) properly by splitting first, then wrapping each line
 */
function splitTextSafe(pdf: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return [];
  
  // First split by explicit newlines
  const textParagraphs = text.split("\n");
  
  // Then wrap each paragraph to fit within maxWidth
  const wrappedLines: string[] = [];
  textParagraphs.forEach((paragraphText) => {
    if (!paragraphText.trim()) {
      // Keep empty lines as separators
      wrappedLines.push("");
    } else {
      const wrapped = pdf.splitTextToSize(paragraphText, maxWidth) as string[];
      wrappedLines.push(...wrapped);
    }
  });
  
  return fixOrphanPunctuation(wrappedLines);
}

function measureMaxLabelCellWidth(
  pdf: jsPDF,
  labels: string[],
  fontSize: number,
  cellPadding: number
): number {
  if (!labels || labels.length === 0) return 0;

  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(fontSize);

  let maxLabelWidth = 0;
  for (const labelText of labels) {
    const formattedText = formatLabel(labelText);
    if (!formattedText) continue;

    const textWidth = pdf.getTextWidth(formattedText) + cellPadding * 2;
    if (textWidth > maxLabelWidth) maxLabelWidth = textWidth;
  }

  return maxLabelWidth;
}


function addHeaderFooter(pdf: jsPDF, analystName: string) {
  const totalPages = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { headerText } = formatReportHeader(analystName);
  
  for (let pageIndex = 1; pageIndex <= totalPages; pageIndex++) {
    pdf.setPage(pageIndex);
    pdf.setFontSize(9);
    pdf.setTextColor(...GRAY);
    pdf.text(headerText, 15, 10);
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(15, 15, pageWidth - 15, 15);
    pdf.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    pdf.text(`${pageIndex}`, pageWidth - 15, pageHeight - 10, { align: "right" });
  }
}

// Roman numeral conversion
const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// Draw a section header with Roman numeral (like "I. BACKGROUND") - with spacing before
function drawSectionHeader(pdf: jsPDF, title: string, y: number, _pageWidth: number, counter: { value: number }): number {
  // Add spacing before header (except at top of page)
  if (y > 30) {
    y += SPACING.SECTION_GAP;
  }

  if (y > 260) {
    pdf.addPage();
    y = 25;
  }

  // Get Roman numeral and increment counter
  const romanNumeral = ROMAN_NUMERALS[counter.value] || String(counter.value + 1);
  counter.value++;
  
  pdf.setFontSize(12);
  pdf.setTextColor(...HEADER_COLOR);
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.text(`${romanNumeral}. ${title.toUpperCase()}`, 15, y);
  pdf.setFont(FONT_FAMILY, "normal");
  return y + 8;
}

// Draw a subsection header (like "OSINT LOOKUP") - with spacing before
function drawSubsectionHeader(pdf: jsPDF, title: string, y: number): number {
  // Add spacing before header
  y += SPACING.SUBSECTION_GAP;
  
  if (y > 265) {
    pdf.addPage();
    y = 25;
  }
  
  pdf.setFontSize(10);
  pdf.setTextColor(...HEADER_COLOR);
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.text(title.toUpperCase(), 15, y);
  pdf.setFont(FONT_FAMILY, "normal");
  return y + 6;
}

// Parse markdown links and render with textWithLink for PDF
function drawTextWithMarkdownLinks(
  pdf: jsPDF,
  text: string,
  xPosition: number,
  yPosition: number,
  maxWidth: number,
  lineHeight: number
): { endY: number; linesDrawn: number } {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let totalLinesDrawn = 0;
  
  // Check if text contains links
  if (!linkRegex.test(text)) {
    // No links, use regular text
    const textLines = pdf.splitTextToSize(text, maxWidth);
    textLines.forEach((lineText: string, lineIndex: number) => {
      pdf.text(lineText, xPosition, yPosition + lineIndex * lineHeight);
    });
    return { endY: yPosition + textLines.length * lineHeight, linesDrawn: textLines.length };
  }
  
  // Reset regex
  linkRegex.lastIndex = 0;
  
  // Parse text into segments (plain text or link)
  const textSegments: { text: string; url?: string }[] = [];
  let lastMatchIndex = 0;
  let regexMatch;

  while ((regexMatch = linkRegex.exec(text)) !== null) {
    if (regexMatch.index > lastMatchIndex) {
      textSegments.push({ text: text.slice(lastMatchIndex, regexMatch.index) });
    }
    textSegments.push({ text: regexMatch[1], url: regexMatch[2] });
    lastMatchIndex = regexMatch.index + regexMatch[0].length;
  }
  if (lastMatchIndex < text.length) {
    textSegments.push({ text: text.slice(lastMatchIndex) });
  }

  // Flatten segments into wrapped lines
  type RenderChunk = { text: string; url?: string };
  const lines: RenderChunk[][] = [];
  let currentLine: RenderChunk[] = [];
  let currentLineWidth = 0;

  for (const segment of textSegments) {
    const words = segment.text.split(/(\s+)/);
    for (const word of words) {
      if (!word) continue;
      const wordWidth = pdf.getTextWidth(word);
      if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [];
        currentLineWidth = 0;
      }
      currentLine.push({ text: word, url: segment.url });
      currentLineWidth += wordWidth;
    }
  }
  if (currentLine.length > 0) lines.push(currentLine);

  // Render each line
  let currentY = yPosition;
  for (const lineChunks of lines) {
    let currentX = xPosition;
    for (const chunk of lineChunks) {
      if (chunk.url) {
        pdf.setTextColor(0, 100, 80);
        pdf.textWithLink(chunk.text, currentX, currentY, { url: chunk.url });
      } else {
        pdf.setTextColor(...BLACK);
        pdf.text(chunk.text, currentX, currentY);
      }
      currentX += pdf.getTextWidth(chunk.text);
    }
    currentY += lineHeight;
    totalLinesDrawn++;
  }

  return { endY: currentY, linesDrawn: totalLinesDrawn };
}

// Draw a table-based key-value layout (like Runtime Behavior, Code Analysis)
function drawTableKeyValue(
  pdf: jsPDF,
  data: Record<string, string>,
  startY: number,
  pageWidth: number
): number {
  const dataEntries = Object.entries(data).filter(([, fieldValue]) => fieldValue && fieldValue.trim());
  if (dataEntries.length === 0) return startY;

  let currentY = startY;
  const tableX = 15;
  const tableWidth = pageWidth - 30;
  const cellPadding = 5;
  const lineHeight = 5.5;
  const minRowHeight = 14;
  const fontSize = 9;

  // Prepare formatted labels for width calculation
  // Smart regex for camelCase/acronyms:
  // 1. Add space between lowercase and uppercase: "antiVM" -> "anti VM"
  // 2. Add space between acronym and word: "APITrace" -> "API Trace"
  // 3. Preserve known acronyms uppercase: "Api" -> "API"
  const formatLabelKey = (key: string): string => {
    return key
      .replace(/([a-z])([A-Z])/g, "$1 $2")           // lowercase -> uppercase
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")     // ACRONYM + Word
      .replace(/\bApi\b/gi, "API")                   // Fix "Api" -> "API"
      .replace(/^./, (firstChar) => firstChar.toUpperCase())
      .trim();
  };
  const formattedLabels = dataEntries.map(([entryKey]) => formatLabelKey(entryKey));

  // Auto-fit label width (clamp between 25% and 45% of table)
  const labelColumnWidth = clamp(
    measureMaxLabelCellWidth(pdf, formattedLabels, fontSize, cellPadding),
    tableWidth * 0.25,
    tableWidth * 0.45
  );
  const valueColumnWidth = tableWidth - labelColumnWidth;

  dataEntries.forEach(([, entryValue], entryIndex) => {
    const labelText = formatLabel(formattedLabels[entryIndex]);
    const containsLinks = /\[([^\]]+)\]\(([^)]+)\)/.test(entryValue);

    // Calculate content height (label + value)
    pdf.setFontSize(fontSize);
    const labelLines = splitTextSafe(pdf, labelText, labelColumnWidth - cellPadding * 2);
    
    // For link calculation, use plain text version
    const plainValue = containsLinks ? entryValue.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') : entryValue;
    const valueLines = splitTextSafe(pdf, plainValue, valueColumnWidth - cellPadding * 2);
    const rowHeight = Math.max(
      minRowHeight,
      labelLines.length * lineHeight + cellPadding * 2,
      valueLines.length * lineHeight + cellPadding * 2
    );

    // Check page break
    if (currentY + rowHeight > 270) {
      pdf.addPage();
      currentY = 25;
    }

    // Draw cell borders
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.rect(tableX, currentY, labelColumnWidth, rowHeight);
    pdf.rect(tableX + labelColumnWidth, currentY, valueColumnWidth, rowHeight);

    // Draw label (black, bold) - top aligned, wrap if needed
    pdf.setTextColor(...BLACK);
    pdf.setFont(FONT_FAMILY, "bold");
    labelLines.forEach((lineText: string, lineIndex: number) => {
      pdf.text(lineText, tableX + cellPadding, currentY + cellPadding + 3 + lineIndex * lineHeight);
    });

    // Draw value with semantic color for anti-analysis fields or with links
    if (containsLinks) {
      pdf.setFont(FONT_FAMILY, "normal");
      drawTextWithMarkdownLinks(
        pdf,
        entryValue,
        tableX + labelColumnWidth + cellPadding,
        currentY + cellPadding + 3,
        valueColumnWidth - cellPadding * 2,
        lineHeight
      );
    } else {
      const semanticColor = getSemanticColorForField(formattedLabels[entryIndex], entryValue);
      pdf.setTextColor(...(semanticColor || BLACK));
      pdf.setFont(FONT_FAMILY, semanticColor ? "bold" : "normal");
      valueLines.forEach((lineText: string, lineIndex: number) => {
        pdf.text(lineText, tableX + labelColumnWidth + cellPadding, currentY + cellPadding + 3 + lineIndex * lineHeight);
      });
    }

    currentY += rowHeight;
  });

  return currentY + SPACING.AFTER_TABLE;
}

// Draw two-column table layout (4 cells per row: Label1 | Value1 | Label2 | Value2)
function drawTwoColumnTable(
  pdf: jsPDF,
  fields: Array<{ label: string; value: string }>,
  startY: number,
  pageWidth: number
): number {
  const filteredFields = fields.filter((f) => f.value && f.value.trim());
  if (filteredFields.length === 0) return startY;

  let y = startY;
  const tableX = 15;
  const tableWidth = pageWidth - 30;
  const halfWidth = tableWidth / 2;
  const cellPadding = 5;
  const lineHeight = 5.5;
  const minRowHeight = 14;
  const fontSize = 9;

  // Auto-fit label/value widths based on content (clamped to keep values readable)
  const labelWidth = clamp(
    measureMaxLabelCellWidth(
      pdf,
      filteredFields.map((f) => f.label),
      fontSize,
      cellPadding
    ),
    halfWidth * 0.35,
    halfWidth * 0.6
  );
  const valueWidth = halfWidth - labelWidth;

  for (let i = 0; i < filteredFields.length; i += 2) {
    const left = filteredFields[i];
    const right = filteredFields[i + 1];

    // Calculate row height based on content (label + value)
    pdf.setFontSize(fontSize);
    let maxHeight = minRowHeight;

    if (left) {
      const leftLabelLines = splitTextSafe(
        pdf,
        formatLabel(left.label),
        labelWidth - cellPadding * 2
      );
      const leftValueLines = splitTextSafe(
        pdf,
        left.value || "",
        valueWidth - cellPadding * 2
      );
      maxHeight = Math.max(
        maxHeight,
        leftLabelLines.length * lineHeight + cellPadding * 2,
        leftValueLines.length * lineHeight + cellPadding * 2
      );
    }

    if (right) {
      const rightLabelLines = splitTextSafe(
        pdf,
        formatLabel(right.label),
        labelWidth - cellPadding * 2
      );
      const rightValueLines = splitTextSafe(
        pdf,
        right.value || "",
        valueWidth - cellPadding * 2
      );
      maxHeight = Math.max(
        maxHeight,
        rightLabelLines.length * lineHeight + cellPadding * 2,
        rightValueLines.length * lineHeight + cellPadding * 2
      );
    }

    // Check page break
    if (y + maxHeight > 270) {
      pdf.addPage();
      y = 25;
    }

    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);

    // Draw left column cells (always draw both cells for consistent grid)
    pdf.rect(tableX, y, labelWidth, maxHeight);
    pdf.rect(tableX + labelWidth, y, valueWidth, maxHeight);

    if (left) {
      // Label - top aligned (wrap)
      pdf.setTextColor(...BLACK);
      pdf.setFont(FONT_FAMILY, "bold");
      const labelLines = splitTextSafe(
        pdf,
        formatLabel(left.label),
        labelWidth - cellPadding * 2
      );
      labelLines.forEach((line: string, idx: number) => {
        pdf.text(line, tableX + cellPadding, y + cellPadding + 3 + idx * lineHeight);
      });

      // Value - top aligned with semantic color
      const leftSemanticColor = getSemanticColorForField(left.label, left.value);
      pdf.setTextColor(...(leftSemanticColor || BLACK));
      pdf.setFont(FONT_FAMILY, leftSemanticColor ? "bold" : "normal");
      const valueLines = splitTextSafe(pdf, left.value, valueWidth - cellPadding * 2);
      valueLines.forEach((line: string, idx: number) => {
        pdf.text(
          line,
          tableX + labelWidth + cellPadding,
          y + cellPadding + 3 + idx * lineHeight
        );
      });
    }

    // Draw right column cells
    const rightX = tableX + halfWidth;
    pdf.rect(rightX, y, labelWidth, maxHeight);
    pdf.rect(rightX + labelWidth, y, valueWidth, maxHeight);

    if (right) {
      // Label - top aligned (wrap)
      pdf.setTextColor(...BLACK);
      pdf.setFont(FONT_FAMILY, "bold");
      const labelLines = splitTextSafe(
        pdf,
        formatLabel(right.label),
        labelWidth - cellPadding * 2
      );
      labelLines.forEach((line: string, idx: number) => {
        pdf.text(line, rightX + cellPadding, y + cellPadding + 3 + idx * lineHeight);
      });

      // Value - top aligned with semantic color
      const rightSemanticColor = getSemanticColorForField(right.label, right.value);
      pdf.setTextColor(...(rightSemanticColor || BLACK));
      pdf.setFont(FONT_FAMILY, rightSemanticColor ? "bold" : "normal");
      const rightValueLines = splitTextSafe(pdf, right.value, valueWidth - cellPadding * 2);
      rightValueLines.forEach((line: string, idx: number) => {
        pdf.text(
          line,
          rightX + labelWidth + cellPadding,
          y + cellPadding + 3 + idx * lineHeight
        );
      });
    }

    y += maxHeight;
  }

  return y + SPACING.AFTER_TABLE;
}

// Alias for backward compatibility - now uses table layout
function drawKeyValueList(pdf: jsPDF, content: Record<string, string>, y: number, pageWidth: number): number {
  return drawTableKeyValue(pdf, content, y, pageWidth);
}

// Draw two equal-width columns with shared border (like OSINT Lookup on dashboard)
// Left column and right column each have their own label-value pairs, stacked vertically
// If only one column has data, draw single column at full width
function drawEqualColumnsSideBySide(
  pdf: jsPDF,
  title: string,
  leftFields: Array<{ label: string; value: string }>,
  rightFields: Array<{ label: string; value: string }>,
  startY: number,
  pageWidth: number
): number {
  const tableX = 15;
  const totalWidth = pageWidth - 30;
  const cellPadding = 5;
  const lineHeight = 5.5;
  const minRowHeight = 14;
  const fontSize = 9;

  // Filter fields
  const leftFiltered = leftFields.filter((f) => f.value && f.value.trim());
  const rightFiltered = rightFields.filter((f) => f.value && f.value.trim());
  
  // If no data at all, skip
  if (leftFiltered.length === 0 && rightFiltered.length === 0) return startY;

  // Add spacing before this section
  let y = startY + SPACING.SUBSECTION_GAP;

  // Check page break
  if (y > 260) {
    pdf.addPage();
    y = 25;
  }

  // Draw section header
  pdf.setFontSize(10);
  pdf.setTextColor(...HEADER_COLOR);
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.text(title.toUpperCase(), tableX, y);
  pdf.setFont(FONT_FAMILY, "normal");
  y += 6;

  // Determine layout: single column or two columns
  const hasBothColumns = leftFiltered.length > 0 && rightFiltered.length > 0;
  
  if (!hasBothColumns) {
    // Single column mode - use full width
    const fields = leftFiltered.length > 0 ? leftFiltered : rightFiltered;
    const labelWidth = clamp(
      measureMaxLabelCellWidth(pdf, fields.map((f) => f.label), fontSize, cellPadding),
      totalWidth * 0.25,
      totalWidth * 0.45
    );
    const valueWidth = totalWidth - labelWidth;

    fields.forEach((field) => {
      pdf.setFontSize(fontSize);
      const labelLines = splitTextSafe(pdf, formatLabel(field.label), labelWidth - cellPadding * 2);
      const valueLines = splitTextSafe(pdf, field.value, valueWidth - cellPadding * 2);
      const rowHeight = Math.max(minRowHeight, labelLines.length * lineHeight + cellPadding * 2, valueLines.length * lineHeight + cellPadding * 2);

      if (y + rowHeight > 270) {
        pdf.addPage();
        y = 25;
      }

      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.3);
      pdf.rect(tableX, y, labelWidth, rowHeight);
      pdf.rect(tableX + labelWidth, y, valueWidth, rowHeight);

      // Label
      pdf.setTextColor(...BLACK);
      pdf.setFont(FONT_FAMILY, "bold");
      labelLines.forEach((line: string, idx: number) => {
        pdf.text(line, tableX + cellPadding, y + cellPadding + 3 + idx * lineHeight);
      });

      // Value
      pdf.setTextColor(...BLACK);
      pdf.setFont(FONT_FAMILY, "normal");
      valueLines.forEach((line: string, idx: number) => {
        pdf.text(line, tableX + labelWidth + cellPadding, y + cellPadding + 3 + idx * lineHeight);
      });

      y += rowHeight;
    });
  } else {
    // Two column mode
    const gap = 4;
    const columnWidth = totalWidth / 2;

    const leftLabelWidth = clamp(
      measureMaxLabelCellWidth(pdf, leftFiltered.map((f) => f.label), fontSize, cellPadding),
      columnWidth * 0.35,
      columnWidth * 0.55
    );
    const leftValueWidth = columnWidth - leftLabelWidth - gap / 2;

    const rightLabelWidth = clamp(
      measureMaxLabelCellWidth(pdf, rightFiltered.map((f) => f.label), fontSize, cellPadding),
      columnWidth * 0.35,
      columnWidth * 0.55
    );
    const rightValueWidth = columnWidth - rightLabelWidth - gap / 2;

    const maxRows = Math.max(leftFiltered.length, rightFiltered.length);

    for (let row = 0; row < maxRows; row++) {
      const leftField = row < leftFiltered.length ? leftFiltered[row] : null;
      const rightField = row < rightFiltered.length ? rightFiltered[row] : null;

      let rowHeight = minRowHeight;
      pdf.setFontSize(fontSize);

      if (leftField) {
        const leftLabelLines = splitTextSafe(pdf, formatLabel(leftField.label), leftLabelWidth - cellPadding * 2);
        const leftValueLines = splitTextSafe(pdf, leftField.value, leftValueWidth - cellPadding * 2);
        rowHeight = Math.max(rowHeight, leftLabelLines.length * lineHeight + cellPadding * 2, leftValueLines.length * lineHeight + cellPadding * 2);
      }

      if (rightField) {
        const rightLabelLines = splitTextSafe(pdf, formatLabel(rightField.label), rightLabelWidth - cellPadding * 2);
        const rightValueLines = splitTextSafe(pdf, rightField.value, rightValueWidth - cellPadding * 2);
        rowHeight = Math.max(rowHeight, rightLabelLines.length * lineHeight + cellPadding * 2, rightValueLines.length * lineHeight + cellPadding * 2);
      }

      if (y + rowHeight > 270) {
        pdf.addPage();
        y = 25;
      }

      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.3);

      // Draw left column cells only if left field exists
      if (leftField) {
        pdf.rect(tableX, y, leftLabelWidth, rowHeight);
        pdf.rect(tableX + leftLabelWidth, y, leftValueWidth, rowHeight);

        pdf.setTextColor(...BLACK);
        pdf.setFont(FONT_FAMILY, "bold");
        const labelLines = splitTextSafe(pdf, formatLabel(leftField.label), leftLabelWidth - cellPadding * 2);
        labelLines.forEach((line: string, idx: number) => {
          pdf.text(line, tableX + cellPadding, y + cellPadding + 3 + idx * lineHeight);
        });

        pdf.setTextColor(...BLACK);
        pdf.setFont(FONT_FAMILY, "normal");
        const valueLines = splitTextSafe(pdf, leftField.value, leftValueWidth - cellPadding * 2);
        valueLines.forEach((line: string, idx: number) => {
          pdf.text(line, tableX + leftLabelWidth + cellPadding, y + cellPadding + 3 + idx * lineHeight);
        });
      }

      // Draw right column cells only if right field exists
      const rightX = tableX + columnWidth + gap / 2;
      if (rightField) {
        pdf.rect(rightX, y, rightLabelWidth, rowHeight);
        pdf.rect(rightX + rightLabelWidth, y, rightValueWidth, rowHeight);

        pdf.setTextColor(...BLACK);
        pdf.setFont(FONT_FAMILY, "bold");
        const labelLines = splitTextSafe(pdf, formatLabel(rightField.label), rightLabelWidth - cellPadding * 2);
        labelLines.forEach((line: string, idx: number) => {
          pdf.text(line, rightX + cellPadding, y + cellPadding + 3 + idx * lineHeight);
        });

        pdf.setTextColor(...BLACK);
        pdf.setFont(FONT_FAMILY, "normal");
        const valueLines = splitTextSafe(pdf, rightField.value, rightValueWidth - cellPadding * 2);
        valueLines.forEach((line: string, idx: number) => {
          pdf.text(line, rightX + rightLabelWidth + cellPadding, y + cellPadding + 3 + idx * lineHeight);
        });
      }

      y += rowHeight;
    }
  }

  return y + SPACING.AFTER_TABLE;
}


function drawSideBySideSections(
  pdf: jsPDF,
  leftTitle: string,
  leftFields: Array<{ label: string; value: string }>,
  rightTitle: string,
  rightFields: Array<{ label: string; value: string }>,
  startY: number,
  pageWidth: number
): number {
  const tableX = 15;
  const totalWidth = pageWidth - 30;
  const gap = 5;
  
  const cellPadding = 5;
  const lineHeight = 5.5;
  const minRowHeight = 14;
  const fontSize = 9;

  // Filter fields first
  const leftFiltered = leftFields.filter((f) => f.value && f.value.trim());
  const rightFiltered = rightFields.filter((f) => f.value && f.value.trim());
  
  // If neither section has data, skip entirely
  if (leftFiltered.length === 0 && rightFiltered.length === 0) return startY;

  // Add spacing before this section (same as subsection)
  let y = startY + SPACING.SUBSECTION_GAP;

  // Check page break
  if (y > 260) {
    pdf.addPage();
    y = 25;
  }

  // Determine layout based on which sections have data
  const hasLeft = leftFiltered.length > 0;
  const hasRight = rightFiltered.length > 0;
  const hasBoth = hasLeft && hasRight;
  
  const columnWidth = hasBoth ? (totalWidth - gap) / 2 : totalWidth;

  // Draw section headers only for sections that have data
  pdf.setFontSize(10);
  pdf.setTextColor(...HEADER_COLOR);
  pdf.setFont(FONT_FAMILY, "bold");
  
  if (hasBoth) {
    // Both sections have data - draw side by side
    pdf.text(leftTitle.toUpperCase(), tableX, y);
    const rightSectionX = tableX + columnWidth + gap;
    pdf.text(rightTitle.toUpperCase(), rightSectionX, y);
  } else if (hasLeft) {
    pdf.text(leftTitle.toUpperCase(), tableX, y);
  } else {
    pdf.text(rightTitle.toUpperCase(), tableX, y);
  }
  pdf.setFont(FONT_FAMILY, "normal");
  y += 6;

  if (!hasBoth) {
    // Single column mode - draw one section at full width
    const fields = hasLeft ? leftFiltered : rightFiltered;
    const labelWidth = clamp(
      measureMaxLabelCellWidth(pdf, fields.map((f) => f.label), fontSize, cellPadding),
      totalWidth * 0.25,
      totalWidth * 0.45
    );
    const valueWidth = totalWidth - labelWidth;

    fields.forEach((field) => {
      pdf.setFontSize(fontSize);
      const labelLines = splitTextSafe(pdf, formatLabel(field.label), labelWidth - cellPadding * 2);
      const valueLines = splitTextSafe(pdf, field.value, valueWidth - cellPadding * 2);
      const rowHeight = Math.max(minRowHeight, labelLines.length * lineHeight + cellPadding * 2, valueLines.length * lineHeight + cellPadding * 2);

      if (y + rowHeight > 270) {
        pdf.addPage();
        y = 25;
      }

      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.3);
      pdf.rect(tableX, y, labelWidth, rowHeight);
      pdf.rect(tableX + labelWidth, y, valueWidth, rowHeight);

      // Label
      pdf.setTextColor(...BLACK);
      pdf.setFont(FONT_FAMILY, "bold");
      labelLines.forEach((line: string, idx: number) => {
        pdf.text(line, tableX + cellPadding, y + cellPadding + 3 + idx * lineHeight);
      });

      // Value with semantic color
      const semanticColor = getSemanticColorForField(field.label, field.value);
      pdf.setTextColor(...(semanticColor || BLACK));
      pdf.setFont(FONT_FAMILY, semanticColor ? "bold" : "normal");
      valueLines.forEach((line: string, idx: number) => {
        pdf.text(line, tableX + labelWidth + cellPadding, y + cellPadding + 3 + idx * lineHeight);
      });

      y += rowHeight;
    });
  } else {
    // Two column mode - both sections have data
    const rightSectionX = tableX + columnWidth + gap;

    const leftLabelWidth = clamp(
      measureMaxLabelCellWidth(pdf, leftFiltered.map((f) => f.label), fontSize, cellPadding),
      columnWidth * 0.35,
      columnWidth * 0.55
    );
    const leftValueWidth = columnWidth - leftLabelWidth;

    const rightLabelWidth = clamp(
      measureMaxLabelCellWidth(pdf, rightFiltered.map((f) => f.label), fontSize, cellPadding),
      columnWidth * 0.35,
      columnWidth * 0.55
    );
    const rightValueWidth = columnWidth - rightLabelWidth;

    const maxRows = Math.max(leftFiltered.length, rightFiltered.length);

    for (let row = 0; row < maxRows; row++) {
      const leftField = row < leftFiltered.length ? leftFiltered[row] : null;
      const rightField = row < rightFiltered.length ? rightFiltered[row] : null;

      let rowHeight = minRowHeight;
      pdf.setFontSize(fontSize);

      if (leftField) {
        const leftLabelLines = splitTextSafe(pdf, formatLabel(leftField.label), leftLabelWidth - cellPadding * 2);
        const leftValueLines = splitTextSafe(pdf, leftField.value, leftValueWidth - cellPadding * 2);
        rowHeight = Math.max(rowHeight, leftLabelLines.length * lineHeight + cellPadding * 2, leftValueLines.length * lineHeight + cellPadding * 2);
      }

      if (rightField) {
        const rightLabelLines = splitTextSafe(pdf, formatLabel(rightField.label), rightLabelWidth - cellPadding * 2);
        const rightValueLines = splitTextSafe(pdf, rightField.value, rightValueWidth - cellPadding * 2);
        rowHeight = Math.max(rowHeight, rightLabelLines.length * lineHeight + cellPadding * 2, rightValueLines.length * lineHeight + cellPadding * 2);
      }

      if (y + rowHeight > 270) {
        pdf.addPage();
        y = 25;
      }

      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.3);

      // Draw left section cells only if field exists
      if (leftField) {
        pdf.rect(tableX, y, leftLabelWidth, rowHeight);
        pdf.rect(tableX + leftLabelWidth, y, leftValueWidth, rowHeight);

        pdf.setFontSize(fontSize);
        pdf.setTextColor(...BLACK);
        pdf.setFont(FONT_FAMILY, "bold");
        const labelLines = splitTextSafe(pdf, formatLabel(leftField.label), leftLabelWidth - cellPadding * 2);
        labelLines.forEach((line: string, idx: number) => {
          pdf.text(line, tableX + cellPadding, y + cellPadding + 3 + idx * lineHeight);
        });

        const leftSemanticColor = getSemanticColorForField(leftField.label, leftField.value);
        pdf.setTextColor(...(leftSemanticColor || BLACK));
        pdf.setFont(FONT_FAMILY, leftSemanticColor ? "bold" : "normal");
        const valueLines = splitTextSafe(pdf, leftField.value, leftValueWidth - cellPadding * 2);
        valueLines.forEach((line: string, idx: number) => {
          pdf.text(line, tableX + leftLabelWidth + cellPadding, y + cellPadding + 3 + idx * lineHeight);
        });
      }

      // Draw right section cells only if field exists
      if (rightField) {
        pdf.rect(rightSectionX, y, rightLabelWidth, rowHeight);
        pdf.rect(rightSectionX + rightLabelWidth, y, rightValueWidth, rowHeight);

        pdf.setFontSize(fontSize);
        pdf.setTextColor(...BLACK);
        pdf.setFont(FONT_FAMILY, "bold");
        const labelLines = splitTextSafe(pdf, formatLabel(rightField.label), rightLabelWidth - cellPadding * 2);
        labelLines.forEach((line: string, idx: number) => {
          pdf.text(line, rightSectionX + cellPadding, y + cellPadding + 3 + idx * lineHeight);
        });

        const rightSemanticColor = getSemanticColorForField(rightField.label, rightField.value);
        pdf.setTextColor(...(rightSemanticColor || BLACK));
        pdf.setFont(FONT_FAMILY, rightSemanticColor ? "bold" : "normal");
        const valueLines = splitTextSafe(pdf, rightField.value, rightValueWidth - cellPadding * 2);
        valueLines.forEach((line: string, idx: number) => {
          pdf.text(line, rightSectionX + rightLabelWidth + cellPadding, y + cellPadding + 3 + idx * lineHeight);
        });
      }

      y += rowHeight;
    }
  }

  return y + SPACING.AFTER_TABLE;
}


// Draw PE Sections as table with borders (consistent with other tables)
function drawPESectionsTable(pdf: jsPDF, sections: PESectionData[], startY: number, pageWidth: number): number {
  const meaningfulSections = (sections ?? []).filter(
    (section) => section.sectionName || section.size || section.entropy || section.permissions || section.sectionHash
  );
  if (meaningfulSections.length === 0) return startY;

  let y = startY;
  const tableX = 15;
  const tableWidth = pageWidth - 30;
  const colWidths = [12, 30, 28, 32, 24, tableWidth - 126]; // #, Name, Size, Entropy, RWX, Hash (wider)
  const headers = ["#", "NAME", "SIZE", "ENTROPY", "RWX", "HASH"];
  const headerRowHeight = 12;
  const dataRowHeight = 10;
  const cellPadding = 3;

  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.3);

  // Draw header row with borders
  pdf.setFontSize(8);
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setTextColor(...BLACK);

  let x = tableX;
  headers.forEach((header, i) => {
    pdf.rect(x, y, colWidths[i], headerRowHeight);
    pdf.text(header, x + cellPadding, y + headerRowHeight / 2 + 2);
    x += colWidths[i];
  });
  y += headerRowHeight;

  // Draw data rows with borders
  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setTextColor(...BLACK);
  pdf.setFontSize(9);

  meaningfulSections.forEach((section, idx) => {
    if (y + dataRowHeight > 270) {
      pdf.addPage();
      y = 25;
    }

    x = tableX;
    const row = [
      String(idx + 1),
      section.sectionName || "-",
      section.size || "-",
      section.entropy || "-",
      section.permissions || "-",
      section.sectionHash || "-",
    ];

    // Column indices: 0=#, 1=Name, 2=Size, 3=Entropy, 4=RWX, 5=Hash
    row.forEach((cell, i) => {
      pdf.rect(x, y, colWidths[i], dataRowHeight);
      const maxWidth = colWidths[i] - cellPadding * 2;
      const truncated = pdf.splitTextToSize(cell, maxWidth)[0] || cell;

      // Apply semantic colors for Entropy (i=3) and RWX (i=4)
      let cellColor: [number, number, number] = BLACK;
      let useBold = false;

      if (i === 3) {
        const entropyColor = getEntropyColor(cell);
        if (entropyColor !== BLACK) {
          cellColor = entropyColor;
          useBold = true;
        }
      } else if (i === 4) {
        const rwxColor = getRWXColor(cell);
        if (rwxColor !== BLACK) {
          cellColor = rwxColor;
          useBold = true;
        }
      }

      pdf.setTextColor(...cellColor);
      pdf.setFont(FONT_FAMILY, useBold ? "bold" : "normal");
      pdf.text(truncated, x + cellPadding, y + dataRowHeight / 2 + 2);
      x += colWidths[i];
    });
    y += dataRowHeight;
  });

  return y + SPACING.AFTER_TABLE;
}

// Helper to extract code analysis (with new fields: role, analystHypothesis)
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
        let formattedLine = `${funcEntry.functionName || ""} @ ${funcEntry.rvaAddress || ""}`;
        if (funcEntry.role) formattedLine += ` [Role: ${funcEntry.role}]`;
        if (funcEntry.notes) formattedLine += `: ${funcEntry.notes}`;
        return formattedLine;
      })
      .filter((lineText: string) => lineText.trim() !== " @ ");
    if (filtered.length) extractedResult.interestingFunctions = filtered.join("\n");
  }
  if (staticCodeData?.controlFlow?.length > 0) {
    const filtered = staticCodeData.controlFlow
      .filter((e: ControlFlowEntry) => hasContentInKeys(e, ['loopBranchNotes', 'cfgObservations', 'stringDecryptionRoutines']))
      .map((cfEntry: ControlFlowEntry) => {
        const parts: string[] = [];
        if (cfEntry.loopBranchNotes?.trim()) parts.push(`Loops/Branch: ${cfEntry.loopBranchNotes}`);
        if (cfEntry.cfgObservations?.trim()) parts.push(`CFG: ${cfEntry.cfgObservations}`);
        if (cfEntry.stringDecryptionRoutines?.trim()) parts.push(`String Decryption: ${cfEntry.stringDecryptionRoutines}`);
        return parts.join(", ");
      })
      .filter((lineText: string) => lineText.trim());
    if (filtered.length) extractedResult.controlFlow = filtered.join("\n");
  }
  if (staticCodeData?.apiUsage?.length > 0) {
    const filtered = staticCodeData.apiUsage
      .filter((e: APIUsageEntry) => hasContentInKeys(e, ['apiName', 'purposeBehavior']))
      .map((apiEntry: APIUsageEntry) => `${apiEntry.apiName || ""}: ${apiEntry.purposeBehavior || ""}`)
      .filter((lineText: string) => lineText.trim() !== ":");
    if (filtered.length) extractedResult.apiUsage = filtered.join("\n");
  }
  if (staticCodeData?.obfuscation?.length > 0) {
    const filtered = staticCodeData.obfuscation
      .filter((e: ObfuscationEntry) => hasContentInKeys(e, ['technique', 'evidence']))
      .map((obfEntry: ObfuscationEntry) => `${obfEntry.technique || ""}: ${obfEntry.evidence || ""}`)
      .filter((lineText: string) => lineText.trim() !== ":");
    if (filtered.length) extractedResult.obfuscation = filtered.join("\n");
  }
  if (dynamicCodeData?.breakpointEvents?.length > 0) {
    const filtered = dynamicCodeData.breakpointEvents
      .filter((e: BreakpointEvent) => hasContentInKeys(e, ['eventType', 'whereTriggered', 'notes']))
      .map((bpEntry: BreakpointEvent) => `[${bpEntry.eventType || ""}] ${bpEntry.whereTriggered || ""}: ${bpEntry.notes || ""}`)
      .filter((lineText: string) => lineText.trim() !== "[] :");
    if (filtered.length) extractedResult.breakpointEvents = filtered.join("\n");
  }
  if (dynamicCodeData?.memoryRegions?.length > 0) {
    const filtered = dynamicCodeData.memoryRegions
      .filter((e: MemoryRegion) => hasContentInKeys(e, ['allocation', 'address', 'behavior']))
      .map((memEntry: MemoryRegion) => `[${memEntry.allocation || ""}] ${memEntry.address || ""}: ${memEntry.behavior || ""}`)
      .filter((lineText: string) => lineText.trim() !== "[] :");
    if (filtered.length) extractedResult.memoryRegions = filtered.join("\n");
  }
  if (dynamicCodeData?.runtimeApiTrace?.length > 0) {
    const filtered = dynamicCodeData.runtimeApiTrace
      .filter((e: RuntimeAPITrace) => hasContentInKeys(e, ['api', 'arguments', 'returnValue']))
      .map((traceEntry: RuntimeAPITrace) => `${traceEntry.api || ""}(${traceEntry.arguments || ""}) → ${traceEntry.returnValue || ""}`)
      .filter((lineText: string) => lineText.trim() !== "() →");
    if (filtered.length) extractedResult.runtimeAPITrace = filtered.join("\n");
  }
  return extractedResult;
}

// Helper to extract deep dive data (with new fields: analystHypothesis, entryCondition, exitCondition, failureAbortBehavior)
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
        if (stageEntry.transitionMethod?.trim()) stageParts.push(`  Transition Method: ${stageEntry.transitionMethod}`);
        if (stageEntry.apisUsed?.trim()) stageParts.push(`  APIs Used: ${stageEntry.apisUsed}`);
        if (stageEntry.artifacts?.trim()) stageParts.push(`  Artifacts: ${stageEntry.artifacts}`);
        if (stageEntry.ioc?.trim()) stageParts.push(`  IOC: ${stageEntry.ioc}`);
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
        // Each behavior on its own line
        return `[${microEntry.id}](${behaviorUrl}) (${microEntry.name}) - ${microEntry.objectiveName || '-'}`;
      })
      .join("\n"); // Join with newline so each is on separate line
    
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
      .map((triggerEntry: TriggerEntry) => `${triggerEntry.name || ""}: ${triggerEntry.description || ""}`)
      .filter((lineText: string) => lineText.trim() !== ":");
    if (filtered.length) extractedResult.triggers = filtered.join("\n");
  }
  if (runtimeBehavior.antiDebugEnabled && runtimeBehavior.antiDebug?.length > 0) {
    const filtered = runtimeBehavior.antiDebug
      .filter((e: AntiDebugEntry) => hasContentInKeys(e, ['categoryTags', 'apis', 'effect', 'notes']))
      .map((debugEntry: AntiDebugEntry) => {
        let formattedLine = `[${(debugEntry.categoryTags ?? []).join(", ")}] APIs: ${(debugEntry.apis ?? []).join(", ")}`;
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
        let formattedLine = `[${(vmEntry.methodTags ?? []).join(", ")}] ${vmEntry.indicator || ""}`;
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
      .map((flowEntry: ExecutionFlowEntry) => `${flowEntry.stepName || ""}: ${flowEntry.description || ""}`)
      .filter((lineText: string) => lineText.trim() !== ":");
    if (filtered.length) extractedResult.executionFlow = filtered.join("\n");
  }
  if (runtimeBehavior.systemArtifactsEnabled && runtimeBehavior.systemArtifacts?.length > 0) {
    const filtered = runtimeBehavior.systemArtifacts
      .filter((e: SystemArtifactEntry) => hasContentInKeys(e, ['typeTags', 'path', 'notes']))
      .map((artifactEntry: SystemArtifactEntry) => `[${(artifactEntry.typeTags ?? []).join(", ")}] ${artifactEntry.path || ""} - ${artifactEntry.notes || ""}`)
      .filter((lineText: string) => lineText.trim() && lineText !== "[]  - ");
    if (filtered.length) extractedResult.systemArtifacts = filtered.join("\n");
  }
  if (runtimeBehavior.persistenceEnabled && runtimeBehavior.persistence?.length > 0) {
    const filtered = runtimeBehavior.persistence
      .filter((e: PersistenceEntry) => hasContentInKeys(e, ['typeTags', 'path', 'notes']))
      .map((persistEntry: PersistenceEntry) => `[${(persistEntry.typeTags ?? []).join(", ")}] ${persistEntry.path || ""} - ${persistEntry.notes || ""}`)
      .filter((lineText: string) => lineText.trim() && lineText !== "[]  - ");
    if (filtered.length) extractedResult.persistence = filtered.join("\n");
  }
  if (runtimeBehavior.networkEnabled && runtimeBehavior.network?.length > 0) {
    const filtered = runtimeBehavior.network
      .filter((e: NetworkBehaviorEntry) => hasContentInKeys(e, ['behaviorTags', 'indicator', 'notes']))
      .map((netEntry: NetworkBehaviorEntry) => `[${(netEntry.behaviorTags ?? []).join(", ")}] ${netEntry.indicator || ""} - ${netEntry.notes || ""}`)
      .filter((lineText: string) => lineText.trim() && lineText !== "[]  - ");
    if (filtered.length) extractedResult.networkBehavior = filtered.join("\n");
  }
  if (runtimeBehavior.memoryEnabled && runtimeBehavior.memory?.length > 0) {
    const filtered = runtimeBehavior.memory
      .filter((e: MemoryBehaviorEntry) => hasContentInKeys(e, ['eventTags', 'region', 'notes']))
      .map((memEntry: MemoryBehaviorEntry) => `[${(memEntry.eventTags ?? []).join(", ")}] ${memEntry.region || ""} - ${memEntry.notes || ""}`)
      .filter((lineText: string) => lineText.trim() && lineText !== "[]  - ");
    if (filtered.length) extractedResult.memoryBehavior = filtered.join("\n");
  }
  if (runtimeBehavior.processInjectionEnabled && runtimeBehavior.processInjection?.length > 0) {
    const filtered = runtimeBehavior.processInjection
      .filter((e: ProcessInjectionEntry) => hasContentInKeys(e, ['techniqueTags', 'targetProcess', 'apiChain', 'notes']))
      .map((injectionEntry: ProcessInjectionEntry) => `[${(injectionEntry.techniqueTags ?? []).join(", ")}] Target: ${injectionEntry.targetProcess || ""}, APIs: ${(injectionEntry.apiChain ?? []).join(" → ")} - ${injectionEntry.notes || ""}`)
      .filter((lineText: string) => lineText.trim() && lineText !== "[] Target: , APIs:  - ");
    if (filtered.length) extractedResult.processInjection = filtered.join("\n");
  }
  return extractedResult;
}

export function exportREPDF(reportData: REData, analystName: string, fileName: string, fileHash: string): void {
  const pdf = new jsPDF();
  
  // Register custom Unicode fonts if available
  if (registerFonts(pdf)) {
    FONT_FAMILY = getFontFamily();
  } else {
    FONT_FAMILY = "helvetica";
  }
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  let currentY = 25;

  // Local section counter for Roman numerals (avoids module-level race condition)
  const sectionCounter = { value: 0 };

  // Title
  pdf.setFontSize(18);
  pdf.setTextColor(...HEADER_COLOR);
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.text("Malware Reverse Engineering Report", pageWidth / 2, currentY, { align: "center" });
  pdf.setFont(FONT_FAMILY, "normal");
  currentY += 15;

  // ===== BACKGROUND =====

  const backgroundFields = [
    { label: "Analyst", value: reportData.background?.analyst || "" },
    { label: "Date", value: reportData.background?.date || "" },
    { label: "Workstation", value: reportData.background?.workstation || "" },
    { label: "File Name", value: reportData.background?.fileName || "" },
    { label: "File Location", value: reportData.background?.fileLocation || "" },
    { label: "Operating System", value: reportData.background?.os || "" },
  ];

  if (hasAnyMeaningfulValue(backgroundFields)) {
    currentY = drawSectionHeader(pdf, "Background", currentY, pageWidth, sectionCounter);
    currentY = drawTwoColumnTable(pdf, backgroundFields, currentY, pageWidth);
  }

  // ===== STATIC ANALYSIS =====

  const osintLeftFields = [
    { label: "VirusTotal", value: reportData.staticAnalysis?.virusTotal || "" },
    { label: "MalwareBazaar", value: reportData.staticAnalysis?.malwareBazaar || "" },
  ];
  const osintRightFields = [
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
  const hasOsint = hasAnyMeaningfulValue(osintLeftFields) || hasAnyMeaningfulValue(osintRightFields);
  const hasBasicInfo = hasAnyMeaningfulValue(basicFileInfoFields) || hasAnyMeaningfulValue(peInfoFields);
  const hasSecurityPosture = hasAnyMeaningfulValue(securityPostureFields);
  const hasPacking = hasAnyMeaningfulValue(packingFields);
  const peSectionsData = reportData.staticAnalysis?.peSections ?? [];
  const meaningfulPeSections = peSectionsData.filter(
    (section) => section.sectionName || section.size || section.entropy || section.permissions || section.sectionHash
  );

  const hasAnyStaticAnalysis = hasOsint || hasBasicInfo || hasSecurityPosture || hasPacking || meaningfulPeSections.length > 0;

  if (hasAnyStaticAnalysis) {
    currentY = drawSectionHeader(pdf, "Static Analysis", currentY, pageWidth, sectionCounter);
    
    // OSINT LOOKUP
    if (hasOsint) {
      currentY = drawEqualColumnsSideBySide(pdf, "OSINT Lookup", osintLeftFields, osintRightFields, currentY, pageWidth);
    }
    
    // BASIC FILE INFO + PE STRUCTURE side by side
    if (hasBasicInfo) {
      currentY = drawSideBySideSections(pdf, "Basic File Info", basicFileInfoFields, "Portable Executable Info", peInfoFields, currentY, pageWidth);
    }
    
    // SECURITY POSTURE
    if (hasSecurityPosture) {
      currentY = drawSubsectionHeader(pdf, "Security Posture", currentY);
      currentY = drawTwoColumnTable(pdf, securityPostureFields, currentY, pageWidth);
    }
    
    // PE SECTIONS table
    if (meaningfulPeSections.length > 0) {
      currentY = drawSubsectionHeader(pdf, "PE Sections", currentY);
      currentY = drawPESectionsTable(pdf, meaningfulPeSections, currentY, pageWidth);
    }
    
    // PACKING ANALYSIS
    if (hasPacking) {
      currentY = drawSubsectionHeader(pdf, "Packing Analysis", currentY);
      currentY = drawTwoColumnTable(pdf, packingFields, currentY, pageWidth);
    }
  }

  // ===== RUNTIME BEHAVIOR =====
  const runtimeBehaviorExtracted = extractRuntimeBehaviorWithEffect(reportData.codeBehavior?.runtimeBehavior);
  if (Object.keys(runtimeBehaviorExtracted).length > 0) {
    currentY = drawSectionHeader(pdf, "Runtime Behavior", currentY, pageWidth, sectionCounter);
    currentY = drawKeyValueList(pdf, runtimeBehaviorExtracted, currentY, pageWidth);
  }

  // ===== CODE ANALYSIS =====
  const codeAnalysisExtracted = extractCodeAnalysis(reportData.codeBehavior?.codeAnalysis);
  if (Object.keys(codeAnalysisExtracted).length > 0) {
    currentY = drawSectionHeader(pdf, "Code Analysis", currentY, pageWidth, sectionCounter);
    currentY = drawKeyValueList(pdf, codeAnalysisExtracted, currentY, pageWidth);
  }

  // ===== DEEP DIVE =====
  const deepDiveExtracted = extractDeepDive(reportData.deepDive, reportData.staticAnalysis?.unpackLayers);
  if (Object.keys(deepDiveExtracted).length > 0) {
    currentY = drawSectionHeader(pdf, "Deep Dive", currentY, pageWidth, sectionCounter);
    currentY = drawKeyValueList(pdf, deepDiveExtracted, currentY, pageWidth);
  }

  // ===== MBC MAPPING =====
  const meaningfulMbc = (reportData.detection?.mbcMapping || []).filter((mbcItem: { id: string; name: string; objectiveName: string; pathToMd?: string }) => {
    const hasId = mbcItem.id && mbcItem.id.trim() && mbcItem.id.trim() !== '-';
    const hasName = mbcItem.name && mbcItem.name.trim() && mbcItem.name.trim() !== '-';
    return hasId || hasName;
  });

  if (meaningfulMbc.length > 0) {
    currentY = drawSectionHeader(pdf, "MBC Mapping", currentY, pageWidth, sectionCounter);
    const groupedByObjective: Record<string, { id: string; name: string; pathToMd?: string }[]> = {};
    meaningfulMbc.forEach((mbcItem: { id: string; name: string; objectiveName: string; pathToMd?: string }) => {
      const objectiveKey = mbcItem.objectiveName || "Other";
      if (!groupedByObjective[objectiveKey]) groupedByObjective[objectiveKey] = [];
      groupedByObjective[objectiveKey].push(mbcItem);
    });
    Object.entries(groupedByObjective).forEach(([objectiveName, behaviorsList]: [string, { id: string; name: string; pathToMd?: string }[]]) => {
      if (currentY > 270) { pdf.addPage(); currentY = 25; }
      
      // Objective header with link
      pdf.setFontSize(9);
      pdf.setFont(FONT_FAMILY, "bold");
      // Use tree/main instead of blob/main for folder navigation
      const objectiveSlug = objectiveName.toLowerCase().replace(/\s+/g, '-');
      const objectiveUrl = `https://github.com/MBCProject/mbc-markdown/tree/main/${objectiveSlug}`;
      pdf.setTextColor(0, 100, 80); // Teal for link
      pdf.textWithLink(`${objectiveName}:`, 15, currentY, { url: objectiveUrl });
      currentY += 5;
      
      // Behaviors - each on its own line
      pdf.setFont(FONT_FAMILY, "normal");
      behaviorsList.forEach((behaviorEntry: { id: string; name: string; pathToMd?: string }) => {
        if (currentY > 270) { pdf.addPage(); currentY = 25; }
        
        const xPosition = 20; // Indent for behaviors
        
        // Behavior ID with link - use blob/main for file view
        const behaviorUrl = behaviorEntry.pathToMd 
          ? `https://github.com/MBCProject/mbc-markdown/blob/main/${behaviorEntry.pathToMd}`
          : `https://github.com/MBCProject/mbc-markdown/blob/main/${objectiveSlug}/${behaviorEntry.id.toLowerCase()}.md`;
        pdf.setTextColor(0, 100, 80); // Teal for link
        pdf.textWithLink(behaviorEntry.id, xPosition, currentY, { url: behaviorUrl });
        
        // Name (no link)
        pdf.setTextColor(...BLACK);
        pdf.text(` (${behaviorEntry.name})`, xPosition + pdf.getTextWidth(behaviorEntry.id), currentY);
        currentY += 4;
      });
      currentY += 2; // Small gap after each objective group
    });
    // No extra spacing - drawSectionHeader adds its own
  }

  // ===== YARA SIGNATURE =====
  const yaraContent = reportData.detection?.yaraSignature?.trim();
  if (yaraContent && yaraContent !== '-') {
    currentY = drawSectionHeader(pdf, "YARA Signature", currentY, pageWidth, sectionCounter);
    pdf.setFontSize(9);
    pdf.setTextColor(...BLACK);
    const yaraLines = pdf.splitTextToSize(yaraContent, pageWidth - 30);
    yaraLines.forEach((lineText: string) => {
      if (currentY > 270) { pdf.addPage(); currentY = 25; }
      pdf.text(lineText, 15, currentY);
      currentY += 4;
    });
    // No extra spacing - drawSectionHeader adds its own
  }

  // ===== IOCs =====
  const meaningfulIocs = (reportData.detection?.iocs || []).filter((iocEntry: { type: string; value: string; description: string }) => {
    const hasType = iocEntry.type && iocEntry.type.trim() && iocEntry.type.trim() !== '-';
    const hasValue = iocEntry.value && iocEntry.value.trim() && iocEntry.value.trim() !== '-';
    const hasDescription = iocEntry.description && iocEntry.description.trim() && iocEntry.description.trim() !== '-';
    return hasType || hasValue || hasDescription;
  });

  if (meaningfulIocs.length > 0) {
    currentY = drawSectionHeader(pdf, "Indicators of Compromise", currentY, pageWidth, sectionCounter);
    meaningfulIocs.forEach((iocEntry: { type: string; value: string; description: string }) => {
      if (currentY > 270) { pdf.addPage(); currentY = 25; }
      pdf.setFontSize(9);
      pdf.setTextColor(...BLACK);
      pdf.text(`[${iocEntry.type || '-'}] ${iocEntry.value || '-'} - ${iocEntry.description || '-'}`, 15, currentY);
      currentY += 5;
    });
    // No extra spacing - drawSectionHeader adds its own
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
    currentY = drawSectionHeader(pdf, "Summary", currentY, pageWidth, sectionCounter);
    currentY = drawKeyValueList(pdf, summaryFieldsData, currentY, pageWidth);
  }

  // Add headers/footers
  addHeaderFooter(pdf, analystName);

  // Save
  const exportFileName = generateFileName(analystName, fileName, fileHash, "pdf");
  pdf.save(exportFileName);
}
