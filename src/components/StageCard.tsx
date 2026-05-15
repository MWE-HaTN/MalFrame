import { ReactNode, useId, memo } from "react";
import { GripVertical, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface StageCardProps {
  stageNumber: number;
  stageName: string;
  onStageNameChange: (value: string) => void;
  placeholder?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  canDelete: boolean;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  children: ReactNode;
}

export const StageCard = memo(function StageCard({
  stageNumber,
  stageName,
  onStageNameChange,
  placeholder,
  isExpanded,
  onToggleExpand,
  onDelete,
  canDelete,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
  children,
}: StageCardProps) {
  const inputId = useId();
  
  return (
    <div
      className={cn(
        "border border-border rounded-md bg-card/50 transition-all",
        isDragging && "opacity-50 border-primary",
        isDragOver && "border-primary/50 bg-primary/5"
      )}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/30"
        onClick={onToggleExpand}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggleExpand(); } }}
        role="button"
        tabIndex={0}
      >
        <div
          className="cursor-grab hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-mono text-primary shrink-0">Stage {stageNumber}</span>
        <span className="text-muted-foreground">–</span>
        <Input
          id={inputId}
          name={`stage-name-${stageNumber}`}
          value={stageName}
          onChange={(e) => onStageNameChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder={placeholder}
          aria-label={`Stage ${stageNumber} name`}
          className="h-6 text-xs bg-transparent border-none px-1 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div className="flex-1" />
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/50">
          {children}
        </div>
      )}
    </div>
  );
});