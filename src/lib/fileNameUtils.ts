/**
 * Generate filename utility
 * Extracted to a separate file for lightweight imports without loading heavy export libraries
 */

export type ReportType = "MRE" | "MIA";

/**
 * Generate filename in format: YourName_Date_filename_hash.REPORT_TYPE.ext
 * For JSON: includes report type suffix (e.g., .MRE.json, .MIA.json)
 * For other formats: standard extension (e.g., .pdf, .docx)
 */
export function generateFileName(
  analyst: string, 
  fileName: string, 
  hash: string, 
  extension: string,
  reportType?: ReportType
): string {
  const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const safeName = analyst.replace(/[^a-zA-Z0-9._-]/g, "") || "Analyst";
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "") || "report";
  const shortHash = hash.slice(0, 8) || "nohash";
  
  // For JSON exports, include report type suffix
  if (extension === "json" && reportType) {
    return `${safeName}_${date}_${safeFileName}_${shortHash}.${reportType}.json`;
  }
  
  return `${safeName}_${date}_${safeFileName}_${shortHash}.${extension}`;
}
