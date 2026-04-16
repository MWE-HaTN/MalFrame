import { Shield, TriangleAlert, Bug, Monitor } from "lucide-react";
import { generateId } from "@/lib/utils";
import { RuntimeBehaviorData } from "./types";
import { ANTI_DEBUG_CATEGORIES, ANTI_DEBUG_APIS, ANTI_VM_METHODS } from "./constants";
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
import { useLanguage } from "@/hooks/useLanguage";

interface AntiAnalysisGroupProps {
  data: RuntimeBehaviorData;
  isExpanded: boolean;
  onToggleGroup: () => void;
  expandedSubItems: Record<string, boolean>;
  onToggleSubItem: (key: string) => void;
  update: <K extends keyof RuntimeBehaviorData>(key: K, value: RuntimeBehaviorData[K]) => void;
  updateMany: (patch: Partial<RuntimeBehaviorData>) => void;
}

export function AntiAnalysisGroup({
  data,
  isExpanded,
  onToggleGroup,
  expandedSubItems,
  onToggleSubItem,
  update,
  updateMany,
}: AntiAnalysisGroupProps) {
  const { t } = useLanguage();

  const addTrigger = () => {
    const next = [...data.triggers, { id: generateId(), name: "", description: "", images: [] }];
    updateMany({ triggers: next, triggersEnabled: true });
    if (!expandedSubItems["triggers"]) onToggleSubItem("triggers");
  };

  const addAntiDebug = () => {
    const next = [
      ...data.antiDebug,
      { id: generateId(), categoryTags: [], apis: [], effect: "", notes: "", images: [] },
    ];
    updateMany({ antiDebug: next, antiDebugEnabled: true });
    if (!expandedSubItems["antiDebug"]) onToggleSubItem("antiDebug");
  };

  const addAntiVM = () => {
    const next = [...data.antiVM, { id: generateId(), methodTags: [], indicator: "", effect: "", notes: "", images: [] }];
    updateMany({ antiVM: next, antiVMEnabled: true });
    if (!expandedSubItems["antiVM"]) onToggleSubItem("antiVM");
  };


  return (
    <div className="space-y-2">
      <GroupHeader
        title={t("runtime.antiAnalysis.title")}
        icon={<Shield className="w-4 h-4" />}
        isExpanded={isExpanded}
        onToggle={onToggleGroup}
      />
      
      <AnimatedCollapse isOpen={isExpanded} className="ml-6 space-y-2">
        {/* Triggers */}
        <SubItemRow
          title={t("runtime.antiAnalysis.triggers")}
          icon={<TriangleAlert className="w-4 h-4" />}
          isExpanded={expandedSubItems["triggers"]}
          onExpandToggle={() => onToggleSubItem("triggers")}
          count={data.triggers.length}
          onAdd={addTrigger}
        />
        <AnimatedCollapse isOpen={!!expandedSubItems["triggers"]} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
          {data.triggers.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic">{t("runtime.antiAnalysis.noTriggers")}</p>
          ) : (
            data.triggers.map((triggerEntry, entryIndex) => (
              <EntryCard 
                key={triggerEntry.id} 
                onDelete={() => update("triggers", data.triggers.filter((_, filterIndex) => filterIndex !== entryIndex))}
                canDelete={data.triggers.length > 0}
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-3">
                  <AutoTextarea
                    label={t("runtime.antiAnalysis.triggerName")}
                    value={triggerEntry.name}
                    onChange={(changeEvent) => {
                      const updatedTriggers = [...data.triggers];
                      updatedTriggers[entryIndex] = { ...triggerEntry, name: changeEvent.target.value };
                      update("triggers", updatedTriggers);
                    }}
                    placeholder={t("runtime.antiAnalysis.triggerNamePlaceholder")}
                  />
                  <AutoTextarea
                    label={t("runtime.antiAnalysis.description")}
                    value={triggerEntry.description}
                    onChange={(changeEvent) => {
                      const updatedTriggers = [...data.triggers];
                      updatedTriggers[entryIndex] = { ...triggerEntry, description: changeEvent.target.value };
                      update("triggers", updatedTriggers);
                    }}
                    placeholder={t("runtime.antiAnalysis.descriptionPlaceholder")}
                  />
                </div>
              </EntryCard>
            ))
          )}
        </AnimatedCollapse>

        {/* Anti-Debugging Techniques */}
        <SubItemRow
          title={t("runtime.antiAnalysis.antiDebugging")}
          icon={<Bug className="w-4 h-4" />}
          isExpanded={expandedSubItems["antiDebug"]}
          onExpandToggle={() => onToggleSubItem("antiDebug")}
          count={data.antiDebug.length}
          onAdd={addAntiDebug}
        />
        <AnimatedCollapse isOpen={!!expandedSubItems["antiDebug"]} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
          {data.antiDebug.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic">{t("runtime.antiAnalysis.noAntiDebug")}</p>
          ) : (
            data.antiDebug.map((debugEntry, entryIndex) => (
              <EntryCard 
                key={debugEntry.id}
                onDelete={() => update("antiDebug", data.antiDebug.filter((_, filterIndex) => filterIndex !== entryIndex))}
                canDelete={data.antiDebug.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.antiAnalysis.categoryTags")}</FieldLabel>
                  <TagList
                    tags={debugEntry.categoryTags}
                    availableTags={ANTI_DEBUG_CATEGORIES}
                    onChange={(newTags) => {
                      const updatedDebugEntries = [...data.antiDebug];
                      updatedDebugEntries[entryIndex] = { ...debugEntry, categoryTags: newTags };
                      update("antiDebug", updatedDebugEntries);
                    }}
                    placeholder={t("runtime.antiAnalysis.addCategory")}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.antiAnalysis.apisUsed")}</FieldLabel>
                  <TagList
                    tags={debugEntry.apis}
                    availableTags={ANTI_DEBUG_APIS}
                    onChange={(newTags) => {
                      const updatedDebugEntries = [...data.antiDebug];
                      updatedDebugEntries[entryIndex] = { ...debugEntry, apis: newTags };
                      update("antiDebug", updatedDebugEntries);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.antiAnalysis.effect")}</FieldLabel>
                  <input
                    type="text"
                    value={debugEntry.effect || ""}
                    onChange={(changeEvent) => {
                      const updatedDebugEntries = [...data.antiDebug];
                      updatedDebugEntries[entryIndex] = { ...debugEntry, effect: changeEvent.target.value };
                      update("antiDebug", updatedDebugEntries);
                    }}
                    placeholder={t("runtime.antiAnalysis.effectPlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <AutoTextarea
                  label={t("runtime.antiAnalysis.behaviorNotes")}
                  value={debugEntry.notes}
                  onChange={(changeEvent) => {
                    const updatedDebugEntries = [...data.antiDebug];
                    updatedDebugEntries[entryIndex] = { ...debugEntry, notes: changeEvent.target.value };
                    update("antiDebug", updatedDebugEntries);
                  }}
                  placeholder={t("runtime.antiAnalysis.behaviorNotesPlaceholder")}
                />
              </EntryCard>
            ))
          )}
        </AnimatedCollapse>

        {/* Anti-VM / Environment Checks */}
        <SubItemRow
          title={t("runtime.antiAnalysis.antiVM")}
          icon={<Monitor className="w-4 h-4" />}
          isExpanded={expandedSubItems["antiVM"]}
          onExpandToggle={() => onToggleSubItem("antiVM")}
          count={data.antiVM.length}
          onAdd={addAntiVM}
        />
        <AnimatedCollapse isOpen={!!expandedSubItems["antiVM"]} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
          {data.antiVM.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic">{t("runtime.antiAnalysis.noAntiVM")}</p>
          ) : (
            data.antiVM.map((vmEntry, entryIndex) => (
              <EntryCard 
                key={vmEntry.id}
                onDelete={() => update("antiVM", data.antiVM.filter((_, filterIndex) => filterIndex !== entryIndex))}
                canDelete={data.antiVM.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.antiAnalysis.detectionMethod")}</FieldLabel>
                  <TagList
                    tags={vmEntry.methodTags}
                    availableTags={ANTI_VM_METHODS}
                    onChange={(newTags) => {
                      const updatedVMEntries = [...data.antiVM];
                      updatedVMEntries[entryIndex] = { ...vmEntry, methodTags: newTags };
                      update("antiVM", updatedVMEntries);
                    }}
                    placeholder={t("runtime.antiAnalysis.addMethod")}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.antiAnalysis.indicatorFound")}</FieldLabel>
                  <input
                    type="text"
                    value={vmEntry.indicator}
                    onChange={(changeEvent) => {
                      const updatedVMEntries = [...data.antiVM];
                      updatedVMEntries[entryIndex] = { ...vmEntry, indicator: changeEvent.target.value };
                      update("antiVM", updatedVMEntries);
                    }}
                    placeholder={t("runtime.antiAnalysis.indicatorPlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.antiAnalysis.effect")}</FieldLabel>
                  <input
                    type="text"
                    value={vmEntry.effect || ""}
                    onChange={(changeEvent) => {
                      const updatedVMEntries = [...data.antiVM];
                      updatedVMEntries[entryIndex] = { ...vmEntry, effect: changeEvent.target.value };
                      update("antiVM", updatedVMEntries);
                    }}
                    placeholder={t("runtime.antiAnalysis.vmEffectPlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <AutoTextarea
                  label={t("runtime.antiAnalysis.notesImpact")}
                  value={vmEntry.notes}
                  onChange={(changeEvent) => {
                    const updatedVMEntries = [...data.antiVM];
                    updatedVMEntries[entryIndex] = { ...vmEntry, notes: changeEvent.target.value };
                    update("antiVM", updatedVMEntries);
                  }}
                  placeholder={t("runtime.antiAnalysis.notesImpactPlaceholder")}
                />
              </EntryCard>
            ))
          )}
        </AnimatedCollapse>
      </AnimatedCollapse>
    </div>
  );
}

