import { useState, useMemo, useEffect, memo, useCallback } from "react";
import { ChevronDown, ChevronRight, Search, Download, RefreshCw, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMBCItemTypeClass } from "@/lib/semanticColors";
import { downloadBlob } from "@/lib/export/helpers";
import { toast } from "sonner";
import { useMBCData } from "@/features/mre/hooks/useMBCData";
import { useLanguage } from "@/hooks/useLanguage";
import type { MBCBehavior, MBCObjective } from "@/lib/mbc";

interface SelectedBehavior {
  id: string;
  name: string;
  objectiveId: string;
  objectiveName: string;
  type: 'behavior' | 'micro' | 'enhanced' | 'sub-technique';
}

interface MBCMappingProps {
  mapping?: SelectedBehavior[];
  onMappingChange?: (mapping: SelectedBehavior[]) => void;
  readOnly?: boolean;
}

export function MBCMapping({ 
  mapping = [], 
  onMappingChange,
  readOnly = false 
}: MBCMappingProps) {
  const { t } = useLanguage();
  const { mbcData, isLoading } = useMBCData();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());
  const [expandedBehaviors, setExpandedBehaviors] = useState<Set<string>>(new Set());

  // Filter behaviors based on search
  const filteredObjectives = useMemo(() => {
    if (!mbcData) return [];
    if (!searchQuery) return mbcData.objectives;
    const query = searchQuery.toLowerCase();
    return mbcData.objectives.map(objective => ({
      ...objective,
      behaviors: objective.behaviors.map(behavior => {
        const behaviorMatches = 
          behavior.id.toLowerCase().includes(query) ||
          behavior.name.toLowerCase().includes(query) ||
          behavior.description.toLowerCase().includes(query);
        
        const filteredMethods = behavior.methods?.filter(method => 
          method.name.toLowerCase().includes(query) || method.id.toLowerCase().includes(query)
        );
        
        // If behavior itself matches, return with all methods
        // If only methods match, return with only matching methods
        if (behaviorMatches) {
          return behavior;
        } else if (filteredMethods && filteredMethods.length > 0) {
          return { ...behavior, methods: filteredMethods };
        }
        return null;
      }).filter((behavior): behavior is NonNullable<typeof behavior> => behavior !== null)
    })).filter(objective => objective.behaviors.length > 0);
  }, [mbcData, searchQuery]);

  // Auto-expand objectives and behaviors when searching, collapse when cleared
  useEffect(() => {
    if (searchQuery) {
      const objectivesToExpand = filteredObjectives.map(o => o.objectiveId);
      setExpandedObjectives(new Set(objectivesToExpand));
      
      // Also expand behaviors that have matching methods
      const behaviorsToExpand = filteredObjectives.flatMap(o => 
        o.behaviors.filter(b => b.methods && b.methods.length > 0).map(b => b.id)
      );
      setExpandedBehaviors(new Set(behaviorsToExpand));
    } else {
      // Collapse when search is cleared
      setExpandedObjectives(new Set());
      setExpandedBehaviors(new Set());
    }
  }, [searchQuery, filteredObjectives]);

  const toggleObjective = (objectiveId: string) => {
    const newSet = new Set(expandedObjectives);
    if (newSet.has(objectiveId)) {
      newSet.delete(objectiveId);
    } else {
      newSet.add(objectiveId);
    }
    setExpandedObjectives(newSet);
  };

  const toggleBehavior = (behaviorId: string) => {
    const newSet = new Set(expandedBehaviors);
    if (newSet.has(behaviorId)) {
      newSet.delete(behaviorId);
    } else {
      newSet.add(behaviorId);
    }
    setExpandedBehaviors(newSet);
  };

  const isSelected = useCallback((id: string) => mapping.some(m => m.id === id), [mapping]);

  const selectBehavior = useCallback((behavior: MBCBehavior, objective: MBCObjective) => {
    if (readOnly) return;
    const exists = mapping.some(m => m.id === behavior.id);
    if (exists) {
      onMappingChange?.(mapping.filter(m => m.id !== behavior.id));
    } else {
      onMappingChange?.([...mapping, {
        id: behavior.id,
        name: behavior.name,
        objectiveId: objective.objectiveId,
        objectiveName: objective.objectiveName,
        type: 'behavior'
      }]);
    }
  }, [mapping, onMappingChange, readOnly]);
  const selectMethod = useCallback((methodId: string, methodName: string, behavior: MBCBehavior, objective: MBCObjective) => {
    if (readOnly) return;
    const exists = mapping.some(m => m.id === methodId);
    if (exists) {
      onMappingChange?.(mapping.filter(m => m.id !== methodId));
    } else {
      onMappingChange?.([...mapping, {
        id: methodId,
        name: `${behavior.name}: ${methodName}`,
        objectiveId: objective.objectiveId,
        objectiveName: objective.objectiveName,
        type: 'behavior'
      }]);
    }
  }, [mapping, onMappingChange, readOnly]);

  const exportMapping = () => {
    if (!mbcData) return;
    const exportData = {
      version: mbcData.version,
      exportDate: new Date().toISOString(),
      selectedBehaviors: mapping
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'mbc_mapping.json');
    toast.success(t("mbc.exportSuccess"));
  };

  const handleUpdate = () => {
    toast.success(t("mbc.upToDate"));
  };

  // Loading state
  if (isLoading || !mbcData) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-mono">{t("mbc.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground font-mono text-left">
          {t("mbc.description")}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">{mbcData.version}</span>
          <button
            onClick={handleUpdate}
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-muted-foreground hover:text-primary border border-border/50 rounded-sm hover:bg-primary/10 transition-all"
            title="Check for updates"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{t("mbc.update")}</span>
          </button>
          {mapping.length > 0 && (
            <button
              onClick={exportMapping}
              className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-primary hover:text-primary/80 border border-primary/30 rounded-sm hover:bg-primary/10 transition-all"
              title="Export selected mappings"
            >
              <Download className="w-3 h-3" />
              <span>{t("mbc.export")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          id="mbc-search"
          name="mbc-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("mbc.search")}
          aria-label="Search MBC behaviors"
          className="w-full pl-9 pr-9 py-2 text-sm font-mono bg-card border border-border rounded-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-3 gap-2 max-h-[500px] overflow-y-auto">
        {filteredObjectives.map(objective => (
          <ObjectiveColumn
            key={objective.objectiveId}
            objective={objective}
            isExpanded={expandedObjectives.has(objective.objectiveId)}
            expandedBehaviors={expandedBehaviors}
            onToggleObjective={() => toggleObjective(objective.objectiveId)}
            onToggleBehavior={toggleBehavior}
            isSelected={isSelected}
            onSelectBehavior={(b) => selectBehavior(b, objective)}
            onSelectMethod={(mId, mName, b) => selectMethod(mId, mName, b, objective)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* Selected Section */}
      {mapping.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs font-mono text-muted-foreground mb-3 text-left">
            {t("mbc.selectedBehaviors")} ({mapping.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {mapping.map(item => (
              <button
                key={item.id}
                onClick={() => !readOnly && onMappingChange?.(mapping.filter(m => m.id !== item.id))}
                disabled={readOnly}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-mono",
                  getMBCItemTypeClass(item.type),
                  "hover:opacity-80 transition-all",
                  readOnly && "cursor-default"
                )}
                title={`${item.id}: ${item.name} (${t("mbc.clickToRemove")})`}
              >
                {item.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ObjectiveColumnProps {
  objective: MBCObjective;
  isExpanded: boolean;
  expandedBehaviors: Set<string>;
  onToggleObjective: () => void;
  onToggleBehavior: (id: string) => void;
  isSelected: (id: string) => boolean;
  onSelectBehavior: (b: MBCBehavior) => void;
  onSelectMethod: (methodId: string, methodName: string, behavior: MBCBehavior) => void;
  readOnly: boolean;
}

// Memoized ObjectiveColumn with custom comparison to prevent unnecessary re-renders
const ObjectiveColumn = memo(
  function ObjectiveColumn({
    objective,
    isExpanded,
    expandedBehaviors,
    onToggleObjective,
    onToggleBehavior,
    isSelected,
    onSelectBehavior,
    onSelectMethod,
    readOnly,
  }: ObjectiveColumnProps) {
    const selectedCount = objective.behaviors.filter(b => isSelected(b.id)).length;

    return (
      <div className="flex flex-col border border-border/50 rounded-sm overflow-hidden">
        <button
          onClick={onToggleObjective}
          className="flex items-center gap-2 bg-secondary/30 border-b border-border/50 px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left"
        >
          <h4 className="flex-1 text-sm font-bold text-primary tracking-wide font-terminal truncate" title={objective.objectiveName}>
            <a
              href={`https://github.com/MBCProject/mbc-markdown/blob/main/${objective.objectiveName.toLowerCase().replace(/\s+/g, '-')}/README.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent font-normal mr-1.5 hover:underline"
              title={`View ${objective.objectiveId} on GitHub`}
              onClick={(e) => e.stopPropagation()}
            >
              {objective.objectiveId}
            </a>
            {objective.objectiveName}
          </h4>
          {selectedCount > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono font-medium">
              {selectedCount}
            </span>
          )}
          <span className="text-xs text-muted-foreground font-mono">{objective.behaviors.length}</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-primary shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="bg-card/20 max-h-[320px] overflow-y-auto">
            {objective.behaviors.map(behavior => (
              <BehaviorRow
                key={behavior.id}
                behavior={behavior}
                isExpanded={expandedBehaviors.has(behavior.id)}
                isSelected={isSelected(behavior.id)}
                onToggleBehavior={onToggleBehavior}
                onSelectBehavior={onSelectBehavior}
                onSelectMethod={onSelectMethod}
                isMethodSelected={isSelected}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
  // Custom comparison function
  (prevProps, nextProps) => {
    // Quick checks first
    if (prevProps.isExpanded !== nextProps.isExpanded) return false;
    if (prevProps.readOnly !== nextProps.readOnly) return false;
    if (prevProps.objective.objectiveId !== nextProps.objective.objectiveId) return false;
    if (prevProps.objective.behaviors.length !== nextProps.objective.behaviors.length) return false;
    
    // Check expanded behaviors for this objective
    const prevBehaviorIds = prevProps.objective.behaviors.map(b => b.id);
    const prevExpanded = prevBehaviorIds.filter(id => prevProps.expandedBehaviors.has(id));
    const nextExpanded = prevBehaviorIds.filter(id => nextProps.expandedBehaviors.has(id));
    if (prevExpanded.length !== nextExpanded.length || 
        prevExpanded.some((id, i) => id !== nextExpanded[i])) {
      return false;
    }
    
    // Check if selection changed for any behavior in this objective
    for (const behavior of prevProps.objective.behaviors) {
      if (prevProps.isSelected(behavior.id) !== nextProps.isSelected(behavior.id)) {
        return false;
      }
      // Check methods too
      if (behavior.methods) {
        for (const method of behavior.methods) {
          if (prevProps.isSelected(method.id) !== nextProps.isSelected(method.id)) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
);

// Memoized BehaviorRow for even finer-grained updates
interface BehaviorRowProps {
  behavior: MBCBehavior;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleBehavior: (id: string) => void;
  onSelectBehavior: (b: MBCBehavior) => void;
  onSelectMethod: (methodId: string, methodName: string, behavior: MBCBehavior) => void;
  isMethodSelected: (id: string) => boolean;
  readOnly: boolean;
}

const BehaviorRow = memo(
  function BehaviorRow({
    behavior,
    isExpanded,
    isSelected,
    onToggleBehavior,
    onSelectBehavior,
    onSelectMethod,
    isMethodSelected,
    readOnly,
  }: BehaviorRowProps) {
    const hasMethods = behavior.methods && behavior.methods.length > 0;

    return (
      <div className="border-b border-border/20 last:border-b-0">
        <div className="flex items-center gap-1 py-1.5 px-2">
          <a
            href={behavior.pathToMd}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-accent hover:underline shrink-0"
            title={`View ${behavior.id} on GitHub`}
            onClick={(e) => e.stopPropagation()}
          >
            {behavior.id}
          </a>
          <button
            onClick={() => onSelectBehavior(behavior)}
            disabled={readOnly}
            className={cn(
              "flex-1 text-left text-sm font-mono transition-all truncate",
              isSelected ? "text-primary font-medium" : "text-foreground/70 hover:text-primary"
            )}
            title={`${behavior.id}: ${behavior.name}`}
          >
            {behavior.name}
          </button>
          {isSelected && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
          {behavior.attackMapping && (
            <a
              href={behavior.attackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-orange-400 hover:underline shrink-0"
              onClick={(e) => e.stopPropagation()}
              title="View on MITRE ATT&CK"
            >
              {behavior.attackMapping}
            </a>
          )}
          {hasMethods && (
            <button
              onClick={() => onToggleBehavior(behavior.id)}
              className="p-0.5 text-muted-foreground hover:text-primary shrink-0"
              title={`${behavior.methods!.length} methods`}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {hasMethods && isExpanded && (
          <div className="ml-6 border-l-2 border-border/40 bg-card/30 mb-1">
            {behavior.methods!.map(method => {
              const methodSelected = isMethodSelected(method.id);
              return (
                <div key={method.id} className="flex items-center gap-1 py-1 px-2">
                  <span className="text-sm font-mono text-accent/70 shrink-0">
                    {method.id}
                  </span>
                  <button
                    onClick={() => onSelectMethod(method.id, method.name, behavior)}
                    disabled={readOnly}
                    className={cn(
                      "flex-1 text-left text-sm font-mono transition-all truncate",
                      methodSelected ? "text-primary font-medium" : "text-foreground/60 hover:text-primary"
                    )}
                    title={`${method.id}: ${method.name}`}
                  >
                    {method.name}
                  </button>
                  {methodSelected && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.behavior.id === nextProps.behavior.id &&
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.readOnly === nextProps.readOnly &&
      // Check method selections
      (prevProps.behavior.methods || []).every(m => 
        prevProps.isMethodSelected(m.id) === nextProps.isMethodSelected(m.id)
      )
    );
  }
);


