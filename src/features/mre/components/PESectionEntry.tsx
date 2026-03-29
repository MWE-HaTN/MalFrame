import { useCallback, memo } from "react";
import { cn, generateId } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import type { PESectionData } from "@/types/dashboard";
import { getEntropyColorClass, getRWXBadgeClass } from "@/lib/semanticColors";

interface PESectionEntryProps {
  entries: PESectionData[];
  onEntriesChange: (entries: PESectionData[]) => void;
  className?: string;
}

interface PESectionRowProps {
  entry: PESectionData;
  index: number;
  canDelete: boolean;
  onUpdate: (id: string, updates: Partial<PESectionData>) => void;
  onDelete: (id: string) => void;
}

const PESectionRow = memo(function PESectionRow({ entry, index, canDelete, onUpdate, onDelete }: PESectionRowProps) {
  return (
    <div 
      className="grid grid-cols-[40px_minmax(80px,1fr)_minmax(70px,0.8fr)_minmax(60px,0.6fr)_minmax(50px,0.5fr)_minmax(120px,2fr)_32px] gap-2 px-3 py-2 items-center border-b border-border/30 last:border-b-0 hover:bg-card/20 transition-colors"
    >
      <span className="text-xs font-mono text-muted-foreground text-center">{index + 1}</span>
      <input
        id={`pe-section-name-${entry.id}`}
        name={`pe-section-name-${entry.id}`}
        type="text"
        value={entry.sectionName}
        onChange={(e) => onUpdate(entry.id, { sectionName: e.target.value })}
        placeholder=".text"
        aria-label="Section Name"
        className={cn(
          "w-full bg-transparent border-none text-sm font-mono text-foreground",
          "placeholder:text-muted-foreground/50 focus:outline-none"
        )}
      />
      <input
        id={`pe-section-size-${entry.id}`}
        name={`pe-section-size-${entry.id}`}
        type="text"
        value={entry.size}
        onChange={(e) => onUpdate(entry.id, { size: e.target.value })}
        placeholder="0 KB"
        aria-label="Size"
        className={cn(
          "w-full bg-transparent border-none text-sm font-mono text-foreground",
          "placeholder:text-muted-foreground/50 focus:outline-none"
        )}
      />
      <input
        id={`pe-section-entropy-${entry.id}`}
        name={`pe-section-entropy-${entry.id}`}
        type="text"
        value={entry.entropy}
        onChange={(e) => onUpdate(entry.id, { entropy: e.target.value })}
        placeholder="0.00"
        aria-label="Entropy"
        className={cn(
          "w-full bg-transparent border-none text-sm font-mono",
          "placeholder:text-muted-foreground/50 focus:outline-none",
          getEntropyColorClass(entry.entropy) || "text-foreground"
        )}
      />
      <input
        id={`pe-section-permissions-${entry.id}`}
        name={`pe-section-permissions-${entry.id}`}
        type="text"
        value={entry.permissions}
        onChange={(e) => onUpdate(entry.id, { permissions: e.target.value })}
        placeholder="R-X"
        aria-label="Permissions"
        className={cn(
          "w-full bg-transparent border-none text-sm font-mono font-medium",
          "placeholder:text-muted-foreground/50 focus:outline-none",
          getRWXBadgeClass(entry.permissions) || "text-foreground"
        )}
      />
      <input
        id={`pe-section-hash-${entry.id}`}
        name={`pe-section-hash-${entry.id}`}
        type="text"
        value={entry.sectionHash}
        onChange={(e) => onUpdate(entry.id, { sectionHash: e.target.value })}
        placeholder="hash..."
        aria-label="Section Hash"
        className={cn(
          "w-full bg-transparent border-none text-sm font-mono text-foreground",
          "placeholder:text-muted-foreground/50 focus:outline-none"
        )}
      />
      <button
        type="button"
        onClick={() => onDelete(entry.id)}
        className={cn(
          "p-1 transition-colors",
          !canDelete 
            ? "text-muted-foreground/30 cursor-not-allowed" 
            : "text-muted-foreground hover:text-destructive"
        )}
        title={!canDelete ? "Cannot delete last section" : "Delete section"}
        disabled={!canDelete}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});

export function PESectionEntry({ entries, onEntriesChange, className }: PESectionEntryProps) {
  const createId = () => generateId("pe");

  const addEntry = useCallback(() => {
    const newEntry: PESectionData = {
      id: createId(),
      sectionName: "",
      size: "",
      entropy: "",
      permissions: "",
      sectionHash: "",
      images: [],
      timestamp: new Date().toISOString(),
    };
    onEntriesChange([...entries, newEntry]);
  }, [entries, onEntriesChange]);

  const updateEntry = useCallback((id: string, updates: Partial<PESectionData>) => {
    onEntriesChange(
      entries.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  }, [entries, onEntriesChange]);

  const deleteEntry = useCallback((id: string) => {
    if (entries.length <= 1) return;
    onEntriesChange(entries.filter((entry) => entry.id !== id));
  }, [entries, onEntriesChange]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Table */}
      <div className="border border-border rounded-sm bg-card/30 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[40px_minmax(80px,1fr)_minmax(70px,0.8fr)_minmax(60px,0.6fr)_minmax(50px,0.5fr)_minmax(120px,2fr)_32px] gap-2 px-3 py-2.5 bg-card/50 border-b border-border text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          <span className="text-center">#</span>
          <span>Name</span>
          <span>Size</span>
          <span>Entropy</span>
          <span>RWX</span>
          <span>Hash</span>
          <span></span>
        </div>

        {/* Table rows */}
        {entries.map((entry, index) => (
          <PESectionRow
            key={entry.id}
            entry={entry}
            index={index}
            canDelete={entries.length > 1}
            onUpdate={updateEntry}
            onDelete={deleteEntry}
          />
        ))}

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="px-4 py-4 text-center text-xs text-muted-foreground">
            No PE sections added
          </div>
        )}
      </div>

      {/* Add entry button */}
      <button
        type="button"
        onClick={addEntry}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2",
          "border border-dashed border-border rounded-sm",
          "text-sm font-mono text-muted-foreground",
          "hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
        )}
      >
        <Plus className="w-4 h-4" />
        <span>Add Section</span>
      </button>
    </div>
  );
}
