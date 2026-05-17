import { useState, useRef, useEffect, useMemo, memo } from "react";
import { Trash2, FileIcon, Copy, GripVertical, ArrowUpDown, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn, parseSizeToBytes, copyToClipboard } from "@/lib/utils";
import { clearImagesForHash } from "@/lib/imageStorage";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Artifact } from "@/types/dashboard";

// Available "Used In" options for MIA Dashboard artifacts
const USED_IN_OPTIONS = [
  "Static Analysis",
  "Behavior Analysis",
  "Network Activity",
  "Memory Artifacts",
  "Process Tree",
  "IOC Table",
  "Attack Timeline",
  "Reporting",
] as const;

interface EvidenceArtifactsProps {
  artifacts: Artifact[];
  onArtifactsChange: (artifacts: Artifact[]) => void;
  onSampleSelected?: (artifact: Artifact) => void; // Callback when "Sample" type is selected
  onSampleCleared?: () => void; // Callback when type changes FROM "Sample" to something else
}

const ARTIFACT_TYPES = [
  "Unclassified",
  "Sample",
  "Executable",
  "Document",
  "Script",
  "Memory Dump",
  "Network Capture",
  "Log File",
  "Registry Export",
  "Disk Image",
  "Configuration",
  "Other",
];

type SortField = "name" | "type" | "size" | null;
type SortDirection = "asc" | "desc";



export const EvidenceArtifacts = memo(function EvidenceArtifacts({ artifacts, onArtifactsChange, onSampleSelected, onSampleCleared }: EvidenceArtifactsProps) {
  const { t } = useLanguage();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const undoTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const artifactsRef = useRef(artifacts);
  artifactsRef.current = artifacts;

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const timeouts = undoTimeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  // Sort artifacts
  const sortedArtifacts = useMemo(() => [...artifacts].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
      case "size":
        comparison = parseSizeToBytes(a.size) - parseSizeToBytes(b.size);
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  }), [artifacts, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection("asc");
      } else {
        setSortDirection("desc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />;
    return <ArrowUpDown className={cn("w-3 h-3", sortDirection === "asc" ? "text-primary" : "text-primary rotate-180")} />;
  };

  const canRemove = (artifact: Artifact): boolean => {
    return artifact.type !== "Sample" || artifact.usedIn.length === 0;
  };

  const handleRemove = (artifact: Artifact) => {
    if (!canRemove(artifact)) return;

    // Remove from list
    const remainingArtifacts = artifacts.filter((item) => item.id !== artifact.id);
    onArtifactsChange(remainingArtifacts);

    // Clear any existing timeout for this artifact
    const existingTimeout = undoTimeoutsRef.current.get(artifact.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Show toast with undo action — use captured `artifact` and ref for latest state
    toast(t("evidence.artifactRemoved"), {
      action: {
        label: t("evidence.undo"),
        onClick: () => {
          onArtifactsChange([...artifactsRef.current.filter((item) => item.id !== artifact.id), artifact]);
          const timeout = undoTimeoutsRef.current.get(artifact.id);
          if (timeout) {
            clearTimeout(timeout);
            undoTimeoutsRef.current.delete(artifact.id);
          }
        },
      },
      duration: 5000,
    });

    // Clear associated images after timeout
    const newTimeout = setTimeout(() => {
      if (artifact.sha256) {
        clearImagesForHash(artifact.sha256);
      }
      undoTimeoutsRef.current.delete(artifact.id);
    }, 5000);
    undoTimeoutsRef.current.set(artifact.id, newTimeout);
  };

  const handleTypeChange = (artifactId: string, newType: string) => {
    const artifact = artifacts.find((item) => item.id === artifactId);
    if (!artifact) return;

    const oldType = artifact.type;
    if (oldType === newType) return;

    // Downgrade existing "Sample" if another artifact already has that type
    let updatedArtifacts = artifacts.map((item) =>
      item.id === artifactId ? { ...item, type: newType } : item
    );
    if (newType === "Sample") {
      updatedArtifacts = updatedArtifacts.map((item) =>
        item.id !== artifactId && item.type === "Sample" ? { ...item, type: "Unclassified" } : item
      );
    }
    onArtifactsChange(updatedArtifacts);

    if (newType === "Sample" && onSampleSelected) {
      const updatedArtifact = { ...artifact, type: newType };
      onSampleSelected(updatedArtifact);
      toast.success(`Sample Info updated: ${artifact.name}`);
    }

    // Only clear Sample Info if no remaining artifact has "Sample" type
    if (oldType === "Sample" && newType !== "Sample" && onSampleCleared) {
      const hasOtherSample = updatedArtifacts.some((item) => item.type === "Sample");
      if (!hasOtherSample) {
        onSampleCleared();
        toast.info(t("evidence.sampleInfoCleared"));
      }
    }
  };


  // Drag and drop handlers
  const handleDragStart = (event: React.DragEvent, artifactId: string) => {
    setDraggedId(artifactId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", artifactId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (draggedId && draggedId !== targetId) {
      setDragOverId(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const draggedIndex = artifacts.findIndex((item) => item.id === draggedId);
    const targetIndex = artifacts.findIndex((item) => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reorderedArtifacts = [...artifacts];
    const [draggedArtifact] = reorderedArtifacts.splice(draggedIndex, 1);
    const adjustedIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    reorderedArtifacts.splice(adjustedIndex, 0, draggedArtifact);

    onArtifactsChange(reorderedArtifacts);
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-3">
      {artifacts.length > 0 ? (
        <div className="border border-border rounded-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm table-fixed min-w-[750px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="w-[32px]"></th>
                <th className="px-3 py-2 text-left text-xs font-terminal uppercase tracking-wider text-muted-foreground w-[180px]">
                  <button 
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Name {getSortIcon("name")}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-terminal uppercase tracking-wider text-muted-foreground w-[110px]">
                  <button 
                    onClick={() => handleSort("type")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Type {getSortIcon("type")}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-terminal uppercase tracking-wider text-muted-foreground w-[200px]">
                  SHA256
                </th>
                <th className="px-3 py-2 text-left text-xs font-terminal uppercase tracking-wider text-muted-foreground w-[70px]">
                  <button 
                    onClick={() => handleSort("size")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Size {getSortIcon("size")}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-terminal uppercase tracking-wider text-muted-foreground w-[240px]">
                  Used In
                </th>
                <th className="w-[40px]"></th>
              </tr>
            </thead>
            <tbody>
              {sortedArtifacts.map((artifact) => (
                <tr
                  key={artifact.id}
                  draggable={!sortField}
                  onDragStart={(e) => handleDragStart(e, artifact.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, artifact.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, artifact.id)}
                  className={cn(
                    "border-b border-border/50 last:border-0 hover:bg-muted/20 transition-all group",
                    draggedId === artifact.id && "opacity-50 bg-muted/30",
                    dragOverId === artifact.id && "border-t-2 border-t-primary"
                  )}
                  onMouseEnter={() => setHoveredRow(artifact.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="px-1 py-2">
                    <div className="cursor-grab active:cursor-grabbing flex justify-center">
                      <GripVertical className="w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-mono text-foreground truncate text-xs" title={artifact.name}>
                        {artifact.name}
                      </span>
                      <button
                        onClick={() => copyToClipboard(artifact.name, "Name")}
                        className="p-0.5 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        aria-label={t("common.copyName")}
                        title={t("common.copyName")}
                      >
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      id={`artifact-type-${artifact.id}`}
                      name={`artifact-type-${artifact.id}`}
                      value={artifact.type}
                      onChange={(e) => handleTypeChange(artifact.id, e.target.value)}
                      aria-label={t("aria.artifactType")}
                      className={cn(
                        "w-full bg-background border border-border/50 rounded px-2 py-1 text-xs font-mono",
                        "focus:outline-none focus:border-primary",
                        artifact.type === "Unclassified" && "text-muted-foreground italic",
                        artifact.type === "Sample" && "text-primary font-semibold"
                      )}
                    >
                      {ARTIFACT_TYPES.map((type) => (
                        <option key={type} value={type} className="bg-background text-foreground">
                          {type}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground font-mono truncate" title={artifact.sha256}>
                        {artifact.sha256 ? `${artifact.sha256.substring(0, 16)}...` : "—"}
                      </span>
                      {artifact.sha256 && (
                        <button
                          onClick={() => copyToClipboard(artifact.sha256, "SHA256")}
                          className="p-0.5 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          aria-label={t("common.copySha256")}
                          title={t("common.copySha256")}
                        >
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                    {artifact.size}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {artifact.usedIn.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-5 gap-1 font-mono"
                        >
                          {tag}
                          <button
                            onClick={() => {
                              const updatedArtifacts = artifacts.map((item) =>
                                item.id === artifact.id
                                  ? { ...item, usedIn: item.usedIn.filter((usedInTag) => usedInTag !== tag) }
                                  : item
                              );
                              onArtifactsChange(updatedArtifacts);
                            }}
                            className="hover:text-destructive transition-colors ml-0.5"
                            aria-label={`Remove tag ${tag}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 hover:bg-muted"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          {USED_IN_OPTIONS.map((option) => (
                            <DropdownMenuCheckboxItem
                              key={option}
                              checked={artifact.usedIn.includes(option)}
                              onCheckedChange={(checked) => {
                                const updatedArtifacts = artifacts.map((item) =>
                                  item.id === artifact.id
                                    ? {
                                        ...item,
                                        usedIn: checked
                                          ? [...item.usedIn, option]
                                          : item.usedIn.filter((usedInTag) => usedInTag !== option),
                                      }
                                    : item
                                );
                                onArtifactsChange(updatedArtifacts);
                              }}
                            >
                              {option}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    {/* Delete icon - only visible on hover and when removable */}
                    <button
                      onClick={() => handleRemove(artifact)}
                      className={cn(
                        "p-1 rounded hover:bg-destructive/20 transition-all",
                        hoveredRow === artifact.id && canRemove(artifact)
                          ? "opacity-100"
                          : "opacity-0 pointer-events-none"
                      )}
                      aria-label={t("common.deleteFromCase")}
                      title={t("common.deleteFromCase")}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-dashed border-border/50 rounded-sm p-6 text-center">
          <FileIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("evidence.noArtifacts")}</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            {t("evidence.addArtifactHint")}
          </p>
        </div>
      )}
    </div>
  );
});
