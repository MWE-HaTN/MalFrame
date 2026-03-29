import { useEffect } from "react";
import { FileText, Cpu, Code, Activity, Database } from "lucide-react";
import { Header } from "@/components/Header";
import {
  LazyMBCMapping,
  LazyIOCTable,
  LazyRuntimeBehavior,
  LazyCodeAnalysisGroups,
  LazyFileHashDropzone,
  LazyExportConfirmDialog,
  LazyStaticAnalysisCards,
  LazySecurityPosture,
  LazyPESectionEntry,
  LazyPackedDropdown,
} from "@/components/lazy";
import { FormField } from "@/components/FormField";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PackerSuspectedDropdown } from "@/features/mre/components/PackerSuspectedDropdown";
import { ScrollToTop } from "@/components/ScrollToTop";
import { DashboardHeader } from "@/components/dashboard";
import { CaseSwitcher } from "@/components/CaseSwitcher";
import { BackgroundSection, SummarySection, OSINTLookupSection } from "@/features/mre/components";

import { useLanguage } from "@/hooks/useLanguage";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useCaseManager } from "@/hooks/useCaseManager";
import { useImportJSON } from "@/hooks/useImportJSON";
import { useDashboardExport } from "@/hooks/useDashboardExport";
import { lazyExportJSON, lazyExportREPDF, lazyExportREWord, preloadREPDF, preloadREWord } from "@/lib/lazyExport";
import {
  prefetchMBCMapping,
  prefetchRuntimeBehavior,
  prefetchCodeAnalysis,
  prefetchIOCTable,
  prefetchStaticAnalysisCards,
  prefetchSecurityPosture,
  prefetchPESectionEntry,
} from "@/lib/lazyPrefetch";
import { generateFileName } from "@/lib/fileNameUtils";
import { clearAllSectionStates } from "@/lib/sectionState";
import { toast } from "sonner";
import { validateREData } from "@/lib/validationSchemas";

import type { REData } from "@/features/mre/types";
import { MRE_STORAGE_KEY, initialREData, defaultSummary } from "@/features/mre/services/constants";
import { transformForExport } from "@/features/mre/services/transform";
import { migrateREData } from "@/features/mre/services/migrate";

// ─────────────────────────────────────────────
// Outer shell: case manager + page chrome
// ─────────────────────────────────────────────

export default function MREDashboard() {
  const caseManager = useCaseManager("mre", MRE_STORAGE_KEY);

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
          <MREDashboardBody
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

interface MREDashboardBodyProps {
  storageKey: string;
}

function MREDashboardBody({ storageKey }: MREDashboardBodyProps) {
  const { t } = useLanguage();
  const { data, setData, clearData, forceCloseCounter } = useDashboardData<REData>({
    storageKey,
    initialData: initialREData,
    migrateData: migrateREData,
    clearSuccessMessage: t("clear.success"),
  });

  const handleHashGenerated = (hash: string, fileName: string, fileSize: number) => {
    setData((prev) => ({
      ...prev,
      background: { ...prev.background, fileName },
      staticAnalysis: {
        ...prev.staticAnalysis,
        sha256: hash,
        fileSize: `${(fileSize / 1024).toFixed(2)} KB`,
      },
    }));
  };

  const formatExportError = (err: unknown) => {
    if (err instanceof Error) return err.message;
    return String(err);
  };

  const handleExportJSON = async () => {
    try {
      const hasData = <T extends object>(obj: T, excludeKeys = ['id', 'timestamp', 'images']): boolean =>
        Object.entries(obj).some(([key, value]) => {
          if (excludeKeys.includes(key)) return false;
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'boolean') return false;
          return Boolean(value);
        });

      const cleanedData: REData = {
        ...data,
        staticAnalysis: {
          ...data.staticAnalysis,
          peSections: data.staticAnalysis.peSections.filter((entry) => hasData(entry)),
          unpackLayers: data.staticAnalysis.unpackLayers.filter((entry) => hasData(entry)),
        },
        codeBehavior: {
          ...data.codeBehavior,
          runtimeBehavior: {
            ...data.codeBehavior.runtimeBehavior,
            triggers: data.codeBehavior.runtimeBehavior.triggers.filter((entry) => hasData(entry)),
            antiDebug: data.codeBehavior.runtimeBehavior.antiDebug.filter((entry) => hasData(entry)),
            antiVM: data.codeBehavior.runtimeBehavior.antiVM.filter((entry) => hasData(entry)),
            executionFlow: data.codeBehavior.runtimeBehavior.executionFlow.filter((entry) => hasData(entry)),
            systemArtifacts: data.codeBehavior.runtimeBehavior.systemArtifacts.filter((entry) => hasData(entry)),
            persistence: data.codeBehavior.runtimeBehavior.persistence.filter((entry) => hasData(entry)),
            network: data.codeBehavior.runtimeBehavior.network.filter((entry) => hasData(entry)),
            memory: data.codeBehavior.runtimeBehavior.memory.filter((entry) => hasData(entry)),
            processInjection: data.codeBehavior.runtimeBehavior.processInjection.filter((entry) => hasData(entry)),
          },
          codeAnalysis: {
            staticCodeAnalysis: {
              interestingFunctions: data.codeBehavior.codeAnalysis.staticCodeAnalysis.interestingFunctions.filter((entry) => hasData(entry)),
              controlFlow: data.codeBehavior.codeAnalysis.staticCodeAnalysis.controlFlow.filter((entry) => hasData(entry)),
              apiUsage: data.codeBehavior.codeAnalysis.staticCodeAnalysis.apiUsage.filter((entry) => hasData(entry)),
              obfuscation: data.codeBehavior.codeAnalysis.staticCodeAnalysis.obfuscation.filter((entry) => hasData(entry)),
            },
            dynamicCodeAnalysis: {
              breakpointEvents: data.codeBehavior.codeAnalysis.dynamicCodeAnalysis.breakpointEvents.filter((entry) => hasData(entry)),
              memoryRegions: data.codeBehavior.codeAnalysis.dynamicCodeAnalysis.memoryRegions.filter((entry) => hasData(entry)),
              runtimeApiTrace: data.codeBehavior.codeAnalysis.dynamicCodeAnalysis.runtimeApiTrace.filter((entry) => hasData(entry)),
              registerStack: data.codeBehavior.codeAnalysis.dynamicCodeAnalysis.registerStack.filter((entry) => hasData(entry)),
            },
          },
        },
        deepDive: {
          ...data.deepDive,
          executionStages: data.deepDive.executionStages.filter((stage) =>
            stage.entryPoint || stage.entryCondition || stage.purpose || stage.actions ||
            stage.exitCondition || stage.failureAbortBehavior || stage.transitionMethod ||
            stage.apisUsed || stage.artifacts || stage.ioc
          ),
          cryptoEntries: data.deepDive.cryptoEntries.filter((entry) => hasData(entry)),
          microBehaviors: data.deepDive.microBehaviors.filter((entry) => entry.name),
        },
        detection: {
          mbcMapping: (data.detection?.mbcMapping || []).filter((entry) => entry.name),
          yaraSignature: data.detection?.yaraSignature || "",
          iocs: (data.detection?.iocs || []).filter((entry) => hasData(entry)),
          summary: data.detection?.summary || defaultSummary,
        },
      };

      const exportData = transformForExport(cleanedData);
      await lazyExportJSON(exportData, data.background.analyst, data.background.fileName, data.staticAnalysis.sha256, "MRE");
      toast.success(t("export.success.json"));
    } catch (err) {
      toast.error(`${t("export.error")}: ${formatExportError(err)}`);
    }
  };

  const handleExportPDF = async () => {
    try {
      await lazyExportREPDF(data, data.background.analyst, data.background.fileName, data.staticAnalysis.sha256);
      toast.success(t("export.success.pdf"));
    } catch (err) {
      toast.error(`${t("export.error")}: ${formatExportError(err)}`);
    }
  };

  const handleExportWord = async () => {
    try {
      await lazyExportREWord(data, data.background.analyst, data.background.fileName, data.staticAnalysis.sha256);
      toast.success(t("export.success.word"));
    } catch (err) {
      toast.error(`${t("export.error")}: ${formatExportError(err)}`);
    }
  };

  const { importJSON } = useImportJSON({
    validate: validateREData,
    onSuccess: (importedData) => {
      clearAllSectionStates();
      const normalizedData = migrateREData(importedData as Record<string, unknown>);
      setData(normalizedData);
    },
    successMessage: t("import.success"),
  });

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

  useEffect(() => {
    if (!exportDialogOpen) return;
    if (pendingExportType === "pdf") preloadREPDF();
    if (pendingExportType === "word") preloadREWord();
  }, [exportDialogOpen, pendingExportType]);

  const getReportName = () => {
    const ext = pendingExportType === "pdf" ? "pdf" : pendingExportType === "word" ? "docx" : "json";
    return generateFileName(data.background.analyst, data.background.fileName, data.staticAnalysis.sha256, ext);
  };

  const handleConfirmExport = async (_shouldSaveImages: boolean, clearDataAfter: boolean) => {
    if (pendingExportType === "pdf") {
      await handleExportPDF();
    } else {
      await handleExportWord();
    }
    if (clearDataAfter) {
      clearData();
    }
  };

  return (
    <>
      {/* Page Header */}
      <DashboardHeader
        title={t("mre.title")}
        subtitle={t("mre.subtitle")}
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
      <LazyFileHashDropzone onHashGenerated={handleHashGenerated} />

      {/* Background Section */}
      <BackgroundSection
        data={data.background}
        onChange={(background) => setData((p) => ({ ...p, background }))}
        forceCloseCounter={forceCloseCounter}
      />

      {/* Static Analysis Section */}
      <CollapsibleSection
        title={t("mre.staticAnalysis")}
        icon={<Cpu className="w-4 h-4" />}
        defaultOpen={true}
        storageKey="re-static-analysis"
        forceClose={forceCloseCounter}
        lazy
        skeletonVariant="form"
        skeletonRows={5}
        onPrefetch={() => {
          prefetchStaticAnalysisCards();
          prefetchSecurityPosture();
          prefetchPESectionEntry();
        }}
        hint={t("hint.mre.staticAnalysis")}
      >
        <OSINTLookupSection
          data={{
            virusTotal: data.staticAnalysis.virusTotal,
            malwareBazaar: data.staticAnalysis.malwareBazaar,
            anyRun: data.staticAnalysis.anyRun,
            tiNotes: data.staticAnalysis.tiNotes,
          }}
          onChange={(patch) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, ...patch } }))}
        />

        <LazyStaticAnalysisCards
          data={{
            sha256: data.staticAnalysis.sha256,
            impHash: data.staticAnalysis.impHash,
            fileType: data.staticAnalysis.fileType,
            fileSize: data.staticAnalysis.fileSize,
            compileTime: data.staticAnalysis.compileTime,
            fileEntropy: data.staticAnalysis.fileEntropy,
            entryPoint: data.staticAnalysis.entryPoint,
            imageBase: data.staticAnalysis.imageBase,
            architecture: data.staticAnalysis.architecture,
            numberOfSections: data.staticAnalysis.numberOfSections,
            characteristics: data.staticAnalysis.characteristics,
            subsystem: data.staticAnalysis.subsystem,
          }}
          onChange={(patch) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, ...patch } }))}
        />

        <LazySecurityPosture
          signatureStatus={data.staticAnalysis.signatureStatus}
          dllMitigations={data.staticAnalysis.dllMitigations}
          onSignatureChange={(value) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, signatureStatus: value } }))}
          onMitigationsChange={(mitigations) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, dllMitigations: mitigations } }))}
        />

        <div className="space-y-2 mb-4">
          <label className="label-cyber block">{t("mre.peSections")}</label>
          <LazyPESectionEntry
            entries={data.staticAnalysis.peSections || []}
            onEntriesChange={(entries) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, peSections: entries } }))}
          />
        </div>

        <div className={`grid grid-cols-1 ${data.staticAnalysis.isPacked === "yes" ? "lg:grid-cols-2" : ""} gap-4 mb-4`}>
          <LazyPackedDropdown
            isPacked={data.staticAnalysis.isPacked}
            onPackedChange={(v) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, isPacked: v } }))}
            unpackLayers={data.staticAnalysis.unpackLayers}
            onUnpackLayersChange={(layers) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, unpackLayers: layers } }))}
          />
          {data.staticAnalysis.isPacked === "yes" && (
            <PackerSuspectedDropdown
              value={data.staticAnalysis.packerSuspected}
              onChange={(v) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, packerSuspected: v } }))}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            label={t("mre.stringsDetection")}
            type="textarea"
            rows={3}
            value={data.staticAnalysis.stringsDetection}
            onChange={(v) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, stringsDetection: v } }))}
            placeholder={t("mre.placeholder.stringsDetection")}
          />
          <FormField
            label={t("mre.importsExports")}
            type="textarea"
            rows={3}
            value={data.staticAnalysis.importsExports}
            onChange={(v) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, importsExports: v } }))}
            placeholder={t("mre.placeholder.importsExports")}
          />
        </div>
      </CollapsibleSection>

      {/* Runtime Behavior Section */}
      <CollapsibleSection
        title={t("mre.runtimeBehavior")}
        icon={<Activity className="w-4 h-4" />}
        storageKey="re-runtime-behavior"
        forceClose={forceCloseCounter}
        lazy
        skeletonVariant="form"
        skeletonRows={4}
        onPrefetch={prefetchRuntimeBehavior}
        hint={t("hint.mre.runtimeBehavior")}
      >
        <LazyRuntimeBehavior
          data={data.codeBehavior.runtimeBehavior}
          onChange={(runtimeBehavior) => setData((p) => ({ ...p, codeBehavior: { ...p.codeBehavior, runtimeBehavior } }))}
        />
      </CollapsibleSection>

      {/* Code Analysis Section */}
      <CollapsibleSection
        title={t("mre.codeAnalysis")}
        icon={<Code className="w-4 h-4" />}
        storageKey="re-code-analysis"
        forceClose={forceCloseCounter}
        lazy
        skeletonVariant="form"
        skeletonRows={4}
        onPrefetch={prefetchCodeAnalysis}
        hint={t("hint.mre.codeAnalysis")}
      >
        <LazyCodeAnalysisGroups
          codeData={data.codeBehavior.codeAnalysis}
          onCodeDataChange={(codeAnalysis) => setData((p) => ({
            ...p,
            codeBehavior: { ...p.codeBehavior, codeAnalysis }
          }))}
          deepDiveData={data.deepDive}
          onDeepDiveDataChange={(deepDive) => setData((p) => ({ ...p, deepDive }))}
          isPacked={data.staticAnalysis.isPacked}
          unpackLayers={data.staticAnalysis.unpackLayers}
          onUnpackLayersChange={(layers) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, unpackLayers: layers } }))}
          onClearPacked={() => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, isPacked: "" } }))}
        />
      </CollapsibleSection>

      {/* Malware Behavior Mapping */}
      <CollapsibleSection
        title={t("mre.mbcMapping")}
        icon={<Database className="w-4 h-4" />}
        storageKey="re-mbc"
        forceClose={forceCloseCounter}
        lazy
        skeletonVariant="table"
        skeletonRows={5}
        onPrefetch={prefetchMBCMapping}
        hint={t("hint.mre.mbc")}
      >
        <LazyMBCMapping
          mapping={data.detection?.mbcMapping ?? []}
          onMappingChange={(mapping) => setData((p) => ({ ...p, detection: { ...p.detection, mbcMapping: mapping } }))}
        />
      </CollapsibleSection>

      {/* YARA Signature */}
      <CollapsibleSection
        title={t("mre.yaraSignature")}
        icon={<FileText className="w-4 h-4" />}
        storageKey="re-yara"
        forceClose={forceCloseCounter}
        lazy
        skeletonVariant="default"
        skeletonRows={4}
        hint={t("hint.mre.yara")}
      >
        <FormField
          label={t("mre.yaraRule")}
          type="textarea"
          rows={12}
          value={data.detection?.yaraSignature || ""}
          onChange={(v) => setData((p) => ({ ...p, detection: { ...p.detection, yaraSignature: v } }))}
          placeholder={`rule MalwareName {\n    meta:\n        author = "Your name"\n        description = "Detection for..."\n    strings:\n        $s1 = "string1"\n        $s2 = { 00 11 22 33 }\n    condition:\n        any of them\n}`}
          mono
        />
      </CollapsibleSection>

      {/* IOC Table */}
      <CollapsibleSection
        title={t("mre.iocTable")}
        icon={<Database className="w-4 h-4" />}
        storageKey="re-ioc"
        forceClose={forceCloseCounter}
        lazy
        skeletonVariant="table"
        skeletonRows={4}
        onPrefetch={prefetchIOCTable}
        hint={t("hint.mre.ioc")}
      >
        <LazyIOCTable
          iocs={data.detection?.iocs || []}
          onIOCsChange={(iocs) => setData((p) => ({ ...p, detection: { ...p.detection, iocs } }))}
        />
      </CollapsibleSection>

      {/* Summary */}
      <SummarySection
        data={data.detection.summary}
        onChange={(summary) => setData((p) => ({ ...p, detection: { ...p.detection, summary } }))}
        forceCloseCounter={forceCloseCounter}
      />

      {/* Export Confirm Dialog */}
      <LazyExportConfirmDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reportName={getReportName()}
        exportType={pendingExportType}
        onConfirmExport={handleConfirmExport}
        hasImages={false}
        imageCount={0}
      />
    </>
  );
}
