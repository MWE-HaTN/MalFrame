import { memo } from "react";
import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  keys: string[];
  label: string;
}

const globalShortcuts: ShortcutItem[] = [
  { keys: ["Ctrl", "K"], label: "shortcuts.commandPalette" },
  { keys: ["Ctrl", "Shift", "X"], label: "shortcuts.searchCases" },
  { keys: ["Ctrl", "Shift", "I"], label: "shortcuts.iocCrossRef" },
  { keys: ["Ctrl", "Shift", "1"], label: "shortcuts.goToMia" },
  { keys: ["Ctrl", "Shift", "2"], label: "shortcuts.goToMre" },
  { keys: ["Ctrl", "Shift", "T"], label: "shortcuts.goToTools" },
  { keys: ["Ctrl", "Shift", "S"], label: "shortcuts.goToSettings" },
];

const dashboardShortcuts: ShortcutItem[] = [
  { keys: ["Ctrl", "Z"], label: "shortcuts.undo" },
  { keys: ["Ctrl", "Shift", "Z"], label: "shortcuts.redo" },
  { keys: ["Ctrl", "Shift", "E"], label: "shortcuts.export" },
  { keys: ["Ctrl", "Shift", "N"], label: "shortcuts.newCase" },
  { keys: ["Ctrl", "Shift", "←"], label: "shortcuts.prevCase" },
  { keys: ["Ctrl", "Shift", "→"], label: "shortcuts.nextCase" },
  { keys: ["Ctrl", "Shift", "↓"], label: "shortcuts.nextSection" },
  { keys: ["Ctrl", "Shift", "↑"], label: "shortcuts.prevSection" },
  { keys: ["Ctrl", "Shift", "A"], label: "shortcuts.toggleAllSections" },
];

const otherShortcuts: ShortcutItem[] = [
  { keys: ["?"], label: "shortcuts.showHelp" },
];

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1.5 rounded border border-border bg-muted text-[10px] font-mono font-medium text-foreground">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, label }: ShortcutItem) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{t(label)}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-[10px] text-muted-foreground/50">+</span>}
            <KeyBadge>{key}</KeyBadge>
          </span>
        ))}
      </div>
    </div>
  );
}

export const ShortcutsDialog = memo(function ShortcutsDialog({
  open,
  onOpenChange,
}: ShortcutsDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-terminal tracking-wider">
            <Keyboard className="w-4 h-4 text-primary" />
            {t("shortcuts.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <h4 className="text-xs font-terminal text-primary tracking-wider mb-2 uppercase">
              {t("shortcuts.global")}
            </h4>
            <div className="divide-y divide-border/50">
              {globalShortcuts.map((s) => (
                <ShortcutRow key={s.label} {...s} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-terminal text-primary tracking-wider mb-2 uppercase">
              {t("shortcuts.dashboard")}
            </h4>
            <div className="divide-y divide-border/50">
              {dashboardShortcuts.map((s) => (
                <ShortcutRow key={s.label} {...s} />
              ))}
            </div>
          </div>

          <div>
            <div className="divide-y divide-border/50">
              {otherShortcuts.map((s) => (
                <ShortcutRow key={s.label} {...s} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
