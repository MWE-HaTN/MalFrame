import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, Calendar, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { ActivityDataSchema, safeJsonParse } from "@/lib/validationSchemas";
import { useLanguage } from "@/hooks/useLanguage";

// Lazy import debug logger to reduce initial bundle
const debugWarn = (message: string) => 
  import("@/lib/debugLogger").then(m => m.debugWarn(message));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ActivityData {
  activities: string[]; // Array of date strings "YYYY-MM-DD"
}

const getActivityLevel = (count: number): number => {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
};

const getActivityColor = (level: number): string => {
  switch (level) {
    case 0: return "bg-muted/30 border border-border/50";
    case 1: return "bg-primary/50 border border-primary/40";
    case 2: return "bg-primary/70 border border-primary/60";
    case 3: return "bg-primary/85 border border-primary/75";
    case 4: return "bg-primary border border-primary";
    default: return "bg-muted/30 border border-border/50";
  }
};

export const ActivityTracker = memo(function ActivityTracker() {
  const { t, language } = useLanguage();
  const [activityData, setActivityData] = useState<ActivityData>({ activities: [] });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const importInputRef = useRef<HTMLInputElement>(null);

  // Load data from localStorage with validation
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY_DATA);
    if (saved) {
      try {
        const parsed = safeJsonParse<unknown>(saved);
        const result = ActivityDataSchema.safeParse(parsed);
        if (result.success) {
          setActivityData(result.data);
        } else {
          debugWarn("Activity data validation failed, using empty");
          setActivityData({ activities: [] });
        }
      } catch {
        debugWarn("Invalid activity data JSON");
        localStorage.removeItem(STORAGE_KEYS.ACTIVITY_DATA);
        setActivityData({ activities: [] });
      }
    }
  }, []);

  // Save data to localStorage
  const saveData = (data: ActivityData) => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_DATA, JSON.stringify(data));
    setActivityData(data);
  };

  // Get today's date string
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if today is already tracked
  const isTodayTracked = activityData.activities.includes(getTodayString());

  // Handle tracking button click for today
  const handleTrackToday = () => {
    const today = getTodayString();
    toggleDateActivity(today);
  };

  // Toggle activity for a specific date
  const toggleDateActivity = (dateString: string) => {
    const hasActivity = activityData.activities.includes(dateString);
    if (hasActivity) {
      const filteredActivities = activityData.activities.filter(activityDate => activityDate !== dateString);
      saveData({ activities: filteredActivities });
      toast.success(`Activity removed for ${dateString}`);
    } else {
      const updatedActivities = [...activityData.activities, dateString];
      saveData({ activities: updatedActivities });
      toast.success(`Activity tracked for ${dateString}!`);
    }
  };

  // Export activity data as JSON file
  const handleExport = useCallback(() => {
    const json = JSON.stringify(activityData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `malframe-activity-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t("activity.exportSuccess"));
  }, [activityData, t]);

  // Import activity data from JSON file (merges with existing)
  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const result = ActivityDataSchema.safeParse(parsed);
        if (!result.success) {
          toast.error(t("activity.importError"));
          return;
        }
        // Merge: union of existing + imported dates
        const merged = Array.from(new Set([...activityData.activities, ...result.data.activities]));
        saveData({ activities: merged });
        toast.success(t("activity.importSuccess"));
      } catch {
        toast.error(t("activity.importError"));
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = "";
  }, [activityData.activities, t]);

  // Format date for tooltip display - memoized formatter options
  const dateFormatOptions: Intl.DateTimeFormatOptions = useMemo(() => ({ 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), []);

  const formatDateForTooltip = useCallback((dateString: string, count: number) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', dateFormatOptions);
    const activityText = count === 0
      ? t("activity.noSessions")
      : count === 1
        ? `1 ${t("activity.session")}`
        : `${count} ${t("activity.sessions")}`;
    return { formattedDate, activityText };
  }, [dateFormatOptions, t]);

  // Generate calendar grid for the selected year
  const calendarData = useMemo(() => {
    const weeks: { date: Date; dateString: string }[][] = [];
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);
    
    // Adjust start to the first Sunday
    const firstDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - firstDay);
    
    let currentWeek: { date: Date; dateString: string }[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate || currentWeek.length > 0) {
      const dateString = current.toISOString().split('T')[0];
      currentWeek.push({ date: new Date(current), dateString });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      current.setDate(current.getDate() + 1);
      
      // Stop if we've passed the end of the year and completed the week
      if (current > endDate && currentWeek.length === 0) break;
    }
    
    // Add remaining days if any
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        const dateString = current.toISOString().split('T')[0];
        currentWeek.push({ date: new Date(current), dateString });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [selectedYear]);

  // Count activities per date
  const activityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activityData.activities.forEach(activityDate => {
      counts[activityDate] = (counts[activityDate] || 0) + 1;
    });
    return counts;
  }, [activityData.activities]);

  // Calculate total contributions for the year - memoized
  const yearContributions = useMemo(() => {
    const yearPrefix = selectedYear.toString();
    return activityData.activities.filter(activityDate => activityDate.startsWith(yearPrefix)).length;
  }, [activityData.activities, selectedYear]);

  // Get month labels positions - must be before localizedMonths usage in JSX
  const getMonthLabels = useCallback((months: string[]) => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    
    calendarData.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0];
      if (firstDayOfWeek.date.getFullYear() === selectedYear) {
        const month = firstDayOfWeek.date.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: months[month], weekIndex });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  }, [calendarData, selectedYear]);

  // Auto-generate years from 2025 to current year
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yearsArray: number[] = [];
    for (let year = currentYear; year >= 2025; year--) {
      yearsArray.push(year);
    }
    if (yearsArray.length === 0) yearsArray.push(2025);
    return yearsArray;
  }, [currentYear]);

  // Localized months
  const localizedMonths = useMemo(() => {
    if (language === "vn") {
      return ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];
    }
    return MONTHS;
  }, [language]);

  // Localized day labels
  const dayLabels = useMemo(() => {
    if (language === "vn") {
      return { mon: "T2", wed: "T4", fri: "T6" };
    }
    return { mon: "Mon", wed: "Wed", fri: "Fri" };
  }, [language]);

  return (
    <div className="card-cyber p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {t("activity.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {yearContributions} {language === "vn" ? "ngày trong" : "day(s) in"} {selectedYear}
            </p>
          </div>
        </div>
        <button
          onClick={handleTrackToday}
          className={`flex items-center justify-center gap-2 w-[140px] py-2 rounded-sm font-mono text-sm uppercase tracking-wide transition-all duration-300 ${
            isTodayTracked
              ? "bg-primary text-primary-foreground scale-[1.02] shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
              : "bg-input border border-border text-foreground hover:border-primary/50 hover:scale-[1.02]"
          }`}
        >
          <CheckCircle className={`w-4 h-4 transition-transform duration-300 ${isTodayTracked ? "scale-110" : ""}`} />
          <span>{isTodayTracked ? (language === "vn" ? "Đã theo dõi" : "Tracked") : (language === "vn" ? "Theo dõi" : "Track Today")}</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex items-start gap-3">
        {/* Calendar grid */}
        <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <div className="inline-block min-w-fit">
            {/* Month labels */}
            <div className="flex mb-2 ml-10 relative h-5">
              {getMonthLabels(localizedMonths).map(({ month, weekIndex }, labelIndex) => (
                <div
                  key={labelIndex}
                  className="text-xs text-muted-foreground font-medium absolute"
                  style={{ left: `${weekIndex * 16}px` }}
                >
                  {month}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-[3px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[3px] mr-1.5 w-7">
                <div className="h-[14px]" />
                <div className="h-[14px] text-xs text-muted-foreground/70 font-medium leading-[14px]">{dayLabels.mon}</div>
                <div className="h-[14px]" />
                <div className="h-[14px] text-xs text-muted-foreground/70 font-medium leading-[14px]">{dayLabels.wed}</div>
                <div className="h-[14px]" />
                <div className="h-[14px] text-xs text-muted-foreground/70 font-medium leading-[14px]">{dayLabels.fri}</div>
                <div className="h-[14px]" />
              </div>

              {/* Weeks */}
              <TooltipProvider delayDuration={50}>
                {calendarData.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((dayData, dayIndex) => {
                      const isInYear = dayData.date.getFullYear() === selectedYear;
                      const count = activityCounts[dayData.dateString] || 0;
                      const level = getActivityLevel(count);
                      const { formattedDate, activityText } = formatDateForTooltip(dayData.dateString, count);
                      
                      if (!isInYear) {
                        return (
                          <div
                            key={dayIndex}
                            className="w-[13px] h-[13px] rounded-sm bg-transparent"
                          />
                        );
                      }
                      
                      return (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-[13px] h-[13px] rounded-sm transition-all duration-200 cursor-pointer hover:scale-125 hover:ring-1 hover:ring-primary/40 ${getActivityColor(level)}`}
                              onClick={() => toggleDateActivity(dayData.dateString)}
                            />
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-popover border border-border text-popover-foreground px-2 py-1.5 text-sm"
                          >
                            <div className="font-semibold text-primary">{activityText}</div>
                            <div className="text-muted-foreground text-xs">{formattedDate}</div>
                            <div className="text-muted-foreground/60 text-xs mt-1 border-t border-border/40 pt-1">
                              {count > 0 ? t("activity.clickToRemove") : t("activity.clickToTrack")}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Year selector - always visible */}
        <div className="flex flex-col border-l border-border pl-3 w-[70px]">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
            {language === "vn" ? "Năm" : "Year"}
          </span>
          <div className="flex flex-col gap-1">
            {years.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`w-full px-2 py-1 text-sm font-mono rounded transition-all ${
                  year === selectedYear
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Export / Import */}
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border/40">
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
        <button
          onClick={() => importInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-muted-foreground border border-border/60 rounded hover:border-primary/50 hover:text-foreground transition-all"
        >
          <Upload className="w-3 h-3" />
          {t("activity.import")}
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-muted-foreground border border-border/60 rounded hover:border-primary/50 hover:text-foreground transition-all"
        >
          <Download className="w-3 h-3" />
          {t("activity.export")}
        </button>
      </div>
    </div>
  );
});

