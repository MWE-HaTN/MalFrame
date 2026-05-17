import { memo } from "react";
import { Wifi, MemoryStick, Syringe } from "lucide-react";
import { generateId } from "@/lib/utils";
import { RuntimeBehaviorData } from "./types";
import { NETWORK_TYPES, MEMORY_TYPES, INJECTION_TECHNIQUES, INJECTION_APIS } from "./constants";
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

interface TechnicalRuntimeGroupProps {
  data: RuntimeBehaviorData;
  isExpanded: boolean;
  onToggleGroup: () => void;
  expandedSubItems: Record<string, boolean>;
  onToggleSubItem: (key: string) => void;
  update: <K extends keyof RuntimeBehaviorData>(key: K, value: RuntimeBehaviorData[K]) => void;
  updateMany: (patch: Partial<RuntimeBehaviorData>) => void;
  updateField: <K extends keyof RuntimeBehaviorData>(key: K, updater: (current: RuntimeBehaviorData[K]) => RuntimeBehaviorData[K]) => void;
}

export const TechnicalRuntimeGroup = memo(function TechnicalRuntimeGroup({
  data,
  isExpanded,
  onToggleGroup,
  expandedSubItems,
  onToggleSubItem,
  update: _update,
  updateMany,
  updateField,
}: TechnicalRuntimeGroupProps) {
  const { t } = useLanguage();

  const addNetworkEntry = () => {
    updateMany({ network: [...data.network, { id: generateId(), behaviorTags: [], indicator: "", notes: "", images: [] }], networkEnabled: true });
    if (!expandedSubItems["network"]) onToggleSubItem("network");
  };

  const addMemoryEntry = () => {
    updateMany({ memory: [...data.memory, { id: generateId(), eventTags: [], region: "", notes: "", images: [] }], memoryEnabled: true });
    if (!expandedSubItems["memory"]) onToggleSubItem("memory");
  };

  const addInjectionEntry = () => {
    updateMany({ processInjection: [...data.processInjection, { id: generateId(), techniqueTags: [], targetProcess: "", apiChain: [], notes: "", images: [] }], processInjectionEnabled: true });
    if (!expandedSubItems["injection"]) onToggleSubItem("injection");
  };


  return (
    <div className="space-y-2">
      <GroupHeader
        title={t("runtime.technical.title")}
        icon={<Wifi className="w-4 h-4" />}
        isExpanded={isExpanded}
        onToggle={onToggleGroup}
      />

      <AnimatedCollapse isOpen={isExpanded} className="ml-6 space-y-2">
        {/* Network Behavior */}
        <SubItemRow
          title={t("runtime.technical.networkBehavior")}
          icon={<Wifi className="w-4 h-4" />}
          isExpanded={expandedSubItems["network"]}
          onExpandToggle={() => onToggleSubItem("network")}
          count={data.network.length}
          onAdd={addNetworkEntry}
        />
        <AnimatedCollapse isOpen={!!expandedSubItems["network"]} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
          {data.network.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic">{t("runtime.technical.noNetwork")}</p>
          ) : (
            data.network.map((networkEntry, entryIndex) => (
              <EntryCard
                key={networkEntry.id}
                onDelete={() => updateField("network", (current) => current.filter((_, i) => i !== entryIndex))}
                canDelete={data.network.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.technical.behaviorTags")}</FieldLabel>
                  <TagList
                    tags={networkEntry.behaviorTags}
                    availableTags={NETWORK_TYPES}
                    onChange={(newTags) => {
                      updateField("network", (current) => current.map((item, i) => i === entryIndex ? { ...item, behaviorTags: newTags } : item));
                    }}
                    placeholder={t("runtime.technical.addBehavior")}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.technical.indicator")}</FieldLabel>
                  <input
                    type="text"
                    value={networkEntry.indicator}
                    onChange={(changeEvent) => {
                      updateField("network", (current) => current.map((item, i) => i === entryIndex ? { ...item, indicator: changeEvent.target.value } : item));
                    }}
                    placeholder={t("runtime.technical.indicatorPlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <AutoTextarea
                  label={t("runtime.technical.trafficPattern")}
                  value={networkEntry.notes}
                  onChange={(changeEvent) => {
                    updateField("network", (current) => current.map((item, i) => i === entryIndex ? { ...item, notes: changeEvent.target.value } : item));
                  }}
                  placeholder={t("runtime.technical.trafficPlaceholder")}
                />
              </EntryCard>
            ))
          )}
        </AnimatedCollapse>

        {/* Memory Behavior */}
        <SubItemRow
          title={t("runtime.technical.memoryBehavior")}
          icon={<MemoryStick className="w-4 h-4" />}
          isExpanded={expandedSubItems["memory"]}
          onExpandToggle={() => onToggleSubItem("memory")}
          count={data.memory.length}
          onAdd={addMemoryEntry}
        />
        <AnimatedCollapse isOpen={!!expandedSubItems["memory"]} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
          {data.memory.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic">{t("runtime.technical.noMemory")}</p>
          ) : (
            data.memory.map((memoryEntry, entryIndex) => (
              <EntryCard
                key={memoryEntry.id}
                onDelete={() => updateField("memory", (current) => current.filter((_, i) => i !== entryIndex))}
                canDelete={data.memory.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.technical.eventTags")}</FieldLabel>
                  <TagList
                    tags={memoryEntry.eventTags}
                    availableTags={MEMORY_TYPES}
                    onChange={(newTags) => {
                      updateField("memory", (current) => current.map((item, i) => i === entryIndex ? { ...item, eventTags: newTags } : item));
                    }}
                    placeholder={t("runtime.technical.addEventType")}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.technical.addressRegion")}</FieldLabel>
                  <input
                    type="text"
                    value={memoryEntry.region}
                    onChange={(changeEvent) => {
                      updateField("memory", (current) => current.map((item, i) => i === entryIndex ? { ...item, region: changeEvent.target.value } : item));
                    }}
                    placeholder={t("runtime.technical.addressPlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <AutoTextarea
                  label={t("common.notes")}
                  value={memoryEntry.notes}
                  onChange={(changeEvent) => {
                    updateField("memory", (current) => current.map((item, i) => i === entryIndex ? { ...item, notes: changeEvent.target.value } : item));
                  }}
                  placeholder={t("runtime.technical.memoryPlaceholder")}
                />
              </EntryCard>
            ))
          )}
        </AnimatedCollapse>

        {/* Process Injection */}
        <SubItemRow
          title={t("runtime.technical.processInjection")}
          icon={<Syringe className="w-4 h-4" />}
          isExpanded={expandedSubItems["injection"]}
          onExpandToggle={() => onToggleSubItem("injection")}
          count={data.processInjection.length}
          onAdd={addInjectionEntry}
        />
        <AnimatedCollapse isOpen={!!expandedSubItems["injection"]} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
          {data.processInjection.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic">{t("runtime.technical.noInjection")}</p>
          ) : (
            data.processInjection.map((injectionEntry, entryIndex) => (
              <EntryCard
                key={injectionEntry.id}
                onDelete={() => updateField("processInjection", (current) => current.filter((_, i) => i !== entryIndex))}
                canDelete={data.processInjection.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.technical.techniqueTags")}</FieldLabel>
                  <TagList
                    tags={injectionEntry.techniqueTags}
                    availableTags={INJECTION_TECHNIQUES}
                    onChange={(newTags) => {
                      updateField("processInjection", (current) => current.map((item, i) => i === entryIndex ? { ...item, techniqueTags: newTags } : item));
                    }}
                    placeholder={t("runtime.technical.addTechnique")}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.technical.targetProcess")}</FieldLabel>
                  <input
                    type="text"
                    value={injectionEntry.targetProcess}
                    onChange={(changeEvent) => {
                      updateField("processInjection", (current) => current.map((item, i) => i === entryIndex ? { ...item, targetProcess: changeEvent.target.value } : item));
                    }}
                    placeholder={t("runtime.technical.targetPlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.technical.apiChain")}</FieldLabel>
                  <TagList
                    tags={injectionEntry.apiChain}
                    availableTags={INJECTION_APIS}
                    onChange={(newTags) => {
                      updateField("processInjection", (current) => current.map((item, i) => i === entryIndex ? { ...item, apiChain: newTags } : item));
                    }}
                  />
                </div>
                <AutoTextarea
                  label={t("runtime.technical.notesPayload")}
                  value={injectionEntry.notes}
                  onChange={(changeEvent) => {
                    updateField("processInjection", (current) => current.map((item, i) => i === entryIndex ? { ...item, notes: changeEvent.target.value } : item));
                  }}
                  placeholder={t("runtime.technical.injectionPlaceholder")}
                />
              </EntryCard>
            ))
          )}
        </AnimatedCollapse>
      </AnimatedCollapse>
    </div>
  );
});
