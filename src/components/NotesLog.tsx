import { useRef, useEffect, ClipboardEvent, memo } from "react";
import { cn, generateId } from "@/lib/utils";
import { Plus, Trash2, Image, ChevronUp, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LogEntry } from "@/types/dashboard";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { ImageGrid } from "@/components/ui/image-grid";

interface NotesLogProps {
  entries: LogEntry[];
  onEntriesChange: (entries: LogEntry[]) => void;
  placeholder?: string;
  className?: string;
  hideAddButton?: boolean;
  maxEntriesPerRow?: number;
  allowImages?: boolean;
}

export const NotesLog = memo(function NotesLog({ entries, onEntriesChange, placeholder, className, hideAddButton = false, maxEntriesPerRow, allowImages = true }: NotesLogProps) {
  const { t } = useLanguage();
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Auto-create entry if empty and hideAddButton is true - sync once on mount
  useEffect(() => {
    if (entries.length === 0 && hideAddButton) {
      onEntriesChange([{ id: generateId("entry"), text: "", images: [], timestamp: new Date().toLocaleString() }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideAddButton]);

  // Use entries directly - if empty with hideAddButton, the effect above handles initialization
  const effectiveEntries = entries;

  const addEntry = () => {
    const newEntry: LogEntry = {
      id: generateId("entry"),
      text: "",
      images: [],
      timestamp: new Date().toLocaleString(),
    };
    onEntriesChange([...entries, newEntry]);
  };

  const updateEntry = (id: string, updates: Partial<LogEntry>) => {
    onEntriesChange(
      entries.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  };

  const deleteEntry = (id: string) => {
    onEntriesChange(entries.filter((entry) => entry.id !== id));
  };

  const moveEntry = (entryId: string, direction: "up" | "down") => {
    const currentIndex = entries.findIndex((entry) => entry.id === entryId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= entries.length) return;
    
    const reorderedEntries = [...entries];
    [reorderedEntries[currentIndex], reorderedEntries[targetIndex]] = [reorderedEntries[targetIndex], reorderedEntries[currentIndex]];
    onEntriesChange(reorderedEntries);
  };

  const handlePaste = (pasteEvent: ClipboardEvent<HTMLTextAreaElement>, entryId: string) => {
    if (!allowImages) return;
    
    const clipboardItems = pasteEvent.clipboardData?.items;
    if (!clipboardItems) return;

    for (let itemIndex = 0; itemIndex < clipboardItems.length; itemIndex++) {
      const clipboardItem = clipboardItems[itemIndex];
      if (clipboardItem.type.startsWith("image/")) {
        pasteEvent.preventDefault();
        const imageFile = clipboardItem.getAsFile();
        if (imageFile) {
          const fileReader = new FileReader();
          fileReader.onload = (loadEvent) => {
            const base64Data = loadEvent.target?.result as string;
            const targetEntry = entries.find((entry) => entry.id === entryId);
            if (targetEntry) {
              updateEntry(entryId, { images: [...targetEntry.images, base64Data] });
            }
          };
          fileReader.readAsDataURL(imageFile);
        }
        break;
      }
    }
  };

  const handleFileSelect = (changeEvent: React.ChangeEvent<HTMLInputElement>, entryId: string) => {
    const selectedFiles = changeEvent.target.files;
    if (!selectedFiles) return;

    const targetEntry = entries.find((entry) => entry.id === entryId);
    if (!targetEntry) return;

    Array.from(selectedFiles).forEach((imageFile) => {
      if (imageFile.type.startsWith("image/")) {
        const fileReader = new FileReader();
        fileReader.onload = (loadEvent) => {
          const base64Data = loadEvent.target?.result as string;
          updateEntry(entryId, { images: [...targetEntry.images, base64Data] });
        };
        fileReader.readAsDataURL(imageFile);
      }
    });

    // Reset input
    const inputRef = fileInputRefs.current.get(entryId);
    if (inputRef) inputRef.value = "";
  };

  const removeImage = (entryId: string, imageIndex: number) => {
    const targetEntry = entries.find((entry) => entry.id === entryId);
    if (!targetEntry) return;
    updateEntry(entryId, {
      images: targetEntry.images.filter((_, index) => index !== imageIndex),
    });
  };

  // Determine grid columns based on maxEntriesPerRow
  const getGridClass = () => {
    if (!maxEntriesPerRow) return "space-y-3";
    if (maxEntriesPerRow === 2) return "grid grid-cols-1 md:grid-cols-2 gap-3";
    if (maxEntriesPerRow === 3) return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3";
    if (maxEntriesPerRow >= 4) return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3";
    return "space-y-3";
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Entry list */}
      <div className={getGridClass()}>
        {effectiveEntries.map((entry, index) => (
          <div
            key={entry.id}
            className="border border-border rounded-sm bg-card/30 overflow-hidden"
          >
            {/* Entry header */}
            <div className="flex items-center justify-between px-3 py-2 bg-card/50 border-b border-border">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-primary font-mono font-semibold">
                  #{index + 1}
                </span>
                <input
                  id={`entry-name-${entry.id}`}
                  name={`entry-name-${entry.id}`}
                  type="text"
                  value={entry.imageName || ""}
                  onChange={(e) => updateEntry(entry.id, { imageName: e.target.value })}
                  placeholder="Name..."
                  className="bg-transparent border-none text-sm text-muted-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:text-foreground w-20 md:w-28"
                />
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => moveEntry(entry.id, "up")}
                  disabled={index === 0}
                  className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveEntry(entry.id, "down")}
                  disabled={index === effectiveEntries.length - 1}
                  className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {allowImages && (
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current.get(entry.id)?.click()}
                    className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
                    title={t("notes.tooltip.addImage")}
                  >
                    <Image className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteEntry(entry.id)}
                  className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                  title={t("notes.tooltip.deleteEntry")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {allowImages && (
                  <input
                    ref={(el) => {
                      if (el) fileInputRefs.current.set(entry.id, el);
                    }}
                    id={`file-upload-${entry.id}`}
                    name={`file-upload-${entry.id}`}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e, entry.id)}
                    className="hidden"
                    aria-label="Upload image files"
                  />
                )}
              </div>
            </div>

            {/* Entry content */}
            <div className="p-3 space-y-2">
              <AutoTextarea
                id={`notes-entry-${entry.id}`}
                name={`notes-entry-${entry.id}`}
                value={entry.text}
                onChange={(e) => updateEntry(entry.id, { text: e.target.value })}
                onPaste={(e) => handlePaste(e, entry.id)}
                placeholder={allowImages ? (placeholder || "Write notes here... (Ctrl+V to paste images)") : (placeholder || "Write notes here...")}
                minHeight={72}
              />

              {/* Images */}
              <ImageGrid 
                images={entry.images}
                onRemove={(imgIndex) => removeImage(entry.id, imgIndex)}
                imageHeight="h-32"
                clickToOpen
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add entry button */}
      {!hideAddButton && (
        <button
          type="button"
          onClick={addEntry}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3",
            "border border-dashed border-border rounded-sm",
            "text-sm font-mono text-muted-foreground",
            "hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
          )}
        >
          <Plus className="w-4 h-4" />
          <span>{t("notes.addEntry")}</span>
        </button>
      )}

      {/* Empty state - only show when add button is visible */}
      {entries.length === 0 && !hideAddButton && (
        <p className="text-center text-xs text-muted-foreground py-2">
          {t("notes.emptyClick")}
        </p>
      )}
    </div>
  );
});
