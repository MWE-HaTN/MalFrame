// Runtime Behavior Module

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
export { createInitialRuntimeBehavior } from "./types";

// Component
export { RuntimeBehavior } from "./RuntimeBehavior";
