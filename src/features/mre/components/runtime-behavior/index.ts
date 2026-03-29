// Runtime Behavior Module - Explicit exports for better tree-shaking

// Types
export type {
  TriggerEntry,
  AntiDebugEntry,
  AntiVMEntry,
  ExecutionFlowEntry,
  SystemArtifactEntry,
  PersistenceEntry,
  NetworkBehaviorEntry,
  MemoryBehaviorEntry,
  ProcessInjectionEntry,
  RuntimeBehaviorData,
} from "./types";
export { initialRuntimeBehavior } from "./types";

// Constants
export {
  ANTI_DEBUG_CATEGORIES,
  ANTI_DEBUG_APIS,
  ANTI_VM_METHODS,
  ARTIFACT_TYPES,
  PERSISTENCE_TYPES,
  NETWORK_TYPES,
  MEMORY_TYPES,
  INJECTION_TECHNIQUES,
  INJECTION_APIS,
} from "./constants";

// Component
export { RuntimeBehavior } from "./RuntimeBehavior";
