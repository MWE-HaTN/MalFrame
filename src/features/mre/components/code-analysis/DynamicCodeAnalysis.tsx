import { useMemo, memo, useRef, useCallback } from "react";
import { Target, HardDrive, Activity, Cpu } from "lucide-react";
import { PortalDropdown, DropdownOption } from "@/components/ui/portal-dropdown";
import { EntryCard, FieldLabel, AutoTextarea, AccessibleField } from "@/features/mre/components/runtime-behavior/ui-components";
import { inputStyles } from "@/features/mre/components/runtime-behavior/styles";
import { AnimatedCollapse } from "@/components/ui/skeleton";
import { SubSectionHeader, useExpandedSections, useListManager } from "./shared";
import { useDragReorder } from "@/hooks/useDragReorder";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { useLanguage } from "@/hooks/useLanguage";
import {
  DynamicCodeAnalysisData,
  BreakpointEvent,
  MemoryRegion,
  RuntimeAPITrace,
  RegisterStackEntry,
  EVENT_TYPES,
  MEMORY_ALLOCATIONS,
  createEmptyBreakpoint,
  createEmptyMemoryRegion,
  createEmptyAPITrace,
  createEmptyRegisterStack
} from "./types";

interface DynamicCodeAnalysisProps {
  data: DynamicCodeAnalysisData;
  onChange: (data: DynamicCodeAnalysisData) => void;
}

export const DynamicCodeAnalysis = memo(function DynamicCodeAnalysis({ data, onChange }: DynamicCodeAnalysisProps) {
  const { t } = useLanguage();
  const { isExpanded, toggle, expand } = useExpandedSections(STORAGE_KEYS.CODE_ANALYSIS_DYNAMIC);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Stable onChange wrappers — only recreate when onChange prop changes
  const onBreakpointsChange = useCallback(
    (items: BreakpointEvent[]) => onChange({ ...dataRef.current, breakpointEvents: items }),
    [onChange]
  );
  const onMemoryChange = useCallback(
    (items: MemoryRegion[]) => onChange({ ...dataRef.current, memoryRegions: items }),
    [onChange]
  );
  const onApiTraceChange = useCallback(
    (items: RuntimeAPITrace[]) => onChange({ ...dataRef.current, runtimeApiTrace: items }),
    [onChange]
  );
  const onRegisterStackChange = useCallback(
    (items: RegisterStackEntry[]) => onChange({ ...dataRef.current, registerStack: items }),
    [onChange]
  );

  // List managers for each section
  const breakpoints = useListManager<BreakpointEvent>(
    data.breakpointEvents,
    onBreakpointsChange,
    { createEmpty: createEmptyBreakpoint, onExpand: () => expand("breakpoints") }
  );

  const memory = useListManager<MemoryRegion>(
    data.memoryRegions,
    onMemoryChange,
    { createEmpty: createEmptyMemoryRegion, onExpand: () => expand("memory") }
  );

  const apiTrace = useListManager<RuntimeAPITrace>(
    data.runtimeApiTrace,
    onApiTraceChange,
    { createEmpty: createEmptyAPITrace, onExpand: () => expand("apiTrace") }
  );

  const registerStack = useListManager<RegisterStackEntry>(
    data.registerStack,
    onRegisterStackChange,
    { createEmpty: createEmptyRegisterStack, onExpand: () => expand("registerStack") }
  );

  // Drag handlers for each section
  const breakpointsDrag = useDragReorder(breakpoints.reorder);
  const memoryDrag = useDragReorder(memory.reorder);
  const apiTraceDrag = useDragReorder(apiTrace.reorder);
  const registerStackDrag = useDragReorder(registerStack.reorder);

  const eventTypeOptions: DropdownOption[] = useMemo(() => 
    EVENT_TYPES.map(eventType => ({ value: eventType, label: eventType })), 
  []);
  
  const memoryOptions: DropdownOption[] = useMemo(() => 
    MEMORY_ALLOCATIONS.map(allocationType => ({ value: allocationType, label: allocationType })), 
  []);

  return (
    <div className="space-y-2">
      {/* Breakpoints / Events */}
      <SubSectionHeader
        title={t("codeAnalysis.dynamic.breakpoints")}
        icon={<Target className="w-4 h-4" />}
        isExpanded={isExpanded("breakpoints")}
        onToggle={() => toggle("breakpoints")}
        count={breakpoints.count}
        onAdd={breakpoints.add}
      />
      <AnimatedCollapse isOpen={isExpanded("breakpoints")} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
        {breakpoints.isEmpty ? (
          <p className="text-xs text-muted-foreground font-mono italic">{t("codeAnalysis.dynamic.noBreakpoints")}</p>
        ) : (
          breakpoints.items.map((bpEntry, entryIndex) => (
            <EntryCard
              key={bpEntry.id}
              onDelete={() => breakpoints.remove(bpEntry.id)}
              canDelete={!breakpoints.isEmpty}
              {...breakpointsDrag.getDragProps(entryIndex)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AccessibleField label={t("codeAnalysis.dynamic.whereTriggered")}>
                  {(fieldId) => (
                    <input
                      id={fieldId}
                      name={fieldId}
                      type="text"
                      value={bpEntry.whereTriggered}
                      onChange={(changeEvent) => breakpoints.update(bpEntry.id, { whereTriggered: changeEvent.target.value })}
                      placeholder="0x00401500"
                      className={inputStyles}
                    />
                  )}
                </AccessibleField>
                <div className="space-y-1.5">
                  <FieldLabel>{t("codeAnalysis.dynamic.eventType")}</FieldLabel>
                  <PortalDropdown
                    value={bpEntry.eventType}
                    onChange={(newValue) => breakpoints.update(bpEntry.id, { eventType: newValue })}
                    options={eventTypeOptions}
                    placeholder={t("codeAnalysis.dynamic.selectType")}
                  />
                </div>
              </div>
              <AutoTextarea
                label={t("common.notes")}
                value={bpEntry.notes}
                onChange={(changeEvent) => breakpoints.update(bpEntry.id, { notes: changeEvent.target.value })}
                placeholder={t("codeAnalysis.dynamic.breakpointNotesPlaceholder")}
                allowImages
                images={bpEntry.images || []}
                onImagesChange={(newImages) => breakpoints.update(bpEntry.id, { images: newImages })}
              />
            </EntryCard>
          ))
        )}
      </AnimatedCollapse>

      {/* Memory Map Analysis */}
      <SubSectionHeader
        title={t("codeAnalysis.dynamic.memoryMap")}
        icon={<HardDrive className="w-4 h-4" />}
        isExpanded={isExpanded("memory")}
        onToggle={() => toggle("memory")}
        count={memory.count}
        onAdd={memory.add}
      />
      <AnimatedCollapse isOpen={isExpanded("memory")} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
        {memory.isEmpty ? (
          <p className="text-xs text-muted-foreground font-mono italic">{t("codeAnalysis.dynamic.noMemory")}</p>
        ) : (
          memory.items.map((memEntry, entryIndex) => (
            <EntryCard
              key={memEntry.id}
              onDelete={() => memory.remove(memEntry.id)}
              canDelete={!memory.isEmpty}
              {...memoryDrag.getDragProps(entryIndex)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FieldLabel>{t("codeAnalysis.dynamic.allocation")}</FieldLabel>
                  <PortalDropdown
                    value={memEntry.allocation}
                    onChange={(newValue) => memory.update(memEntry.id, { allocation: newValue })}
                    options={memoryOptions}
                    placeholder={t("codeAnalysis.dynamic.selectAllocation")}
                  />
                </div>
                <AccessibleField label={t("codeAnalysis.dynamic.address")}>
                  {(fieldId) => (
                    <input
                      id={fieldId}
                      name={fieldId}
                      type="text"
                      value={memEntry.address}
                      onChange={(changeEvent) => memory.update(memEntry.id, { address: changeEvent.target.value })}
                      placeholder="0x00A00000"
                      className={inputStyles}
                    />
                  )}
                </AccessibleField>
              </div>
              <AutoTextarea
                label={t("codeAnalysis.dynamic.behavior")}
                value={memEntry.behavior}
                onChange={(changeEvent) => memory.update(memEntry.id, { behavior: changeEvent.target.value })}
                placeholder={t("codeAnalysis.dynamic.behaviorPlaceholder")}
                allowImages
                images={memEntry.images || []}
                onImagesChange={(newImages) => memory.update(memEntry.id, { images: newImages })}
              />
            </EntryCard>
          ))
        )}
      </AnimatedCollapse>

      {/* Runtime API Trace */}
      <SubSectionHeader
        title={t("codeAnalysis.dynamic.apiTrace")}
        icon={<Activity className="w-4 h-4" />}
        isExpanded={isExpanded("apiTrace")}
        onToggle={() => toggle("apiTrace")}
        count={apiTrace.count}
        onAdd={apiTrace.add}
      />
      <AnimatedCollapse isOpen={isExpanded("apiTrace")} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
        {apiTrace.isEmpty ? (
          <p className="text-xs text-muted-foreground font-mono italic">{t("codeAnalysis.dynamic.noApiTrace")}</p>
        ) : (
          apiTrace.items.map((traceEntry, entryIndex) => (
            <EntryCard
              key={traceEntry.id}
              onDelete={() => apiTrace.remove(traceEntry.id)}
              canDelete={!apiTrace.isEmpty}
              {...apiTraceDrag.getDragProps(entryIndex)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AccessibleField label={t("codeAnalysis.dynamic.api")}>
                  {(fieldId) => (
                    <input
                      id={fieldId}
                      name={fieldId}
                      type="text"
                      value={traceEntry.api}
                      onChange={(changeEvent) => apiTrace.update(traceEntry.id, { api: changeEvent.target.value })}
                      placeholder={t("codeAnalysis.dynamic.apiPlaceholder")}
                      className={inputStyles}
                    />
                  )}
                </AccessibleField>
                <AccessibleField label={t("codeAnalysis.dynamic.returnValue")}>
                  {(fieldId) => (
                    <input
                      id={fieldId}
                      name={fieldId}
                      type="text"
                      value={traceEntry.returnValue}
                      onChange={(changeEvent) => apiTrace.update(traceEntry.id, { returnValue: changeEvent.target.value })}
                      placeholder="0x00A00000"
                      className={inputStyles}
                    />
                  )}
                </AccessibleField>
              </div>
              <AutoTextarea
                label={t("codeAnalysis.dynamic.arguments")}
                value={traceEntry.arguments}
                onChange={(changeEvent) => apiTrace.update(traceEntry.id, { arguments: changeEvent.target.value })}
                placeholder={t("codeAnalysis.dynamic.argumentsPlaceholder")}
                allowImages
                images={traceEntry.images || []}
                onImagesChange={(newImages) => apiTrace.update(traceEntry.id, { images: newImages })}
              />
            </EntryCard>
          ))
        )}
      </AnimatedCollapse>

      {/* Register / Stack Behavior */}
      <SubSectionHeader
        title={t("codeAnalysis.dynamic.registerStack")}
        icon={<Cpu className="w-4 h-4" />}
        isExpanded={isExpanded("registerStack")}
        onToggle={() => toggle("registerStack")}
        count={registerStack.count}
        onAdd={registerStack.add}
      />
      <AnimatedCollapse isOpen={isExpanded("registerStack")} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
        {registerStack.isEmpty ? (
          <p className="text-xs text-muted-foreground font-mono italic">{t("codeAnalysis.dynamic.noRegisterStack")}</p>
        ) : (
          registerStack.items.map((rsEntry, entryIndex) => (
            <EntryCard
              key={rsEntry.id}
              onDelete={() => registerStack.remove(rsEntry.id)}
              canDelete={!registerStack.isEmpty}
              {...registerStackDrag.getDragProps(entryIndex)}
            >
              <AutoTextarea
                label={t("codeAnalysis.dynamic.registersModified")}
                value={rsEntry.registersModified}
                onChange={(changeEvent) => registerStack.update(rsEntry.id, { registersModified: changeEvent.target.value })}
                placeholder={t("codeAnalysis.dynamic.registersPlaceholder")}
                allowImages
                inEntryCard
                images={rsEntry.images || []}
                onImagesChange={(newImages) => registerStack.update(rsEntry.id, { images: newImages })}
              />
              <AutoTextarea
                label={t("codeAnalysis.dynamic.stackPatterns")}
                value={rsEntry.stackPatterns}
                onChange={(changeEvent) => registerStack.update(rsEntry.id, { stackPatterns: changeEvent.target.value })}
                placeholder={t("codeAnalysis.dynamic.stackPlaceholder")}
                allowImages
                images={rsEntry.images || []}
                onImagesChange={(newImages) => registerStack.update(rsEntry.id, { images: newImages })}
              />
              <AutoTextarea
                label={t("common.notes")}
                value={rsEntry.notes}
                onChange={(changeEvent) => registerStack.update(rsEntry.id, { notes: changeEvent.target.value })}
                placeholder={t("common.additionalNotes")}
                allowImages
                images={rsEntry.images || []}
                onImagesChange={(newImages) => registerStack.update(rsEntry.id, { images: newImages })}
              />
            </EntryCard>
          ))
        )}
      </AnimatedCollapse>
    </div>
  );
});

