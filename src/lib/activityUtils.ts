import { STORAGE_KEYS } from "./storageKeys";
import { toast } from "sonner";

interface ActivityData {
  activities: string[];
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

// Milestone definitions
const MILESTONES = [7, 30, 100, 365, 10000] as const;

// Storage key for tracking shown milestones
const SHOWN_MILESTONES_KEY = "mad-shown-milestones";

/**
 * Get activity data from localStorage
 */
function getActivityData(): ActivityData {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY_DATA);
    return stored ? JSON.parse(stored) : { activities: [] };
  } catch {
    return { activities: [] };
  }
}

/**
 * Get the count of tracked days in the current month
 */
export function getCurrentMonthActivityCount(): number {
  const data = getActivityData();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return data.activities.filter((dateStr) => {
    const date = new Date(dateStr);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  }).length;
}

/**
 * Calculate streak information from activity data
 */
export function calculateStreakInfo(): StreakInfo {
  const data = getActivityData();
  const activities = data.activities
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  if (activities.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalDays: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Calculate longest streak
  for (let i = 1; i < activities.length; i++) {
    const prev = activities[i - 1];
    const curr = activities[i];
    const diffDays = Math.floor(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      tempStreak++;
    } else if (diffDays > 1) {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
    // diffDays === 0 means same day, skip
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak (from today backwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sortedDesc = [...activities].sort((a, b) => b.getTime() - a.getTime());
  
  // Check if today or yesterday is in the list
  const latestDate = sortedDesc[0];
  latestDate.setHours(0, 0, 0, 0);
  
  const diffFromToday = Math.floor(
    (today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffFromToday <= 1) {
    currentStreak = 1;
    for (let i = 1; i < sortedDesc.length; i++) {
      const curr = new Date(sortedDesc[i - 1]);
      const prev = new Date(sortedDesc[i]);
      curr.setHours(0, 0, 0, 0);
      prev.setHours(0, 0, 0, 0);
      
      const diff = Math.floor(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diff === 1) {
        currentStreak++;
      } else if (diff > 1) {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalDays: activities.length,
  };
}

/**
 * Get shown milestones from localStorage
 */
function getShownMilestones(): number[] {
  try {
    const stored = localStorage.getItem(SHOWN_MILESTONES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save shown milestones to localStorage
 */
function saveShownMilestones(milestones: number[]): void {
  localStorage.setItem(SHOWN_MILESTONES_KEY, JSON.stringify(milestones));
}

/**
 * Check and show milestone notification if user reached a new milestone
 */
function checkAndShowMilestoneNotification(): void {
  const { totalDays } = calculateStreakInfo();
  const shownMilestones = getShownMilestones();

  for (const milestone of MILESTONES) {
    if (totalDays >= milestone && !shownMilestones.includes(milestone)) {
      // Show celebration toast
      const emoji = getMilestoneEmoji(milestone);
      const message = getMilestoneMessage(milestone);
      
      toast.success(`${emoji} ${message}`, {
        description: `You've tracked ${totalDays} days of activity!`,
        duration: 6000,
      });

      // Mark this milestone as shown
      saveShownMilestones([...shownMilestones, milestone]);
      break; // Only show one notification at a time
    }
  }
}

/**
 * Get emoji for milestone
 */
function getMilestoneEmoji(days: number): string {
  switch (days) {
    case 7:
      return "🔥";
    case 30:
      return "⭐";
    case 100:
      return "🏆";
    case 365:
      return "👑";
    case 10000:
      return "🌟";
    default:
      return "🎉";
  }
}

/**
 * Get message for milestone
 */
function getMilestoneMessage(days: number): string {
  switch (days) {
    case 7:
      return "First Week Complete!";
    case 30:
      return "One Month Milestone!";
    case 100:
      return "Century Club Member!";
    case 365:
      return "One Year Achievement!";
    case 10000:
      return "Legendary Analyst!";
    default:
      return "Milestone Reached!";
  }
}

/**
 * Tracks activity for today's date in localStorage.
 * Used to automatically record activity when user exports reports.
 * Also checks for milestone achievements.
 */
export function trackTodayActivity(): void {
  const today = new Date().toISOString().split("T")[0];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY_DATA);
    const data: ActivityData = stored ? JSON.parse(stored) : { activities: [] };

    // Only add if not already tracked today
    if (!data.activities.includes(today)) {
      data.activities.push(today);
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_DATA, JSON.stringify(data));
      
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent("activity-tracked"));
      
      // Check for milestones after tracking
      setTimeout(() => {
        checkAndShowMilestoneNotification();
      }, 500);
    }
  } catch {
    // Silently fail - activity tracking is non-critical
  }
}
