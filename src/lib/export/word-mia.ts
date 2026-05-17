// Word Export for MIA (Malware Incident Analysis) - v2
// Updated to match MRE layout style with two-column format
import { Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { generateFileName } from "@/lib/fileNameUtils";
import { formatReportHeader } from "@/lib/utils";
import { extractLogText, isMeaningful, downloadBlob } from "./helpers";
import type { DFIRData } from "@/features/mia/types";

const HEADER_COLOR = "006450"; // Teal/Green
const LABEL_COLOR = "000000"; // Black

// Roman numeral conversion
const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// Create section header paragraph with Roman numeral (like "I. BACKGROUND")
function createSectionHeader(title: string, counter: { value: number }): Paragraph {
  const romanNumeral = ROMAN_NUMERALS[counter.value] || String(counter.value + 1);
  counter.value++;

  return new Paragraph({
    children: [
      new TextRun({ text: `${romanNumeral}. ${title.toUpperCase()}`, bold: true, color: HEADER_COLOR, size: 26 }),
    ],
    spacing: { before: 300, after: 150 },
  });
}

// Create subsection header
function createSubsectionHeader(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: title.toUpperCase(), bold: true, color: HEADER_COLOR, size: 22 }),
    ],
    spacing: { before: 200, after: 100 },
  });
}

// Create two-column table for fields (like MRE)
function createTwoColumnTable(
  leftFields: Array<{ label: string; value: string }>,
  rightFields: Array<{ label: string; value: string }>
): Table | null {
  const invisibleBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const visibleBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  
  const leftFiltered = leftFields.filter(f => isMeaningful(f.value));
  const rightFiltered = rightFields.filter(f => isMeaningful(f.value));
  
  if (leftFiltered.length === 0 && rightFiltered.length === 0) return null;
  
  const tableRows: TableRow[] = [];
  const hasBothColumns = leftFiltered.length > 0 && rightFiltered.length > 0;
  
  if (!hasBothColumns) {
    // Single column mode
    const fields = leftFiltered.length > 0 ? leftFiltered : rightFiltered;
    
    fields.forEach((field) => {
      tableRows.push(new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: `${field.label}:`, bold: true, color: LABEL_COLOR, size: 18 })],
              }),
            ],
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: { top: visibleBorder, bottom: visibleBorder, left: visibleBorder, right: visibleBorder },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: field.value, size: 20 })],
              }),
            ],
            width: { size: 75, type: WidthType.PERCENTAGE },
            borders: { top: visibleBorder, bottom: visibleBorder, left: visibleBorder, right: visibleBorder },
          }),
        ],
      }));
    });
  } else {
    // Two column mode
    const maxRows = Math.max(leftFiltered.length, rightFiltered.length);
    
    for (let row = 0; row < maxRows; row++) {
      const leftField = row < leftFiltered.length ? leftFiltered[row] : null;
      const rightField = row < rightFiltered.length ? rightFiltered[row] : null;
      
      const cells: TableCell[] = [];
      
      // Left column
      if (leftField) {
        cells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: `${leftField.label}:`, bold: true, color: LABEL_COLOR, size: 18 })],
              }),
            ],
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: { top: visibleBorder, bottom: visibleBorder, left: visibleBorder, right: visibleBorder },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: leftField.value, size: 20 })],
              }),
            ],
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: { top: visibleBorder, bottom: visibleBorder, left: visibleBorder, right: visibleBorder },
          })
        );
      } else {
        cells.push(
          new TableCell({
            children: [new Paragraph({})],
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: { top: invisibleBorder, bottom: invisibleBorder, left: invisibleBorder, right: invisibleBorder },
          }),
          new TableCell({
            children: [new Paragraph({})],
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: { top: invisibleBorder, bottom: invisibleBorder, left: invisibleBorder, right: invisibleBorder },
          })
        );
      }
      
      // Right column
      if (rightField) {
        cells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: `${rightField.label}:`, bold: true, color: LABEL_COLOR, size: 18 })],
              }),
            ],
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: { top: visibleBorder, bottom: visibleBorder, left: visibleBorder, right: visibleBorder },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: rightField.value, size: 20 })],
              }),
            ],
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: { top: visibleBorder, bottom: visibleBorder, left: visibleBorder, right: visibleBorder },
          })
        );
      } else {
        cells.push(
          new TableCell({
            children: [new Paragraph({})],
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: { top: invisibleBorder, bottom: invisibleBorder, left: invisibleBorder, right: invisibleBorder },
          }),
          new TableCell({
            children: [new Paragraph({})],
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: { top: invisibleBorder, bottom: invisibleBorder, left: invisibleBorder, right: invisibleBorder },
          })
        );
      }
      
      tableRows.push(new TableRow({ children: cells }));
    }
  }
  
  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// Create single column table for fields
function createSingleColumnTable(fields: Array<{ label: string; value: string }>): Table | null {
  const visibleBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  
  const filtered = fields.filter(f => isMeaningful(f.value));
  if (filtered.length === 0) return null;
  
  const tableRows = filtered.map((field) => 
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: `${field.label}:`, bold: true, color: LABEL_COLOR, size: 18 })],
            }),
          ],
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: { top: visibleBorder, bottom: visibleBorder, left: visibleBorder, right: visibleBorder },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: field.value, size: 20 })],
            }),
          ],
          width: { size: 75, type: WidthType.PERCENTAGE },
          borders: { top: visibleBorder, bottom: visibleBorder, left: visibleBorder, right: visibleBorder },
        }),
      ],
    })
  );
  
  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

export async function exportDFIRWord(data: DFIRData, analyst: string, fileName: string, hash: string): Promise<void> {
  const sectionCounter = { value: 0 };
  const paragraphs: (Paragraph | Table)[] = [];

  // Title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: "MALWARE INCIDENT ANALYSIS REPORT", bold: true, color: HEADER_COLOR, size: 32 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

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
    paragraphs.push(createSectionHeader("Background", sectionCounter));
    const table = createTwoColumnTable(bgLeft, bgRight);
    if (table) paragraphs.push(table);
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
    paragraphs.push(createSectionHeader("Sample Information", sectionCounter));
    const table = createTwoColumnTable(sampleLeft, sampleRight);
    if (table) paragraphs.push(table);
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
    paragraphs.push(createSectionHeader("Static Analysis", sectionCounter));
    const table = createSingleColumnTable(staticFields);
    if (table) paragraphs.push(table);
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
    paragraphs.push(createSectionHeader("Behavior Analysis", sectionCounter));
    const table = createSingleColumnTable(behaviorFields);
    if (table) paragraphs.push(table);
  }

  // 5. MITRE ATT&CK Mapping
  const hasMeaningfulMitre = data.mitreMapping && Object.entries(data.mitreMapping).some(([_tactic, techniques]: [string, { id: string; name: string }[]]) =>
    techniques && techniques.length > 0 && techniques.some((t: { id: string; name: string }) => isMeaningful(t.id) || isMeaningful(t.name))
  );

  if (hasMeaningfulMitre) {
    paragraphs.push(createSectionHeader("MITRE ATT&CK Mapping", sectionCounter));

    Object.entries(data.mitreMapping).forEach(([tactic, techniques]: [string, { id: string; name: string }[]]) => {
      if (!techniques) return;
      const meaningfulTechniques = techniques.filter((t: { id: string; name: string }) => isMeaningful(t.id) || isMeaningful(t.name));
      if (meaningfulTechniques.length === 0) return;
      
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${tactic}:`, bold: true, color: HEADER_COLOR, size: 20 }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );
      
      meaningfulTechniques.forEach((technique: { id: string; name: string }) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `  ${technique.id}`, color: HEADER_COLOR, size: 18 }),
              new TextRun({ text: ` (${technique.name})`, size: 18 }),
            ],
            spacing: { after: 25 },
          })
        );
      });
    });
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
    paragraphs.push(createSectionHeader("Impact Assessment", sectionCounter));
    const table = createTwoColumnTable(impactLeft, impactRight);
    if (table) paragraphs.push(table);
  }

  // 7. Recommendations
  const hasShortTerm = isMeaningful(data.recommendations?.shortTerm);
  const hasLongTerm = isMeaningful(data.recommendations?.longTerm);
  
  if (hasShortTerm || hasLongTerm) {
    paragraphs.push(createSectionHeader("Recommendations", sectionCounter));
    
    if (hasShortTerm) {
      paragraphs.push(createSubsectionHeader("Short-term (Immediate Response)"));
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: data.recommendations.shortTerm, size: 20 })],
          spacing: { after: 100 },
        })
      );
    }
    
    if (hasLongTerm) {
      paragraphs.push(createSubsectionHeader("Long-term (Mitigation)"));
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: data.recommendations.longTerm, size: 20 })],
          spacing: { after: 100 },
        })
      );
    }
  }

  // 8. IOCs
  const meaningfulIocs = (data.iocs || []).filter((iocItem: { type: string; value: string; description: string }) =>
    isMeaningful(iocItem.type) || isMeaningful(iocItem.value) || isMeaningful(iocItem.description)
  );

  if (meaningfulIocs.length > 0) {
    paragraphs.push(createSectionHeader("Indicators of Compromise (IOCs)", sectionCounter));

    const iocFields = meaningfulIocs.map((ioc: { type: string; value: string; description: string }) => ({
      label: ioc.type || "Unknown",
      value: `${ioc.value || '-'}${ioc.description ? ` - ${ioc.description}` : ''}`
    }));
    const table = createSingleColumnTable(iocFields);
    if (table) paragraphs.push(table);
  }

  // 9. Timeline
  const validTimelineEvents = (data.timeline || []).filter((timelineEvent: { time: string; content: string; severity: string }) =>
    isMeaningful(timelineEvent.time) || isMeaningful(timelineEvent.content)
  );

  if (validTimelineEvents.length > 0) {
    paragraphs.push(createSectionHeader("Attack Timeline", sectionCounter));

    const timelineFields = validTimelineEvents.map((event: { time: string; content: string; severity: string }) => ({
      label: `[${event.time || "N/A"}] (${event.severity || '-'})`,
      value: event.content || '-'
    }));
    const table = createSingleColumnTable(timelineFields);
    if (table) paragraphs.push(table);
  }

  // 10. Evidence Artifacts
  const meaningfulArtifacts = (data.artifacts || []).filter((artifactItem: { type: string; name: string; sha256: string; md5: string; size?: string; usedIn?: string[] }) =>
    isMeaningful(artifactItem.type) || isMeaningful(artifactItem.name) || isMeaningful(artifactItem.sha256) || isMeaningful(artifactItem.md5)
  );

  if (meaningfulArtifacts.length > 0) {
    paragraphs.push(createSectionHeader("Evidence Artifacts", sectionCounter));

    meaningfulArtifacts.forEach((artifact: { type: string; name: string; sha256: string; md5: string; size?: string; usedIn?: string[] }) => {
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
      
      const table = createTwoColumnTable(artifactLeft, artifactRight);
      if (table) paragraphs.push(table);
      
      paragraphs.push(new Paragraph({ spacing: { after: 100 } }));
    });
  }

  const { headerText } = formatReportHeader(analyst);

  const doc = new Document({
    sections: [{
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: headerText, size: 18, color: "666666", italics: true }),
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
      children: paragraphs,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const exportFileName = generateFileName(analyst, fileName, hash, "docx");
  downloadBlob(blob, exportFileName);
}