import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { COUNT_BADGE_CLASS } from "@/lib/semanticColors";

// ============================================
// Hooks for managing expanded sections state
// ============================================

/**
 * Hook for managing multiple expandable sections with localStorage persistence
 */
export function useExpandedSections(storageKey: string) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          const result: Record<string, boolean> = {};
          for (const key of Object.keys(parsed)) {
            if (typeof parsed[key] === 'boolean') {
              result[key] = parsed[key];
            }
          }
          return result;
        }
      }
      return {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(expandedSections));
  }, [storageKey, expandedSections]);

  const toggle = useCallback((section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const expand = useCallback((section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: true }));
  }, []);

  const collapse = useCallback((section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: false }));
  }, []);

  const isExpanded = useCallback((section: string) => {
    return !!expandedSections[section];
  }, [expandedSections]);

  return {
    expandedSections,
    toggle,
    expand,
    collapse,
    isExpanded
  };
}

/**
 * Hook for managing a single expandable section with localStorage persistence
 */
export function useExpandedState(storageKey: string, defaultValue = false) {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isExpanded));
  }, [storageKey, isExpanded]);

  const toggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    setIsExpanded
  };
}

// ============================================
// Hook for managing CRUD operations on lists
// ============================================

export interface ListItem {
  id: string;
}

export interface UseListManagerOptions<T extends ListItem> {
  createEmpty: () => T;
  onExpand?: () => void;
}

/**
 * Hook for managing CRUD operations on entry lists
 * Provides add, update, remove operations with consistent patterns
 */
export function useListManager<T extends ListItem>(
  items: T[],
  onChange: (items: T[]) => void,
  options: UseListManagerOptions<T>
) {
  const { createEmpty, onExpand } = options;

  const add = useCallback(() => {
    const newItem = createEmpty();
    onChange([...items, newItem]);
    onExpand?.();
    return newItem;
  }, [items, onChange, createEmpty, onExpand]);

  const update = useCallback((id: string, updates: Partial<T>) => {
    onChange(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, [items, onChange]);

  const remove = useCallback((id: string) => {
    onChange(items.filter(item => item.id !== id));
  }, [items, onChange]);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    const result = [...items];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    onChange(result);
  }, [items, onChange]);

  return {
    items,
    count: items.length,
    isEmpty: items.length === 0,
    add,
    update,
    remove,
    reorder
  };
}

// ============================================
// SubSection Header Component
// ============================================

export interface SubSectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  count?: number;
  onAdd?: () => void;
}

export function SubSectionHeader({ 
  title, 
  icon, 
  isExpanded, 
  onToggle, 
  count, 
  onAdd 
}: SubSectionHeaderProps) {
  const handleAdd = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Auto-expand if collapsed
    if (!isExpanded) {
      onToggle();
    }
    onAdd?.();
  };

  return (
    <button 
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between rounded-sm py-2 px-3",
        "transition-all duration-200 ease-out",
        "hover:bg-primary/5 active:bg-primary/10",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      )}
    >
      {/* Header content */}
      <div className="flex-1 flex items-center gap-3 font-mono text-primary">
        <span className={cn(
          "text-primary transition-transform duration-200",
          isExpanded && "scale-110"
        )}>{icon}</span>
        <span className="text-sm font-medium uppercase tracking-widest">{title}</span>
        {count !== undefined && count > 0 && (
          <span className={cn(COUNT_BADGE_CLASS, "transition-all duration-200 animate-scale-in")}>
            {count}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {onAdd && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleAdd}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(e); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-primary",
              "border border-primary/30 rounded-sm uppercase tracking-wider",
              "transition-all duration-200 ease-out",
              "hover:bg-primary/10 hover:border-primary/50 hover:scale-105",
              "active:scale-95"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </span>
        )}
        <ChevronRight className={cn(
          "w-5 h-5 text-primary transition-all duration-200 ease-out",
          isExpanded && "rotate-90"
        )} />
      </div>
    </button>
  );
}
