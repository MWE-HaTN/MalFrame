import { memo } from "react";
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
} from "./ui-components";
import { inputStyles } from "./styles";
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
  updateField: <K extends keyof RuntimeBehaviorData>(key: K, updater: (current: RuntimeBehaviorData[K]) => RuntimeBehaviorData[K]) => void;
}

export const AntiAnalysisGroup = memo(function AntiAnalysisGroup({
  data,
  isExpanded,
  onToggleGroup,
  expandedSubItems,
  onToggleSubItem,
  update: _update,
  updateMany,
  updateField,
}: AntiAnalysisGroupProps) {
  const { t } = useLanguage();

  const addTrigger = () => {
    updateMany({ triggers: [...data.triggers, { id: generateId(), name: "", description: "", images: [] }], triggersEnabled: true });
    if (!expandedSubItems["triggers"]) onToggleSubItem("triggers");
  };

  const addAntiDebug = () => {
    updateMany({ antiDebug: [...data.antiDebug, { id: generateId(), categoryTags: [], apis: [], effect: "", notes: "", images: [] }], antiDebugEnabled: true });
    if (!expandedSubItems["antiDebug"]) onToggleSubItem("antiDebug");
  };

  const addAntiVM = () => {
    updateMany({ antiVM: [...data.antiVM, { id: generateId(), methodTags: [], indicator: "", effect: "", notes: "", images: [] }], antiVMEnabled: true });
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
                onDelete={() => updateField("triggers", (current) => current.filter((_, i) => i !== entryIndex))}
                canDelete={data.triggers.length > 0}
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-3">
                  <AutoTextarea
                    label={t("runtime.antiAnalysis.triggerName")}
                    value={triggerEntry.name}
                    onChange={(changeEvent) => {
                      updateField("triggers", (current) => current.map((item, i) => i === entryIndex ? { ...item, name: changeEvent.target.value } : item));
                    }}
                    placeholder={t("runtime.antiAnalysis.triggerNamePlaceholder")}
                  />
                  <AutoTextarea
                    label={t("runtime.antiAnalysis.description")}
                    value={triggerEntry.description}
                    onChange={(changeEvent) => {
                      updateField("triggers", (current) => current.map((item, i) => i === entryIndex ? { ...item, description: changeEvent.target.value } : item));
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
                onDelete={() => updateField("antiDebug", (current) => current.filter((_, i) => i !== entryIndex))}
                canDelete={data.antiDebug.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.antiAnalysis.categoryTags")}</FieldLabel>
                  <TagList
                    tags={debugEntry.categoryTags}
                    availableTags={ANTI_DEBUG_CATEGORIES}
                    onChange={(newTags) => {
                      updateField("antiDebug", (current) => current.map((item, i) => i === entryIndex ? { ...item, categoryTags: newTags } : item));
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
                      updateField("antiDebug", (current) => current.map((item, i) => i === entryIndex ? { ...item, apis: newTags } : item));
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.antiAnalysis.effect")}</FieldLabel>
                  <input
                    type="text"
                    value={debugEntry.effect || ""}
                    onChange={(changeEvent) => {
                      updateField("antiDebug", (current) => current.map((item, i) => i === entryIndex ? { ...item, effect: changeEvent.target.value } : item));
                    }}
                    placeholder={t("runtime.antiAnalysis.effectPlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <AutoTextarea
                  label={t("runtime.antiAnalysis.behaviorNotes")}
                  value={debugEntry.notes}
                  onChange={(changeEvent) => {
                    updateField("antiDebug", (current) => current.map((item, i) => i === entryIndex ? { ...item, notes: changeEvent.target.value } : item));
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
                onDelete={() => updateField("antiVM", (current) => current.filter((_, i) => i !== entryIndex))}
                canDelete={data.antiVM.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.antiAnalysis.detectionMethod")}</FieldLabel>
                  <TagList
                    tags={vmEntry.methodTags}
                    availableTags={ANTI_VM_METHODS}
                    onChange={(newTags) => {
                      updateField("antiVM", (current) => current.map((item, i) => i === entryIndex ? { ...item, methodTags: newTags } : item));
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
                      updateField("antiVM", (current) => current.map((item, i) => i === entryIndex ? { ...item, indicator: changeEvent.target.value } : item));
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
                      updateField("antiVM", (current) => current.map((item, i) => i === entryIndex ? { ...item, effect: changeEvent.target.value } : item));
                    }}
                    placeholder={t("runtime.antiAnalysis.vmEffectPlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <AutoTextarea
                  label={t("runtime.antiAnalysis.notesImpact")}
                  value={vmEntry.notes}
                  onChange={(changeEvent) => {
                    updateField("antiVM", (current) => current.map((item, i) => i === entryIndex ? { ...item, notes: changeEvent.target.value } : item));
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
});
