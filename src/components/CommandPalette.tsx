import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Map,
  Wrench,
  Settings,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  Keyboard,
  ArrowRight,
  Languages,
  SunMoon,
  Scaling,
  Activity,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: () => void;
  onShowHelp: () => void;
  onExport?: () => void;
  onNewCase?: () => void;
  onPrevCase?: () => void;
  onNextCase?: () => void;
  onToggleLanguage?: () => void;
  onToggleTheme?: () => void;
  onCycleScale?: () => void;
  onTrackToday?: () => void;
}

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  group: string;
  action: () => void;
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export const CommandPalette = memo(function CommandPalette({
  open,
  onOpenChange,
  onSearch,
  onShowHelp,
  onExport,
  onNewCase,
  onPrevCase,
  onNextCase,
  onToggleLanguage,
  onToggleTheme,
  onCycleScale,
  onTrackToday,
}: CommandPaletteProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const actions: ActionItem[] = useMemo(
    () => [
      { id: "mia", label: t("commandPalette.actions.goToMia"), icon: <Map className="w-4 h-4" />, shortcut: "Ctrl+Shift+1", group: t("commandPalette.group.navigation"), action: () => { navigate("/mia"); onOpenChange(false); } },
      { id: "mre", label: t("commandPalette.actions.goToMre"), icon: <Search className="w-4 h-4" />, shortcut: "Ctrl+Shift+2", group: t("commandPalette.group.navigation"), action: () => { navigate("/mre"); onOpenChange(false); } },
      { id: "tools", label: t("commandPalette.actions.goToTools"), icon: <Wrench className="w-4 h-4" />, shortcut: "Ctrl+Shift+T", group: t("commandPalette.group.navigation"), action: () => { navigate("/tools"); onOpenChange(false); } },
      { id: "settings", label: t("commandPalette.actions.goToSettings"), icon: <Settings className="w-4 h-4" />, shortcut: "Ctrl+Shift+S", group: t("commandPalette.group.navigation"), action: () => { navigate("/settings"); onOpenChange(false); } },
      { id: "search", label: t("commandPalette.actions.searchCases"), icon: <Search className="w-4 h-4" />, shortcut: "Ctrl+Shift+X", group: t("commandPalette.group.search"), action: () => { onSearch(); onOpenChange(false); } },
      { id: "new-case", label: t("commandPalette.actions.newCase"), icon: <FolderPlus className="w-4 h-4" />, shortcut: "Ctrl+Shift+N", group: t("commandPalette.group.cases"), action: () => { onNewCase?.(); onOpenChange(false); } },
      { id: "prev-case", label: t("commandPalette.actions.prevCase"), icon: <ChevronLeft className="w-4 h-4" />, shortcut: "Ctrl+Shift+←", group: t("commandPalette.group.cases"), action: () => { onPrevCase?.(); onOpenChange(false); } },
      { id: "next-case", label: t("commandPalette.actions.nextCase"), icon: <ChevronRight className="w-4 h-4" />, shortcut: "Ctrl+Shift+→", group: t("commandPalette.group.cases"), action: () => { onNextCase?.(); onOpenChange(false); } },
      { id: "export", label: t("commandPalette.actions.export"), icon: <Download className="w-4 h-4" />, shortcut: "Ctrl+Shift+E", group: t("commandPalette.group.export"), action: () => { onExport?.(); onOpenChange(false); } },
      { id: "toggle-lang", label: t("commandPalette.actions.toggleLanguage"), icon: <Languages className="w-4 h-4" />, group: t("commandPalette.group.settings"), action: () => { onToggleLanguage?.(); onOpenChange(false); } },
      { id: "toggle-theme", label: t("commandPalette.actions.toggleTheme"), icon: <SunMoon className="w-4 h-4" />, group: t("commandPalette.group.settings"), action: () => { onToggleTheme?.(); onOpenChange(false); } },
      { id: "cycle-scale", label: t("commandPalette.actions.cycleScale"), icon: <Scaling className="w-4 h-4" />, group: t("commandPalette.group.settings"), action: () => { onCycleScale?.(); onOpenChange(false); } },
      { id: "track-today", label: t("commandPalette.actions.trackToday"), icon: <Activity className="w-4 h-4" />, group: t("commandPalette.group.tools"), action: () => { onTrackToday?.(); onOpenChange(false); } },
      { id: "help", label: t("commandPalette.actions.showHelp"), icon: <Keyboard className="w-4 h-4" />, shortcut: "?", group: t("commandPalette.group.help"), action: () => { onShowHelp(); onOpenChange(false); } },
    ],
    [t, navigate, onOpenChange, onSearch, onShowHelp, onExport, onNewCase, onPrevCase, onNextCase, onToggleLanguage, onToggleTheme, onCycleScale, onTrackToday],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    return actions.filter((a) => fuzzyMatch(query, a.label));
  }, [query, actions]);

  // Group filtered actions
  const grouped = useMemo(() => {
    const groups: { label: string; items: ActionItem[] }[] = [];
    const seen = new Set<string>();
    for (const action of filtered) {
      if (!seen.has(action.group)) {
        seen.add(action.group);
        groups.push({ label: action.group, items: [] });
      }
      groups[groups.length - 1].items.push(action);
    }
    return groups;
  }, [filtered]);

  // Flat list for keyboard navigation
  const flatList = filtered;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= flatList.length) {
      setSelectedIndex(Math.max(0, flatList.length - 1));
    }
  }, [flatList.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (flatList.length === 0) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % flatList.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + flatList.length) % flatList.length);
          break;
        case "Enter":
          e.preventDefault();
          flatList[selectedIndex]?.action();
          break;
      }
    },
    [flatList, selectedIndex],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden" onKeyDown={handleKeyDown}>
        <div className="flex items-center border-b px-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder={t("commandPalette.search")}
            aria-label={t("commandPalette.search")}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm h-12"
          />
        </div>

        <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
          {flatList.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("commandPalette.noResults")}
            </div>
          )}

          {(() => {
            let flatIndex = 0;
            return grouped.map((group) => {
              const groupStartIndex = flatIndex;
              return (
              <div key={group.label}>
                <div className="px-3 py-1.5 text-[10px] font-terminal text-primary tracking-wider uppercase">
                  {group.label}
                </div>
                {group.items.map((item, i) => {
                  const itemIndex = groupStartIndex + i;
                  flatIndex++;
                  return (
                    <button
                      key={item.id}
                      data-index={itemIndex}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                        itemIndex === selectedIndex
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="text-[10px] font-mono text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded border border-border/50">
                          {item.shortcut}
                        </kbd>
                      )}
                      {itemIndex === selectedIndex && (
                        <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          });
        })()}
        </div>

        <div className="border-t px-3 py-1.5 flex items-center gap-3 text-[10px] text-muted-foreground/60">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
});
