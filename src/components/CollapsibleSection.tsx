import { useState, useEffect, useRef, memo, useCallback } from "react";
import { ChevronDown, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { SectionSkeleton } from "@/components/ui/section-skeleton";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useLanguage } from "@/hooks/useLanguage";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactElement;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  storageKey?: string;
  forceClose?: number; // increment to force close
  headerAction?: React.ReactNode; // optional action button in header
  /** Inline guidance text for analysts — shown/hidden via ℹ button, state persisted */
  hint?: string;
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

// Get hint states from localStorage
function getHintStates(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HINT_STATES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const result: Record<string, boolean> = {};
        for (const key of Object.keys(parsed)) {
          if (typeof parsed[key] === 'boolean') result[key] = parsed[key];
        }
        return result;
      }
    }
    return {};
  } catch {
    return {};
  }
}

function saveHintState(key: string, isOpen: boolean) {
  const states = getHintStates();
  states[key] = isOpen;
  localStorage.setItem(STORAGE_KEYS.HINT_STATES, JSON.stringify(states));
}


// Custom comparator: shallow-compare all props except `icon` and `children`,
// which are typically new JSX element references on every parent render and
// would otherwise defeat the memo.
function areSectionPropsEqual(
  prev: CollapsibleSectionProps,
  next: CollapsibleSectionProps
): boolean {
  const keys = Object.keys(next) as (keyof CollapsibleSectionProps)[];
  for (const key of keys) {
    if (key === "icon" || key === "children") continue;
    if (prev[key] !== next[key]) return false;
  }
  return true;
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
  hint,
  lazy = false,
  skeletonVariant = "form",
  skeletonRows = 3,
  onPrefetch,
}: CollapsibleSectionProps) {
  const { t } = useLanguage();
  const key = storageKey || title;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(!lazy);
  const [hasEverOpened, setHasEverOpened] = useState(false);

  // Hint: default hidden — user opens on demand, state persists
  const [hintOpen, setHintOpen] = useState(() => {
    if (!hint) return false;
    const states = getHintStates();
    const hintKey = `hint-${key}`;
    return hintKey in states ? states[hintKey] : false;
  });

  const toggleHint = useCallback(() => {
    setHintOpen(prev => {
      const next = !prev;
      saveHintState(`hint-${key}`, next);
      return next;
    });
  }, [key]);

  const handleHintToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleHint();
  }, [toggleHint]);
  
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

  // Handle force close — only react to increments, not initial mount
  const prevForceCloseRef = useRef(forceClose);
  useEffect(() => {
    if (forceClose > prevForceCloseRef.current) {
      setIsOpen(false);
    }
    prevForceCloseRef.current = forceClose;
  }, [forceClose]);

  // Save state when it changes - memoized to prevent re-renders
  const handleToggle = useCallback(() => {
    setIsOpen(prev => {
      const next = !prev;
      if (storageKey) {
        saveSectionState(key, next);
      }
      return next;
    });
    markVisited();
  }, [storageKey, key]);

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
    <div ref={sectionRef} className={cn("section-collapsible", className)} data-section-key={key}>
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
          {hint && (
            <div
              onClick={handleHintToggle}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggleHint(); } }}
              role="button"
              tabIndex={0}
              aria-label={t("common.toggleGuidance")}
              className={cn(
                "p-1 rounded transition-colors duration-150",
                hintOpen
                  ? "text-primary/80 hover:text-primary"
                  : "text-muted-foreground/40 hover:text-muted-foreground"
              )}
            >
              <Info className="w-3.5 h-3.5" />
            </div>
          )}
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
            {hint && hintOpen && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 mb-2 rounded border border-primary/20 bg-primary/5 text-xs text-muted-foreground font-mono leading-relaxed">
                <Info className="w-3.5 h-3.5 text-primary/60 mt-0.5 shrink-0" />
                <span className="flex-1">{hint}</span>
                <button
                  onClick={handleHintToggle}
                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0 mt-0.5"
                  aria-label={t("common.dismissGuidance")}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {showSkeleton ? (
              <SectionSkeleton variant={skeletonVariant} rows={skeletonRows} />
            ) : shouldRenderContent ? (
              <SectionErrorBoundary>
                {children}
              </SectionErrorBoundary>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}, areSectionPropsEqual);
