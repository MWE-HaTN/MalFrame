import { useState, useId, useRef, useMemo, useCallback, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus, Trash2, Clock, TriangleAlert, Info } from "lucide-react";
import { cn, generateId } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TimelineEvent } from "@/types/dashboard";

interface TimelineTableProps {
  events: TimelineEvent[];
  onEventsChange: (events: TimelineEvent[]) => void;
}

interface TimelineRowProps {
  event: TimelineEvent;
  severityOption: { value: string; label: string; color: string; bgColor: string } | undefined;
  onRemove: (id: string) => void;
  deleteLabel: string;
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "info":
      return <Info className="w-4 h-4 text-accent" />;
    case "warning":
      return <TriangleAlert className="w-4 h-4 text-warning" />;
    case "critical":
      return <TriangleAlert className="w-4 h-4 text-destructive" />;
    default:
      return <Info className="w-4 h-4 text-accent" />;
  }
};

const TimelineRow = memo(function TimelineRow({ event, severityOption, onRemove, deleteLabel }: TimelineRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-border/50 last:border-0 transition-colors",
        "hover:bg-primary/5"
      )}
    >
      <td className="px-4 py-3 font-mono text-sm text-muted-foreground whitespace-nowrap">
        {event.time}
      </td>
      <td className="px-4 py-3 text-sm text-foreground">
        {event.content}
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono uppercase",
            severityOption?.bgColor,
            severityOption?.color
          )}
        >
          {getSeverityIcon(event.severity)}
          {severityOption?.label}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onRemove(event.id)}
          className="p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title={deleteLabel}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
});

const ROW_HEIGHT = 52;
const MAX_VISIBLE_ROWS = 10;

export const TimelineTable = memo(function TimelineTable({ events, onEventsChange }: TimelineTableProps) {
  const { t } = useLanguage();
  const formId = useId();
  const [newEvent, setNewEvent] = useState<Omit<TimelineEvent, "id">>({
    time: "",
    content: "",
    severity: "info",
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = events.length > MAX_VISIBLE_ROWS;

  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const severityOptions = useMemo(() => [
    { value: "info", label: t("timeline.info"), color: "text-accent", bgColor: "bg-accent/20" },
    { value: "warning", label: t("timeline.warning"), color: "text-warning", bgColor: "bg-warning/20" },
    { value: "critical", label: t("timeline.critical"), color: "text-destructive", bgColor: "bg-destructive/20" },
  ], [t]);

  const addEvent = useCallback(() => {
    if (!newEvent.time || !newEvent.content) return;
    
    const event: TimelineEvent = {
      id: generateId(),
      ...newEvent,
    };
    
    onEventsChange([...events, event]);
    setNewEvent({ time: "", content: "", severity: "info" });
  }, [newEvent, events, onEventsChange]);

  const removeEvent = useCallback((id: string) => {
    onEventsChange(events.filter((event) => event.id !== id));
  }, [events, onEventsChange]);

  const containerHeight = useMemo(() => {
    if (!shouldVirtualize) return "auto";
    return Math.min(events.length, MAX_VISIBLE_ROWS) * ROW_HEIGHT;
  }, [events.length, shouldVirtualize]);

  return (
    <div className="space-y-4">
      {/* Add new event form */}
      <div className="grid grid-cols-12 gap-3 items-end">
        <div className="col-span-3">
          <label htmlFor={`${formId}-time`} className="label-cyber block text-left mb-1.5">{t("timeline.time")}</label>
          <input
            id={`${formId}-time`}
            name="timeline-time"
            type="text"
            value={newEvent.time}
            onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
            placeholder={t("timeline.placeholder.time")}
            className="input-cyber w-full text-sm"
          />
        </div>
        <div className="col-span-5">
          <label htmlFor={`${formId}-content`} className="label-cyber block text-left mb-1.5">{t("timeline.content")}</label>
          <input
            id={`${formId}-content`}
            name="timeline-content"
            type="text"
            value={newEvent.content}
            onChange={(e) => setNewEvent({ ...newEvent, content: e.target.value })}
            placeholder={t("timeline.placeholder.content")}
            className="input-cyber w-full text-sm"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor={`${formId}-severity`} className="label-cyber block text-left mb-1.5">{t("timeline.severity")}</label>
          <select
            id={`${formId}-severity`}
            name="timeline-severity"
            value={newEvent.severity}
            onChange={(e) => setNewEvent({ ...newEvent, severity: e.target.value as TimelineEvent["severity"] })}
            className="input-cyber w-full text-sm"
          >
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <button
            onClick={addEvent}
            disabled={!newEvent.time || !newEvent.content}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-sm",
              "bg-primary text-primary-foreground font-terminal text-sm uppercase",
              "hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Plus className="w-4 h-4" />
            {t("common.add")}
          </button>
        </div>
      </div>

      {/* Events table */}
      {events.length > 0 ? (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-card border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-terminal uppercase tracking-wider text-primary w-[180px]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {t("timeline.time")}
                  </div>
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-terminal uppercase tracking-wider text-primary">
                  {t("timeline.content")}
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-terminal uppercase tracking-wider text-primary w-28">
                  {t("timeline.severity")}
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-terminal uppercase tracking-wider text-primary w-20">
                  {t("timeline.action")}
                </th>
              </tr>
            </thead>
          </table>

          {shouldVirtualize ? (
            <div
              ref={parentRef}
              className="overflow-auto"
              style={{ height: containerHeight }}
            >
              <table className="w-full">
                <tbody
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const event = events[virtualRow.index];
                    const severity = severityOptions.find((s) => s.value === event.severity);
                    return (
                      <tr
                        key={event.id}
                        className="hover:bg-primary/5 transition-colors absolute w-full flex"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground whitespace-nowrap w-[180px] flex-shrink-0">
                          {event.time}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground flex-1 min-w-0">
                          {event.content}
                        </td>
                        <td className="px-4 py-3 text-center w-28 flex-shrink-0">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono uppercase",
                              severity?.bgColor,
                              severity?.color
                            )}
                          >
                            {getSeverityIcon(event.severity)}
                            {severity?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center w-20 flex-shrink-0">
                          <button
                            onClick={() => removeEvent(event.id)}
                            className="p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title={t("common.delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <table className="w-full">
              <tbody>
                {events.map((event) => (
                  <TimelineRow
                    key={event.id}
                    event={event}
                    severityOption={severityOptions.find((s) => s.value === event.severity)}
                    onRemove={removeEvent}
                    deleteLabel={t("common.delete")}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-sm p-8 text-center">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-mono">
            {t("timeline.empty")}
          </p>
        </div>
      )}
    </div>
  );
});
