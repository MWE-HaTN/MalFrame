/**
 * Semantic colors for malware analysis UI
 * These colors highlight important security-relevant values in the dashboard
 */
import { getRWXSemanticLevel, getEntropySemanticLevel } from "./export/helpers";

// CSS class mapping for semantic levels
const SEMANTIC_BADGE_CLASSES = {
  HIGH_RISK: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
  SUSPICIOUS: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  GOOD: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20",
  NEUTRAL: "text-muted-foreground",
} as const;

const SEMANTIC_TEXT_CLASSES = {
  HIGH_RISK: "text-red-600 dark:text-red-400",
  SUSPICIOUS: "text-amber-600 dark:text-amber-400",
  GOOD: "text-green-600 dark:text-green-400",
  NEUTRAL: "text-muted-foreground",
} as const;

/**
 * Get semantic background class for RWX permissions (badge style)
 */
export function getRWXBadgeClass(permissions: string): string | null {
  const level = getRWXSemanticLevel(permissions);
  return level ? SEMANTIC_BADGE_CLASSES[level] : null;
}

/**
 * Get semantic color class for entropy values
 */
export function getEntropyColorClass(entropy: string): string | null {
  const level = getEntropySemanticLevel(entropy);
  return level ? SEMANTIC_TEXT_CLASSES[level] : null;
}

/**
 * Get CSS class for MBC item type badges (removable)
 */
export function getMBCItemTypeClass(type: string): string {
  switch (type) {
    case 'micro':
      return "bg-accent/20 text-accent border border-accent/40";
    case 'enhanced':
    case 'sub-technique':
      return "bg-orange-500/20 text-orange-400 border border-orange-500/40";
    default:
      return "bg-primary/20 text-primary border border-primary/40";
  }
}

/**
 * Get CSS class for count badges (primary style)
 */
export const COUNT_BADGE_CLASS = "text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-mono";

/**
 * Get CSS class for selected count badges (accent style)
 */
export const SELECTED_COUNT_BADGE_CLASS = "text-xs bg-accent/20 text-accent px-2 py-0.5 rounded font-mono";
