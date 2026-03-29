import { useState, useCallback } from "react";
import { Layers } from "lucide-react";
import { FormField } from "@/components/FormField";
import { AnimatedCollapse } from "@/components/ui/skeleton";
import { SubSectionHeader, useExpandedState } from "@/features/mre/components/code-analysis/shared";
import { StageCard } from "@/components/StageCard";
import { useDragReorder } from "@/hooks/useDragReorder";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { generateId } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

export interface ExecutionStage {
  id: string;
  stageNumber: number;
  stageName: string;
  entryPoint: string;
  entryCondition: string;
  purpose: string;
  actions: string;
  exitCondition: string;
  failureAbortBehavior: string;
  transitionMethod: string;
  apisUsed: string;
  artifacts: string;
  ioc: string;
}

interface ExecutionStagesProps {
  stages: ExecutionStage[];
  onStagesChange: (stages: ExecutionStage[]) => void;
}

const createEmptyStage = (stageNumber: number): ExecutionStage => ({
  id: generateId(),
  stageNumber,
  stageName: `Stage ${stageNumber}`,
  entryPoint: "",
  entryCondition: "",
  purpose: "",
  actions: "",
  exitCondition: "",
  failureAbortBehavior: "",
  transitionMethod: "",
  apisUsed: "",
  artifacts: "",
  ioc: "",
});

export function ExecutionStages({ stages, onStagesChange }: ExecutionStagesProps) {
  const { t } = useLanguage();
  const { isExpanded, toggle, expand } = useExpandedState(STORAGE_KEYS.EXECUTION_STAGES);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  const reorderStages = (fromIndex: number, toIndex: number) => {
    const result = [...stages];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    // Re-number stages after reorder
    const renumbered = result.map((s, idx) => ({ 
      ...s, 
      stageNumber: idx + 1,
      stageName: s.stageName.replace(/Stage \d+/, `Stage ${idx + 1}`)
    }));
    onStagesChange(renumbered);
  };

  const { getDragProps } = useDragReorder(reorderStages);

  const addStage = useCallback(() => {
    const newStageNumber = stages.length + 1;
    const newStage = createEmptyStage(newStageNumber);
    onStagesChange([...stages, newStage]);
    setExpandedStages((prev) => new Set([...prev, newStage.id]));
    expand();
  }, [stages, onStagesChange, expand]);

  const removeStage = useCallback((id: string) => {
    if (stages.length <= 1) return;
    const updatedStages = stages
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, stageNumber: idx + 1, stageName: `Stage ${idx + 1}` }));
    onStagesChange(updatedStages);
  }, [stages, onStagesChange]);

  const updateStage = useCallback((id: string, field: keyof ExecutionStage, value: string | number) => {
    onStagesChange(
      stages.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }, [stages, onStagesChange]);

  const toggleStageExpand = useCallback((id: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Extract custom name from stageName (remove "Stage X" prefix)
  const getCustomName = (stageName: string, stageNumber: number) => {
    return stageName.replace(`Stage ${stageNumber}`, "").replace(/^[\s–-]+/, "");
  };

  return (
    <div className="space-y-2">
      <SubSectionHeader
        title={t("codeAnalysis.stages.title")}
        icon={<Layers className="w-4 h-4" />}
        isExpanded={isExpanded}
        onToggle={toggle}
        count={stages.length}
        onAdd={addStage}
      />

      <AnimatedCollapse isOpen={isExpanded} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm">
        {stages.length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono italic">{t("codeAnalysis.stages.noStages")}</p>
        ) : (
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <StageCard
                key={stage.id}
                stageNumber={stage.stageNumber}
                stageName={getCustomName(stage.stageName, stage.stageNumber)}
                onStageNameChange={(v) => updateStage(stage.id, "stageName", `Stage ${stage.stageNumber}${v ? ` – ${v}` : ""}`)}
                placeholder={t("codeAnalysis.stages.stageNamePlaceholder")}
                isExpanded={expandedStages.has(stage.id)}
                onToggleExpand={() => toggleStageExpand(stage.id)}
                onDelete={() => removeStage(stage.id)}
                canDelete={stages.length > 1}
                {...getDragProps(index)}
              >
                <FormField
                  label={t("codeAnalysis.stages.entryCondition")}
                  value={stage.entryCondition}
                  onChange={(v) => updateStage(stage.id, "entryCondition", v)}
                  placeholder={t("codeAnalysis.stages.entryConditionPlaceholder")}
                />
                <FormField
                  label={t("codeAnalysis.stages.entryPoint")}
                  value={stage.entryPoint}
                  onChange={(v) => updateStage(stage.id, "entryPoint", v)}
                  placeholder="0x006A1400"
                  mono
                />
                <FormField
                  label={t("codeAnalysis.stages.purpose")}
                  value={stage.purpose}
                  onChange={(v) => updateStage(stage.id, "purpose", v)}
                  placeholder={t("codeAnalysis.stages.purposePlaceholder")}
                />
                <FormField
                  label={t("codeAnalysis.stages.actions")}
                  value={stage.actions}
                  onChange={(v) => updateStage(stage.id, "actions", v)}
                  placeholder={t("codeAnalysis.stages.actionsPlaceholder")}
                  type="textarea"
                  rows={2}
                />
                <FormField
                  label={t("codeAnalysis.stages.exitCondition")}
                  value={stage.exitCondition}
                  onChange={(v) => updateStage(stage.id, "exitCondition", v)}
                  placeholder={t("codeAnalysis.stages.exitConditionPlaceholder")}
                />
                <FormField
                  label={t("codeAnalysis.stages.failureBehavior")}
                  value={stage.failureAbortBehavior}
                  onChange={(v) => updateStage(stage.id, "failureAbortBehavior", v)}
                  placeholder={t("codeAnalysis.stages.failurePlaceholder")}
                />
                <FormField
                  label={t("codeAnalysis.stages.transitionMethod")}
                  value={stage.transitionMethod}
                  onChange={(v) => updateStage(stage.id, "transitionMethod", v)}
                  placeholder={t("codeAnalysis.stages.transitionPlaceholder")}
                />
                <FormField
                  label={t("codeAnalysis.stages.apisUsed")}
                  value={stage.apisUsed}
                  onChange={(v) => updateStage(stage.id, "apisUsed", v)}
                  placeholder="VirtualAlloc, RtlMoveMemory"
                />
                <FormField
                  label={t("codeAnalysis.stages.artifacts")}
                  value={stage.artifacts}
                  onChange={(v) => updateStage(stage.id, "artifacts", v)}
                  placeholder="%TEMP%\\payload.bin"
                />
                <FormField
                  label={t("codeAnalysis.stages.ioc")}
                  value={stage.ioc}
                  onChange={(v) => updateStage(stage.id, "ioc", v)}
                  placeholder="SHA256: 93ad0e…"
                  mono
                />
              </StageCard>
            ))}
          </div>
        )}
      </AnimatedCollapse>
    </div>
  );
}

