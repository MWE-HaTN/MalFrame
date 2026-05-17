import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { ChevronRight, Search, X, Microscope, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { COUNT_BADGE_CLASS, SELECTED_COUNT_BADGE_CLASS, getMBCItemTypeClass } from "@/lib/semanticColors";
import { useMBCData } from "@/features/mre/hooks/useMBCData";
import type { MBCMicroObjective, MBCMicroBehavior } from "@/lib/mbc";
import { AnimatedCollapse } from "@/components/ui/skeleton";
import { useExpandedState } from "./shared";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { useLanguage } from "@/hooks/useLanguage";

interface SelectedMicroBehavior {
  id: string;
  name: string;
  objectiveId: string;
  objectiveName: string;
}

interface MicroBehaviorsSectionProps {
  selectedBehaviors: SelectedMicroBehavior[];
  onBehaviorsChange: (behaviors: SelectedMicroBehavior[]) => void;
  readOnly?: boolean;
}

export const MicroBehaviorsSection = memo(function MicroBehaviorsSection({ 
  selectedBehaviors, 
  onBehaviorsChange,
  readOnly = false 
}: MicroBehaviorsSectionProps) {
  const { t } = useLanguage();
  const { isExpanded, toggle } = useExpandedState(STORAGE_KEYS.CODE_ANALYSIS_MICRO);
  const { mbcData, isLoading, error } = useMBCData();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());
  const selectedBehaviorsRef = useRef(selectedBehaviors);
  selectedBehaviorsRef.current = selectedBehaviors;

  const selectedIds = useMemo(() => new Set(selectedBehaviors.map(b => b.id)), [selectedBehaviors]);

  const totalMicroBehaviors = useMemo(() => 
    mbcData?.microObjectives.reduce((sum, objective) => sum + objective.behaviors.length, 0) ?? 0,
  [mbcData]);

  const filteredObjectives = useMemo(() => {
    if (!mbcData) return [];
    if (!searchQuery) return mbcData.microObjectives;
    const query = searchQuery.toLowerCase();
    return mbcData.microObjectives.map(objective => ({
      ...objective,
      behaviors: objective.behaviors.filter(behavior => 
        behavior.id.toLowerCase().includes(query) ||
        behavior.name.toLowerCase().includes(query)
      )
    })).filter(objective => objective.behaviors.length > 0);
  }, [mbcData, searchQuery]);

  const filteredObjectivesRef = useRef(filteredObjectives);
  filteredObjectivesRef.current = filteredObjectives;

  useEffect(() => {
    if (searchQuery) {
      setExpandedObjectives(new Set(filteredObjectivesRef.current.map(o => o.objectiveId)));
    } else {
      setExpandedObjectives(new Set());
    }
  }, [searchQuery]);

  const toggleObjective = useCallback((objectiveId: string) => {
    setExpandedObjectives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(objectiveId)) newSet.delete(objectiveId);
      else newSet.add(objectiveId);
      return newSet;
    });
  }, []);

  const selectBehavior = useCallback((behaviorToToggle: MBCMicroBehavior, parentObjective: MBCMicroObjective) => {
    if (readOnly) return;
    const current = selectedBehaviorsRef.current;
    if (current.some(behavior => behavior.id === behaviorToToggle.id)) {
      onBehaviorsChange(current.filter(behavior => behavior.id !== behaviorToToggle.id));
    } else {
      onBehaviorsChange([...current, {
        id: behaviorToToggle.id,
        name: behaviorToToggle.name,
        objectiveId: parentObjective.objectiveId,
        objectiveName: parentObjective.objectiveName
      }]);
    }
  }, [readOnly, onBehaviorsChange]);

  const handleRemoveBehavior = useCallback((behaviorId: string) => {
    if (!readOnly) onBehaviorsChange(selectedBehaviorsRef.current.filter(behavior => behavior.id !== behaviorId));
  }, [readOnly, onBehaviorsChange]);

  const clearSearch = useCallback(() => setSearchQuery(""), []);

  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-primary/5 rounded-sm transition-colors py-2 px-3"
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }}}
        role="button"
        tabIndex={0}
      >
        <div className="flex-1 flex items-center gap-3 font-mono text-primary">
          <Microscope className="w-4 h-4" />
          <span className="text-sm font-medium uppercase tracking-widest">{t("code.microBehaviors")}</span>
          <span className={COUNT_BADGE_CLASS}>{totalMicroBehaviors}</span>
          {selectedBehaviors.length > 0 && (
            <span className={SELECTED_COUNT_BADGE_CLASS}>
              {selectedBehaviors.length} {t("code.microBehaviors.selected")}
            </span>
          )}
        </div>
        <ChevronRight className={cn("w-5 h-5 text-primary transition-transform duration-200", isExpanded && "rotate-90")} />
      </div>

      <AnimatedCollapse isOpen={isExpanded} className="ml-6 p-3 bg-background/30 border border-border/40 rounded-sm space-y-3">
        {error && !mbcData ? (
          <div className="flex items-center justify-center py-8 gap-3" role="alert">
            <span className="text-sm text-destructive font-mono">{t("mbc.loadError") || "Failed to load MBC data"}</span>
          </div>
        ) : isLoading || !mbcData ? (
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground font-mono">{t("code.microBehaviors.loading")}</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground font-mono text-left">
              {t("code.microBehaviors.description")}
            </p>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                id="micro-behaviors-search"
                name="micro-behaviors-search"
                type="text" 
                value={searchQuery} 
                onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)} 
                placeholder={t("code.microBehaviors.search")}
                aria-label={t("code.microBehaviors.search")}
                className="w-full pl-9 pr-9 py-2 text-sm font-mono bg-card border border-border rounded-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all" 
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
              {filteredObjectives.map(objectiveItem => (
                <MicroObjectiveColumn
                  key={objectiveItem.objectiveId}
                  objective={objectiveItem}
                  isExpanded={expandedObjectives.has(objectiveItem.objectiveId)}
                  onToggle={() => toggleObjective(objectiveItem.objectiveId)}
                  selectedIds={selectedIds}
                  onSelectBehavior={(behaviorItem) => selectBehavior(behaviorItem, objectiveItem)}
                  readOnly={readOnly}
                />
              ))}
            </div>

            {selectedBehaviors.length > 0 && (
              <div className="pt-3 border-t border-border/50">
                <p className="text-xs font-mono text-muted-foreground mb-2 text-left">
                  {t("code.microBehaviors.selectedCount")} ({selectedBehaviors.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBehaviors.map(item => (
                    <SelectedBehaviorBadge 
                      key={item.id} 
                      item={item} 
                      onRemove={handleRemoveBehavior} 
                      readOnly={readOnly} 
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </AnimatedCollapse>
    </div>
  );
});

// Memoized badge component
interface SelectedBehaviorBadgeProps {
  item: SelectedMicroBehavior;
  onRemove: (id: string) => void;
  readOnly: boolean;
}

const SelectedBehaviorBadge = memo(function SelectedBehaviorBadge({ 
  item, 
  onRemove, 
  readOnly 
}: SelectedBehaviorBadgeProps) {
  return (
    <button 
      onClick={() => onRemove(item.id)} 
      disabled={readOnly}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-mono",
        getMBCItemTypeClass('micro'),
        "hover:opacity-80 transition-all", 
        readOnly && "cursor-default"
      )}
      title={`${item.id}: ${item.name} (Click to remove)`}
    >
      {item.id}
    </button>
  );
});

// Memoized objective column
interface MicroObjectiveColumnProps {
  objective: MBCMicroObjective;
  isExpanded: boolean;
  onToggle: () => void;
  selectedIds: Set<string>;
  onSelectBehavior: (b: MBCMicroBehavior) => void;
  readOnly: boolean;
}

const MicroObjectiveColumn = memo(function MicroObjectiveColumn({
  objective,
  isExpanded,
  onToggle,
  selectedIds,
  onSelectBehavior,
  readOnly
}: MicroObjectiveColumnProps) {
  const selectedCount = useMemo(() =>
    objective.behaviors.filter(behavior => selectedIds.has(behavior.id)).length,
  [objective.behaviors, selectedIds]);

  return (
    <div className="flex flex-col border border-border/50 rounded-sm overflow-hidden">
      <button 
        onClick={onToggle} 
        className="flex items-center gap-2 bg-secondary/30 border-b border-border/50 px-2 py-2 hover:bg-secondary/50 transition-colors text-left"
      >
        <h4 className="flex-1 text-sm font-bold text-primary tracking-wide font-terminal truncate" title={objective.objectiveName}>
          <a
            href={`https://github.com/MBCProject/mbc-markdown/blob/main/micro-behaviors/${objective.objectiveName.toLowerCase().replace(/\s+/g, '-')}/README.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent font-normal mr-1 hover:underline"
            title={`View ${objective.objectiveId} on GitHub`}
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            {objective.objectiveId}
          </a>
          {objective.objectiveName}
        </h4>
        {selectedCount > 0 && (
          <span className="text-xs bg-primary/20 text-primary px-1 py-0.5 rounded font-mono text-[10px]">
            {selectedCount}
          </span>
        )}
        <span className="text-xs text-muted-foreground font-mono">{objective.behaviors.length}</span>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-primary shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
        )}
      </button>
      
      {isExpanded && (
        <VirtualizedBehaviorList
          behaviors={objective.behaviors}
          selectedIds={selectedIds}
          onSelectBehavior={onSelectBehavior}
          readOnly={readOnly}
        />
      )}
    </div>
  );
});

// Virtualized behavior list - only renders visible items
interface VirtualizedBehaviorListProps {
  behaviors: MBCMicroBehavior[];
  selectedIds: Set<string>;
  onSelectBehavior: (b: MBCMicroBehavior) => void;
  readOnly: boolean;
}

const ITEM_HEIGHT = 32;
const MAX_VISIBLE_HEIGHT = 250;

const VirtualizedBehaviorList = memo(function VirtualizedBehaviorList({
  behaviors,
  selectedIds,
  onSelectBehavior,
  readOnly
}: VirtualizedBehaviorListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const containerHeight = Math.min(MAX_VISIBLE_HEIGHT, behaviors.length * ITEM_HEIGHT);
  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 1);
  const endIndex = Math.min(behaviors.length, startIndex + visibleCount);
  
  const handleScroll = useCallback((scrollEvent: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(scrollEvent.currentTarget.scrollTop);
  }, []);

  // Use simple rendering for small lists
  if (behaviors.length <= 15) {
    return (
      <div className="bg-card/20 max-h-[250px] overflow-y-auto">
        {behaviors.map(behaviorItem => (
          <BehaviorRow 
            key={behaviorItem.id} 
            behavior={behaviorItem} 
            isSelected={selectedIds.has(behaviorItem.id)} 
            onSelect={() => onSelectBehavior(behaviorItem)} 
            readOnly={readOnly} 
          />
        ))}
      </div>
    );
  }

  // Virtualized rendering for large lists
  return (
    <div 
      className="bg-card/20 overflow-y-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: behaviors.length * ITEM_HEIGHT, position: 'relative' }}>
        {behaviors.slice(startIndex, endIndex).map((behaviorItem, virtualIndex) => (
          <div 
            key={behaviorItem.id}
            style={{ 
              position: 'absolute', 
              top: (startIndex + virtualIndex) * ITEM_HEIGHT, 
              left: 0, 
              right: 0,
              height: ITEM_HEIGHT 
            }}
          >
            <BehaviorRow 
              behavior={behaviorItem} 
              isSelected={selectedIds.has(behaviorItem.id)} 
              onSelect={() => onSelectBehavior(behaviorItem)} 
              readOnly={readOnly} 
            />
          </div>
        ))}
      </div>
    </div>
  );
});

// Memoized behavior row
interface BehaviorRowProps {
  behavior: MBCMicroBehavior;
  isSelected: boolean;
  onSelect: () => void;
  readOnly: boolean;
}

const BehaviorRow = memo(function BehaviorRow({ 
  behavior, 
  isSelected, 
  onSelect, 
  readOnly 
}: BehaviorRowProps) {
  return (
    <div className="flex items-center gap-1 py-1.5 px-2 border-b border-border/20 last:border-b-0 h-[32px]">
      <a 
        href={behavior.pathToMd} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-sm font-mono text-accent hover:underline shrink-0" 
        title={`View ${behavior.id} on GitHub`}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {behavior.id}
      </a>
      <button 
        onClick={onSelect} 
        disabled={readOnly} 
        className={cn(
          "flex-1 text-left text-sm font-mono transition-all truncate", 
          isSelected ? "text-accent font-medium" : "text-foreground/70 hover:text-accent"
        )} 
        title={`${behavior.id}: ${behavior.name}`}
      >
        {behavior.name}
      </button>
      {isSelected && <span className="w-2 h-2 rounded-full bg-accent shrink-0" />}
    </div>
  );
});

