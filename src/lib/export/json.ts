// JSON Export
import { generateFileName, type ReportType } from "@/lib/fileNameUtils";
import { downloadBlob } from "./helpers";

export function exportJSON(
  data: any, 
  analyst: string, 
  fileName: string, 
  hash: string,
  reportType?: ReportType
): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const exportFileName = generateFileName(analyst, fileName, hash, "json", reportType);
  downloadBlob(blob, exportFileName);
}
