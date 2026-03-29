import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { RefreshCw, Loader2, ChevronDown, ChevronRight, Download, Search, X } from "lucide-react";
import { cn, truncate } from "@/lib/utils";
import { downloadBlob } from "@/lib/export/helpers";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { debugError } from "@/lib/debugLogger";
import { useLanguage } from "@/hooks/useLanguage";

import { 
  fetchMitreData, 
  loadMitreData, 
  type MitreTactic,
} from "@/lib/mitreUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { STORAGE_KEYS } from "@/lib/storageKeys";

// Note: These keys are NOT cleared when user clears report data
// MITRE cache persists to avoid re-fetching data unnecessarily
const DEFAULT_VERSION = "v16.1";

// Extended display format with sub-techniques
interface TacticDisplay {
  id: string;
  name: string;
  code: string;
  techniques: { 
    id: string; 
    name: string; 
    fullName?: string;
    subtechniques?: { id: string; name: string }[];
  }[];
}

function convertToDisplayFormat(tactics: MitreTactic[]): TacticDisplay[] {
  return tactics.map(tactic => ({
    id: tactic.id,
    name: tactic.name,
    code: tactic.code,
    techniques: tactic.techniques.map(tech => ({
      id: tech.id,
      name: truncate(tech.name, 22),
      fullName: tech.name,
      subtechniques: tech.subtechniques?.map(sub => ({
        id: sub.id,
        name: sub.name,
      })) || [],
    })),
  }));
}

// Default tactics in case loading fails
const DEFAULT_TACTICS: TacticDisplay[] = [
  { id: "reconnaissance", name: "RECONNAISSANCE", code: "TA0043", techniques: [] },
  { id: "resource_development", name: "RESOURCE DEVELOPMENT", code: "TA0042", techniques: [] },
  { id: "initial_access", name: "INITIAL ACCESS", code: "TA0001", techniques: [] },
  { id: "execution", name: "EXECUTION", code: "TA0002", techniques: [] },
  { id: "persistence", name: "PERSISTENCE", code: "TA0003", techniques: [] },
  { id: "privilege_escalation", name: "PRIVILEGE ESCALATION", code: "TA0004", techniques: [] },
  { id: "defense_evasion", name: "DEFENSE EVASION", code: "TA0005", techniques: [] },
  { id: "credential_access", name: "CREDENTIAL ACCESS", code: "TA0006", techniques: [] },
  { id: "discovery", name: "DISCOVERY", code: "TA0007", techniques: [] },
  { id: "lateral_movement", name: "LATERAL MOVEMENT", code: "TA0008", techniques: [] },
  { id: "collection", name: "COLLECTION", code: "TA0009", techniques: [] },
  { id: "command_and_control", name: "COMMAND AND CONTROL", code: "TA0011", techniques: [] },
  { id: "exfiltration", name: "EXFILTRATION", code: "TA0010", techniques: [] },
  { id: "impact", name: "IMPACT", code: "TA0040", techniques: [] },
];

interface Technique {
  id: string;
  name: string;
  fullName?: string;
}

interface MitreMapping {
  [tacticId: string]: Technique[];
}

interface MitreAttackMappingProps {
  mapping?: MitreMapping;
  onMappingChange?: (mapping: MitreMapping) => void;
  readOnly?: boolean;
}

export function MitreAttackMapping({ 
  mapping = {}, 
  onMappingChange,
  readOnly = false 
}: MitreAttackMappingProps) {
  const { t } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [mitreVersion, setMitreVersion] = useState("unknown");
  const [mitreTactics, setMitreTactics] = useState<TacticDisplay[]>(DEFAULT_TACTICS);
  const [isLoading, setIsLoading] = useState(true);

  // Load MITRE data on mount (from cache or fetch from GitHub)
  useEffect(() => {
    setIsLoading(true);
    loadMitreData()
      .then(({ tactics, version }) => {
        const displayTactics = convertToDisplayFormat(tactics);
        setMitreTactics(displayTactics);
        setMitreVersion(version);
      })
      .catch(err => {
        debugError("Failed to load MITRE data:", err);
        // Try to get version from cache even if load failed
        const cachedVersion = localStorage.getItem(STORAGE_KEYS.MITRE_VERSION);
        if (cachedVersion) {
          setMitreVersion(cachedVersion);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Fetched data for export confirmation
  const [pendingExportData, setPendingExportData] = useState<{ tactics: MitreTactic[]; version: string } | null>(null);

  // Fetch MITRE data (without download)
  const updateMitreData = async () => {
    setIsUpdating(true);
    try {
      const { tactics, version } = await fetchMitreData();
      const displayTactics = convertToDisplayFormat(tactics);
      setMitreTactics(displayTactics);
      const newVersion = version || DEFAULT_VERSION;
      setMitreVersion(newVersion);
      localStorage.setItem(STORAGE_KEYS.MITRE_VERSION, newVersion);
      
      // Store for export confirmation
      setPendingExportData({ tactics, version: newVersion });
      setShowUpdateConfirm(true);
      
      const techCount = tactics.reduce((sum, t) => sum + t.techniques.length, 0);
      const subTechCount = tactics.reduce((sum, t) => 
        sum + t.techniques.reduce((s, tech) => s + tech.subtechniques.length, 0), 0);
      toast.success(t("mitre.updateSuccess").replace("{techCount}", String(techCount)).replace("{subTechCount}", String(subTechCount)));
    } catch (error) {
      debugError("Failed to update MITRE data:", error);
      toast.error(t("mitre.updateFailed"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmExport = () => {
    if (pendingExportData) {
      // Download JSON file
      const jsonString = JSON.stringify(pendingExportData.tactics, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      downloadBlob(blob, "mitre_enterprise_attack.json");
      toast.success("Exported MITRE data successfully!");
    }
    setShowUpdateConfirm(false);
    setPendingExportData(null);
  };

  const handleCancelExport = () => {
    setShowUpdateConfirm(false);
    setPendingExportData(null);
  };

  // Memoized handlers to prevent unnecessary re-renders
  const addTechnique = useCallback((tacticId: string, technique: Technique) => {
    if (!technique.id) return;
    
    const newMapping = { ...mapping };
    if (!newMapping[tacticId]) {
      newMapping[tacticId] = [];
    }
    
    // Prevent duplicates (case-insensitive)
    if (newMapping[tacticId].some(t => t.id.toLowerCase() === technique.id.toLowerCase())) {
      toast.info(t("mitre.alreadyExists").replace("{id}", technique.id));
      return;
    }
    
    newMapping[tacticId].push(technique);
    onMappingChange?.(newMapping);
  }, [mapping, onMappingChange, t]);

  const removeTechnique = useCallback((tacticId: string, techniqueId: string) => {
    const newMapping = { ...mapping };
    newMapping[tacticId] = newMapping[tacticId]?.filter(t => t.id !== techniqueId) || [];
    if (newMapping[tacticId].length === 0) {
      delete newMapping[tacticId];
    }
    onMappingChange?.(newMapping);
  }, [mapping, onMappingChange]);

  const isSelected = useCallback((tacticId: string, techniqueId: string) => {
    return mapping[tacticId]?.some(t => t.id === techniqueId) || false;
  }, [mapping]);

  const toggleTechnique = useCallback((tacticId: string, technique: Technique) => {
    if (isSelected(tacticId, technique.id)) {
      removeTechnique(tacticId, technique.id);
    } else {
      addTechnique(tacticId, technique);
    }
  }, [isSelected, removeTechnique, addTechnique]);

  // Filter tactics based on search
  const filteredTactics = useMemo(() => {
    if (!searchQuery) return mitreTactics;
    const query = searchQuery.toLowerCase();
    return mitreTactics.map(tactic => ({
      ...tactic,
      techniques: tactic.techniques.map(tech => {
        const techMatches = 
          tech.id.toLowerCase().includes(query) ||
          tech.name.toLowerCase().includes(query) ||
          (tech.fullName && tech.fullName.toLowerCase().includes(query));
        
        const filteredSubs = tech.subtechniques?.filter(sub =>
          sub.id.toLowerCase().includes(query) ||
          sub.name.toLowerCase().includes(query)
        );
        
        if (techMatches) {
          return tech;
        } else if (filteredSubs && filteredSubs.length > 0) {
          return { ...tech, subtechniques: filteredSubs };
        }
        return null;
      }).filter((tech): tech is NonNullable<typeof tech> => tech !== null)
    })).filter(tactic => tactic.techniques.length > 0);
  }, [searchQuery, mitreTactics]);

  // Get all selected techniques across all tactics
  const allSelectedTechniques: { tacticId: string; tacticName: string; technique: Technique }[] = [];
  Object.entries(mapping).forEach(([tacticId, techniques]) => {
    const tactic = mitreTactics.find(t => t.id === tacticId);
    techniques.forEach(technique => {
      allSelectedTechniques.push({
        tacticId,
        tacticName: tactic?.name || tacticId,
        technique
      });
    });
  });

  return (
    <>
      {/* Export Confirmation Dialog */}
      <AlertDialog open={showUpdateConfirm} onOpenChange={setShowUpdateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              {t("mitre.exportTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("mitre.exportDescription").replace("{version}", pendingExportData?.version || mitreVersion)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelExport}>{t("mitre.exportNo")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExport}>
              {t("mitre.exportYes")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
      <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-mono text-left">
            {t("mitre.description")}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span>{t("mitre.loading")}</span>
                </>
              ) : (
                mitreVersion
              )}
            </span>
            <button
              onClick={updateMitreData}
              disabled={isUpdating || isLoading}
              className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-primary hover:text-primary/80 border border-primary/30 rounded-sm hover:bg-primary/10 transition-all disabled:opacity-50"
              title="Fetch latest from mitre-attack/attack-stix-data"
            >
              {isUpdating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              <span>{isUpdating ? t("mitre.updating") : t("mitre.updateExport")}</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="mitre-search"
            name="mitre-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("mitre.search")}
            aria-label="Search MITRE techniques"
            className="w-full pl-9 pr-9 py-2 text-sm font-mono bg-card border border-border rounded-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      {/* Grid Layout - 3 columns per row */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="rounded-sm border border-border/50 bg-card/50 overflow-hidden">
              <div className="px-3 py-2 bg-muted/30 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
              </div>
              <div className="p-2 space-y-1">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-6 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filteredTactics.map((tactic) => (
            <MemoizedTacticColumn
              key={tactic.id}
              tactic={tactic}
              mapping={mapping}
              isSelected={isSelected}
              toggleTechnique={toggleTechnique}
              readOnly={readOnly}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}

      {/* Selected Techniques Section */}
      {allSelectedTechniques.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs font-mono text-muted-foreground mb-3 text-left">{t("mitre.selected")}</p>
          <div className="flex flex-wrap gap-2">
            {allSelectedTechniques.map(({ tacticId, technique }) => (
              <button
                key={`${tacticId}-${technique.id}`}
                onClick={() => !readOnly && removeTechnique(tacticId, technique.id)}
                disabled={readOnly}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-mono",
                  "bg-primary/20 text-primary border border-primary/40",
                  "hover:bg-primary/30 hover:border-primary/60 transition-all",
                  readOnly && "cursor-default"
                )}
                title={`${technique.id}: ${technique.name} (${t("mitre.clickToRemove")})`}
              >
                {technique.id}
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  );
}

interface TacticColumnProps {
  tactic: TacticDisplay;
  mapping: MitreMapping;
  isSelected: (tacticId: string, techniqueId: string) => boolean;
  toggleTechnique: (tacticId: string, technique: Technique) => void;
  readOnly: boolean;
  searchQuery: string;
}

function TacticColumn({ 
  tactic, 
  mapping, 
  isSelected, 
  toggleTechnique, 
  readOnly,
  searchQuery,
}: TacticColumnProps) {
  const [expandedTechs, setExpandedTechs] = useState<Set<string>>(new Set());
  const [showTechniques, setShowTechniques] = useState(false);
  
  const selectedTechniques = mapping[tactic.id] || [];
  const selectedCount = selectedTechniques.length;
  
  const customSelected = selectedTechniques.filter(t => !tactic.techniques.some(tt => tt.id === t.id));

  // Auto-expand when searching, collapse when cleared
  useEffect(() => {
    if (searchQuery && tactic.techniques.length > 0) {
      setShowTechniques(true);
      // Also expand techniques that have matching sub-techniques
      const techsWithMatchingSubs = tactic.techniques
        .filter(t => t.subtechniques && t.subtechniques.length > 0)
        .map(t => t.id);
      setExpandedTechs(new Set(techsWithMatchingSubs));
    } else if (!searchQuery) {
      // Collapse when search is cleared
      setShowTechniques(false);
      setExpandedTechs(new Set());
    }
  }, [searchQuery, tactic.techniques]);

  const toggleTechExpand = (techId: string) => {
    const newSet = new Set(expandedTechs);
    if (newSet.has(techId)) {
      newSet.delete(techId);
    } else {
      newSet.add(techId);
    }
    setExpandedTechs(newSet);
  };

  return (
    <div className="flex flex-col border border-border/50 rounded-sm overflow-hidden">
      {/* Header - chevron on right */}
      <button
        onClick={() => setShowTechniques(!showTechniques)}
        className="flex items-center gap-2 bg-secondary/30 border-b border-border/50 px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left"
      >
        <h4 className="flex-1 text-sm font-bold text-primary tracking-wide font-terminal">
          <a
            href={`https://attack.mitre.org/tactics/${tactic.code}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline font-normal mr-1.5"
            title={`View ${tactic.code} on MITRE ATT&CK`}
            onClick={(e) => e.stopPropagation()}
          >
            {tactic.code}
          </a>
          {tactic.name}
        </h4>
        {selectedCount > 0 && (
          <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono font-medium">
            {selectedCount}
          </span>
        )}
        <span className="text-xs text-muted-foreground font-mono">
          {tactic.techniques.length}
        </span>
        {showTechniques ? (
          <ChevronDown className="w-4 h-4 text-primary" />
        ) : (
          <ChevronRight className="w-4 h-4 text-primary" />
        )}
      </button>
      
      {/* Techniques list */}
      {showTechniques && (
        <div className="bg-card/20 max-h-[320px] overflow-y-auto">
          {tactic.techniques.map(tech => (
            <TechniqueRow
              key={tech.id}
              technique={tech}
              tacticId={tactic.id}
              isSelected={isSelected(tactic.id, tech.id)}
              isSubExpanded={expandedTechs.has(tech.id)}
              selectedTechniques={selectedTechniques}
              toggleTechnique={toggleTechnique}
              toggleTechExpand={toggleTechExpand}
              readOnly={readOnly}
            />
          ))}
          {customSelected.map(tech => (
            <TechniqueRow
              key={tech.id}
              technique={{ ...tech, subtechniques: [] }}
              tacticId={tactic.id}
              isSelected={true}
              isSubExpanded={false}
              selectedTechniques={selectedTechniques}
              toggleTechnique={toggleTechnique}
              toggleTechExpand={toggleTechExpand}
              readOnly={readOnly}
              isCustom
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Memoized TechniqueRow for fine-grained updates
interface TechniqueRowProps {
  technique: TacticDisplay['techniques'][0];
  tacticId: string;
  isSelected: boolean;
  isSubExpanded: boolean;
  selectedTechniques: Technique[];
  toggleTechnique: (tacticId: string, technique: Technique) => void;
  toggleTechExpand: (techId: string) => void;
  readOnly: boolean;
  isCustom?: boolean;
}

const TechniqueRow = memo(
  function TechniqueRow({
    technique,
    tacticId,
    isSelected,
    isSubExpanded,
    selectedTechniques,
    toggleTechnique,
    toggleTechExpand,
    readOnly,
    isCustom = false,
  }: TechniqueRowProps) {
    const fullName = technique.fullName || technique.name;
    const hasSubs = technique.subtechniques && technique.subtechniques.length > 0;
    
    return (
      <div className="border-b border-border/20 last:border-b-0">
        <div className="flex items-center gap-1 py-1 px-2">
          {/* Technique ID - clickable link to MITRE */}
          <a
            href={`https://attack.mitre.org/techniques/${technique.id}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-accent hover:underline shrink-0"
            title={`View ${technique.id} on MITRE ATT&CK`}
            onClick={(e) => e.stopPropagation()}
          >
            {technique.id}
          </a>
          
          {/* Technique name - clickable to select */}
          <button
            onClick={() => !readOnly && toggleTechnique(tacticId, technique)}
            disabled={readOnly}
            className={cn(
              "flex-1 text-left text-sm font-mono transition-all truncate",
              isSelected || isCustom
                ? "text-primary font-medium" 
                : "text-foreground/70 hover:text-primary"
            )}
            title={`${technique.id}: ${fullName}`}
          >
            {fullName}
          </button>
          
          {/* Selection indicator */}
          {isSelected && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
          
          {/* Sub-techniques chevron */}
          {hasSubs && (
            <button
              onClick={() => toggleTechExpand(technique.id)}
              className="p-0.5 text-muted-foreground hover:text-primary shrink-0"
              title={`${technique.subtechniques!.length} sub-techniques`}
            >
              {isSubExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
        
        {/* Sub-techniques */}
        {hasSubs && isSubExpanded && (
          <div className="ml-6 border-l-2 border-border/40 bg-card/30 mb-1">
            {technique.subtechniques!.map(sub => {
              const subSelected = selectedTechniques.some(t => t.id === sub.id);
              return (
                <div key={sub.id} className="flex items-center gap-1 py-1 px-2">
                  <a
                    href={`https://attack.mitre.org/techniques/${sub.id.replace('.', '/')}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-accent/70 hover:underline shrink-0"
                    title={`View ${sub.id} on MITRE ATT&CK`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {sub.id}
                  </a>
                  <button
                    onClick={() => !readOnly && toggleTechnique(tacticId, { id: sub.id, name: sub.name, fullName: `${technique.fullName}: ${sub.name}` })}
                    disabled={readOnly}
                    className={cn(
                      "flex-1 text-left text-sm font-mono transition-all truncate",
                      subSelected
                        ? "text-primary font-medium" 
                        : "text-foreground/60 hover:text-primary"
                    )}
                    title={`${sub.id}: ${sub.name}`}
                  >
                    {sub.name}
                  </button>
                  {subSelected && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.technique.id === nextProps.technique.id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isSubExpanded === nextProps.isSubExpanded &&
      prevProps.readOnly === nextProps.readOnly &&
      prevProps.isCustom === nextProps.isCustom &&
      // Check sub-technique selections
      (prevProps.technique.subtechniques || []).every(sub => 
        prevProps.selectedTechniques.some(t => t.id === sub.id) === 
        nextProps.selectedTechniques.some(t => t.id === sub.id)
      )
    );
  }
);


// Memoized version of TacticColumn to prevent unnecessary re-renders
const MemoizedTacticColumn = memo(TacticColumn, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.tactic.id === nextProps.tactic.id &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.searchQuery === nextProps.searchQuery &&
    // Deep compare mapping for this specific tactic
    JSON.stringify(prevProps.mapping[prevProps.tactic.id]) === 
    JSON.stringify(nextProps.mapping[nextProps.tactic.id])
  );
});

