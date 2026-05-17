import { useEffect, useCallback, useMemo, useRef } from "react";
import { clearAllSectionStates } from "@/lib/sectionState";
import { useLanguage } from "@/hooks/useLanguage";
import { useDashboardExport } from "@/hooks/useDashboardExport";
import { useImportJSON } from "@/hooks/useImportJSON";
import { useSectionNavigation } from "@/hooks/useSectionNavigation";

interface UseDashboardActionsOptions<T> {
  setData: React.Dispatch<React.SetStateAction<T>>;
  clearData: () => void;
  undo: () => void;
  redo: () => void;
  // Type-specific callbacks
  exportJSON: () => Promise<void>;
  exportPDF: () => Promise<void>;
  exportWord: () => Promise<void>;
  validateImport: (data: string) => { success: true; data: T } | { success: false; error: string };
  migrateImport: (data: Record<string, unknown>) => T;
  preloadPDF: () => void;
  preloadWord: () => void;
  generateReportName: (ext: string) => string;
  // Optional: image support (MIA only)
  totalImageCount?: number;
  downloadAllImages?: () => void;
}

export function useDashboardActions<T>(options: UseDashboardActionsOptions<T>) {
  const { t } = useLanguage();
  const {
    setData,
    clearData,
    undo,
    redo,
    exportJSON,
    exportPDF,
    exportWord,
    validateImport,
    migrateImport,
    preloadPDF,
    preloadWord,
    generateReportName,
    totalImageCount = 0,
    downloadAllImages,
  } = options;

  // Section keyboard navigation
  useSectionNavigation();

  // Ctrl+Z / Ctrl+Shift+Z undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((!e.ctrlKey && !e.metaKey) || e.altKey) return;
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Export dialog state machine
  const {
    exportDialogOpen,
    setExportDialogOpen,
    pendingExportType,
    handleExportJSONClick,
    handleExportPDFClick,
    handleExportWordClick,
  } = useDashboardExport({
    jsonNeedsDialog: false,
    onExportJSONDirect: exportJSON,
  });

  // Stable references for import callbacks to avoid defeating useImportJSON memoization
  const setDataRef = useRef(setData);
  setDataRef.current = setData;
  const migrateImportRef = useRef(migrateImport);
  migrateImportRef.current = migrateImport;

  const handleImportSuccess = useCallback((importedData: unknown) => {
    clearAllSectionStates();
    const normalizedData = migrateImportRef.current(importedData as Record<string, unknown>);
    setDataRef.current(normalizedData);
  }, []);

  // Import
  const { importJSON } = useImportJSON({
    validate: validateImport,
    onSuccess: handleImportSuccess,
  });

  // Preload export chunks when dialog opens
  useEffect(() => {
    if (!exportDialogOpen) return;
    if (pendingExportType === "pdf") preloadPDF();
    if (pendingExportType === "word") preloadWord();
  }, [exportDialogOpen, pendingExportType, preloadPDF, preloadWord]);

  // Report filename
  const reportName = useMemo(() => {
    const ext = pendingExportType === "pdf" ? "pdf" : pendingExportType === "word" ? "docx" : "json";
    return generateReportName(ext);
  }, [generateReportName, pendingExportType]);

  // Confirm export handler — re-throws on failure so the dialog can handle it
  const handleConfirmExport = useCallback(async (shouldSaveImages: boolean, clearDataAfter: boolean) => {
    if (pendingExportType === "pdf") {
      await exportPDF();
    } else if (pendingExportType === "word") {
      await exportWord();
    } else {
      return; // JSON export is handled directly, not through dialog
    }
    if (shouldSaveImages && totalImageCount > 0 && downloadAllImages) {
      downloadAllImages();
    }
    if (clearDataAfter) {
      clearData();
    }
  }, [pendingExportType, exportPDF, exportWord, totalImageCount, downloadAllImages, clearData]);

  // Export options for DashboardHeader
  const exportOptions = useMemo(() => [
    { type: "json" as const, label: t("export.json"), onClick: handleExportJSONClick },
    { type: "pdf" as const, label: t("export.pdf"), onClick: handleExportPDFClick },
    { type: "word" as const, label: t("export.word"), onClick: handleExportWordClick },
  ], [t, handleExportJSONClick, handleExportPDFClick, handleExportWordClick]);

  return {
    importJSON,
    exportDialogOpen,
    setExportDialogOpen,
    pendingExportType,
    handleExportJSONClick,
    handleExportPDFClick,
    handleExportWordClick,
    handleConfirmExport,
    exportOptions,
    reportName,
  };
}
