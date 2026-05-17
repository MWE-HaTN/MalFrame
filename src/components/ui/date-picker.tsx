import { useState, useRef, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface DatePickerProps {
  value: string; // YYYY-MM-DD or ""
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

const MONTH_NAMES = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  vn: ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"],
};

const DAY_HEADERS = {
  en: ["Mo","Tu","We","Th","Fr","Sa","Su"],
  vn: ["T2","T3","T4","T5","T6","T7","CN"],
};

function formatDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

function parseYMD(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Returns 0=Monday offset for first day of month
function getFirstDayOffset(year: number, month: number): number {
  const jsDay = new Date(year, month - 1, 1).getDay(); // 0=Sun,1=Mon,...
  return jsDay === 0 ? 6 : jsDay - 1; // Convert to Mon=0
}

export function DatePicker({ value, onChange, placeholder, className, id: externalId, name: externalName }: DatePickerProps) {
  const { language, t } = useLanguage();
  const generatedId = useId();
  const fieldId = externalId || `datepicker-${generatedId}`;
  const fieldName = externalName || fieldId;

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [flipUp, setFlipUp] = useState(false);

  const today = new Date();
  const parsed = parseYMD(value);

  const [viewYear, setViewYear] = useState(() => parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsed?.month ?? (today.getMonth() + 1));

  const triggerRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Sync view when value changes externally
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const calendarHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldFlipUp = spaceBelow < calendarHeight && spaceAbove > calendarHeight;
    setFlipUp(shouldFlipUp);
    const top = shouldFlipUp ? rect.top - 4 : rect.bottom + 4;
    setPosition({ top, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !calendarRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, updatePosition]);

  const handleDayClick = (day: number) => {
    onChange(toYMD(viewYear, viewMonth, day));
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    onChange(toYMD(y, m, d));
    setViewYear(y);
    setViewMonth(m);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };

  const monthNames = MONTH_NAMES[language === "vn" ? "vn" : "en"];
  const dayHeaders = DAY_HEADERS[language === "vn" ? "vn" : "en"];
  const todayStr = toYMD(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const offset = getFirstDayOffset(viewYear, viewMonth);
  // Build grid: nulls for offset, then days 1..daysInMonth
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  const calendarContent = (
    <div
      ref={calendarRef}
      className={cn(
        "fixed bg-background border border-primary/50 rounded-sm",
        "shadow-lg shadow-primary/20 p-3 animate-scale-in",
        flipUp ? "origin-bottom" : "origin-top"
      )}
      style={{
        top: flipUp ? "auto" : position.top,
        bottom: flipUp ? window.innerHeight - position.top : "auto",
        left: position.left,
        minWidth: 280,
        zIndex: 9999,
      }}
    >
      {/* Month/Year header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 rounded-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          aria-label={t("aria.previousMonth")}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-mono text-foreground font-semibold">
          {monthNames[viewMonth - 1]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 rounded-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          aria-label={t("aria.nextMonth")}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayHeaders.map((d) => (
          <div key={d} className="text-center text-xs font-mono text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dayStr = toYMD(viewYear, viewMonth, day);
          const isSelected = dayStr === value;
          const isToday = dayStr === todayStr;
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              className={cn(
                "w-full aspect-square flex items-center justify-center text-xs font-mono rounded-sm transition-colors",
                "hover:bg-primary/20 hover:text-primary",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                isToday && !isSelected && "border border-primary/50 text-primary",
                !isSelected && !isToday && "text-foreground"
              )}
              aria-label={dayStr}
              aria-pressed={isSelected}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Footer buttons */}
      <div className="flex gap-2 mt-3 pt-2 border-t border-primary/20">
        <button
          type="button"
          onClick={handleToday}
          className="flex-1 text-xs font-mono py-1.5 rounded-sm border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
        >
          {t("common.today")}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 text-xs font-mono py-1.5 rounded-sm border border-primary/20 text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
        >
          {t("common.clearSelection")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={fieldId}
        name={fieldName}
        onClick={() => { updatePosition(); setIsOpen(v => !v); }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cn(
          "w-full h-[46px] flex items-center justify-between",
          "bg-input border border-primary/50 rounded-sm px-4",
          "text-sm font-mono transition-all duration-200",
          "hover:border-primary hover:bg-primary/5",
          "focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none",
          isOpen && "border-primary ring-1 ring-primary/30 bg-primary/5",
          className
        )}
      >
        <span className={cn("font-mono", value ? "text-foreground" : "text-muted-foreground")}>
          {value ? formatDisplay(value) : (placeholder ?? t("common.selectDate"))}
        </span>
        <CalendarDays className={cn("w-4 h-4 text-primary transition-opacity", isOpen && "opacity-70")} />
      </button>
      {isOpen && createPortal(calendarContent, document.body)}
    </>
  );
}
