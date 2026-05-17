// PDF Export for MIA (Malware Incident Analysis) - v2
// Updated to match MRE layout style with two-column format
import { jsPDF } from "jspdf";
import { generateFileName } from "@/lib/fileNameUtils";
import { formatReportHeader } from "@/lib/utils";
import { extractLogText, isMeaningful, formatLabelWithColon as formatLabel, clamp } from "./helpers";
import { registerFonts, getFontFamily } from "./fontLoader";
import type { DFIRData } from "@/features/mia/types";

// Colors for PDF export (matching MRE)
const HEADER_COLOR: [number, number, number] = [0, 100, 80]; // Teal/Green
const BLACK: [number, number, number] = [0, 0, 0];
const GRAY: [number, number, number] = [100, 100, 100];

// Layout constants
const LAYOUT = {
  PAGE_MARGIN: 15,
  PAGE_BREAK_THRESHOLD: 270,
  NEW_PAGE_START_Y: 25,
};

const SPACING = {
  SECTION_GAP: 10,
  SUBSECTION_GAP: 8,
  AFTER_TABLE: 2,
  SECTION_AFTER: 4,
};

// Font family (dynamic: Roboto if loaded, helvetica fallback)
let FONT_FAMILY = "helvetica";

/**
 * Fix orphan punctuation: if a line ends up being just punctuation, merge with previous
 */
function fixOrphanPunctuation(lines: string[]): string[] {
  if (!lines || lines.length <= 1) return lines;

  const resultLines: string[] = [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const currentLine = lines[lineIndex];
    if (/^[\s.:,;!?]+$/.test(currentLine) && resultLines.length > 0) {
      resultLines[resultLines.length - 1] = resultLines[resultLines.length - 1].trimEnd() + currentLine;
    } else {
      resultLines.push(currentLine);
    }
  }
  return resultLines;
}

/**
 * Wrapper around jsPDF splitTextToSize that handles multi-line input
 */
function splitTextSafe(pdf: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return [];
  
  const textParagraphs = text.split("\n");
  const wrappedLines: string[] = [];
  
  textParagraphs.forEach((paragraphText) => {
    if (!paragraphText.trim()) {
      wrappedLines.push("");
    } else {
      const wrapped = pdf.splitTextToSize(paragraphText, maxWidth) as string[];
      wrappedLines.push(...wrapped);
    }
  });
  
  return fixOrphanPunctuation(wrappedLines);
}

function measureMaxLabelCellWidth(pdf: jsPDF, labels: string[], fontSize: number, cellPadding: number): number {
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

function addHeaderFooter(pdf: jsPDF, analyst: string) {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { headerText } = formatReportHeader(analyst);
  
  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
    pdf.setPage(pageIndex);
    
    // Header text
    pdf.setFontSize(9);
    pdf.setTextColor(...GRAY);
    pdf.text(headerText, LAYOUT.PAGE_MARGIN, 10, { align: "left" });
    
    // Header line
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(LAYOUT.PAGE_MARGIN, 15, pageWidth - LAYOUT.PAGE_MARGIN, 15);
    
    // Footer line
    pdf.line(LAYOUT.PAGE_MARGIN, pageHeight - 15, pageWidth - LAYOUT.PAGE_MARGIN, pageHeight - 15);
    
    // Page number
    pdf.text(`Page ${pageIndex} of ${pageCount}`, pageWidth - LAYOUT.PAGE_MARGIN, pageHeight - 10, { align: "right" });
  }
}

// Draw section header (like MRE)
function drawSectionHeader(pdf: jsPDF, title: string, y: number, _pageWidth: number): number {
  if (y > 260) {
    pdf.addPage();
    y = LAYOUT.NEW_PAGE_START_Y;
  }
  
  y += SPACING.SECTION_GAP;
  
  pdf.setFontSize(12);
  pdf.setTextColor(...HEADER_COLOR);
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.text(`> ${title.toUpperCase()}`, LAYOUT.PAGE_MARGIN, y);
  
  return y + 8;
}

// Draw subsection header
function drawSubsectionHeader(pdf: jsPDF, title: string, y: number): number {
  if (y > 265) {
    pdf.addPage();
    y = LAYOUT.NEW_PAGE_START_Y;
  }
  
  y += SPACING.SUBSECTION_GAP;
  
  pdf.setFontSize(10);
  pdf.setTextColor(...HEADER_COLOR);
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.text(title.toUpperCase(), LAYOUT.PAGE_MARGIN, y);
  
  return y + 6;
}

// Draw two-column key-value table (like MRE)
function drawTwoColumnTable(
  pdf: jsPDF,
  leftFields: Array<{ label: string; value: string }>,
  rightFields: Array<{ label: string; value: string }>,
  startY: number,
  pageWidth: number
): number {
  const tableX = LAYOUT.PAGE_MARGIN;
  const totalWidth = pageWidth - LAYOUT.PAGE_MARGIN * 2;
  const cellPadding = 5;
  const lineHeight = 5.5;
  const minRowHeight = 14;
  const fontSize = 9;

  const leftFiltered = leftFields.filter((f) => f.value && f.value.trim());
  const rightFiltered = rightFields.filter((f) => f.value && f.value.trim());
  
  if (leftFiltered.length === 0 && rightFiltered.length === 0) return startY;

  let y = startY;

  const hasBothColumns = leftFiltered.length > 0 && rightFiltered.length > 0;
  
  if (!hasBothColumns) {
    // Single column mode
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

      if (y + rowHeight > LAYOUT.PAGE_BREAK_THRESHOLD) {
        pdf.addPage();
        y = LAYOUT.NEW_PAGE_START_Y;
      }

      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.3);
      pdf.rect(tableX, y, labelWidth, rowHeight);
      pdf.rect(tableX + labelWidth, y, valueWidth, rowHeight);

      pdf.setTextColor(...BLACK);
      pdf.setFont(FONT_FAMILY, "bold");
      labelLines.forEach((line: string, idx: number) => {
        pdf.text(line, tableX + cellPadding, y + cellPadding + 3 + idx * lineHeight);
      });

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

      if (y + rowHeight > LAYOUT.PAGE_BREAK_THRESHOLD) {
        pdf.addPage();
        y = LAYOUT.NEW_PAGE_START_Y;
      }

      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.3);

      const rightX = tableX + columnWidth;

      // Draw left column cells
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

      // Draw right column cells
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

// Draw single column key-value table
function drawSingleColumnTable(
  pdf: jsPDF,
  fields: Array<{ label: string; value: string }>,
  startY: number,
  pageWidth: number
): number {
  const tableX = LAYOUT.PAGE_MARGIN;
  const totalWidth = pageWidth - LAYOUT.PAGE_MARGIN * 2;
  const cellPadding = 5;
  const lineHeight = 5.5;
  const minRowHeight = 14;
  const fontSize = 9;

  const filtered = fields.filter((f) => f.value && f.value.trim());
  if (filtered.length === 0) return startY;

  let y = startY;

  const labelWidth = clamp(
    measureMaxLabelCellWidth(pdf, filtered.map((f) => f.label), fontSize, cellPadding),
    totalWidth * 0.2,
    totalWidth * 0.35
  );
  const valueWidth = totalWidth - labelWidth;

  filtered.forEach((field) => {
    pdf.setFontSize(fontSize);
    const labelLines = splitTextSafe(pdf, formatLabel(field.label), labelWidth - cellPadding * 2);
    const valueLines = splitTextSafe(pdf, field.value, valueWidth - cellPadding * 2);
    const rowHeight = Math.max(minRowHeight, labelLines.length * lineHeight + cellPadding * 2, valueLines.length * lineHeight + cellPadding * 2);

    if (y + rowHeight > LAYOUT.PAGE_BREAK_THRESHOLD) {
      pdf.addPage();
      y = LAYOUT.NEW_PAGE_START_Y;
    }

    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.rect(tableX, y, labelWidth, rowHeight);
    pdf.rect(tableX + labelWidth, y, valueWidth, rowHeight);

    pdf.setTextColor(...BLACK);
    pdf.setFont(FONT_FAMILY, "bold");
    labelLines.forEach((line: string, idx: number) => {
      pdf.text(line, tableX + cellPadding, y + cellPadding + 3 + idx * lineHeight);
    });

    pdf.setTextColor(...BLACK);
    pdf.setFont(FONT_FAMILY, "normal");
    valueLines.forEach((line: string, idx: number) => {
      pdf.text(line, tableX + labelWidth + cellPadding, y + cellPadding + 3 + idx * lineHeight);
    });

    y += rowHeight;
  });

  return y + SPACING.AFTER_TABLE;
}

// Draw multi-line text block
function drawTextBlock(pdf: jsPDF, text: string, startY: number, pageWidth: number): number {
  if (!text || !text.trim()) return startY;

  const tableX = LAYOUT.PAGE_MARGIN;
  const totalWidth = pageWidth - LAYOUT.PAGE_MARGIN * 2;
  const lineHeight = 5;
  let y = startY;

  pdf.setFontSize(9);
  pdf.setTextColor(...BLACK);
  pdf.setFont(FONT_FAMILY, "normal");

  const lines = splitTextSafe(pdf, text, totalWidth);
  lines.forEach((line) => {
    if (y > LAYOUT.PAGE_BREAK_THRESHOLD) {
      pdf.addPage();
      y = LAYOUT.NEW_PAGE_START_Y;
    }
    pdf.text(line, tableX, y);
    y += lineHeight;
  });

  return y + SPACING.AFTER_TABLE;
}

export function exportDFIRPDF(data: DFIRData, analyst: string, fileName: string, hash: string): void {
  const pdf = new jsPDF();
  // Register custom Unicode fonts if available
  if (registerFonts(pdf)) {
    FONT_FAMILY = getFontFamily();
  } else {
    FONT_FAMILY = "helvetica";
  }
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = LAYOUT.NEW_PAGE_START_Y;

  // Title
  pdf.setFontSize(16);
  pdf.setTextColor(...HEADER_COLOR);
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.text("MALWARE INCIDENT ANALYSIS REPORT", pageWidth / 2, y, { align: "center" });
  y += 15;

  // 1. Background - two column layout
  const bgLeft = [
    { label: "Case ID", value: data.background?.caseId || "" },
    { label: "Analyst", value: data.background?.analyst || "" },
    { label: "Date", value: data.background?.date || "" },
  ];
  const bgRight = [
    { label: "Workstation", value: data.background?.workstation || "" },
    { label: "Source", value: data.background?.source || "" },
    { label: "Infection Vector", value: data.background?.infectionVector || "" },
  ];
  
  if (bgLeft.some(f => isMeaningful(f.value)) || bgRight.some(f => isMeaningful(f.value))) {
    y = drawSectionHeader(pdf, "Background", y, pageWidth);
    y = drawTwoColumnTable(pdf, bgLeft, bgRight, y, pageWidth);
  }

  // 2. Sample Information - two column layout
  const sampleInfo = data.sampleInfo ?? {};
  const sampleLeft = [
    { label: "File Name", value: sampleInfo.fileName || "" },
    { label: "File Path", value: sampleInfo.filePath || "" },
    { label: "File Size", value: sampleInfo.fileSize || "" },
    { label: "File Type", value: sampleInfo.fileType || "" },
  ];
  const sampleRight = [
    { label: "SHA256", value: sampleInfo.sha256 || "" },
    { label: "Signature", value: sampleInfo.signature || "" },
    { label: "Compile Time", value: sampleInfo.compileTime || "" },
    { label: "AV Detection", value: sampleInfo.avDetection || "" },
  ];
  
  if (sampleLeft.some(f => isMeaningful(f.value)) || sampleRight.some(f => isMeaningful(f.value))) {
    y = drawSectionHeader(pdf, "Sample Information", y, pageWidth);
    y = drawTwoColumnTable(pdf, sampleLeft, sampleRight, y, pageWidth);
  }

  // 3. Static Analysis
  const staticFields = [
    { label: "Interesting Strings", value: data.staticAnalysis?.strings || "" },
    { label: "Imports / Exports", value: data.staticAnalysis?.importsExports || "" },
    { label: "Embedded URLs", value: data.staticAnalysis?.embeddedUrls || "" },
    { label: "Suspicious Metadata", value: data.staticAnalysis?.suspiciousMetadata || "" },
    { label: "PE Sections / Entropy", value: extractLogText(data.staticAnalysis?.peSectionsEntropyLog) },
  ];
  
  if (staticFields.some(f => isMeaningful(f.value))) {
    y = drawSectionHeader(pdf, "Static Analysis", y, pageWidth);
    y = drawSingleColumnTable(pdf, staticFields, y, pageWidth);
  }

  // 4. Behavior Analysis
  const behaviorFields = [
    { label: "Process Tree", value: data.behaviorAnalysis?.processTree || "" },
    { label: "File System Modifications", value: data.behaviorAnalysis?.fileSystemMods || "" },
    { label: "Registry / Persistence", value: data.behaviorAnalysis?.registryPersistence || "" },
    { label: "Network Activity", value: data.behaviorAnalysis?.networkActivity || "" },
    { label: "Memory Artifacts", value: data.behaviorAnalysis?.memoryArtifacts || "" },
    { label: "System Changes", value: data.behaviorAnalysis?.systemChanges || "" },
  ];
  
  if (behaviorFields.some(f => isMeaningful(f.value))) {
    y = drawSectionHeader(pdf, "Behavior Analysis", y, pageWidth);
    y = drawSingleColumnTable(pdf, behaviorFields, y, pageWidth);
  }

  // 5. MITRE ATT&CK Mapping
  const hasMeaningfulMitre = data.mitreMapping && Object.entries(data.mitreMapping).some(([_tactic, techniques]: [string, { id: string; name: string }[]]) =>
    techniques && techniques.length > 0 && techniques.some((t: { id: string; name: string }) => isMeaningful(t.id) || isMeaningful(t.name))
  );
  
  const MITRE_BASE_URL = "https://attack.mitre.org/techniques";
  const MITRE_TACTIC_URL = "https://attack.mitre.org/tactics";
  const TACTIC_ID_MAP: Record<string, string> = {
    "Reconnaissance": "TA0043",
    "Resource Development": "TA0042",
    "Initial Access": "TA0001",
    "Execution": "TA0002",
    "Persistence": "TA0003",
    "Privilege Escalation": "TA0004",
    "Defense Evasion": "TA0005",
    "Credential Access": "TA0006",
    "Discovery": "TA0007",
    "Lateral Movement": "TA0008",
    "Collection": "TA0009",
    "Command and Control": "TA0011",
    "Exfiltration": "TA0010",
    "Impact": "TA0040",
  };
  
  if (hasMeaningfulMitre) {
    y = drawSectionHeader(pdf, "MITRE ATT&CK Mapping", y, pageWidth);
    
    Object.entries(data.mitreMapping).forEach(([tactic, techniques]: [string, { id: string; name: string }[]]) => {
      if (!techniques) return;
      const meaningfulTechniques = techniques.filter((t: { id: string; name: string }) => isMeaningful(t.id) || isMeaningful(t.name));
      if (meaningfulTechniques.length === 0) return;
      
      if (y > LAYOUT.PAGE_BREAK_THRESHOLD) {
        pdf.addPage();
        y = LAYOUT.NEW_PAGE_START_Y;
      }
      
      const tacticId = TACTIC_ID_MAP[tactic] || "";
      const tacticUrl = tacticId ? `${MITRE_TACTIC_URL}/${tacticId}` : "";
      
      pdf.setFontSize(10);
      pdf.setFont(FONT_FAMILY, "bold");
      if (tacticUrl) {
        pdf.setTextColor(...HEADER_COLOR);
        pdf.textWithLink(`${tactic}:`, LAYOUT.PAGE_MARGIN, y, { url: tacticUrl });
      } else {
        pdf.setTextColor(...BLACK);
        pdf.text(`${tactic}:`, LAYOUT.PAGE_MARGIN, y);
      }
      y += 5;
      
      pdf.setFontSize(9);
      pdf.setFont(FONT_FAMILY, "normal");
      meaningfulTechniques.forEach((technique: { id: string; name: string }) => {
        if (y > LAYOUT.PAGE_BREAK_THRESHOLD) {
          pdf.addPage();
          y = LAYOUT.NEW_PAGE_START_Y;
        }
        
        const techniqueId = technique.id || '';
        const techniqueUrl = `${MITRE_BASE_URL}/${techniqueId.replace('.', '/')}`;
        
        pdf.setTextColor(...HEADER_COLOR);
        pdf.textWithLink(techniqueId, LAYOUT.PAGE_MARGIN + 5, y, { url: techniqueUrl });
        
        pdf.setTextColor(...BLACK);
        const nameText = ` (${technique.name})`;
        pdf.text(nameText, LAYOUT.PAGE_MARGIN + 5 + pdf.getTextWidth(techniqueId), y);
        
        y += 4;
      });
      y += 2;
    });
    y += 5;
  }

  // 6. Impact Assessment - two column layout
  const impactLeft = [
    { label: "Scope of Infection", value: data.impact?.scopeOfInfection || "" },
    { label: "User Accounts Affected", value: data.impact?.userAccountsAffected || "" },
    { label: "Data Accessed / Stolen", value: data.impact?.dataAccessedStolen || "" },
  ];
  const impactRight = [
    { label: "Persistence Likelihood", value: data.impact?.persistenceLikelihood || "" },
    { label: "Risk Rating", value: data.impact?.riskRating || "" },
  ];
  
  if (impactLeft.some(f => isMeaningful(f.value)) || impactRight.some(f => isMeaningful(f.value))) {
    y = drawSectionHeader(pdf, "Impact Assessment", y, pageWidth);
    y = drawTwoColumnTable(pdf, impactLeft, impactRight, y, pageWidth);
  }

  // 7. Recommendations
  const hasShortTerm = isMeaningful(data.recommendations?.shortTerm);
  const hasLongTerm = isMeaningful(data.recommendations?.longTerm);
  
  if (hasShortTerm || hasLongTerm) {
    y = drawSectionHeader(pdf, "Recommendations", y, pageWidth);
    
    if (hasShortTerm) {
      y = drawSubsectionHeader(pdf, "Short-term (Immediate Response)", y);
      y = drawTextBlock(pdf, data.recommendations.shortTerm, y, pageWidth);
    }
    
    if (hasLongTerm) {
      y = drawSubsectionHeader(pdf, "Long-term (Mitigation)", y);
      y = drawTextBlock(pdf, data.recommendations.longTerm, y, pageWidth);
    }
  }

  // 8. IOCs
  const meaningfulIocs = (data.iocs || []).filter((iocItem: { type: string; value: string; description: string }) =>
    isMeaningful(iocItem.type) || isMeaningful(iocItem.value) || isMeaningful(iocItem.description)
  );

  if (meaningfulIocs.length > 0) {
    y = drawSectionHeader(pdf, "Indicators of Compromise (IOCs)", y, pageWidth);

    const iocFields = meaningfulIocs.map((ioc: { type: string; value: string; description: string }) => ({
      label: ioc.type || "Unknown",
      value: `${ioc.value || '-'}${ioc.description ? ` - ${ioc.description}` : ''}`
    }));
    y = drawSingleColumnTable(pdf, iocFields, y, pageWidth);
  }

  // 9. Timeline
  const validTimelineEvents = (data.timeline || []).filter((timelineEvent: { time: string; content: string; severity: string }) =>
    isMeaningful(timelineEvent.time) || isMeaningful(timelineEvent.content)
  );

  if (validTimelineEvents.length > 0) {
    y = drawSectionHeader(pdf, "Attack Timeline", y, pageWidth);

    const timelineFields = validTimelineEvents.map((event: { time: string; content: string; severity: string }) => ({
      label: `[${event.time || "N/A"}] (${event.severity || '-'})`,
      value: event.content || '-'
    }));
    y = drawSingleColumnTable(pdf, timelineFields, y, pageWidth);
  }

  // 10. Evidence Artifacts
  const meaningfulArtifacts = (data.artifacts || []).filter((artifactItem: { type: string; name: string; sha256: string; md5: string; size?: string; usedIn?: string[] }) =>
    isMeaningful(artifactItem.type) || isMeaningful(artifactItem.name) || isMeaningful(artifactItem.sha256) || isMeaningful(artifactItem.md5)
  );

  if (meaningfulArtifacts.length > 0) {
    y = drawSectionHeader(pdf, "Evidence Artifacts", y, pageWidth);

    meaningfulArtifacts.forEach((artifact: { type: string; name: string; sha256: string; md5: string; size?: string; usedIn?: string[] }) => {
      if (y > LAYOUT.PAGE_BREAK_THRESHOLD) {
        pdf.addPage();
        y = LAYOUT.NEW_PAGE_START_Y;
      }
      
      const artifactLeft = [
        { label: "Type", value: artifact.type || "" },
        { label: "Name", value: artifact.name || "" },
        { label: "Size", value: artifact.size || "" },
      ];
      const artifactRight = [
        { label: "SHA256", value: artifact.sha256 || "" },
        { label: "MD5", value: artifact.md5 || "" },
        { label: "Used In", value: artifact.usedIn?.join(", ") || "" },
      ];
      
      y = drawTwoColumnTable(pdf, artifactLeft, artifactRight, y, pageWidth);
      y += 2;
    });
  }

  addHeaderFooter(pdf, analyst);
  
  const exportFileName = generateFileName(analyst, fileName, hash, "pdf");
  pdf.save(exportFileName);
}