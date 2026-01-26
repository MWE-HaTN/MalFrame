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
import { CollapsibleSection, clearAllSectionStates } from "@/components/CollapsibleSection";
import { DashboardHeader } from "@/components/dashboard";
import { ScrollToTop } from "@/components/ScrollToTop";
import {
  BackgroundSection, 
  SampleInfoSection, 
  ImpactSection, 
  RecommendationsSection,
  StaticAnalysisSection,
  BehaviorAnalysisSection,
} from "@/components/mia";
import type { LogEntry } from "@/types/dashboard";
import type { DFIRData } from "@/types/mia";

import { useLanguage } from "@/contexts/LanguageContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useImportJSON } from "@/hooks/useImportJSON";
import { useArtifactFileDrop } from "@/hooks/useArtifactFileDrop";
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
import { toast } from "sonner";
import { validateDFIRData } from "@/lib/validationSchemas";
import { MIA_STORAGE_KEY, initialDFIRData } from "@/lib/mia/constants";
import { transformForExport } from "@/lib/mia/transform";
import { migrateDFIRData } from "@/lib/mia/migrate";

export default function MIADashboard() {
  const { t } = useLanguage();
  const { data, setData, clearData, forceCloseCounter } = useDashboardData<DFIRData>({
    storageKey: MIA_STORAGE_KEY,
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

  // Helper to check if an entry has any meaningful data
  const hasData = <T extends object>(obj: T, excludeKeys = ['id', 'timestamp', 'images']): boolean => 
    Object.entries(obj).some(([key, value]) => {
      if (excludeKeys.includes(key)) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return false;
      return Boolean(value);
    });

  const handleExportJSON = async () => {
    try {
      // Filter empty entries before export
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
      
      // Transform to nested structure for export
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
      // Clear existing data first by removing from localStorage
      localStorage.removeItem(MIA_STORAGE_KEY);
      clearAllSectionStates();
      
      // Run migrateData to normalize the imported data structure
      const normalizedData = migrateDFIRData(importedData as Record<string, unknown>);
      setData(normalizedData);
    },
    successMessage: t("import.success"),
  });

  // Preload export modules when dialog opens
  useEffect(() => {
    if (!exportDialogOpen) return;
    if (pendingExportType === "pdf") preloadDFIRPDF();
    if (pendingExportType === "word") preloadDFIRWord();
  }, [exportDialogOpen, pendingExportType]);

  // Helper to count images in log entries
  const countLogImages = (log: LogEntry[] | undefined): number => {
    let count = 0;
    log?.forEach(entry => { count += entry.images?.length || 0; });
    return count;
  };

  // Count total images (only from LogEntry[] fields and behavior analysis images)
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
    
    // Download behavior analysis images
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
    <div className="min-h-screen bg-background cyber-grid flex flex-col">
      <Header />
      <ScrollToTop />
      
      <main id="main-content" className="container max-w-7xl mx-auto py-6 space-y-4 flex-1">
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
      </main>
    </div>
  );
}
