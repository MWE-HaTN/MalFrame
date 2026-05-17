import { memo } from "react";
import { Workflow, FolderCog, Lock } from "lucide-react";
import { cn, generateId } from "@/lib/utils";
import { RuntimeBehaviorData } from "./types";
import { ARTIFACT_TYPES, PERSISTENCE_TYPES } from "./constants";
import {
  GroupHeader,
  SubItemRow,
  EntryCard,
  FieldLabel,
  TagList,
  AutoTextarea,
} from "./ui-components";
import { inputStyles } from "./styles";
import { AnimatedCollapse } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";

interface ExecutionBehaviorGroupProps {
  data: RuntimeBehaviorData;
  isExpanded: boolean;
  onToggleGroup: () => void;
  expandedSubItems: Record<string, boolean>;
  onToggleSubItem: (key: string) => void;
  update: <K extends keyof RuntimeBehaviorData>(key: K, value: RuntimeBehaviorData[K]) => void;
  updateMany: (patch: Partial<RuntimeBehaviorData>) => void;
  updateField: <K extends keyof RuntimeBehaviorData>(key: K, updater: (current: RuntimeBehaviorData[K]) => RuntimeBehaviorData[K]) => void;
}

export const ExecutionBehaviorGroup = memo(function ExecutionBehaviorGroup({
  data,
  isExpanded,
  onToggleGroup,
  expandedSubItems,
  onToggleSubItem,
  update: _update,
  updateMany,
  updateField,
}: ExecutionBehaviorGroupProps) {
  const { t } = useLanguage();

  const addExecutionFlow = () => {
    updateMany({ executionFlow: [...data.executionFlow, { id: generateId(), stepName: "", description: "", images: [] }], executionFlowEnabled: true });
    if (!expandedSubItems["executionFlow"]) onToggleSubItem("executionFlow");
  };

  const addSystemArtifact = () => {
    updateMany({ systemArtifacts: [...data.systemArtifacts, { id: generateId(), typeTags: [], path: "", notes: "", images: [] }], systemArtifactsEnabled: true });
    if (!expandedSubItems["systemArtifacts"]) onToggleSubItem("systemArtifacts");
  };

  const addPersistence = () => {
    updateMany({ persistence: [...data.persistence, { id: generateId(), typeTags: [], path: "", notes: "", images: [] }], persistenceEnabled: true });
    if (!expandedSubItems["persistence"]) onToggleSubItem("persistence");
  };


  return (
    <div className="space-y-2">
      <GroupHeader
        title={t("runtime.execution.title")}
        icon={<Workflow className="w-4 h-4" />}
        isExpanded={isExpanded}
        onToggle={onToggleGroup}
      />

      <AnimatedCollapse isOpen={isExpanded} className="ml-6 space-y-2">
        {/* Execution Flow */}
        <SubItemRow
          title={t("runtime.execution.executionFlow")}
          icon={<Workflow className="w-4 h-4" />}
          isExpanded={expandedSubItems["executionFlow"]}
          onExpandToggle={() => onToggleSubItem("executionFlow")}
          count={data.executionFlow.length}
          onAdd={addExecutionFlow}
        />
        <AnimatedCollapse isOpen={!!expandedSubItems["executionFlow"]} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
          {data.executionFlow.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic">{t("runtime.execution.noExecutionFlow")}</p>
          ) : (
            data.executionFlow.map((flowEntry, entryIndex) => (
              <EntryCard
                key={flowEntry.id}
                onDelete={() => updateField("executionFlow", (current) => current.filter((_, i) => i !== entryIndex))}
                canDelete={data.executionFlow.length > 0}
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-3 items-start">
                  <div className="space-y-1.5">
                    <FieldLabel>{t("runtime.execution.stepName")}</FieldLabel>
                    <input
                      type="text"
                      value={flowEntry.stepName}
                      onChange={(changeEvent) => {
                        updateField("executionFlow", (current) => current.map((item, i) => i === entryIndex ? { ...item, stepName: changeEvent.target.value } : item));
                      }}
                      placeholder={t("runtime.execution.stepNamePlaceholder")}
                      className={cn(inputStyles, "!min-h-[70px] py-3")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>{t("runtime.execution.descriptionAction")}</FieldLabel>
                    <AutoTextarea
                      value={flowEntry.description}
                      onChange={(changeEvent) => {
                        updateField("executionFlow", (current) => current.map((item, i) => i === entryIndex ? { ...item, description: changeEvent.target.value } : item));
                      }}
                      placeholder={t("runtime.execution.descriptionPlaceholder")}
                      minHeight={70}
                    />
                  </div>
                </div>
              </EntryCard>
            ))
          )}
        </AnimatedCollapse>

        {/* System Artifacts */}
        <SubItemRow
          title={t("runtime.execution.systemArtifacts")}
          icon={<FolderCog className="w-4 h-4" />}
          isExpanded={expandedSubItems["systemArtifacts"]}
          onExpandToggle={() => onToggleSubItem("systemArtifacts")}
          count={data.systemArtifacts.length}
          onAdd={addSystemArtifact}
        />
        <AnimatedCollapse isOpen={!!expandedSubItems["systemArtifacts"]} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
          {data.systemArtifacts.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic">{t("runtime.execution.noArtifacts")}</p>
          ) : (
            data.systemArtifacts.map((artifactEntry, entryIndex) => (
              <EntryCard
                key={artifactEntry.id}
                onDelete={() => updateField("systemArtifacts", (current) => current.filter((_, i) => i !== entryIndex))}
                canDelete={data.systemArtifacts.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.execution.artifactType")}</FieldLabel>
                  <TagList
                    tags={artifactEntry.typeTags}
                    availableTags={ARTIFACT_TYPES}
                    onChange={(newTags) => {
                      updateField("systemArtifacts", (current) => current.map((item, i) => i === entryIndex ? { ...item, typeTags: newTags } : item));
                    }}
                    placeholder={t("runtime.execution.addType")}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.execution.pathValue")}</FieldLabel>
                  <input
                    type="text"
                    value={artifactEntry.path}
                    onChange={(changeEvent) => {
                      updateField("systemArtifacts", (current) => current.map((item, i) => i === entryIndex ? { ...item, path: changeEvent.target.value } : item));
                    }}
                    placeholder={t("runtime.execution.pathPlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <AutoTextarea
                  label={t("common.notes")}
                  value={artifactEntry.notes}
                  onChange={(changeEvent) => {
                    updateField("systemArtifacts", (current) => current.map((item, i) => i === entryIndex ? { ...item, notes: changeEvent.target.value } : item));
                  }}
                  placeholder={t("common.additionalNotes")}
                />
              </EntryCard>
            ))
          )}
        </AnimatedCollapse>

        {/* Persistence Behavior */}
        <SubItemRow
          title={t("runtime.execution.persistence")}
          icon={<Lock className="w-4 h-4" />}
          isExpanded={expandedSubItems["persistence"]}
          onExpandToggle={() => onToggleSubItem("persistence")}
          count={data.persistence.length}
          onAdd={addPersistence}
        />
        <AnimatedCollapse isOpen={!!expandedSubItems["persistence"]} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
          {data.persistence.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic">{t("runtime.execution.noPersistence")}</p>
          ) : (
            data.persistence.map((persistenceEntry, entryIndex) => (
              <EntryCard
                key={persistenceEntry.id}
                onDelete={() => updateField("persistence", (current) => current.filter((_, i) => i !== entryIndex))}
                canDelete={data.persistence.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.execution.persistenceType")}</FieldLabel>
                  <TagList
                    tags={persistenceEntry.typeTags}
                    availableTags={PERSISTENCE_TYPES}
                    onChange={(newTags) => {
                      updateField("persistence", (current) => current.map((item, i) => i === entryIndex ? { ...item, typeTags: newTags } : item));
                    }}
                    placeholder={t("runtime.execution.addType")}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.execution.pathCommand")}</FieldLabel>
                  <input
                    type="text"
                    value={persistenceEntry.path}
                    onChange={(changeEvent) => {
                      updateField("persistence", (current) => current.map((item, i) => i === entryIndex ? { ...item, path: changeEvent.target.value } : item));
                    }}
                    placeholder={t("runtime.execution.persistencePlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <AutoTextarea
                  label={t("common.notes")}
                  value={persistenceEntry.notes}
                  onChange={(changeEvent) => {
                    updateField("persistence", (current) => current.map((item, i) => i === entryIndex ? { ...item, notes: changeEvent.target.value } : item));
                  }}
                  placeholder={t("common.additionalNotes")}
                />
              </EntryCard>
            ))
          )}
        </AnimatedCollapse>
      </AnimatedCollapse>
    </div>
  );
});
