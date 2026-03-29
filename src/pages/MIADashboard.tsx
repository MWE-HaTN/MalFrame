import { useEffect } from "react";
import { Target, Database, FolderOpen, Activity } from "lucide-react";
import { Header } from "@/components/Header";
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
import { useCaseManager } from "@/hooks/useCaseManager";
import { useImportJSON } from "@/hooks/useImportJSON";
import { useArtifactFileDrop } from "@/features/mia/hooks/useArtifactFileDrop";
import { useDashboardExport } from "@/hooks/useDashboardExport";
import { lazyExportJSON, lazyExportDFIRPDF, lazyExportDFIRWord, preloadDFIRPDF, preloadDFIRWord } from "@/lib/lazyExport";
import {
  prefetchMitreMapping,
  prefetchIOCTable,
  prefetchTimelineTable,
  prefetchEvidenceArtifacts
} from "@/lib/lazyPrefetch";
import { generateFileName } from "@/lib/fileNameUtils";
import { clearAllImages } from "@/lib/imageStorage";
import { clearAllSectionStates } from "@/lib/sectionState";
import { toast } from "sonner";
import { validateDFIRData } from "@/lib/validationSchemas";
import { MIA_STORAGE_KEY, initialDFIRData } from "@/features/mia/services/constants";
import { transformForExport } from "@/features/mia/services/transform";
import { migrateDFIRData } from "@/features/mia/services/migrate";

// ─────────────────────────────────────────────
// Outer shell: case manager + page chrome
// ─────────────────────────────────────────────

export default function MIADashboard() {
  const caseManager = useCaseManager("mia", MIA_STORAGE_KEY);

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
        />
        {caseManager.activeCaseId && (
          <MIADashboardBody
            key={caseManager.activeCaseId}
            storageKey={caseManager.activeStorageKey}
          />
        )}
      </main>
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
  const { data, setData, clearData, forceCloseCounter } = useDashboardData<DFIRData>({
    storageKey,
    initialData: initialDFIRData,
    migrateData: migrateDFIRData,
    onClearExtra: () => clearAllImages(),
    clearSuccessMessage: t("clear.success"),
  });

  const { handleFileDropped, handleMultipleFilesDropped } = useArtifactFileDrop({ setData });

  const formatExportError = (err: unknown) => {
    if (err instanceof Error) return err.message;
    return String(err);
  };

  const hasData = <T extends object>(obj: T, excludeKeys = ['id', 'timestamp', 'images']): boolean =>
    Object.entries(obj).some(([key, value]) => {
      if (excludeKeys.includes(key)) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return false;
      return Boolean(value);
    });

  const handleExportJSON = async () => {
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
    } catch (err) {
      toast.error(`${t("export.error")}: ${formatExportError(err)}`);
    }
  };

  const handleExportPDF = async () => {
    try {
      await lazyExportDFIRPDF(data, data.background.analyst, data.sampleInfo.fileName, data.sampleInfo.sha256);
      toast.success(t("export.success.pdf"));
    } catch (err) {
      toast.error(`${t("export.error")}: ${formatExportError(err)}`);
    }
  };

  const handleExportWord = async () => {
    try {
      await lazyExportDFIRWord(data, data.background.analyst, data.sampleInfo.fileName, data.sampleInfo.sha256);
      toast.success(t("export.success.word"));
    } catch (err) {
      toast.error(`${t("export.error")}: ${formatExportError(err)}`);
    }
  };

  const {
    exportDialogOpen,
    setExportDialogOpen,
    pendingExportType,
    handleExportJSONClick,
    handleExportPDFClick,
    handleExportWordClick,
  } = useDashboardExport({
    jsonNeedsDialog: false,
    onExportJSONDirect: handleExportJSON,
  });

  const { importJSON } = useImportJSON({
    validate: validateDFIRData,
    onSuccess: (importedData) => {
      clearAllSectionStates();
      const normalizedData = migrateDFIRData(importedData as Record<string, unknown>);
      setData(normalizedData);
    },
    successMessage: t("import.success"),
  });

  useEffect(() => {
    if (!exportDialogOpen) return;
    if (pendingExportType === "pdf") preloadDFIRPDF();
    if (pendingExportType === "word") preloadDFIRWord();
  }, [exportDialogOpen, pendingExportType]);

  const countLogImages = (log: LogEntry[] | undefined): number => {
    let count = 0;
    log?.forEach(entry => { count += entry.images?.length || 0; });
    return count;
  };

  const getTotalImageCount = (): number => {
    let count = 0;
    count += countLogImages(data.staticAnalysis.peSectionsEntropyLog);
    count += data.behaviorAnalysis.processTreeImages?.length || 0;
    count += data.behaviorAnalysis.fileSystemModsImages?.length || 0;
    count += data.behaviorAnalysis.registryPersistenceImages?.length || 0;
    count += data.behaviorAnalysis.networkActivityImages?.length || 0;
    count += data.behaviorAnalysis.memoryArtifactsImages?.length || 0;
    count += data.behaviorAnalysis.systemChangesImages?.length || 0;
    return count;
  };

  const getReportName = () => {
    const ext = pendingExportType === "pdf" ? "pdf" : pendingExportType === "word" ? "docx" : "json";
    return generateFileName(data.background.analyst, data.sampleInfo.fileName, data.sampleInfo.sha256, ext);
  };

  const downloadAllImages = () => {
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
  };

  const handleConfirmExport = async (_shouldSaveImages: boolean, clearDataAfter: boolean) => {
    if (pendingExportType === "pdf") {
      await handleExportPDF();
    } else {
      await handleExportWord();
    }
    if (_shouldSaveImages && getTotalImageCount() > 0) {
      downloadAllImages();
    }
    if (clearDataAfter) {
      clearData();
    }
  };

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
        exportOptions={[
          { type: "json", label: t("export.json"), onClick: handleExportJSONClick },
          { type: "pdf", label: t("export.pdf"), onClick: handleExportPDFClick },
          { type: "word", label: t("export.word"), onClick: handleExportWordClick },
        ]}
      />

      {/* File Drop Zone */}
      <LazyFileHashDropzone
        onFileDropped={handleFileDropped}
        onMultipleFilesDropped={handleMultipleFilesDropped}
        existingHashes={data.artifacts.map(a => a.sha256).filter(Boolean)}
      />

      {/* Background Section */}
      <BackgroundSection
        data={data.background}
        onChange={(background) => setData((p) => ({ ...p, background }))}
        forceCloseCounter={forceCloseCounter}
      />

      {/* Sample Information */}
      <SampleInfoSection
        data={data.sampleInfo}
        onChange={(sampleInfo) => setData((p) => ({ ...p, sampleInfo }))}
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
          onArtifactsChange={(artifacts) => setData((p) => ({ ...p, artifacts }))}
          onSampleSelected={(artifact) => {
            setData((p) => ({
              ...p,
              sampleInfo: {
                ...p.sampleInfo,
                fileName: artifact.name,
                fileSize: artifact.size,
                sha256: artifact.sha256,
              },
            }));
          }}
          onSampleCleared={() => {
            setData((p) => ({
              ...p,
              sampleInfo: {
                ...p.sampleInfo,
                fileName: "",
                fileSize: "",
                sha256: "",
              },
            }));
          }}
        />
      </CollapsibleSection>

      {/* Static Analysis */}
      <StaticAnalysisSection
        data={data.staticAnalysis}
        onChange={(staticAnalysis) => setData((p) => ({ ...p, staticAnalysis }))}
        forceCloseCounter={forceCloseCounter}
      />

      {/* Behavior Analysis */}
      <BehaviorAnalysisSection
        data={data.behaviorAnalysis}
        onChange={(behaviorAnalysis) => setData((p) => ({ ...p, behaviorAnalysis }))}
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
          onMappingChange={(mapping) => setData((p) => ({ ...p, mitreMapping: mapping }))}
        />
      </CollapsibleSection>

      {/* Impact Assessment */}
      <ImpactSection
        data={data.impact}
        onChange={(impact) => setData((p) => ({ ...p, impact }))}
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
          onIOCsChange={(iocs) => setData((p) => ({ ...p, iocs }))}
        />
      </CollapsibleSection>

      {/* Recommendations */}
      <RecommendationsSection
        data={data.recommendations}
        onChange={(recommendations) => setData((p) => ({ ...p, recommendations }))}
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
          onEventsChange={(events) => setData((p) => ({ ...p, timeline: events }))}
        />
      </CollapsibleSection>

      {/* Export Confirm Dialog */}
      <LazyExportConfirmDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reportName={getReportName()}
        exportType={pendingExportType}
        onConfirmExport={handleConfirmExport}
        hasImages={getTotalImageCount() > 0}
        imageCount={getTotalImageCount()}
      />
    </>
  );
}
