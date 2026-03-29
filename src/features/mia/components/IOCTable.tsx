import { useState, useRef, useMemo, useCallback, useEffect, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus, Copy, Trash2, Check, Database } from "lucide-react";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import type { IOC } from "@/types/dashboard";

interface IOCTableProps {
  iocs: IOC[];
  onIOCsChange: (iocs: IOC[]) => void;
}

interface IOCRowProps {
  ioc: IOC;
  isCopied: boolean;
  onCopy: (ioc: IOC) => void;
  onRemove: (id: string) => void;
}

const IOCRow = memo(function IOCRow({ ioc, isCopied, onCopy, onRemove }: IOCRowProps) {
  return (
    <tr className="hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3">
        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
          {ioc.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <code className="text-xs font-mono text-foreground break-all">
          {ioc.value}
        </code>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {ioc.description || "-"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onCopy(ioc)}
            className="p-1.5 hover:bg-secondary rounded transition-colors"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => onRemove(ioc.id)}
            className="p-1.5 hover:bg-destructive/20 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </td>
    </tr>
  );
});

const IOC_TYPES = [
  "IP Address",
  "Domain",
  "URL",
  "File Hash (MD5)",
  "File Hash (SHA1)",
  "File Hash (SHA256)",
  "File Name",
  "File Path",
  "Directory",
  "Dropped File",
  "Process",
  "Registry Key",
  "Mutex",
  "Named Pipe",
  "Email",
  "User Agent",
  "Other",
];

const ROW_HEIGHT = 52;
const MAX_VISIBLE_ROWS = 10;

export const IOCTable = memo(function IOCTable({ iocs, onIOCsChange }: IOCTableProps) {
  const { t } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newIOC, setNewIOC] = useState<Omit<IOC, "id">>({
    type: "File Hash (SHA256)",
    value: "",
    description: "",
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const shouldVirtualize = iocs.length > MAX_VISIBLE_ROWS;

  const rowVirtualizer = useVirtualizer({
    count: iocs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const addIOC = useCallback(() => {
    if (!newIOC.value.trim()) {
      toast.error(t("ioc.enterValue"));
      return;
    }

    const ioc: IOC = {
      id: generateId(),
      ...newIOC,
    };
    onIOCsChange([...iocs, ioc]);
    setNewIOC({ type: "File Hash (SHA256)", value: "", description: "" });
    toast.success(t("ioc.added"));
  }, [newIOC, iocs, onIOCsChange, t]);

  const removeIOC = useCallback((iocId: string) => {
    onIOCsChange(iocs.filter((iocItem) => iocItem.id !== iocId));
    toast.success(t("ioc.removed"));
  }, [iocs, onIOCsChange, t]);

  const copyIOC = useCallback((ioc: IOC) => {
    navigator.clipboard.writeText(ioc.value);
    setCopiedId(ioc.id);
    toast.success(t("ioc.copied"));
  }, [t]);

  // Cleanup copiedId with proper timer cleanup
  useEffect(() => {
    if (copiedId === null) return;
    const timer = setTimeout(() => setCopiedId(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedId]);

  const copyAllIOCs = useCallback(() => {
    const formattedText = iocs.map((iocItem) => `${iocItem.type}: ${iocItem.value}`).join("\n");
    navigator.clipboard.writeText(formattedText);
    toast.success(t("ioc.copiedAll"));
  }, [iocs, t]);

  const containerHeight = useMemo(() => {
    if (!shouldVirtualize) return "auto";
    return Math.min(iocs.length, MAX_VISIBLE_ROWS) * ROW_HEIGHT;
  }, [iocs.length, shouldVirtualize]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="section-header">
          <Database className="w-4 h-4" />
          <span>{t("ioc.type")}</span>
          <span className="text-xs font-normal text-muted-foreground ml-2">
            ({iocs.length} {t("ioc.indicators")})
          </span>
        </div>
        {iocs.length > 0 && (
          <button
            onClick={copyAllIOCs}
            className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Copy className="w-3 h-3" />
            {t("ioc.copyAll")}
          </button>
        )}
      </div>

      {/* Add new IOC */}
      <div className="flex gap-2 flex-wrap">
        <select
          id="ioc-type-select"
          name="ioc-type"
          value={newIOC.type}
          onChange={(e) => setNewIOC({ ...newIOC, type: e.target.value })}
          className="bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
          aria-label="IOC Type"
        >
          {IOC_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          id="ioc-value-input"
          name="ioc-value"
          type="text"
          value={newIOC.value}
          onChange={(e) => setNewIOC({ ...newIOC, value: e.target.value })}
          placeholder={t("ioc.value")}
          className="flex-1 min-w-[200px] bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
          aria-label="IOC Value"
        />
        <input
          id="ioc-description-input"
          name="ioc-description"
          type="text"
          value={newIOC.description}
          onChange={(e) => setNewIOC({ ...newIOC, description: e.target.value })}
          placeholder={t("ioc.description")}
          className="flex-1 min-w-[150px] bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
          aria-label="IOC Description"
        />
        <button
          onClick={addIOC}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("common.add")}
        </button>
      </div>

      {/* IOC List */}
      {iocs.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-[140px]">
                  {t("ioc.type")}
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  {t("ioc.value")}
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-[200px]">
                  {t("ioc.description")}
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-[100px]">
                  {t("timeline.action")}
                </th>
              </tr>
            </thead>
          </table>

          {shouldVirtualize ? (
            <div
              ref={parentRef}
              className="overflow-auto"
              style={{ height: containerHeight }}
            >
              <table className="w-full">
                <tbody
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const ioc = iocs[virtualRow.index];
                    return (
                      <tr
                        key={ioc.id}
                        className="hover:bg-secondary/30 transition-colors absolute w-full flex"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <td className="px-4 py-3 w-[140px] flex-shrink-0">
                          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                            {ioc.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex-1 min-w-0">
                          <code className="text-xs font-mono text-foreground break-all">
                            {ioc.value}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground w-[200px] flex-shrink-0">
                          {ioc.description || "-"}
                        </td>
                        <td className="px-4 py-3 w-[100px] flex-shrink-0">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => copyIOC(ioc)}
                              className="p-1.5 hover:bg-secondary rounded transition-colors"
                            >
                              {copiedId === ioc.id ? (
                                <Check className="w-4 h-4 text-success" />
                              ) : (
                                <Copy className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            <button
                              onClick={() => removeIOC(ioc.id)}
                              className="p-1.5 hover:bg-destructive/20 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <table className="w-full">
              <tbody className="divide-y divide-border">
                {iocs.map((ioc) => (
                  <IOCRow
                    key={ioc.id}
                    ioc={ioc}
                    isCopied={copiedId === ioc.id}
                    onCopy={copyIOC}
                    onRemove={removeIOC}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {iocs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t("ioc.empty")}
        </div>
      )}
    </div>
  );
});

