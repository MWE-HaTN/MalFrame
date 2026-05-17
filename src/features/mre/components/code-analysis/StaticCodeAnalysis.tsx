import { useMemo, memo, useRef, useCallback } from "react";
import { GitBranch, Cpu, Shield, Code2 } from "lucide-react";
import { PortalDropdown, DropdownOption } from "@/components/ui/portal-dropdown";
import { EntryCard, FieldLabel, AutoTextarea, AccessibleField } from "@/features/mre/components/runtime-behavior/ui-components";
import { inputStyles } from "@/features/mre/components/runtime-behavior/styles";
import { AnimatedCollapse } from "@/components/ui/skeleton";
import { SubSectionHeader, useExpandedSections, useListManager } from "./shared";
import { useDragReorder } from "@/hooks/useDragReorder";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { useLanguage } from "@/hooks/useLanguage";
import {
  StaticCodeAnalysisData,
  InterestingFunction,
  ControlFlowEntry,
  APIUsageEntry,
  ObfuscationEntry,
  OBFUSCATION_TECHNIQUES,
  createEmptyFunction,
  createEmptyAPIUsage,
  createEmptyObfuscation,
  createEmptyControlFlow
} from "./types";

interface StaticCodeAnalysisProps {
  data: StaticCodeAnalysisData;
  onChange: (data: StaticCodeAnalysisData) => void;
}

export const StaticCodeAnalysis = memo(function StaticCodeAnalysis({ data, onChange }: StaticCodeAnalysisProps) {
  const { t } = useLanguage();
  const { isExpanded, toggle, expand } = useExpandedSections(STORAGE_KEYS.CODE_ANALYSIS_STATIC);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Stable onChange wrappers — only recreate when onChange prop changes
  const onFunctionsChange = useCallback(
    (items: InterestingFunction[]) => onChange({ ...dataRef.current, interestingFunctions: items }),
    [onChange]
  );
  const onControlFlowChange = useCallback(
    (items: ControlFlowEntry[]) => onChange({ ...dataRef.current, controlFlow: items }),
    [onChange]
  );
  const onApiUsageChange = useCallback(
    (items: APIUsageEntry[]) => onChange({ ...dataRef.current, apiUsage: items }),
    [onChange]
  );
  const onObfuscationChange = useCallback(
    (items: ObfuscationEntry[]) => onChange({ ...dataRef.current, obfuscation: items }),
    [onChange]
  );

  // List managers for each section
  const functions = useListManager<InterestingFunction>(
    data.interestingFunctions,
    onFunctionsChange,
    { createEmpty: createEmptyFunction, onExpand: () => expand("functions") }
  );

  const controlFlow = useListManager<ControlFlowEntry>(
    data.controlFlow,
    onControlFlowChange,
    { createEmpty: createEmptyControlFlow, onExpand: () => expand("controlFlow") }
  );

  const apiUsage = useListManager<APIUsageEntry>(
    data.apiUsage,
    onApiUsageChange,
    { createEmpty: createEmptyAPIUsage, onExpand: () => expand("apiUsage") }
  );

  const obfuscation = useListManager<ObfuscationEntry>(
    data.obfuscation,
    onObfuscationChange,
    { createEmpty: createEmptyObfuscation, onExpand: () => expand("obfuscation") }
  );

  // Drag handlers for each section
  const functionsDrag = useDragReorder(functions.reorder);
  const controlFlowDrag = useDragReorder(controlFlow.reorder);
  const apiUsageDrag = useDragReorder(apiUsage.reorder);
  const obfuscationDrag = useDragReorder(obfuscation.reorder);

  const obfuscationOptions: DropdownOption[] = useMemo(() => 
    OBFUSCATION_TECHNIQUES.map(technique => ({ value: technique, label: technique })), 
  []);

  return (
    <div className="space-y-2">
      {/* Interesting Functions */}
      <SubSectionHeader
        title={t("codeAnalysis.static.functions")}
        icon={<Code2 className="w-4 h-4" />}
        isExpanded={isExpanded("functions")}
        onToggle={() => toggle("functions")}
        count={functions.count}
        onAdd={functions.add}
      />
      <AnimatedCollapse isOpen={isExpanded("functions")} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
        {functions.isEmpty ? (
          <p className="text-xs text-muted-foreground font-mono italic">{t("codeAnalysis.static.noFunctions")}</p>
        ) : (
          functions.items.map((funcEntry, entryIndex) => (
            <EntryCard
              key={funcEntry.id}
              onDelete={() => functions.remove(funcEntry.id)}
              canDelete={!functions.isEmpty}
              {...functionsDrag.getDragProps(entryIndex)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AccessibleField label={t("codeAnalysis.static.functionName")}>
                  {(fieldId) => (
                    <input
                      id={fieldId}
                      name={fieldId}
                      type="text"
                      value={funcEntry.functionName}
                      onChange={(changeEvent) => functions.update(funcEntry.id, { functionName: changeEvent.target.value })}
                      placeholder="sub_401000"
                      className={inputStyles}
                    />
                  )}
                </AccessibleField>
                <AccessibleField label={t("codeAnalysis.static.rvaAddress")}>
                  {(fieldId) => (
                    <input
                      id={fieldId}
                      name={fieldId}
                      type="text"
                      value={funcEntry.rvaAddress}
                      onChange={(changeEvent) => functions.update(funcEntry.id, { rvaAddress: changeEvent.target.value })}
                      placeholder="0x00401000"
                      className={inputStyles}
                    />
                  )}
                </AccessibleField>
              </div>
              <AccessibleField label={t("codeAnalysis.static.role")}>
                {(fieldId) => (
                  <input
                    id={fieldId}
                    name={fieldId}
                    type="text"
                    value={funcEntry.role || ""}
                    onChange={(changeEvent) => functions.update(funcEntry.id, { role: changeEvent.target.value })}
                    placeholder={t("codeAnalysis.static.rolePlaceholder")}
                    className={inputStyles}
                  />
                )}
              </AccessibleField>
              <AutoTextarea
                label={t("common.notes")}
                value={funcEntry.notes}
                onChange={(changeEvent) => functions.update(funcEntry.id, { notes: changeEvent.target.value })}
                placeholder={t("codeAnalysis.static.notesPlaceholder")}
                allowImages
                images={funcEntry.images || []}
                onImagesChange={(newImages) => functions.update(funcEntry.id, { images: newImages })}
              />
            </EntryCard>
          ))
        )}
      </AnimatedCollapse>

      {/* Control Flow & Structure */}
      <SubSectionHeader
        title={t("codeAnalysis.static.controlFlow")}
        icon={<GitBranch className="w-4 h-4" />}
        isExpanded={isExpanded("controlFlow")}
        onToggle={() => toggle("controlFlow")}
        count={controlFlow.count}
        onAdd={controlFlow.add}
      />
      <AnimatedCollapse isOpen={isExpanded("controlFlow")} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
        {controlFlow.isEmpty ? (
          <p className="text-xs text-muted-foreground font-mono italic">{t("codeAnalysis.static.noControlFlow")}</p>
        ) : (
          controlFlow.items.map((cfEntry, entryIndex) => (
            <EntryCard
              key={cfEntry.id}
              onDelete={() => controlFlow.remove(cfEntry.id)}
              canDelete={!controlFlow.isEmpty}
              {...controlFlowDrag.getDragProps(entryIndex)}
            >
              <AutoTextarea
                label={t("codeAnalysis.static.loopBranch")}
                value={cfEntry.loopBranchNotes}
                onChange={(changeEvent) => controlFlow.update(cfEntry.id, { loopBranchNotes: changeEvent.target.value })}
                placeholder={t("codeAnalysis.static.loopBranchPlaceholder")}
                allowImages
                inEntryCard
                images={cfEntry.images || []}
                onImagesChange={(newImages) => controlFlow.update(cfEntry.id, { images: newImages })}
              />
              <AutoTextarea
                label={t("codeAnalysis.static.cfgObservations")}
                value={cfEntry.cfgObservations}
                onChange={(changeEvent) => controlFlow.update(cfEntry.id, { cfgObservations: changeEvent.target.value })}
                placeholder={t("codeAnalysis.static.cfgPlaceholder")}
                allowImages
                images={cfEntry.images || []}
                onImagesChange={(newImages) => controlFlow.update(cfEntry.id, { images: newImages })}
              />
              <AutoTextarea
                label={t("codeAnalysis.static.stringDecryption")}
                value={cfEntry.stringDecryptionRoutines}
                onChange={(changeEvent) => controlFlow.update(cfEntry.id, { stringDecryptionRoutines: changeEvent.target.value })}
                placeholder={t("codeAnalysis.static.stringDecryptionPlaceholder")}
                allowImages
                images={cfEntry.images || []}
                onImagesChange={(newImages) => controlFlow.update(cfEntry.id, { images: newImages })}
              />
            </EntryCard>
          ))
        )}
      </AnimatedCollapse>

      {/* API Usage Summary */}
      <SubSectionHeader
        title={t("codeAnalysis.static.apiUsage")}
        icon={<Cpu className="w-4 h-4" />}
        isExpanded={isExpanded("apiUsage")}
        onToggle={() => toggle("apiUsage")}
        count={apiUsage.count}
        onAdd={apiUsage.add}
      />
      <AnimatedCollapse isOpen={isExpanded("apiUsage")} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
        {apiUsage.isEmpty ? (
          <p className="text-xs text-muted-foreground font-mono italic">{t("codeAnalysis.static.noApis")}</p>
        ) : (
          apiUsage.items.map((apiEntry, entryIndex) => (
            <EntryCard
              key={apiEntry.id}
              onDelete={() => apiUsage.remove(apiEntry.id)}
              canDelete={!apiUsage.isEmpty}
              {...apiUsageDrag.getDragProps(entryIndex)}
            >
              <AccessibleField label={t("codeAnalysis.static.apiName")}>
                {(fieldId) => (
                  <input
                    id={fieldId}
                    name={fieldId}
                    type="text"
                    value={apiEntry.apiName}
                    onChange={(changeEvent) => apiUsage.update(apiEntry.id, { apiName: changeEvent.target.value })}
                    placeholder={t("codeAnalysis.static.apiPlaceholder")}
                    className={inputStyles}
                  />
                )}
              </AccessibleField>
              <AutoTextarea
                label={t("codeAnalysis.static.purposeBehavior")}
                value={apiEntry.purposeBehavior}
                onChange={(changeEvent) => apiUsage.update(apiEntry.id, { purposeBehavior: changeEvent.target.value })}
                placeholder={t("codeAnalysis.static.purposePlaceholder")}
                allowImages
                images={apiEntry.images || []}
                onImagesChange={(newImages) => apiUsage.update(apiEntry.id, { images: newImages })}
              />
              <AutoTextarea
                label={t("common.notes")}
                value={apiEntry.notes}
                onChange={(changeEvent) => apiUsage.update(apiEntry.id, { notes: changeEvent.target.value })}
                placeholder={t("codeAnalysis.static.apiNotesPlaceholder")}
                allowImages
                images={apiEntry.images || []}
                onImagesChange={(newImages) => apiUsage.update(apiEntry.id, { images: newImages })}
              />
            </EntryCard>
          ))
        )}
      </AnimatedCollapse>

      {/* Code Obfuscation / Protection */}
      <SubSectionHeader
        title={t("codeAnalysis.static.obfuscation")}
        icon={<Shield className="w-4 h-4" />}
        isExpanded={isExpanded("obfuscation")}
        onToggle={() => toggle("obfuscation")}
        count={obfuscation.count}
        onAdd={obfuscation.add}
      />
      <AnimatedCollapse isOpen={isExpanded("obfuscation")} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
        {obfuscation.isEmpty ? (
          <p className="text-xs text-muted-foreground font-mono italic">{t("codeAnalysis.static.noObfuscation")}</p>
        ) : (
          obfuscation.items.map((obfEntry, entryIndex) => (
            <EntryCard
              key={obfEntry.id}
              onDelete={() => obfuscation.remove(obfEntry.id)}
              canDelete={!obfuscation.isEmpty}
              {...obfuscationDrag.getDragProps(entryIndex)}
            >
              <div className="space-y-1.5">
                <FieldLabel>{t("codeAnalysis.static.obfuscationTechnique")}</FieldLabel>
                <PortalDropdown
                  value={obfEntry.technique}
                  onChange={(newValue) => obfuscation.update(obfEntry.id, { technique: newValue })}
                  options={obfuscationOptions}
                  placeholder={t("codeAnalysis.static.selectTechnique")}
                />
              </div>
              <AutoTextarea
                label={t("codeAnalysis.static.evidence")}
                value={obfEntry.evidence}
                onChange={(changeEvent) => obfuscation.update(obfEntry.id, { evidence: changeEvent.target.value })}
                placeholder={t("codeAnalysis.static.evidencePlaceholder")}
                allowImages
                images={obfEntry.images || []}
                onImagesChange={(newImages) => obfuscation.update(obfEntry.id, { images: newImages })}
              />
              <AutoTextarea
                label={t("common.notes")}
                value={obfEntry.notes}
                onChange={(changeEvent) => obfuscation.update(obfEntry.id, { notes: changeEvent.target.value })}
                placeholder={t("common.additionalNotes")}
                allowImages
                images={obfEntry.images || []}
                onImagesChange={(newImages) => obfuscation.update(obfEntry.id, { images: newImages })}
              />
            </EntryCard>
          ))
        )}
      </AnimatedCollapse>
    </div>
  );
});

