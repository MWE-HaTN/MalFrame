import { cn } from "@/lib/utils";

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
