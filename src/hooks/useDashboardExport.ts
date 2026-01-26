import { useState, useCallback } from "react";

export type ExportType = "json" | "pdf" | "word";

interface UseDashboardExportOptions {
  /** If true, JSON export opens dialog; if false, executes directly */
  jsonNeedsDialog?: boolean;
  onExportJSONDirect?: () => void;
}

export function useDashboardExport(options: UseDashboardExportOptions = {}) {
  const { jsonNeedsDialog = true, onExportJSONDirect } = options;
  
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<ExportType>("pdf");

  const handleExportJSONClick = useCallback(() => {
    setPendingExportType("json");
    if (jsonNeedsDialog) {
      setExportDialogOpen(true);
    } else {
      onExportJSONDirect?.();
    }
  }, [jsonNeedsDialog, onExportJSONDirect]);

  const handleExportPDFClick = useCallback(() => {
    setPendingExportType("pdf");
    setExportDialogOpen(true);
  }, []);

  const handleExportWordClick = useCallback(() => {
    setPendingExportType("word");
    setExportDialogOpen(true);
  }, []);

  return {
    exportDialogOpen,
    setExportDialogOpen,
    pendingExportType,
    handleExportJSONClick,
    handleExportPDFClick,
    handleExportWordClick,
  };
}
