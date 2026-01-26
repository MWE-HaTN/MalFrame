import { useState, useEffect, useRef, memo, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { SectionSkeleton } from "@/components/ui/section-skeleton";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  storageKey?: string;
  forceClose?: number; // increment to force close
  headerAction?: React.ReactNode; // optional action button in header
  /** Enable lazy rendering - only render content when section is visible + open */
  lazy?: boolean;
  /** Skeleton variant when lazy loading */
  skeletonVariant?: "default" | "form" | "table" | "list";
  /** Number of skeleton rows */
  skeletonRows?: number;
  /** Prefetch function to call on header hover */
  onPrefetch?: () => void;
}

// Get section states from localStorage
function getSectionStates(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SECTION_STATES);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate structure - ensure it's an object with boolean values
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
}

// Mark that user has visited and interacted
function markVisited() {
  localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, "true");
}

// Save section state to localStorage
function saveSectionState(key: string, isOpen: boolean) {
  const states = getSectionStates();
  states[key] = isOpen;
  localStorage.setItem(STORAGE_KEYS.SECTION_STATES, JSON.stringify(states));
}

// Clear all section states (reset to first visit behavior)
// IMPORTANT: Does NOT clear MITRE cache - that persists across data clears
export function clearAllSectionStates() {
  // Clear section states only - MITRE cache is preserved automatically since we only remove specific keys
  localStorage.removeItem(STORAGE_KEYS.SECTION_STATES);
  localStorage.removeItem(STORAGE_KEYS.FIRST_VISIT);
}

// Memoized component to prevent unnecessary re-renders
export const CollapsibleSection = memo(function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  className,
  storageKey,
  forceClose = 0,
  headerAction,
  lazy = false,
  skeletonVariant = "form",
  skeletonRows = 3,
  onPrefetch,
}: CollapsibleSectionProps) {
  const key = storageKey || title;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(!lazy);
  const [hasEverOpened, setHasEverOpened] = useState(false);
  
  const [isOpen, setIsOpen] = useState(() => {
    if (storageKey) {
      const states = getSectionStates();
      // If this section has a saved state, use it (user explicitly toggled)
      if (key in states) {
        return states[key];
      }
    }
    // On first visit, only open sections with defaultOpen=true (typically background sections)
    // This provides good UX - analysts see the starting sections immediately
    return defaultOpen;
  });

  // Track if section has ever been opened (for deferred rendering)
  useEffect(() => {
    if (isOpen && !hasEverOpened) {
      setHasEverOpened(true);
    }
  }, [isOpen, hasEverOpened]);

  // Lazy loading: observe when section enters viewport
  useEffect(() => {
    if (!lazy || hasBeenVisible) return;
    
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasBeenVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px", threshold: 0 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [lazy, hasBeenVisible]);

  // Handle force close
  useEffect(() => {
    if (forceClose > 0) {
      setIsOpen(false);
    }
  }, [forceClose]);

  // Save state when it changes - memoized to prevent re-renders
  const handleToggle = useCallback(() => {
    const newState = !isOpen;
    setIsOpen(newState);
    markVisited(); // Mark that user has interacted
    if (storageKey) {
      saveSectionState(key, newState);
    }
  }, [isOpen, storageKey, key]);

  // Determine if we should render children
  // Render if: (not lazy OR hasBeenVisible) AND (isOpen OR hasEverOpened)
  const shouldRenderContent = (!lazy || hasBeenVisible) && (isOpen || hasEverOpened);
  const showSkeleton = lazy && !hasBeenVisible && isOpen;

  // Handle prefetch on hover - memoized
  const handleMouseEnter = useCallback(() => {
    if (onPrefetch && !isOpen) {
      onPrefetch();
    }
  }, [onPrefetch, isOpen]);

  return (
    <div ref={sectionRef} className={cn("section-collapsible", className)}>
      <button
        type="button"
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        className="section-header-cyber w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="icon">{icon}</span>
          <span className="text-primary">&gt;</span>
          <span className="title uppercase tracking-widest text-left">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {headerAction && (
            <div onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </div>
          )}
          <ChevronDown
            className={cn(
              "chevron transition-transform duration-200 ease-out",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>
      
      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className={cn(
            "p-4 space-y-4 transition-transform duration-200 ease-out",
            isOpen ? "translate-y-0" : "-translate-y-1"
          )}>
            {showSkeleton ? (
              <SectionSkeleton variant={skeletonVariant} rows={skeletonRows} />
            ) : shouldRenderContent ? (
              children
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});
