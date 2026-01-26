import { useState, useRef, useEffect, useCallback, ReactNode, ClipboardEvent, useId } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, ChevronDown, ChevronRight, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatedCollapse } from "@/components/ui/skeleton";
import { ImageGrid } from "@/components/ui/image-grid";

// Input styles - fixed height h-[46px] to match dropdowns
export const inputStyles = cn(
  "w-full h-[46px] bg-background/50 border border-border/60 rounded-md px-3",
  "text-sm font-mono text-foreground placeholder:text-muted-foreground/50",
  "transition-all duration-200",
  "hover:border-primary/40 hover:bg-background/70",
  "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background outline-none"
);

// Textarea styles - min-height matches input height
export const textareaBaseStyles = cn(
  "w-full min-h-[46px] bg-background/50 border border-border/60 rounded-md px-3 py-3",
  "text-sm font-mono text-foreground placeholder:text-muted-foreground/50",
  "resize-none transition-all duration-200",
  "hover:border-primary/40 hover:bg-background/70",
  "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background outline-none"
);

// ============================================
// ActionIcon - Standardized action button component
// Used for delete, add image, and other action icons
// ============================================

type ActionIconVariant = "delete" | "default";

interface ActionIconProps {
  icon: ReactNode;
  onClick: () => void;
  title: string;
  variant?: ActionIconVariant;
  className?: string;
  showOnHover?: boolean;
}

const actionIconBaseStyles = cn(
  "p-1.5 rounded-sm flex items-center justify-center",
  "transition-all duration-200 ease-out",
  "hover:scale-110 active:scale-95"
);

const actionIconVariants: Record<ActionIconVariant, string> = {
  default: "text-muted-foreground hover:text-primary hover:bg-primary/10",
  delete: "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
};

export function ActionIcon({
  icon,
  onClick,
  title,
  variant = "default",
  className,
  showOnHover = false,
}: ActionIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        actionIconBaseStyles,
        actionIconVariants[variant],
        showOnHover && "opacity-0 group-hover:opacity-100",
        className
      )}
    >
      {icon}
    </button>
  );
}

// Tag List Component with auto-flip
interface TagListProps {
  tags: string[];
  availableTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagList({ tags, availableTags, onChange, placeholder = "Add API..." }: TagListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [flipUp, setFlipUp] = useState(false);
  const unusedTags = availableTags.filter(tag => !tags.includes(tag));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuHeight = Math.min(192, (unusedTags.length + 1) * 40);
    
    const shouldFlipUp = spaceBelow < menuHeight && spaceAbove > menuHeight;
    setFlipUp(shouldFlipUp);
    
    setDropdownPosition({
      top: shouldFlipUp ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  }, [unusedTags.length]);

  useEffect(() => {
    if (!isOpen) return;
    
    updatePosition();
    
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideButton = buttonRef.current?.contains(target);
      const isInsideMenu = menuRef.current?.contains(target);
      if (!isInsideButton && !isInsideMenu) {
        setIsOpen(false);
        setShowCustomInput(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, updatePosition]);

  const handleAddCustom = () => {
    if (customInput.trim() && !tags.includes(customInput.trim())) {
      onChange([...tags, customInput.trim()]);
      setCustomInput("");
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tagName) => (
            <span 
              key={tagName} 
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1",
                "bg-primary/15 text-primary text-xs font-mono rounded-md border border-primary/30",
                "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                "hover:bg-primary/25 hover:scale-105 hover:shadow-sm hover:shadow-primary/20"
              )}
            >
              <code>{tagName}</code>
              <button 
                type="button" 
                onClick={() => onChange(tags.filter((existingTag) => existingTag !== tagName))}
                className="hover:text-destructive hover:scale-125 transition-all duration-200 active:scale-90"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {showCustomInput ? (
        <div className="flex gap-2">
          <input
            id="custom-api-input"
            name="custom-api-input"
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
            placeholder="Enter custom API name..."
            aria-label="Enter custom API name"
            className={cn(
              "flex-1 h-10 bg-background/50 border border-border/60 rounded-md px-3",
              "text-sm font-mono text-foreground placeholder:text-muted-foreground/50",
              "focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            )}
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddCustom}
            className="h-10 px-4 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Add
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setShowCustomInput(false); setCustomInput(""); }}
            className="h-10 px-3 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => {
              if (!isOpen) updatePosition();
              setIsOpen(!isOpen);
            }}
            className={cn(
              "w-full flex items-center justify-between gap-2 h-10",
              "bg-background/50 border border-dashed border-border/60 rounded-md px-3",
              "text-sm font-mono transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
              "hover:border-primary/50 hover:bg-background/80 hover:shadow-sm hover:shadow-primary/10"
            )}
          >
            <span className="text-muted-foreground/70">{placeholder}</span>
            <Plus className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-300",
              isOpen && "rotate-45"
            )} />
          </button>
          {isOpen && createPortal(
            <div 
              ref={menuRef}
              className={cn(
                "fixed bg-popover border border-primary/30 rounded-md shadow-xl shadow-primary/10 overflow-hidden animate-scale-in",
                flipUp && "origin-bottom",
                !flipUp && "origin-top"
              )}
              style={{ 
                top: flipUp ? "auto" : dropdownPosition.top,
                bottom: flipUp ? window.innerHeight - dropdownPosition.top : "auto",
                left: dropdownPosition.left, 
                width: dropdownPosition.width,
                zIndex: 9999
              }}
            >
              <div className="max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setShowCustomInput(true); setIsOpen(false); }}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-sm font-mono",
                    "transition-all duration-200 ease-out",
                    "hover:bg-accent/15 hover:text-accent hover:pl-4",
                    "border-b border-border/30 flex items-center gap-2"
                  )}
                >
                  <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
                  <span>Add Custom API...</span>
                </button>
                {unusedTags.map((availableTag) => (
                  <button
                    key={availableTag}
                    type="button"
                    onClick={() => { onChange([...tags, availableTag]); setIsOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm font-mono transition-all duration-150 hover:bg-primary/15 hover:text-primary hover:pl-4"
                  >
                    <code>{availableTag}</code>
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  );
}

// Group Header Component - Unified style
interface GroupHeaderProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

export function GroupHeader({ title, icon, isExpanded, onToggle }: GroupHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-sm border",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "border-primary/30 bg-primary/10",
        "hover:border-primary/50 hover:bg-primary/15",
        "hover:shadow-md hover:shadow-primary/10"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-primary/20 text-primary">
          {icon}
        </div>
        <span className="text-sm font-mono uppercase tracking-widest font-medium text-primary">
          {title}
        </span>
      </div>
      <ChevronRight className={cn(
        "w-5 h-5 text-primary transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isExpanded && "rotate-90"
      )} />
    </button>
  );
}

// Sub-item Row Component - Unified style matching SubSectionHeader
interface SubItemRowProps {
  title: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  count?: number;
  onAdd?: () => void;
}

export function SubItemRow({ title, icon, isExpanded, onExpandToggle, count, onAdd }: SubItemRowProps) {
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onAdd?.();
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onExpandToggle?.();
  };

  return (
    <button
      type="button"
      onClick={handleExpandToggle}
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
          <span className={cn(
            "text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-mono",
            "transition-all duration-200",
            "animate-scale-in"
          )}>
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
            onKeyDown={(e) => e.key === 'Enter' && handleAdd(e as unknown as React.MouseEvent)}
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


// Entry Card Component - Unified style
interface EntryCardProps {
  children: React.ReactNode;
  onDelete?: () => void;
  canDelete?: boolean;
  index?: number;
  onDragStart?: (index: number) => void;
  onDragOver?: (index: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export function EntryCard({ 
  children, 
  onDelete, 
  canDelete = true,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver
}: EntryCardProps) {
  const isDraggable = typeof index === 'number' && !!onDragStart && !!onDragOver && !!onDragEnd;

  return (
    <div 
      draggable={isDraggable ? true : undefined}
      onDragStart={isDraggable ? () => onDragStart(index) : undefined}
      onDragOver={isDraggable ? (e) => { e.preventDefault(); onDragOver(index); } : undefined}
      onDragEnd={isDraggable ? onDragEnd : undefined}
      className={cn(
        "relative group p-3 bg-background/50 border border-border/50 rounded-sm",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:border-primary/40 hover:bg-background/50 hover:shadow-lg hover:shadow-primary/5",
        "hover:-translate-y-0.5 hover:scale-[1.01]",
        isDraggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 scale-95 border-dashed",
        isDragOver && "border-primary border-2 bg-primary/10"
      )}>
      <div className="space-y-3">
        {children}
      </div>
      {canDelete && onDelete && (
        <ActionIcon
          icon={<Trash2 className="w-4 h-4" />}
          onClick={onDelete}
          title="Delete"
          variant="delete"
          showOnHover
          className="absolute top-2 right-2"
        />
      )}
    </div>
  );
}

// Field Label Component - uses label-cyber for consistency with DFIR
// Now supports htmlFor for proper accessibility
export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="label-cyber">
      {children}
    </label>
  );
}

// AccessibleField - Wrapper component that provides auto-generated id for label association
interface AccessibleFieldProps {
  label: string;
  children: (id: string) => ReactNode;
  className?: string;
}

export function AccessibleField({ label, children, className }: AccessibleFieldProps) {
  const generatedId = useId();
  const fieldId = `field-${generatedId}`;
  
  return (
    <div className={cn("space-y-1.5", className)}>
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      {children(fieldId)}
    </div>
  );
}

// Add Button Component
export function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "w-full border-dashed border-border/50 text-muted-foreground",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:text-primary hover:border-primary/50 hover:bg-primary/5",
        "hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5",
        "active:translate-y-0 active:scale-[0.99]"
      )}
    >
      <Plus className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
      {children}
    </Button>
  );
}

// Auto-resize Textarea Component with Image Paste Support
interface AutoTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  minHeight?: number;
  images?: string[];
  onImagesChange?: (images: string[]) => void;
  allowImages?: boolean;
  label?: string;
  /** Set to true when inside EntryCard to add padding for delete button */
  inEntryCard?: boolean;
}

export function AutoTextarea({ 
  value, 
  onChange, 
  placeholder, 
  minHeight = 56,
  images = [],
  onImagesChange,
  allowImages = false,
  label,
  inEntryCard = false
}: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaId = useId();
  const fileInputId = useId();

  const adjustHeight = useCallback(() => {
    const textarea = ref.current;
    if (!textarea) return;
    
    textarea.style.height = "auto";
    const newHeight = Math.max(minHeight, textarea.scrollHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.scrollTop = 0;
  }, [minHeight]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    adjustHeight();
  };

  const handlePaste = (pasteEvent: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!allowImages || !onImagesChange) return;
    
    const clipboardItems = pasteEvent.clipboardData?.items;
    if (!clipboardItems) return;

    for (let itemIndex = 0; itemIndex < clipboardItems.length; itemIndex++) {
      const clipboardItem = clipboardItems[itemIndex];
      if (clipboardItem.type.startsWith("image/")) {
        pasteEvent.preventDefault();
        const imageFile = clipboardItem.getAsFile();
        if (imageFile) {
          const fileReader = new FileReader();
          fileReader.onload = (loadEvent) => {
            const base64Data = loadEvent.target?.result as string;
            onImagesChange([...images, base64Data]);
          };
          fileReader.readAsDataURL(imageFile);
        }
        break;
      }
    }
  };

  const handleFileSelect = (selectEvent: React.ChangeEvent<HTMLInputElement>) => {
    if (!onImagesChange) return;
    const selectedFiles = selectEvent.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach((imageFile) => {
      if (imageFile.type.startsWith("image/")) {
        const fileReader = new FileReader();
        fileReader.onload = (loadEvent) => {
          const base64Data = loadEvent.target?.result as string;
          onImagesChange([...images, base64Data]);
        };
        fileReader.readAsDataURL(imageFile);
      }
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (imageIndex: number) => {
    if (!onImagesChange) return;
    const remainingImages = images.filter((_, filterIndex) => filterIndex !== imageIndex);
    onImagesChange(remainingImages);
  };

  return (
    <div className="space-y-2">
      {/* Label row with Add Image button */}
      {(label || allowImages) && (
        <div
          className={cn(
            "relative flex items-center justify-between",
            // reserve space for the action icon so label text never overlaps
            allowImages && (inEntryCard ? "pr-16" : "pr-8")
          )}
        >
          {label && <label htmlFor={textareaId} className="label-cyber">{label}</label>}

          {allowImages && (
            <ActionIcon
              icon={<Image className="w-3.5 h-3.5" />}
              onClick={() => fileInputRef.current?.click()}
              title="Add Image"
              className={cn(
                "absolute top-0",
                // Position: when inside EntryCard (has delete button), place left of delete
                // when standalone, place at right edge matching delete button position
                inEntryCard ? "right-8" : "right-0"
              )}
            />
          )}
        </div>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        name={label ? label.toLowerCase().replace(/\s+/g, '-') : 'auto-textarea'}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={allowImages ? `${placeholder || ""}\n(Ctrl+V to paste images)` : placeholder}
        style={{ minHeight: `${minHeight}px` }}
        className={textareaBaseStyles}
      />
      
      {/* Image preview grid */}
      {allowImages && (
        <ImageGrid 
          images={images}
          onRemove={removeImage}
          imageHeight="h-20"
        />
      )}

      {/* Hidden file input */}
      {allowImages && (
        <input
          ref={fileInputRef}
          id={fileInputId}
          name="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          aria-label="Upload images"
          className="hidden"
        />
      )}
    </div>
  );
}
