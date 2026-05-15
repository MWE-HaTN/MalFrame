import { memo, useState, useCallback, useRef, useEffect } from "react";
import { ClipboardPaste, Search, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { parseIOCsFromText, type ParsedIOC } from "@/lib/parseIOCs";
import type { IOC } from "@/types/dashboard";
import { generateId } from "@/lib/utils";

interface IOCPasteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddIOCs: (iocs: IOC[]) => void;
}

export const IOCPasteDialog = memo(function IOCPasteDialog({
  open,
  onOpenChange,
  onAddIOCs,
}: IOCPasteDialogProps) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedIOC[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setText("");
      setParsed([]);
      setHasScanned(false);
      setTimeout(() => textAreaRef.current?.focus(), 50);
    }
  }, [open]);

  const handleParse = useCallback(() => {
    const results = parseIOCsFromText(text);
    setParsed(results);
    setHasScanned(true);
  }, [text]);

  const handleAddAll = useCallback(() => {
    const iocs: IOC[] = parsed.map((p) => ({
      id: generateId(),
      type: p.type,
      value: p.value,
      description: p.description,
    }));
    onAddIOCs(iocs);
    onOpenChange(false);
  }, [parsed, onAddIOCs, onOpenChange]);

  const handleRemoveParsed = useCallback((index: number) => {
    setParsed((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-terminal tracking-wider">
            <ClipboardPaste className="w-4 h-4 text-primary" />
            {t("ioc.pasteTitle")}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          {t("ioc.pasteDescription")}
        </p>

        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <textarea
            ref={textAreaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (hasScanned) setHasScanned(false);
            }}
            placeholder={t("ioc.pastePlaceholder")}
            aria-label={t("ioc.pastePlaceholder")}
            className="flex-1 min-h-[120px] bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary outline-none resize-none"
          />

          <div className="flex items-center gap-2">
            <Button
              onClick={handleParse}
              disabled={!text.trim()}
              size="sm"
              className="font-mono text-xs"
            >
              <Search className="w-3 h-3 mr-1.5" />
              {t("ioc.parse")}
            </Button>

            {hasScanned && parsed.length > 0 && (
              <span className="text-xs text-primary font-mono">
                {t("ioc.parsedCount").replace("{count}", String(parsed.length))}
              </span>
            )}
          </div>

          {/* Results preview */}
          {hasScanned && parsed.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              {t("ioc.noIOCsFound")}
            </div>
          )}

          {parsed.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden flex-1 min-h-0 max-h-[300px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-[140px]">
                      {t("ioc.type")}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                      {t("ioc.value")}
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-[60px]">
                      {t("timeline.action")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {parsed.map((ioc, i) => (
                    <tr key={i} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-3 py-2">
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {ioc.type}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <code className="text-xs font-mono text-foreground break-all">
                          {ioc.value.length > 80
                            ? ioc.value.slice(0, 80) + "..."
                            : ioc.value}
                        </code>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleRemoveParsed(i)}
                          className="p-1 hover:bg-destructive/20 rounded transition-colors"
                          aria-label="Remove parsed IOC"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {parsed.length > 0 && (
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="font-mono text-xs"
            >
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              onClick={handleAddAll}
              className="font-mono text-xs"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              {t("ioc.addAll")} ({parsed.length})
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
