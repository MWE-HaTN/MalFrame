import { useState, useRef, useEffect } from "react";
import { Plus, X, Pencil, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import type { CaseMeta } from "@/types/cases";
import type { UseCaseManagerReturn } from "@/hooks/useCaseManager";

type Props = Omit<UseCaseManagerReturn, "activeStorageKey">;

export function CaseSwitcher({ cases, activeCaseId, createCase, switchCase, deleteCase, renameCase }: Props) {
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startRename = (c: CaseMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingName(c.name);
  };

  const commitRename = () => {
    if (editingId) renameCase(editingId, editingName);
    setEditingId(null);
  };

  if (cases.length === 0) return null;

  return (
    <div className="flex items-center gap-2 py-0.5">
      <FolderOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground shrink-0 select-none">{t("cases.label")}</span>

      {/* Scrollable case tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0 pb-px scrollbar-hide">
        {cases.map((c) => {
          const isActive = c.id === activeCaseId;
          const isEditing = editingId === c.id;

          return (
            <div
              key={c.id}
              role={isActive ? undefined : "button"}
              tabIndex={isActive ? undefined : 0}
              className={cn(
                "group flex items-center gap-1 rounded border px-2 py-0.5 text-xs shrink-0 select-none transition-colors",
                isActive
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/40 bg-muted/20 text-muted-foreground hover:border-border/70 hover:text-foreground cursor-pointer"
              )}
              onClick={() => !isEditing && !isActive && switchCase(c.id)}
              onKeyDown={(e) => {
                if (!isActive && (e.key === "Enter" || e.key === " ")) switchCase(c.id);
              }}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  className="bg-transparent outline-none w-24 text-xs text-foreground caret-primary"
                  value={editingName}
                  maxLength={32}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                    if (e.key === "Escape") setEditingId(null);
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="max-w-[128px] truncate">{c.name}</span>
              )}

              {/* Rename button — only on active, non-editing */}
              {isActive && !isEditing && (
                <button
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity ml-0.5"
                  onClick={(e) => startRename(c, e)}
                  title={t("cases.rename")}
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              )}

              {/* Delete button — hidden when only 1 case */}
              {cases.length > 1 && (
                <button
                  className="opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:text-destructive transition-all"
                  onClick={(e) => { e.stopPropagation(); deleteCase(c.id); }}
                  title={t("cases.delete")}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* New case button */}
      <button
        onClick={createCase}
        className="flex items-center gap-1 rounded border border-dashed border-border/40 px-2 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors shrink-0 select-none"
        title={t("cases.new")}
      >
        <Plus className="w-3 h-3" />
        <span>{t("cases.new")}</span>
      </button>
    </div>
  );
}
