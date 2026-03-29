// MBC (Malware Behavior Catalog) Module
// Explicit exports for better tree-shaking

// Types
export type { 
  MBCMethod, 
  MBCBehavior, 
  MBCObjective, 
  MBCMicroBehavior, 
  MBCMicroObjective,
  MBCData 
} from "./types";
export { MBC_BASE_URL } from "./types";

// Data - use dynamic import via hook for lazy loading
// Import useMBCData directly from "@/features/mre/hooks/useMBCData" when needed
