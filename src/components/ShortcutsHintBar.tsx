import { memo, useState } from "react";
import { Command, Search, Keyboard, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/hooks/useLanguage";

interface ShortcutHintBarProps {
  onCommandPalette?: () => void;
  onSearch?: () => void;
  onShowHelp?: () => void;
}

export const ShortcutsHintBar = memo(function ShortcutsHintBar({
  onCommandPalette,
  onSearch,
  onShowHelp,
}: ShortcutHintBarProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const collapse = () => setExpanded(false);

  if (!expanded) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="fixed bottom-4 left-4 z-40">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setExpanded(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-border/50 bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all shadow-md"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <span className="text-xs">{t("shortcuts.hint.allShortcuts")}</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => { onCommandPalette?.(); collapse(); }}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border/50 bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all shadow-md"
            >
              <Command className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span className="text-xs">{t("shortcuts.hint.commandPalette")}</span>
            <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">Ctrl+K</kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => { onSearch?.(); collapse(); }}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border/50 bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all shadow-md"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span className="text-xs">{t("shortcuts.hint.search")}</span>
            <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">Ctrl+Shift+X</kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => { onShowHelp?.(); collapse(); }}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border/50 bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all shadow-md"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span className="text-xs">{t("shortcuts.hint.allShortcuts")}</span>
            <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">?</kbd>
          </TooltipContent>
        </Tooltip>

        <button
          onClick={collapse}
          aria-label={t("common.closeShortcutsBar")}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-border/30 bg-background/60 backdrop-blur-sm text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </TooltipProvider>
  );
});
