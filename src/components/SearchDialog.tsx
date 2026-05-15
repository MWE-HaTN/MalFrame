import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Search, Loader2, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";
import { searchAcrossCases, type SearchResult } from "@/lib/searchAcrossCases";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Format field path like "background.analyst" to "Background > Analyst" */
function formatFieldPath(path: string): string {
  return path
    .split(".")
    .filter(Boolean)
    .map((segment) => {
      // Remove array indices like [0], [1]
      const clean = segment.replace(/\[\d+\]$/, "");
      // Convert camelCase to readable
      return clean
        .replace(/([A-Z])/g, " $1")
        .trim()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    })
    .join(" > ");
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export const SearchDialog = memo(function SearchDialog({
  open,
  onOpenChange,
}: SearchDialogProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setExpandedGroups(new Set());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim()) {
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await searchAcrossCases(value);
          setResults(res);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [],
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      const lsKey = result.caseType === "mia" ? "mia-active-case" : "mre-active-case";
      localStorage.setItem(lsKey, result.caseId);
      navigate(result.caseType === "mia" ? "/mia" : "/mre");
      onOpenChange(false);
    },
    [navigate, onOpenChange],
  );

  // Group results by case
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const key = `${r.caseType}:${r.caseId}`;
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-terminal tracking-wider">
            <Search className="w-4 h-4 text-primary" />
            {t("search.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t("search.placeholder")}
            aria-label={t("search.placeholder")}
            className="pl-9 font-mono text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-3" aria-live="polite">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground" role="status">
              <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
              {t("search.loading")}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("search.noResults")}
            </div>
          )}

          {!loading &&
            Object.entries(grouped).map(([key, items]) => {
              const first = items[0];
              const isExpanded = expandedGroups.has(key);
              const visibleItems = isExpanded ? items : items.slice(0, 5);
              const hasMore = items.length > 5;

              return (
                <div key={key} className="border border-border/50 rounded-md overflow-hidden">
                  <button
                    onClick={() => handleSelect(first)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-sm font-medium truncate">{first.caseName}</span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase ml-auto shrink-0">
                      {first.caseType}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {items.length} {items.length === 1 ? "match" : "matches"}
                    </span>
                  </button>
                  <div className="divide-y divide-border/30">
                    {visibleItems.map((r, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 text-xs cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => handleSelect(r)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(r); } }}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="font-medium text-primary/70">{formatFieldPath(r.field)}</span>
                        <span className="mx-1.5 text-muted-foreground/30">·</span>
                        <span className="text-muted-foreground">
                          {highlightMatch(
                            r.value.length > 100 ? r.value.slice(0, 100) + "…" : r.value,
                            query,
                          )}
                        </span>
                      </div>
                    ))}
                    {hasMore && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(key);
                        }}
                        className="w-full px-3 py-1.5 text-[11px] text-primary hover:bg-muted/30 transition-colors flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            {t("search.showLess")}
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-3 h-3" />
                            {t("search.moreMatches").replace("{count}", String(items.length - 5))}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
});
