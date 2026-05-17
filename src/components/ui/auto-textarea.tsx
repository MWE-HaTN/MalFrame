import { useRef, useCallback, useEffect, ClipboardEvent, memo } from "react";
import { cn } from "@/lib/utils";

export interface AutoTextareaProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onPaste?: (e: ClipboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Auto-resizing textarea component
 * Consolidates duplicate implementations from NotesLog and ui-components
 */
export const AutoTextarea = memo(function AutoTextarea({
  id,
  name,
  value,
  onChange,
  onPaste,
  placeholder,
  minHeight = 46,
  className,
  disabled = false,
}: AutoTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
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
    // adjustHeight is called by useEffect([value]) — no need to call here
  };

  return (
    <textarea
      ref={textareaRef}
      id={id}
      name={name}
      value={value}
      onChange={handleChange}
      onPaste={onPaste}
      placeholder={placeholder}
      disabled={disabled}
      style={{ minHeight: `${minHeight}px` }}
      className={cn(
        "w-full bg-background/50 border border-border/60 rounded-md px-3 py-3",
        "text-sm font-mono text-foreground placeholder:text-muted-foreground/50",
        "resize-none transition-all duration-200",
        "hover:border-primary/40 hover:bg-background/70",
        "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background outline-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    />
  );
});
