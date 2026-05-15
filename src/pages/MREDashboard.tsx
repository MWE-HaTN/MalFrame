import { useState, useEffect, useCallback } from "react";
import { FileText, Cpu, Code, Activity, Database } from "lucide-react";
import { Header } from "@/components/Header";
import { formatExportError, hasData } from "@/lib/dashboardExportUtils";
import { recordExportTime } from "@/lib/export/helpers";
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
  LazyYaraEditor,
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
import { useDashboardActions } from "@/hooks/useDashboardActions";
import { useCaseManager } from "@/hooks/useCaseManager";
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
import { toast } from "sonner";
import { validateREData } from "@/lib/validationSchemas";

import type { REData } from "@/features/mre/types";
import { MRE_STORAGE_KEY, initialREData, defaultSummary } from "@/features/mre/services/constants";
import { transformForExport } from "@/features/mre/services/transform";
import { migrateREData } from "@/features/mre/services/migrate";
import { CaseTemplateDialog } from "@/components/CaseTemplateDialog";
import { getTemplatesForType } from "@/lib/caseTemplates";

// ─────────────────────────────────────────────
// Outer shell: case manager + page chrome
// ─────────────────────────────────────────────

export default function MREDashboard() {
  const caseManager = useCaseManager("mre", MRE_STORAGE_KEY);

  useEffect(() => { document.title = "MRE - MalFrame"; }, []);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const handleTemplateSelect = useCallback(
    async (templateId: string) => {
      await caseManager.createCase();
      const template = getTemplatesForType("mre").find((t) => t.id === templateId);
      if (template?.fillMRE) {
        const filled = template.fillMRE({ ...initialREData });
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
          <MREDashboardBody
            key={caseManager.activeCaseId}
            storageKey={caseManager.activeStorageKey}
          />
        )}
      </main>

      <CaseTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        caseType="mre"
        onSelect={handleTemplateSelect}
      />
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
  const { data, setData, clearData, undo, redo, forceCloseCounter, saveStatus } = useDashboardData<REData>({
    storageKey,
    initialData: initialREData,
    migrateData: migrateREData,
    clearSuccessMessage: t("clear.success"),
  });

  const handleHashGenerated = useCallback((hash: string, fileName: string, fileSize: number) => {
    setData((prev) => ({
      ...prev,
      background: { ...prev.background, fileName },
      staticAnalysis: {
        ...prev.staticAnalysis,
        sha256: hash,
        fileSize: `${(fileSize / 1024).toFixed(2)} KB`,
      },
    }));
  }, [setData]);

  // MRE-specific export handlers
  const handleExportJSON = useCallback(async () => {
    try {
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
      recordExportTime(storageKey);
    } catch (err) {
      toast.error(`${t("export.error")}: ${formatExportError(err)}`);
    }
  }, [data, storageKey, t]);

  const handleExportPDF = useCallback(async () => {
    try {
      await lazyExportREPDF(data, data.background.analyst, data.background.fileName, data.staticAnalysis.sha256);
      toast.success(t("export.success.pdf"));
      recordExportTime(storageKey);
    } catch (err) {
      toast.error(`${t("export.error")}: ${formatExportError(err)}`);
    }
  }, [data, storageKey, t]);

  const handleExportWord = useCallback(async () => {
    try {
      await lazyExportREWord(data, data.background.analyst, data.background.fileName, data.staticAnalysis.sha256);
      toast.success(t("export.success.word"));
      recordExportTime(storageKey);
    } catch (err) {
      toast.error(`${t("export.error")}: ${formatExportError(err)}`);
    }
  }, [data, storageKey, t]);

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
    validateImport: validateREData,
    migrateImport: migrateREData,
    preloadPDF: preloadREPDF,
    preloadWord: preloadREWord,
    generateReportName: (ext) => generateFileName(data.background.analyst, data.background.fileName, data.staticAnalysis.sha256, ext),
  });

  // Memoized onChange handlers for section components
  const handleBackgroundChange = useCallback((background: REData["background"]) => setData((p) => ({ ...p, background })), [setData]);
  const handleStaticAnalysisPatch = useCallback((patch: Partial<REData["staticAnalysis"]>) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, ...patch } })), [setData]);
  const handleSignatureChange = useCallback((value: string) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, signatureStatus: value } })), [setData]);
  const handleMitigationsChange = useCallback((mitigations: string[]) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, dllMitigations: mitigations } })), [setData]);
  const handlePESectionsChange = useCallback((entries: REData["staticAnalysis"]["peSections"]) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, peSections: entries } })), [setData]);
  const handlePackedChange = useCallback((v: string) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, isPacked: v } })), [setData]);
  const handleUnpackLayersChange = useCallback((layers: REData["staticAnalysis"]["unpackLayers"]) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, unpackLayers: layers } })), [setData]);
  const handlePackerSuspectedChange = useCallback((v: string) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, packerSuspected: v } })), [setData]);
  const handleStringsDetectionChange = useCallback((v: string) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, stringsDetection: v } })), [setData]);
  const handleImportsExportsChange = useCallback((v: string) => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, importsExports: v } })), [setData]);
  const handleRuntimeBehaviorChange = useCallback((runtimeBehavior: REData["codeBehavior"]["runtimeBehavior"]) => setData((p) => ({ ...p, codeBehavior: { ...p.codeBehavior, runtimeBehavior } })), [setData]);
  const handleCodeAnalysisChange = useCallback((codeAnalysis: REData["codeBehavior"]["codeAnalysis"]) => setData((p) => ({ ...p, codeBehavior: { ...p.codeBehavior, codeAnalysis } })), [setData]);
  const handleDeepDiveChange = useCallback((deepDive: REData["deepDive"]) => setData((p) => ({ ...p, deepDive })), [setData]);
  const handleClearPacked = useCallback(() => setData((p) => ({ ...p, staticAnalysis: { ...p.staticAnalysis, isPacked: "" } })), [setData]);
  const handleMBCMappingChange = useCallback((mapping: REData["detection"]["mbcMapping"]) => setData((p) => ({ ...p, detection: { ...p.detection, mbcMapping: mapping } })), [setData]);
  const handleYaraChange = useCallback((v: string) => setData((p) => ({ ...p, detection: { ...p.detection, yaraSignature: v } })), [setData]);
  const handleIOCsChange = useCallback((iocs: REData["detection"]["iocs"]) => setData((p) => ({ ...p, detection: { ...p.detection, iocs } })), [setData]);
  const handleSummaryChange = useCallback((summary: REData["detection"]["summary"]) => setData((p) => ({ ...p, detection: { ...p.detection, summary } })), [setData]);

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
        exportOptions={exportOptions}
        saveStatus={saveStatus}
      />

      {/* File Drop Zone */}
      <LazyFileHashDropzone onHashGenerated={handleHashGenerated} />

      {/* Background Section */}
      <BackgroundSection
        data={data.background}
        onChange={handleBackgroundChange}
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
          onChange={handleStaticAnalysisPatch}
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
          onChange={handleStaticAnalysisPatch}
        />

        <LazySecurityPosture
          signatureStatus={data.staticAnalysis.signatureStatus}
          dllMitigations={data.staticAnalysis.dllMitigations}
          onSignatureChange={handleSignatureChange}
          onMitigationsChange={handleMitigationsChange}
        />

        <div className="space-y-2 mb-4">
          <label className="label-cyber block">{t("mre.peSections")}</label>
          <LazyPESectionEntry
            entries={data.staticAnalysis.peSections || []}
            onEntriesChange={handlePESectionsChange}
          />
        </div>

        <div className={`grid grid-cols-1 ${data.staticAnalysis.isPacked === "yes" ? "lg:grid-cols-2" : ""} gap-4 mb-4`}>
          <LazyPackedDropdown
            isPacked={data.staticAnalysis.isPacked}
            onPackedChange={handlePackedChange}
            unpackLayers={data.staticAnalysis.unpackLayers}
            onUnpackLayersChange={handleUnpackLayersChange}
          />
          {data.staticAnalysis.isPacked === "yes" && (
            <PackerSuspectedDropdown
              value={data.staticAnalysis.packerSuspected}
              onChange={handlePackerSuspectedChange}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            label={t("mre.stringsDetection")}
            type="textarea"
            rows={3}
            value={data.staticAnalysis.stringsDetection}
            onChange={handleStringsDetectionChange}
            placeholder={t("mre.placeholder.stringsDetection")}
          />
          <FormField
            label={t("mre.importsExports")}
            type="textarea"
            rows={3}
            value={data.staticAnalysis.importsExports}
            onChange={handleImportsExportsChange}
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
          onChange={handleRuntimeBehaviorChange}
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
          onCodeDataChange={handleCodeAnalysisChange}
          deepDiveData={data.deepDive}
          onDeepDiveDataChange={handleDeepDiveChange}
          isPacked={data.staticAnalysis.isPacked}
          unpackLayers={data.staticAnalysis.unpackLayers}
          onUnpackLayersChange={handleUnpackLayersChange}
          onClearPacked={handleClearPacked}
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
          onMappingChange={handleMBCMappingChange}
          runtimeBehavior={data.codeBehavior?.runtimeBehavior}
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
        <LazyYaraEditor
          value={data.detection?.yaraSignature || ""}
          onChange={handleYaraChange}
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
          onIOCsChange={handleIOCsChange}
        />
      </CollapsibleSection>

      {/* Summary */}
      <SummarySection
        data={data.detection.summary}
        onChange={handleSummaryChange}
        forceCloseCounter={forceCloseCounter}
      />

      {/* Export Confirm Dialog */}
      <LazyExportConfirmDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reportName={reportName}
        exportType={pendingExportType}
        onConfirmExport={handleConfirmExport}
        hasImages={false}
        imageCount={0}
      />
    </>
  );
}
