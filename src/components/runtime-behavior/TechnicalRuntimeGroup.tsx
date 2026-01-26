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
  inputStyles,
} from "./ui-components";
import { AnimatedCollapse } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

interface TechnicalRuntimeGroupProps {
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

export function TechnicalRuntimeGroup({
  data,
  isExpanded,
  onToggleGroup,
  expandedSubItems,
  onToggleSubItem,
  onSubItemToggle,
  update,
  updateMany,
}: TechnicalRuntimeGroupProps) {
  const { t } = useLanguage();

  const addNetworkEntry = () => {
    const next = [...data.network, { id: generateId(), behaviorTags: [], indicator: "", notes: "", images: [] }];
    updateMany({ network: next, networkEnabled: true });
    if (!expandedSubItems["network"]) onToggleSubItem("network");
  };

  const addMemoryEntry = () => {
    const next = [...data.memory, { id: generateId(), eventTags: [], region: "", notes: "", images: [] }];
    updateMany({ memory: next, memoryEnabled: true });
    if (!expandedSubItems["memory"]) onToggleSubItem("memory");
  };

  const addInjectionEntry = () => {
    const next = [
      ...data.processInjection,
      { id: generateId(), techniqueTags: [], targetProcess: "", apiChain: [], notes: "", images: [] },
    ];
    updateMany({ processInjection: next, processInjectionEnabled: true });
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
          enabled={data.networkEnabled}
          onToggle={(v) => onSubItemToggle("networkEnabled", "network", { id: generateId(), behaviorTags: [], indicator: "", notes: "", images: [] }, v, "network")}
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
                onDelete={() => update("network", data.network.filter((_, filterIndex) => filterIndex !== entryIndex))}
                canDelete={data.network.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.technical.behaviorTags")}</FieldLabel>
                  <TagList
                    tags={networkEntry.behaviorTags}
                    availableTags={NETWORK_TYPES}
                    onChange={(newTags) => {
                      const updatedNetwork = [...data.network];
                      updatedNetwork[entryIndex] = { ...networkEntry, behaviorTags: newTags };
                      update("network", updatedNetwork);
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
                      const updatedNetwork = [...data.network];
                      updatedNetwork[entryIndex] = { ...networkEntry, indicator: changeEvent.target.value };
                      update("network", updatedNetwork);
                    }}
                    placeholder={t("runtime.technical.indicatorPlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <AutoTextarea
                  label={t("runtime.technical.trafficPattern")}
                  value={networkEntry.notes}
                  onChange={(changeEvent) => {
                    const updatedNetwork = [...data.network];
                    updatedNetwork[entryIndex] = { ...networkEntry, notes: changeEvent.target.value };
                    update("network", updatedNetwork);
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
          enabled={data.memoryEnabled}
          onToggle={(v) => onSubItemToggle("memoryEnabled", "memory", { id: generateId(), eventTags: [], region: "", notes: "", images: [] }, v, "memory")}
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
                onDelete={() => update("memory", data.memory.filter((_, filterIndex) => filterIndex !== entryIndex))}
                canDelete={data.memory.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.technical.eventTags")}</FieldLabel>
                  <TagList
                    tags={memoryEntry.eventTags}
                    availableTags={MEMORY_TYPES}
                    onChange={(newTags) => {
                      const updatedMemory = [...data.memory];
                      updatedMemory[entryIndex] = { ...memoryEntry, eventTags: newTags };
                      update("memory", updatedMemory);
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
                      const updatedMemory = [...data.memory];
                      updatedMemory[entryIndex] = { ...memoryEntry, region: changeEvent.target.value };
                      update("memory", updatedMemory);
                    }}
                    placeholder={t("runtime.technical.addressPlaceholder")}
                    className={inputStyles}
                  />
                </div>
                <AutoTextarea
                  label={t("common.notes")}
                  value={memoryEntry.notes}
                  onChange={(changeEvent) => {
                    const updatedMemory = [...data.memory];
                    updatedMemory[entryIndex] = { ...memoryEntry, notes: changeEvent.target.value };
                    update("memory", updatedMemory);
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
          enabled={data.processInjectionEnabled}
          onToggle={(v) => onSubItemToggle("processInjectionEnabled", "processInjection", { id: generateId(), techniqueTags: [], targetProcess: "", apiChain: [], notes: "", images: [] }, v, "injection")}
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
                onDelete={() => update("processInjection", data.processInjection.filter((_, filterIndex) => filterIndex !== entryIndex))}
                canDelete={data.processInjection.length > 0}
              >
                <div className="space-y-1.5">
                  <FieldLabel>{t("runtime.technical.techniqueTags")}</FieldLabel>
                  <TagList
                    tags={injectionEntry.techniqueTags}
                    availableTags={INJECTION_TECHNIQUES}
                    onChange={(newTags) => {
                      const updatedInjection = [...data.processInjection];
                      updatedInjection[entryIndex] = { ...injectionEntry, techniqueTags: newTags };
                      update("processInjection", updatedInjection);
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
                      const updatedInjection = [...data.processInjection];
                      updatedInjection[entryIndex] = { ...injectionEntry, targetProcess: changeEvent.target.value };
                      update("processInjection", updatedInjection);
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
                      const updatedInjection = [...data.processInjection];
                      updatedInjection[entryIndex] = { ...injectionEntry, apiChain: newTags };
                      update("processInjection", updatedInjection);
                    }}
                  />
                </div>
                <AutoTextarea
                  label={t("runtime.technical.notesPayload")}
                  value={injectionEntry.notes}
                  onChange={(changeEvent) => {
                    const updatedInjection = [...data.processInjection];
                    updatedInjection[entryIndex] = { ...injectionEntry, notes: changeEvent.target.value };
                    update("processInjection", updatedInjection);
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
}
