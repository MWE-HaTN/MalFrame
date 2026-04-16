import { useState } from "react";
import { RuntimeBehaviorData } from "./types";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { AntiAnalysisGroup } from "./AntiAnalysisGroup";
import { ExecutionBehaviorGroup } from "./ExecutionBehaviorGroup";
import { TechnicalRuntimeGroup } from "./TechnicalRuntimeGroup";

function loadExpandedGroups(): Record<number, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.RUNTIME_GROUPS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function loadExpandedSubItems(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.RUNTIME_SUBITEMS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveExpandedGroups(groups: Record<number, boolean>) {
  localStorage.setItem(STORAGE_KEYS.RUNTIME_GROUPS, JSON.stringify(groups));
}

function saveExpandedSubItems(subItems: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEYS.RUNTIME_SUBITEMS, JSON.stringify(subItems));
}

interface RuntimeBehaviorProps {
  data: RuntimeBehaviorData;
  onChange: (data: RuntimeBehaviorData) => void;
}

export function RuntimeBehavior({ data, onChange }: RuntimeBehaviorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(loadExpandedGroups);
  const [expandedSubItems, setExpandedSubItems] = useState<Record<string, boolean>>(loadExpandedSubItems);
  
  const toggleGroup = (group: number) => {
    setExpandedGroups(prev => {
      const updated = { ...prev, [group]: !prev[group] };
      saveExpandedGroups(updated);
      return updated;
    });
  };

  const toggleSubItem = (key: string) => {
    setExpandedSubItems(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      saveExpandedSubItems(updated);
      return updated;
    });
  };

  const update = <K extends keyof RuntimeBehaviorData>(key: K, value: RuntimeBehaviorData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const updateMany = (patch: Partial<RuntimeBehaviorData>) => {
    onChange({ ...data, ...patch });
  };

  return (
    <div className="space-y-3">
      {/* GROUP 1: ANTI-ANALYSIS & EVASION */}
      <AntiAnalysisGroup
        data={data}
        isExpanded={!!expandedGroups[1]}
        onToggleGroup={() => toggleGroup(1)}
        expandedSubItems={expandedSubItems}
        onToggleSubItem={toggleSubItem}
        update={update}
        updateMany={updateMany}
      />

      {/* GROUP 2: EXECUTION BEHAVIOR */}
      <ExecutionBehaviorGroup
        data={data}
        isExpanded={!!expandedGroups[2]}
        onToggleGroup={() => toggleGroup(2)}
        expandedSubItems={expandedSubItems}
        onToggleSubItem={toggleSubItem}
        update={update}
        updateMany={updateMany}
      />

      {/* GROUP 3: TECHNICAL RUNTIME BEHAVIOR */}
      <TechnicalRuntimeGroup
        data={data}
        isExpanded={!!expandedGroups[3]}
        onToggleGroup={() => toggleGroup(3)}
        expandedSubItems={expandedSubItems}
        onToggleSubItem={toggleSubItem}
        update={update}
        updateMany={updateMany}
      />
    </div>
  );
}
