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
  inputStyles,
} from "./ui-components";
import { AnimatedCollapse } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExecutionBehaviorGroupProps {
  data: RuntimeBehaviorData;
  isExpanded: boolean;
  onToggleGroup: () => void;
  expandedSubItems: Record<string, boolean>;
  onToggleSubItem: (key: string) => void;
  onSubItemToggle: (
    enabledKey: keyof RuntimeBehaviorData,
    dataKey: keyof RuntimeBehaviorData,
    defaultEntry: any,
    enabled: boolean,
    subItemKey: string
  ) => void;
  update: <K extends keyof RuntimeBehaviorData>(key: K, value: RuntimeBehaviorData[K]) => void;
  updateMany: (patch: Partial<RuntimeBehaviorData>) => void;
}

export function ExecutionBehaviorGroup({
  data,
  isExpanded,
  onToggleGroup,
  expandedSubItems,
  onToggleSubItem,
  onSubItemToggle,
  update,
  updateMany,
}: ExecutionBehaviorGroupProps) {
  const { t } = useLanguage();

  const addExecutionFlow = () => {
    const next = [...data.executionFlow, { id: generateId(), stepName: "", description: "", images: [] }];
    updateMany({ executionFlow: next, executionFlowEnabled: true });
    if (!expandedSubItems["executionFlow"]) onToggleSubItem("executionFlow");
  };

  const addSystemArtifact = () => {
    const next = [
      ...data.systemArtifacts,
      { id: generateId(), typeTags: [], path: "", notes: "", images: [] },
    ];
    updateMany({ systemArtifacts: next, systemArtifactsEnabled: true });
    if (!expandedSubItems["systemArtifacts"]) onToggleSubItem("systemArtifacts");
  };

  const addPersistence = () => {
    const next = [...data.persistence, { id: generateId(), typeTags: [], path: "", notes: "", images: [] }];
    updateMany({ persistence: next, persistenceEnabled: true });
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
          enabled={data.executionFlowEnabled}
          onToggle={(v) => onSubItemToggle("executionFlowEnabled", "executionFlow", { id: generateId(), stepName: "", description: "", images: [] }, v, "executionFlow")}
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
                onDelete={() => update("executionFlow", data.executionFlow.filter((_, filterIndex) => filterIndex !== entryIndex))}
                canDelete={data.executionFlow.length > 0}
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-3 items-start">
                  <div className="space-y-1.5">
                    <FieldLabel>{t("runtime.execution.stepName")}</FieldLabel>
                    <input
                      type="text"
                      value={flowEntry.stepName}
                      onChange={(changeEvent) => {
                        const updatedFlowEntries = [...data.executionFlow];
                        updatedFlowEntries[entryIndex] = { ...flowEntry, stepName: changeEvent.target.value };
                        update("executionFlow", updatedFlowEntries);
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
                        const updatedFlowEntries = [...data.executionFlow];
                        updatedFlowEntries[entryIndex] = { ...flowEntry, description: changeEvent.target.value };
                        update("executionFlow", updatedFlowEntries);
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
          enabled={data.systemArtifactsEnabled}
          onToggle={(v) => onSubItemToggle("systemArtifactsEnabled", "systemArtifacts", { id: generateId(), typeTags: [], path: "", notes: "", images: [] }, v, "systemArtifacts")}
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
                onDelete={() => update("systemArtifacts", data.systemArtifacts.filter((_, filterIndex) => filterIndex !== entryIndex))}
                canDelete={data.systemArtifacts.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.execution.artifactType")}</FieldLabel>
                  <TagList
                    tags={artifactEntry.typeTags}
                    availableTags={ARTIFACT_TYPES}
                    onChange={(newTags) => {
                      const updatedArtifacts = [...data.systemArtifacts];
                      updatedArtifacts[entryIndex] = { ...artifactEntry, typeTags: newTags };
                      update("systemArtifacts", updatedArtifacts);
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
                      const updatedArtifacts = [...data.systemArtifacts];
                      updatedArtifacts[entryIndex] = { ...artifactEntry, path: changeEvent.target.value };
                      update("systemArtifacts", updatedArtifacts);
                    }}
                    placeholder={t("runtime.execution.pathPlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <AutoTextarea
                  label={t("common.notes")}
                  value={artifactEntry.notes}
                  onChange={(changeEvent) => {
                    const updatedArtifacts = [...data.systemArtifacts];
                    updatedArtifacts[entryIndex] = { ...artifactEntry, notes: changeEvent.target.value };
                    update("systemArtifacts", updatedArtifacts);
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
          enabled={data.persistenceEnabled}
          onToggle={(v) => onSubItemToggle("persistenceEnabled", "persistence", { id: generateId(), typeTags: [], path: "", notes: "", images: [] }, v, "persistence")}
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
                onDelete={() => update("persistence", data.persistence.filter((_, filterIndex) => filterIndex !== entryIndex))}
                canDelete={data.persistence.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.execution.persistenceType")}</FieldLabel>
                  <TagList
                    tags={persistenceEntry.typeTags}
                    availableTags={PERSISTENCE_TYPES}
                    onChange={(newTags) => {
                      const updatedPersistence = [...data.persistence];
                      updatedPersistence[entryIndex] = { ...persistenceEntry, typeTags: newTags };
                      update("persistence", updatedPersistence);
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
                      const updatedPersistence = [...data.persistence];
                      updatedPersistence[entryIndex] = { ...persistenceEntry, path: changeEvent.target.value };
                      update("persistence", updatedPersistence);
                    }}
                    placeholder={t("runtime.execution.persistencePlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <AutoTextarea
                  label={t("common.notes")}
                  value={persistenceEntry.notes}
                  onChange={(changeEvent) => {
                    const updatedPersistence = [...data.persistence];
                    updatedPersistence[entryIndex] = { ...persistenceEntry, notes: changeEvent.target.value };
                    update("persistence", updatedPersistence);
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
}
