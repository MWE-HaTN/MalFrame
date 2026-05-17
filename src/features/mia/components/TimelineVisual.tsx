import { memo, useMemo } from "react";
import { Clock, Info, TriangleAlert, CircleAlert, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import type { TimelineEvent } from "@/types/dashboard";

interface TimelineVisualProps {
  events: TimelineEvent[];
  onRemove: (id: string) => void;
  severityOptions: { value: string; label: string; color: string; bgColor: string }[];
  deleteLabel: string;
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "warning":
      return <TriangleAlert className="w-3.5 h-3.5" />;
    case "critical":
      return <CircleAlert className="w-3.5 h-3.5" />;
    case "info":
      return <Clock className="w-3.5 h-3.5" />;
    default:
      return <Info className="w-3.5 h-3.5" />;
  }
};

const getDotColor = (severity: string) => {
  switch (severity) {
    case "warning":
      return "bg-warning border-warning/50";
    case "critical":
      return "bg-destructive border-destructive/50";
    default:
      return "bg-accent border-accent/50";
  }
};

const getCardBorder = (severity: string) => {
  switch (severity) {
    case "warning":
      return "border-warning/30";
    case "critical":
      return "border-destructive/30";
    default:
      return "border-accent/30";
  }
};

const severityPriority: Record<string, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

const TimelineVisualRow = memo(function TimelineVisualRow({
  event,
  severityOption,
  onRemove,
  deleteLabel,
}: {
  event: TimelineEvent;
  severityOption: { value: string; label: string; color: string; bgColor: string } | undefined;
  onRemove: (id: string) => void;
  deleteLabel: string;
}) {
  return (
    <div className="flex gap-4 group">
      {/* Timeline spine + dot */}
      <div className="flex flex-col items-center w-6 shrink-0">
        <div
          className={cn(
            "w-3 h-3 rounded-full border-2 shrink-0 mt-1.5 z-10",
            getDotColor(event.severity)
          )}
        />
        <div className="w-0.5 flex-1 bg-border/50" />
      </div>

      {/* Card */}
      <div
        className={cn(
          "flex-1 mb-4 p-3 rounded-md border bg-card/30 transition-colors",
          "hover:bg-card/50",
          getCardBorder(event.severity)
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="font-mono text-xs text-muted-foreground">
                {event.time}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase",
                  severityOption?.bgColor,
                  severityOption?.color
                )}
              >
                {getSeverityIcon(event.severity)}
                {severityOption?.label}
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {event.content}
            </p>
          </div>
          <button
            onClick={() => onRemove(event.id)}
            className="p-1 rounded-sm text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
            aria-label={deleteLabel}
            title={deleteLabel}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export const TimelineVisual = memo(function TimelineVisual({
  events,
  onRemove,
  severityOptions,
  deleteLabel,
}: TimelineVisualProps) {
  const { t } = useLanguage();
  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        // 1. Most recent first (descending time)
        const timeCmp = b.time.localeCompare(a.time);
        if (timeCmp !== 0) return timeCmp;
        // 2. Higher severity first
        const sevCmp = (severityPriority[b.severity] ?? 0) - (severityPriority[a.severity] ?? 0);
        if (sevCmp !== 0) return sevCmp;
        // 3. Alphabetical by content
        return a.content.localeCompare(b.content);
      }),
    [events]
  );

  if (sortedEvents.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-sm p-8 text-center">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-mono">
          {t("timeline.noEvents")}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-sm p-4 max-h-[520px] overflow-y-auto">
      {sortedEvents.map((event) => (
        <TimelineVisualRow
          key={event.id}
          event={event}
          severityOption={severityOptions.find((s) => s.value === event.severity)}
          onRemove={onRemove}
          deleteLabel={deleteLabel}
        />
      ))}
    </div>
  );
});
