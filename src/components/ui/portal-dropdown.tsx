import { useState, useRef, useEffect, useCallback, ReactNode, useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface PortalDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  label?: ReactNode;
  renderTrigger?: (props: {
    selectedLabel: string;
    isOpen: boolean;
    value: string;
  }) => ReactNode;
  renderOption?: (option: DropdownOption, isSelected: boolean) => ReactNode;
  className?: string;
  menuClassName?: string;
  maxHeight?: number;
  disabled?: boolean;
  id?: string;
  name?: string;
}

const OPTION_HEIGHT = 44;
const VIRTUAL_THRESHOLD = 20;

export function PortalDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
  renderTrigger,
  renderOption,
  className,
  menuClassName,
  maxHeight = 256,
  disabled = false,
  id: externalId,
  name: externalName,
}: PortalDropdownProps) {
  const generatedId = useId();
  const dropdownId = externalId || `dropdown-${generatedId}`;
  const listboxId = `${dropdownId}-listbox`;
  const dropdownName = externalName || dropdownId;
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [flipUp, setFlipUp] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  // Track if focus change came from keyboard (for scrollIntoView)
  const isKeyboardNavRef = useRef(false);
  // Type-to-search buffer and timer
  const typeBufferRef = useRef("");
  const typeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Cleanup type timeout on unmount
  useEffect(() => {
    return () => {
      if (typeTimeoutRef.current) {
        clearTimeout(typeTimeoutRef.current);
      }
    };
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const selectedLabel = selectedOption?.label || placeholder;
  const selectedIndex = options.findIndex((o) => o.value === value);

  // Determine if we should use virtual scrolling
  const useVirtual = options.length > VIRTUAL_THRESHOLD;

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => OPTION_HEIGHT,
    overscan: 5,
    enabled: useVirtual && isOpen,
  });

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuHeight = Math.min(maxHeight, options.length * OPTION_HEIGHT + 8);

    const shouldFlipUp = spaceBelow < menuHeight && spaceAbove > menuHeight;
    setFlipUp(shouldFlipUp);

    setPosition({
      top: shouldFlipUp ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, [maxHeight, options.length]);

  // Handle global events when dropdown is open (positioning, outside click, and focus-follows-open)
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
      isKeyboardNavRef.current = false;
      return;
    }

    updatePosition();
    // Respect keyboard nav intent: if ArrowUp/End already set focusedIndex, don't override
    const defaultIndex = selectedIndex >= 0 ? selectedIndex : 0;
    if (!isKeyboardNavRef.current) {
      setFocusedIndex(defaultIndex);
    }
    const targetIndex = isKeyboardNavRef.current ? focusedIndex : defaultIndex;

    // Focus-follows-open: reliably focus the initial option (works with virtual lists too)
    const focusInitialOption = () => {
      const el = optionRefs.current[targetIndex];
      if (el) {
        el.focus();
        return true;
      }
      return false;
    };

    // Ensure the initial option is rendered (virtual) then focus it (retry a few frames)
    if (useVirtual) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(targetIndex, { align: "center" });
      });
    }

    let rafId = 0;
    let tries = 0;
    const tryFocus = () => {
      tries += 1;
      if (focusInitialOption()) return;
      if (tries < 12) rafId = requestAnimationFrame(tryFocus);
    };
    rafId = requestAnimationFrame(tryFocus);

    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideButton = buttonRef.current?.contains(target);
      const isInsideMenu = menuRef.current?.contains(target);
      if (!isInsideButton && !isInsideMenu) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- focusedIndex intentionally excluded: effect should not re-run on keyboard nav
  }, [isOpen, updatePosition, selectedIndex, useVirtual, virtualizer]);

  // Type-to-search: find option starting with typed characters
  const findOptionByPrefix = useCallback((prefix: string): number => {
    const lowerPrefix = prefix.toLowerCase();
    const startIndex = focusedIndex >= 0 ? focusedIndex : 0;
    
    // Search from current position to end
    for (let i = startIndex; i < options.length; i++) {
      if (options[i].label.toLowerCase().startsWith(lowerPrefix)) {
        return i;
      }
    }
    // Wrap around from beginning
    for (let i = 0; i < startIndex; i++) {
      if (options[i].label.toLowerCase().startsWith(lowerPrefix)) {
        return i;
      }
    }
    return -1;
  }, [options, focusedIndex]);

  // Page size for PageUp/PageDown (visible items count)
  const pageSize = Math.floor(maxHeight / OPTION_HEIGHT);

  // Document-level keyboard handler is now minimal since focus-follows-open moves focus to options
  // This handler only catches events when focus is on trigger while menu is open (edge case)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if focus is still on the trigger button (not on options)
      if (document.activeElement !== buttonRef.current) return;
      
      // Handle type-to-search for printable characters
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        
        if (typeTimeoutRef.current) {
          clearTimeout(typeTimeoutRef.current);
        }
        
        typeBufferRef.current += event.key;
        const matchIndex = findOptionByPrefix(typeBufferRef.current);
        if (matchIndex >= 0) {
          isKeyboardNavRef.current = true;
          setFocusedIndex(matchIndex);
          optionRefs.current[matchIndex]?.focus();
        }
        
        typeTimeoutRef.current = setTimeout(() => {
          typeBufferRef.current = "";
        }, 500);
        
        return;
      }

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case "ArrowDown":
          event.preventDefault();
          isKeyboardNavRef.current = true;
          setFocusedIndex((prev) => {
            const next = (prev + 1) % options.length;
            requestAnimationFrame(() => optionRefs.current[next]?.focus());
            return next;
          });
          break;
        case "ArrowUp":
          event.preventDefault();
          isKeyboardNavRef.current = true;
          setFocusedIndex((prev) => {
            const next = (prev - 1 + options.length) % options.length;
            requestAnimationFrame(() => optionRefs.current[next]?.focus());
            return next;
          });
          break;
        case "PageDown":
          event.preventDefault();
          isKeyboardNavRef.current = true;
          setFocusedIndex((prev) => {
            const next = Math.min(prev + pageSize, options.length - 1);
            requestAnimationFrame(() => optionRefs.current[next]?.focus());
            return next;
          });
          break;
        case "PageUp":
          event.preventDefault();
          isKeyboardNavRef.current = true;
          setFocusedIndex((prev) => {
            const next = Math.max(prev - pageSize, 0);
            requestAnimationFrame(() => optionRefs.current[next]?.focus());
            return next;
          });
          break;
        case "Home":
          event.preventDefault();
          isKeyboardNavRef.current = true;
          setFocusedIndex(0);
          requestAnimationFrame(() => optionRefs.current[0]?.focus());
          break;
        case "End":
          event.preventDefault();
          isKeyboardNavRef.current = true;
          setFocusedIndex(options.length - 1);
          requestAnimationFrame(() => optionRefs.current[options.length - 1]?.focus());
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            onChange(options[focusedIndex].value);
            setIsOpen(false);
            buttonRef.current?.focus();
          }
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (typeTimeoutRef.current) {
        clearTimeout(typeTimeoutRef.current);
      }
    };
  }, [isOpen, options, onChange, findOptionByPrefix, pageSize, focusedIndex]);

  const handleOpen = () => {
    if (disabled) return;
    if (!isOpen) updatePosition();
    setIsOpen((v) => !v);
  };

  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  }, [onChange]);

  const handleKeyDownTrigger = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        // If dropdown is already open, let the option key handler drive navigation.
        if (isOpen) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        isKeyboardNavRef.current = true;
        updatePosition();
        setIsOpen(true);

        // Set initial focus based on key
        if (event.key === "ArrowUp") {
          setFocusedIndex(options.length - 1);
        } else {
          setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        }
        break;

      case "Enter":
      case " ":
        event.preventDefault();

        // Closed → open
        if (!isOpen) {
          isKeyboardNavRef.current = true;
          updatePosition();
          setIsOpen(true);
          setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        }
        break;

      case "Home":
        event.preventDefault();
        if (!isOpen) {
          updatePosition();
          setIsOpen(true);
        }
        setFocusedIndex(0);
        break;
      case "End":
        event.preventDefault();
        if (!isOpen) {
          updatePosition();
          setIsOpen(true);
        }
        setFocusedIndex(options.length - 1);
        break;
    }
  };

  // Handle mouse enter - don't trigger scroll
  const handleMouseEnter = useCallback((index: number) => {
    isKeyboardNavRef.current = false;
    setFocusedIndex(index);
  }, []);

  // Handle keyboard on option (for focus-follows-open pattern)
  const handleOptionKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    // Handle type-to-search for printable characters
    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      
      if (typeTimeoutRef.current) {
        clearTimeout(typeTimeoutRef.current);
      }
      
      typeBufferRef.current += event.key;
      const matchIndex = findOptionByPrefix(typeBufferRef.current);
      if (matchIndex >= 0) {
        isKeyboardNavRef.current = true;
        setFocusedIndex(matchIndex);
        optionRefs.current[matchIndex]?.focus();
      }
      
      typeTimeoutRef.current = setTimeout(() => {
        typeBufferRef.current = "";
      }, 500);
      
      return;
    }

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        handleSelect(options[index].value);
        break;
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case "ArrowDown":
        event.preventDefault();
        isKeyboardNavRef.current = true;
        setFocusedIndex((prev) => {
          const next = (prev + 1) % options.length;
          requestAnimationFrame(() => optionRefs.current[next]?.focus());
          return next;
        });
        break;
      case "ArrowUp":
        event.preventDefault();
        isKeyboardNavRef.current = true;
        setFocusedIndex((prev) => {
          const next = (prev - 1 + options.length) % options.length;
          requestAnimationFrame(() => optionRefs.current[next]?.focus());
          return next;
        });
        break;
      case "PageDown":
        event.preventDefault();
        isKeyboardNavRef.current = true;
        setFocusedIndex((prev) => {
          const next = Math.min(prev + pageSize, options.length - 1);
          requestAnimationFrame(() => optionRefs.current[next]?.focus());
          return next;
        });
        break;
      case "PageUp":
        event.preventDefault();
        isKeyboardNavRef.current = true;
        setFocusedIndex((prev) => {
          const next = Math.max(prev - pageSize, 0);
          requestAnimationFrame(() => optionRefs.current[next]?.focus());
          return next;
        });
        break;
      case "Home":
        event.preventDefault();
        isKeyboardNavRef.current = true;
        setFocusedIndex(0);
        requestAnimationFrame(() => optionRefs.current[0]?.focus());
        break;
      case "End":
        event.preventDefault();
        isKeyboardNavRef.current = true;
        setFocusedIndex(options.length - 1);
        requestAnimationFrame(() => optionRefs.current[options.length - 1]?.focus());
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  }, [options, handleSelect, findOptionByPrefix, pageSize]);

  // Scroll focused option into view - ONLY for keyboard navigation with smooth behavior
  useEffect(() => {
    if (!isOpen || focusedIndex < 0 || !isKeyboardNavRef.current) return;

    if (useVirtual) {
      // For virtual list, use virtualizer's scrollToIndex
      virtualizer.scrollToIndex(focusedIndex, { align: "auto", behavior: "smooth" });
    } else {
      // For regular list, use scrollIntoView with smooth scroll
      optionRefs.current[focusedIndex]?.scrollIntoView({ 
        block: "nearest", 
        behavior: "smooth" 
      });
    }
  }, [isOpen, focusedIndex, useVirtual, virtualizer]);

  // Scroll to selected item when opening (with virtual)
  useEffect(() => {
    if (isOpen && useVirtual && selectedIndex >= 0) {
      // Small delay to ensure virtualizer is ready
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(selectedIndex, { align: "center" });
      });
    }
  }, [isOpen, useVirtual, selectedIndex, virtualizer]);

  const renderOptionButton = useCallback((option: DropdownOption, index: number, style?: React.CSSProperties) => {
    const isSelected = value === option.value;
    const isFocused = focusedIndex === index;
    const optionId = `${dropdownId}-option-${index}`;

    if (renderOption) {
      return (
        <button
          key={option.value}
          ref={(el) => { optionRefs.current[index] = el; }}
          type="button"
          role="option"
          id={optionId}
          tabIndex={isFocused ? 0 : -1}
          aria-selected={isSelected}
          onClick={() => handleSelect(option.value)}
          onMouseEnter={() => handleMouseEnter(index)}
          onKeyDown={(e) => handleOptionKeyDown(e, index)}
          className={cn(
            "w-full transition-all duration-100 outline-none",
            "focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-primary/15",
            isFocused && "ring-2 ring-inset ring-primary bg-primary/15 shadow-sm"
          )}
          style={{ ...style, contain: "layout style paint" }}
        >
          {renderOption(option, isSelected)}
        </button>
      );
    }

    return (
      <button
        key={option.value}
        ref={(el) => { optionRefs.current[index] = el; }}
        type="button"
        role="option"
        id={optionId}
        tabIndex={isFocused ? 0 : -1}
        aria-selected={isSelected}
        onClick={() => handleSelect(option.value)}
        onMouseEnter={() => handleMouseEnter(index)}
        onKeyDown={(e) => handleOptionKeyDown(e, index)}
        className={cn(
          "w-full px-4 py-2.5 text-left text-sm font-mono outline-none",
          "flex items-center gap-2",
          "transition-all duration-100",
          "hover:bg-primary/10 hover:text-primary",
          "focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-primary/15",
          isSelected ? "bg-primary/20 text-primary" : "text-foreground",
          isFocused && "bg-primary/15 text-primary ring-2 ring-inset ring-primary shadow-sm"
        )}
        style={{ ...style, contain: "layout style paint" }}
      >
        {option.icon}
        {option.label}
      </button>
    );
  }, [value, focusedIndex, dropdownId, renderOption, handleMouseEnter, handleSelect, handleOptionKeyDown]);

  const menuContent = useMemo(() => {
    if (useVirtual) {
      return (
        <div
          ref={scrollContainerRef}
          style={{
            height: Math.min(maxHeight, options.length * OPTION_HEIGHT),
            overflow: "auto",
            willChange: "scroll-position",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const option = options[virtualRow.index];
              if (!option) return null;
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {renderOptionButton(option, virtualRow.index)}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return options.map((option, index) => renderOptionButton(option, index));
  }, [useVirtual, options, maxHeight, virtualizer, renderOptionButton]);

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {label && (
        <label className="label-cyber flex items-center gap-2 text-left">
          {label}
        </label>
      )}

      <div className="relative w-full">
        {renderTrigger ? (
          <button
            ref={buttonRef}
            type="button"
            id={dropdownId}
            name={dropdownName}
            onClick={handleOpen}
            onKeyDown={handleKeyDownTrigger}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={isOpen && focusedIndex >= 0 ? `${dropdownId}-option-${focusedIndex}` : undefined}
            aria-label={placeholder}
            className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 rounded-sm"
          >
            {renderTrigger({ selectedLabel, isOpen, value })}
          </button>
        ) : (
          <button
            ref={buttonRef}
            type="button"
            id={dropdownId}
            name={dropdownName}
            onClick={handleOpen}
            onKeyDown={handleKeyDownTrigger}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={isOpen && focusedIndex >= 0 ? `${dropdownId}-option-${focusedIndex}` : undefined}
            aria-label={placeholder}
            className={cn(
              "w-full h-[46px] flex items-center justify-between",
              "bg-input border border-primary/50 rounded-sm px-4",
              "text-sm font-mono transition-all duration-200",
              "hover:border-primary hover:bg-primary/5",
              "focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none",
              isOpen && "border-primary ring-1 ring-primary/30 bg-primary/5",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className={cn("font-mono", value ? "text-foreground" : "text-muted-foreground")}>
              {selectedLabel}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-primary transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        )}

        {isOpen &&
          createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={dropdownId}
              className={cn(
                "fixed bg-background border border-primary/50 rounded-sm",
                "shadow-lg shadow-primary/20 overflow-hidden",
                "animate-scale-in",
                flipUp && "origin-bottom",
                !flipUp && "origin-top",
                menuClassName
              )}
              style={{
                top: flipUp ? "auto" : position.top,
                bottom: flipUp ? window.innerHeight - position.top : "auto",
                left: position.left,
                width: position.width,
                maxHeight: useVirtual ? undefined : maxHeight,
                zIndex: 9999,
                overflowY: useVirtual ? "hidden" : "auto",
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
              }}
            >
              {menuContent}
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
