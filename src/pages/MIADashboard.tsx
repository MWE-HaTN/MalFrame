import { useState, useEffect, useCallback, useMemo } from "react";
import { Target, Database, FolderOpen, Activity } from "lucide-react";
import { Header } from "@/components/Header";
import { formatExportError, hasData } from "@/lib/dashboardExportUtils";
import { recordExportTime } from "@/lib/export/helpers";
import {
  LazyMitreAttackMapping,
  LazyIOCTable,
  LazyTimelineTable,
  LazyEvidenceArtifacts,
  LazyFileHashDropzone,
  LazyExportConfirmDialog,
} from "@/components/lazy";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DashboardHeader } from "@/components/dashboard";
import { CaseSwitcher } from "@/components/CaseSwitcher";
import { ScrollToTop } from "@/components/ScrollToTop";
import {
  BackgroundSection,
  SampleInfoSection,
  ImpactSection,
  RecommendationsSection,
  StaticAnalysisSection,
  BehaviorAnalysisSection,
} from "@/features/mia/components";
import type { LogEntry } from "@/types/dashboard";
import type { DFIRData } from "@/features/mia/types";

import { useLanguage } from "@/hooks/useLanguage";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardActions } from "@/hooks/useDashboardActions";
import { useCaseManager } from "@/hooks/useCaseManager";
import { useArtifactFileDrop } from "@/features/mia/hooks/useArtifactFileDrop";
import { lazyExportJSON, lazyExportDFIRPDF, lazyExportDFIRWord, preloadDFIRPDF, preloadDFIRWord } from "@/lib/lazyExport";
import {
  prefetchMitreMapping,
  prefetchIOCTable,
  prefetchTimelineTable,
  prefetchEvidenceArtifacts
} from "@/lib/lazyPrefetch";
import { generateFileName } from "@/lib/fileNameUtils";
import { clearAllImages } from "@/lib/imageStorage";
import { toast } from "sonner";
import { validateDFIRData } from "@/lib/validationSchemas";
import { MIA_STORAGE_KEY, initialDFIRData } from "@/features/mia/services/constants";
import { transformForExport } from "@/features/mia/services/transform";
import { migrateDFIRData } from "@/features/mia/services/migrate";
import { CaseTemplateDialog } from "@/components/CaseTemplateDialog";
import { getTemplatesForType } from "@/lib/caseTemplates";

// ─────────────────────────────────────────────
// Outer shell: case manager + page chrome
// ─────────────────────────────────────────────

export default function MIADashboard() {
  const caseManager = useCaseManager("mia", MIA_STORAGE_KEY);

  useEffect(() => { document.title = "MIA - MalFrame"; }, []);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const handleTemplateSelect = useCallback(
    async (templateId: string) => {
      await caseManager.createCase();
      const template = getTemplatesForType("mia").find((t) => t.id === templateId);
      if (template?.fillMIA) {
        const filled = template.fillMIA({ ...initialDFIRData });
        // Save template-filled data for the new case
        const { dbSet } = await import("@/lib/db");
        await dbSet("dashboard", caseManager.activeStorageKey, filled);
      }
    },
    [caseManager],
  );

  return (
    <div className="min-h-screen bg-background cyber-grid flex flex-col">
      <Header />
      <ScrollToTop />
      <main id="main-content" className="container max-w-7xl mx-auto py-6 space-y-4 flex-1">
        <CaseSwitcher
          cases={caseManager.cases}
          activeCaseId={caseManager.activeCaseId}
          createCase={caseManager.createCase}
          switchCase={caseManager.switchCase}
          deleteCase={caseManager.deleteCase}
          renameCase={caseManager.renameCase}
          onNewCaseClick={() => setTemplateDialogOpen(true)}
        />
        {caseManager.activeCaseId && (
          <MIADashboardBody
            key={caseManager.activeCaseId}
            storageKey={caseManager.activeStorageKey}
          />
        )}
      </main>

      <CaseTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        caseType="mia"
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Inner body: dashboard data + all sections
// Re-mounts on case switch via key prop
// ─────────────────────────────────────────────

interface MIADashboardBodyProps {
  storageKey: string;
}

function MIADashboardBody({ storageKey }: MIADashboardBodyProps) {
  const { t } = useLanguage();
  const { data, setData, clearData, undo, redo, forceCloseCounter, saveStatus } = useDashboardData<DFIRData>({
    storageKey,
    initialData: initialDFIRData,
    migrateData: migrateDFIRData,
    onClearExtra: () => clearAllImages(),
    clearSuccessMessage: t("clear.success"),
  });

  const { handleFileDropped, handleMultipleFilesDropped } = useArtifactFileDrop({ setData });

  // MIA-specific export handlers
  const handleExportJSON = useCallback(async () => {
    try {
      const cleanedData = {
        ...data,
        staticAnalysis: {
          ...data.staticAnalysis,
          peSectionsEntropyLog: data.staticAnalysis.peSectionsEntropyLog.filter((entry) => hasData(entry)),
        },
        iocs: data.iocs.filter((entry) => hasData(entry)),
        timeline: data.timeline.filter((entry) => hasData(entry)),
        artifacts: data.artifacts.filter((entry) => hasData(entry)),
      };
      const exportData = transformForExport(cleanedData);
      await lazyExportJSON(exportData, data.background.analyst, data.sampleInfo.fileName, data.sampleInfo.sha256, "MIA");
      toast.success(t("export.success.json"));
      recordExportTime(storageKey);
    } catch (err) {
      toast.error(`${t("export.error")}: ${formatExportError(err)}`);
    }
  }, [data, storageKey, t]);

  const handleExportPDF = useCallback(async () => {
    try {
      await lazyExportDFIRPDF(data, data.background.analyst, data.sampleInfo.fileName, data.sampleInfo.sha256);
      toast.success(t("export.success.pdf"));
      recordExportTime(storageKey);
    } catch (err) {
      toast.error(`${t("export.error")}: ${formatExportError(err)}`);
    }
  }, [data, storageKey, t]);

  const handleExportWord = useCallback(async () => {
    try {
      await lazyExportDFIRWord(data, data.background.analyst, data.sampleInfo.fileName, data.sampleInfo.sha256);
      toast.success(t("export.success.word"));
      recordExportTime(storageKey);
    } catch (err) {
      toast.error(`${t("export.error")}: ${formatExportError(err)}`);
    }
  }, [data, storageKey, t]);

  // MIA-specific image counting
  const totalImageCount = useMemo(() => {
    let count = 0;
    const log = data.staticAnalysis.peSectionsEntropyLog;
    log?.forEach(entry => { count += entry.images?.length || 0; });
    count += data.behaviorAnalysis.processTreeImages?.length || 0;
    count += data.behaviorAnalysis.fileSystemModsImages?.length || 0;
    count += data.behaviorAnalysis.registryPersistenceImages?.length || 0;
    count += data.behaviorAnalysis.networkActivityImages?.length || 0;
    count += data.behaviorAnalysis.memoryArtifactsImages?.length || 0;
    count += data.behaviorAnalysis.systemChangesImages?.length || 0;
    return count;
  }, [data]);

  // MIA-specific image download
  const downloadAllImages = useCallback(() => {
    const hash = data.sampleInfo.sha256?.slice(0, 8) || "nohash";
    const downloadLogImages = (log: LogEntry[] | undefined, fieldPrefix: string) => {
      log?.forEach((entry, entryIndex) => {
        entry.images?.forEach((img, imgIndex) => {
          const link = document.createElement("a");
          link.href = img;
          const ext = img.split(";")[0].split("/")[1] || "png";
          link.download = `${hash}_${fieldPrefix}_entry${entryIndex + 1}_${imgIndex + 1}.${ext}`;
          link.click();
        });
      });
    };
    const downloadFieldImages = (images: string[] | undefined, fieldName: string) => {
      images?.forEach((img, imgIndex) => {
        const link = document.createElement("a");
        link.href = img;
        const ext = img.split(";")[0].split("/")[1] || "png";
        link.download = `${hash}_${fieldName}_${imgIndex + 1}.${ext}`;
        link.click();
      });
    };
    downloadLogImages(data.staticAnalysis.peSectionsEntropyLog, "peSectionsEntropy");
    downloadFieldImages(data.behaviorAnalysis.processTreeImages, "processTree");
    downloadFieldImages(data.behaviorAnalysis.fileSystemModsImages, "fileSystemMods");
    downloadFieldImages(data.behaviorAnalysis.registryPersistenceImages, "registryPersistence");
    downloadFieldImages(data.behaviorAnalysis.networkActivityImages, "networkActivity");
    downloadFieldImages(data.behaviorAnalysis.memoryArtifactsImages, "memoryArtifacts");
    downloadFieldImages(data.behaviorAnalysis.systemChangesImages, "systemChanges");
    toast.success(`Downloaded images!`);
  }, [data]);

  // Shared dashboard actions (export dialog, import, undo/redo shortcuts, section nav)
  const {
    importJSON,
    exportDialogOpen,
    setExportDialogOpen,
    pendingExportType,
    handleConfirmExport,
    exportOptions,
    reportName,
  } = useDashboardActions({
    data, setData, clearData, undo, redo,
    exportJSON: handleExportJSON,
    exportPDF: handleExportPDF,
    exportWord: handleExportWord,
    validateImport: validateDFIRData,
    migrateImport: migrateDFIRData,
    preloadPDF: preloadDFIRPDF,
    preloadWord: preloadDFIRWord,
    generateReportName: (ext) => generateFileName(data.background.analyst, data.sampleInfo.fileName, data.sampleInfo.sha256, ext),
    totalImageCount,
    downloadAllImages,
  });

  // Memoized onChange handlers for section components
  const handleBackgroundChange = useCallback((background: DFIRData["background"]) => setData((p) => ({ ...p, background })), [setData]);
  const handleSampleInfoChange = useCallback((sampleInfo: DFIRData["sampleInfo"]) => setData((p) => ({ ...p, sampleInfo })), [setData]);
  const handleArtifactsChange = useCallback((artifacts: DFIRData["artifacts"]) => setData((p) => ({ ...p, artifacts })), [setData]);
  const handleSampleSelected = useCallback((artifact: { name: string; size: string; sha256: string }) => {
    setData((p) => ({
      ...p,
      sampleInfo: { ...p.sampleInfo, fileName: artifact.name, fileSize: artifact.size, sha256: artifact.sha256 },
    }));
  }, [setData]);
  const handleSampleCleared = useCallback(() => {
    setData((p) => ({
      ...p,
      sampleInfo: { ...p.sampleInfo, fileName: "", fileSize: "", sha256: "" },
    }));
  }, [setData]);
  const handleStaticAnalysisChange = useCallback((staticAnalysis: DFIRData["staticAnalysis"]) => setData((p) => ({ ...p, staticAnalysis })), [setData]);
  const handleBehaviorAnalysisChange = useCallback((behaviorAnalysis: DFIRData["behaviorAnalysis"]) => setData((p) => ({ ...p, behaviorAnalysis })), [setData]);
  const handleMitreMappingChange = useCallback((mitreMapping: DFIRData["mitreMapping"]) => setData((p) => ({ ...p, mitreMapping })), [setData]);
  const handleImpactChange = useCallback((impact: DFIRData["impact"]) => setData((p) => ({ ...p, impact })), [setData]);
  const handleIOCsChange = useCallback((iocs: DFIRData["iocs"]) => setData((p) => ({ ...p, iocs })), [setData]);
  const handleRecommendationsChange = useCallback((recommendations: DFIRData["recommendations"]) => setData((p) => ({ ...p, recommendations })), [setData]);
  const handleTimelineChange = useCallback((timeline: DFIRData["timeline"]) => setData((p) => ({ ...p, timeline })), [setData]);

  // Memoized computed values
  const existingHashes = useMemo(() => data.artifacts.map(a => a.sha256).filter(Boolean), [data.artifacts]);

  return (
    <>
      {/* Page Header */}
      <DashboardHeader
        title={t("mia.title")}
        subtitle={t("mia.subtitle")}
        onImport={importJSON}
        onClear={clearData}
        importLabel={t("common.import")}
        exportLabel={t("common.export")}
        exportOptions={exportOptions}
        saveStatus={saveStatus}
      />

      {/* File Drop Zone */}
      <LazyFileHashDropzone
        onFileDropped={handleFileDropped}
        onMultipleFilesDropped={handleMultipleFilesDropped}
        existingHashes={existingHashes}
      />

      {/* Background Section */}
      <BackgroundSection
        data={data.background}
        onChange={handleBackgroundChange}
        forceCloseCounter={forceCloseCounter}
      />

      {/* Sample Information */}
      <SampleInfoSection
        data={data.sampleInfo}
        onChange={handleSampleInfoChange}
        forceCloseCounter={forceCloseCounter}
      />

      {/* Evidence & Artifacts */}
      <CollapsibleSection
        title={t("mia.evidence")}
        icon={<FolderOpen className="w-4 h-4" />}
        storageKey="mia-artifacts"
        forceClose={forceCloseCounter}
        onPrefetch={prefetchEvidenceArtifacts}
        hint={t("hint.mia.evidence")}
      >
        <LazyEvidenceArtifacts
          artifacts={data.artifacts}
          onArtifactsChange={handleArtifactsChange}
          onSampleSelected={handleSampleSelected}
          onSampleCleared={handleSampleCleared}
        />
      </CollapsibleSection>

      {/* Static Analysis */}
      <StaticAnalysisSection
        data={data.staticAnalysis}
        onChange={handleStaticAnalysisChange}
        forceCloseCounter={forceCloseCounter}
      />

      {/* Behavior Analysis */}
      <BehaviorAnalysisSection
        data={data.behaviorAnalysis}
        onChange={handleBehaviorAnalysisChange}
        forceCloseCounter={forceCloseCounter}
      />

      {/* MITRE ATT&CK Mapping */}
      <CollapsibleSection
        title={t("mia.mitreMapping")}
        icon={<Target className="w-4 h-4" />}
        storageKey="dfir-mitre"
        forceClose={forceCloseCounter}
        lazy
        skeletonVariant="table"
        skeletonRows={5}
        onPrefetch={prefetchMitreMapping}
        hint={t("hint.mia.mitre")}
      >
        <LazyMitreAttackMapping
          mapping={data.mitreMapping}
          onMappingChange={handleMitreMappingChange}
          behaviorData={data.behaviorAnalysis}
        />
      </CollapsibleSection>

      {/* Impact Assessment */}
      <ImpactSection
        data={data.impact}
        onChange={handleImpactChange}
        forceCloseCounter={forceCloseCounter}
      />

      {/* IOC Table */}
      <CollapsibleSection
        title={t("mia.iocTable")}
        icon={<Database className="w-4 h-4" />}
        storageKey="dfir-ioc"
        forceClose={forceCloseCounter}
        lazy
        skeletonVariant="table"
        skeletonRows={4}
        onPrefetch={prefetchIOCTable}
        hint={t("hint.mia.ioc")}
      >
        <LazyIOCTable
          iocs={data.iocs}
          onIOCsChange={handleIOCsChange}
        />
      </CollapsibleSection>

      {/* Recommendations */}
      <RecommendationsSection
        data={data.recommendations}
        onChange={handleRecommendationsChange}
        forceCloseCounter={forceCloseCounter}
      />

      {/* Timeline */}
      <CollapsibleSection
        title={t("mia.timeline")}
        icon={<Activity className="w-4 h-4" />}
        storageKey="dfir-timeline"
        forceClose={forceCloseCounter}
        lazy
        skeletonVariant="table"
        skeletonRows={4}
        onPrefetch={prefetchTimelineTable}
        hint={t("hint.mia.timeline")}
      >
        <LazyTimelineTable
          events={data.timeline}
          onEventsChange={handleTimelineChange}
        />
      </CollapsibleSection>

      {/* Export Confirm Dialog */}
      <LazyExportConfirmDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reportName={reportName}
        exportType={pendingExportType}
        onConfirmExport={handleConfirmExport}
        hasImages={totalImageCount > 0}
        imageCount={totalImageCount}
      />
    </>
  );
}
