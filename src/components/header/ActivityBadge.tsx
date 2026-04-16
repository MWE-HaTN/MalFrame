import { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Flame } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getCurrentMonthActivityCount,
  calculateStreakInfo,
} from "@/lib/activityUtils";
import { cn } from "@/lib/utils";

interface ActivityBadgeProps {
  className?: string;
}

export const ActivityBadge = memo(function ActivityBadge({
  className,
}: ActivityBadgeProps) {
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Load activity data on mount and listen for storage changes
  useEffect(() => {
    const updateCounts = () => {
      setMonthlyCount(getCurrentMonthActivityCount());
      setCurrentStreak(calculateStreakInfo().currentStreak);
    };

    updateCounts();

    // Listen for storage changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "mad-activity-data") {
        updateCounts();
      }
    };

    // Listen for custom event from same tab
    const handleActivityTracked = () => {
      updateCounts();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("activity-tracked", handleActivityTracked);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("activity-tracked", handleActivityTracked);
    };
  }, []);

  const currentMonth = new Date().toLocaleString("en-US", { month: "short" });

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-1.5 h-[30px] px-2.5 rounded-sm text-xs font-mono transition-colors duration-100 border",
              "text-muted-foreground hover:text-primary hover:bg-primary/10 border-primary/30 hover:border-primary/50",
              className
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-primary font-bold">{monthlyCount}</span>
            <span className="text-muted-foreground/70 text-[10px]">
              {currentMonth}
            </span>
            {currentStreak > 0 && (
              <>
                <span className="text-border mx-0.5">|</span>
                <Flame className="w-3.5 h-3.5 text-warning" />
                <span className="text-warning font-bold">{currentStreak}</span>
              </>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="font-mono text-xs">
          <div className="space-y-1">
            <p>
              <span className="text-primary font-bold">{monthlyCount}</span>{" "}
              tracked days in {currentMonth}
            </p>
            {currentStreak > 0 && (
              <p>
                <span className="text-warning font-bold">{currentStreak}</span>{" "}
                day streak 🔥
              </p>
            )}
          </div>
        </TooltipContent>
    </Tooltip>
  );
});
