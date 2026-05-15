import { memo, useState, useCallback } from "react";
import { Link, Search, Loader2, FolderOpen, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { crossReferenceIOCs, type IOCCrossRefResult } from "@/lib/crossReferenceIOCs";

interface IOCCrossReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IOCCrossReferenceDialog = memo(function IOCCrossReferenceDialog({
  open,
  onOpenChange,
}: IOCCrossReferenceDialogProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [results, setResults] = useState<IOCCrossRefResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleScan = useCallback(async () => {
    setLoading(true);
    setScanned(false);
    try {
      const res = await crossReferenceIOCs();
      setResults(res);
      setScanned(true);
    } catch {
      setResults([]);
      setScanned(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNavigateToCase = useCallback(
    (caseType: "mia" | "mre", caseId: string) => {
      const lsKey = caseType === "mia" ? "mia-active-case" : "mre-active-case";
      localStorage.setItem(lsKey, caseId);
      navigate(caseType === "mia" ? "/mia" : "/mre");
      onOpenChange(false);
    },
    [navigate, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-terminal tracking-wider">
            <Link className="w-4 h-4 text-primary" />
            {t("iocXref.title")}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          {t("iocXref.description")}
        </p>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleScan}
            disabled={loading}
            size="sm"
            className="font-mono text-xs"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            ) : (
              <Search className="w-3 h-3 mr-1.5" />
            )}
            {loading ? t("iocXref.scanning") : t("iocXref.scan")}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-2" aria-live="polite">
          {scanned && results.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("iocXref.noResults")}
            </div>
          )}

          {results.map((result) => {
            const mapKey = `${result.type}:${result.value}`;
            return (
              <div
                key={mapKey}
                className="border border-border/50 rounded-md overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {result.type}
                  </span>
                  <code className="text-xs font-mono text-foreground break-all flex-1">
                    {result.value.length > 60
                      ? result.value.slice(0, 60) + "..."
                      : result.value}
                  </code>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {t("iocXref.foundIn").replace("{count}", String(result.cases.length))}
                  </span>
                </div>
                <div className="divide-y divide-border/30">
                  {result.cases.map((c) => (
                    <button
                      key={`${c.caseType}:${c.caseId}`}
                      onClick={() => handleNavigateToCase(c.caseType, c.caseId)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/30 transition-colors text-left"
                    >
                      <FolderOpen className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{c.caseName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase shrink-0">
                        {c.caseType}
                      </span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground/50 ml-auto shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
});
