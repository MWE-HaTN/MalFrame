/**
 * Centralized localStorage keys management
 * All localStorage keys should be defined here to avoid duplication and ease maintenance
 */

// ============================================
// User & Settings
// ============================================
export const STORAGE_KEYS = {
  // Theme & Language
  THEME: "cyber-analyst-theme",
  LANGUAGE: "cyber-analyst-language",
  
  // User Profile
  USER_PROFILE: "cyber-analyst-user-profile",
  
  // Display Settings
  DISPLAY_SCALE: "mad-display-scale",
  
  // ============================================
  // Dashboard Data
  // ============================================
  
  // MIA Dashboard (DFIR)
  MIA_DASHBOARD_DATA: "dfir-dashboard-data",
  
  // MRE Dashboard (Reverse Engineering)
  MRE_DASHBOARD_DATA: "re-dashboard-data",
  
  // Dashboard Navigation
  LAST_DASHBOARD: "preferred-dashboard",
  
  // ============================================
  // Tools
  // ============================================
  TOOLS_DATA: "cyber-analyst-tools-v2",
  TOOLS_VERSION: "cyber-analyst-tools-version",
  
  // ============================================
  // Activity Tracker
  // ============================================
  ACTIVITY_DATA: "mad-activity-data",
  
  // ============================================
  // Images
  // ============================================
  IMAGES: "cyber-analyst-images",
  
  // ============================================
  // MITRE ATT&CK Cache (persists across clear operations)
  // ============================================
  MITRE_CACHE: "mitre-attack-cache",
  MITRE_CACHE_EXPIRY: "mitre-attack-cache-expiry",
  MITRE_VERSION: "mitre-attack-version",
  
  // ============================================
  // Collapsible Section States
  // ============================================
  SECTION_STATES: "dashboard-section-states",
  FIRST_VISIT: "dashboard-first-visit-done",
  HINT_STATES: "dashboard-hint-states",
  
  // ============================================
  // Runtime Behavior Expanded States
  // ============================================
  RUNTIME_GROUPS: "runtime-behavior-groups",
  RUNTIME_SUBITEMS: "runtime-behavior-subitems",
  
  // ============================================
  // Code Analysis Expanded States
  // ============================================
  CODE_ANALYSIS_STATIC: "code-analysis-static-expanded",
  CODE_ANALYSIS_DYNAMIC: "code-analysis-dynamic-expanded",
  CODE_ANALYSIS_CRYPTO: "code-analysis-crypto-expanded",
  CODE_ANALYSIS_MICRO: "code-analysis-micro-expanded",
  
  // ============================================
  // Other Component States
  // ============================================
  EXECUTION_STAGES: "execution-stages-expanded",
  UNPACKING_STAGES: "unpacking-stages-expanded",
} as const;

// Type for storage keys
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

