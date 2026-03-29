// Types - explicit exports for better tree-shaking
export type {
  InterestingFunction,
  ControlFlowEntry,
  APIUsageEntry,
  ObfuscationEntry,
  StaticCodeAnalysisData,
  BreakpointEvent,
  MemoryRegion,
  RuntimeAPITrace,
  RegisterStackEntry,
  DynamicCodeAnalysisData,
  CryptoEntry,
} from "./types";

export {
  OBFUSCATION_TECHNIQUES,
  EVENT_TYPES,
  MEMORY_ALLOCATIONS,
  CRYPTO_ALGORITHMS,
  createEmptyFunction,
  createEmptyAPIUsage,
  createEmptyObfuscation,
  createEmptyBreakpoint,
  createEmptyMemoryRegion,
  createEmptyAPITrace,
  createEmptyCryptoEntry,
  createEmptyControlFlow,
  createEmptyRegisterStack,
} from "./types";

// Shared utilities
export { 
  SubSectionHeader, 
  useExpandedState, 
  useExpandedSections, 
  useListManager
} from "./shared";

// Components
export { StaticCodeAnalysis } from "./StaticCodeAnalysis";
export { DynamicCodeAnalysis } from "./DynamicCodeAnalysis";
export { CryptographyAnalysis } from "./CryptographyAnalysis";
export { MicroBehaviorsSection } from "./MicroBehaviorsSection";
