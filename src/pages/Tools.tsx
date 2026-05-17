import { Header } from "@/components/Header";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Search, ExternalLink, RefreshCw, Info, Globe, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useToolsData } from "@/hooks/useToolsData";
import type { ToolCategory } from "@/lib/toolsData";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { ToolsDataSchema, safeJsonParse } from "@/lib/validationSchemas";

// Lazy import debug logger to reduce initial bundle
const debugWarn = (message: string) =>
  import("@/lib/debugLogger").then(m => m.debugWarn(message)).catch(() => {});

export default function Tools() {
  const { t } = useLanguage();

  useEffect(() => { document.title = "Tools - MalFrame"; }, []);
  const { toolsData: defaultData, version: latestVersion, isLoading: isLoadingDefault } = useToolsData();

  // Local tools data state - initialized from localStorage or default data
  const [toolsData, setToolsData] = useState<ToolCategory[] | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TOOLS_DATA);
    if (saved) {
      try {
        const parsed = safeJsonParse<unknown>(saved);
        const result = ToolsDataSchema.safeParse(parsed);
        if (result.success) {
          return result.data;
        }
        debugWarn("Tools data validation failed, using default");
        localStorage.removeItem(STORAGE_KEYS.TOOLS_DATA);
      } catch {
        debugWarn("Invalid tools data JSON, using default");
        localStorage.removeItem(STORAGE_KEYS.TOOLS_DATA);
      }
    }
    return null; // Will use defaultData when loaded
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [storedVersion, setStoredVersion] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.TOOLS_VERSION)
  );

  // Use saved data or default data
  const activeToolsData = useMemo(() => toolsData ?? defaultData ?? [], [toolsData, defaultData]);
  const currentVersion = latestVersion ?? "1.0";

  // Check if update is available
  const hasUpdate = storedVersion !== null && storedVersion !== currentVersion;

  // Initialize tools data from default when loaded
  useEffect(() => {
    if (!toolsData && defaultData) {
      setToolsData(defaultData);
    }
  }, [toolsData, defaultData]);

  useEffect(() => {
    if (toolsData) {
      localStorage.setItem(STORAGE_KEYS.TOOLS_DATA, JSON.stringify(toolsData));
    }
  }, [toolsData]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(activeToolsData.map(c => c.name)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Check if all categories are expanded or collapsed
  const allExpanded = activeToolsData.length > 0 && expandedCategories.size === activeToolsData.length;
  const allCollapsed = expandedCategories.size === 0;

  // Update tools to latest version
  const handleUpdateTools = () => {
    if (defaultData) {
      setToolsData(defaultData);
      localStorage.setItem(STORAGE_KEYS.TOOLS_VERSION, currentVersion);
      setStoredVersion(currentVersion);
      setUpdateDialogOpen(false);
      toast.success(t("tools.updateSuccess"));
    }
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return activeToolsData;
    return activeToolsData.map(category => ({
      ...category,
      tools: category.tools.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })).filter(category => category.tools.length > 0);
  }, [searchQuery, activeToolsData]);

  const totalTools = useMemo(() => 
    activeToolsData.reduce((acc, cat) => acc + cat.tools.length, 0),
  [activeToolsData]);

  // Loading state
  if (isLoadingDefault) {
    return (
      <div className="min-h-screen bg-background cyber-grid flex flex-col">
        <Header />
        <main className="container max-w-7xl mx-auto py-6 flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground font-mono">{t("tools.loading")}</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-grid flex flex-col">
      <Header />
      
      <main className="container max-w-7xl mx-auto py-6 space-y-6 flex-1">
        <div className="text-left space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-primary text-glow font-terminal tracking-wider flex items-center gap-2">
              <span className="text-accent">※</span> {t("tools.title")}
            </h1>
            <a 
              href="https://github.com/mandiant/flare-vm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-accent/10 text-accent border border-accent/30 rounded-sm hover:bg-accent/20 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              GitHub
            </a>
            <a 
              href="https://github.com/mandiant/VM-Packages/tree/main/packages" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-primary/10 text-primary border border-primary/30 rounded-sm hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Packages
            </a>
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            {t("tools.flareDesc")}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground/70 font-mono">
            <span>{activeToolsData.length} {t("tools.categories")}, {totalTools} {t("tools.totalTools")}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>v{currentVersion}</span>
          </div>
        </div>

        {/* Search and controls - 3 column grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Search - spans 2 columns */}
          <div className="col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("tools.search")}
              aria-label={t("tools.search")}
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-sm font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
            />
          </div>
          
          {/* 3 buttons in 1 column - horizontal, equal width */}
          <div className="flex gap-1">
            <button
              onClick={expandAll}
              disabled={allExpanded}
              className={cn(
                "flex-1 px-1 py-2 text-[10px] font-terminal uppercase tracking-wide border rounded-sm transition-colors flex items-center justify-center gap-1",
                allExpanded 
                  ? "border-border text-muted-foreground/50 cursor-not-allowed" 
                  : "border-primary/50 text-primary hover:bg-primary/10"
              )}
            >
              <ChevronsDownUp className="w-3 h-3" />
              {t("tools.expandAll")}
            </button>
            <button
              onClick={collapseAll}
              disabled={allCollapsed}
              className={cn(
                "flex-1 px-1 py-2 text-[10px] font-terminal uppercase tracking-wide border rounded-sm transition-colors flex items-center justify-center gap-1",
                allCollapsed 
                  ? "border-border text-muted-foreground/50 cursor-not-allowed" 
                  : "border-border text-muted-foreground hover:bg-muted/20"
              )}
            >
              <ChevronsUpDown className="w-3 h-3" />
              {t("tools.collapseAll")}
            </button>
            <button
              onClick={() => setUpdateDialogOpen(true)}
              className={cn(
                "flex-1 px-1 py-2 text-[10px] font-terminal uppercase tracking-wide border rounded-sm transition-colors flex items-center justify-center gap-1 relative",
                hasUpdate 
                  ? "border-accent bg-accent/20 text-accent animate-pulse" 
                  : "border-accent/50 text-accent hover:bg-accent/10"
              )}
            >
              <RefreshCw className="w-3 h-3" />
              {t("tools.update")}
              {hasUpdate && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((category) => (
            <div 
              key={category.name} 
              className="bg-card/30 border border-border rounded-sm overflow-hidden"
            >
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between p-3 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedCategories.has(category.name) ? (
                    <ChevronDown className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="font-terminal text-sm text-primary tracking-wide">
                    {category.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {category.tools.length}
                </span>
              </button>
              
              {expandedCategories.has(category.name) && (
                <div className="border-t border-border p-3 space-y-1 animate-fade-in">
                  {category.tools.map((tool) => (
                    <TooltipProvider key={tool.name} delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              "flex items-center justify-between px-2 py-1.5 text-sm font-mono text-foreground/80 rounded-sm cursor-default group",
                              "hover:bg-primary/10 hover:text-primary transition-colors",
                              searchQuery && tool.name.toLowerCase().includes(searchQuery.toLowerCase()) && "bg-accent/10 text-accent"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span>{tool.name}</span>
                              {tool.description && (
                                <Info className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary/50" />
                              )}
                            </div>
                            {tool.projectUrl && (
                              <a
                                href={tool.projectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 text-muted-foreground/50 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                title={t("aria.visitProjectPage")}
                              >
                                <Globe className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </TooltipTrigger>
                        {tool.description && (
                          <TooltipContent 
                            side="top" 
                            className="max-w-xs text-xs bg-popover border-border"
                          >
                            <p>{tool.description}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {category.tools.length === 0 && (
                    <div className="text-xs text-muted-foreground italic px-2 py-1">
                      {t("tools.noToolsCategory")}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12 text-muted-foreground font-mono">
            {t("tools.noResults")}
          </div>
        )}
      </main>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md border-primary/30 bg-background">
          <DialogHeader>
            <DialogTitle className="text-primary font-terminal flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              {t("tools.updateTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("tools.updateDesc")}
            </DialogDescription>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t("tools.current")}:</span>
              <span className="font-mono text-foreground">{storedVersion || t("tools.notSet")}</span>
              <span>→</span>
              <span className="font-mono text-accent">{currentVersion}</span>
            </div>
            {hasUpdate && (
              <p className="text-accent text-sm font-medium">
                {t("tools.newVersion")}
              </p>
            )}
          </DialogHeader>
          <div className="py-2 space-y-2 text-sm text-muted-foreground">
            <p>{t("tools.updateWillDo")}</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>{t("tools.updateItem1")}</li>
              <li>{t("tools.updateItem2")}</li>
              <li>{t("tools.updateItem3")}</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdateTools} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("tools.updateNow")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

