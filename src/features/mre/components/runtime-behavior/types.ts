// Types for Runtime Behavior
export interface TriggerEntry {
  id: string;
  name: string;
  description: string;
  images?: string[];
}

export interface AntiDebugEntry {
  id: string;
  categoryTags: string[];
  apis: string[];
  effect: string; // NEW: Effect of check (execution gate, delay, termination, etc.)
  notes: string;
  images?: string[];
}

export interface AntiVMEntry {
  id: string;
  methodTags: string[];
  indicator: string;
  effect: string; // NEW: Effect of check (execution gate, delay, termination, etc.)
  notes: string;
  images?: string[];
}

export interface ExecutionFlowEntry {
  id: string;
  stepName: string;
  description: string;
  images?: string[];
}

export interface SystemArtifactEntry {
  id: string;
  typeTags: string[];
  path: string;
  notes: string;
  images?: string[];
}

export interface PersistenceEntry {
  id: string;
  typeTags: string[];
  path: string;
  notes: string;
  images?: string[];
}

export interface NetworkBehaviorEntry {
  id: string;
  behaviorTags: string[];
  indicator: string;
  notes: string;
  images?: string[];
}

export interface MemoryBehaviorEntry {
  id: string;
  eventTags: string[];
  region: string;
  notes: string;
  images?: string[];
}

export interface ProcessInjectionEntry {
  id: string;
  techniqueTags: string[];
  targetProcess: string;
  apiChain: string[];
  notes: string;
  images?: string[];
}

export interface RuntimeBehaviorData {
  triggers: TriggerEntry[];
  triggersEnabled: boolean;
  antiDebugEnabled: boolean;
  antiDebug: AntiDebugEntry[];
  antiVMEnabled: boolean;
  antiVM: AntiVMEntry[];
  executionFlow: ExecutionFlowEntry[];
  executionFlowEnabled: boolean;
  systemArtifacts: SystemArtifactEntry[];
  systemArtifactsEnabled: boolean;
  persistenceEnabled: boolean;
  persistence: PersistenceEntry[];
  networkEnabled: boolean;
  network: NetworkBehaviorEntry[];
  memoryEnabled: boolean;
  memory: MemoryBehaviorEntry[];
  processInjectionEnabled: boolean;
  processInjection: ProcessInjectionEntry[];
}

export type RuntimeEntry =
  | TriggerEntry
  | AntiDebugEntry
  | AntiVMEntry
  | ExecutionFlowEntry
  | SystemArtifactEntry
  | PersistenceEntry
  | NetworkBehaviorEntry
  | MemoryBehaviorEntry
  | ProcessInjectionEntry;

export const initialRuntimeBehavior: Readonly<RuntimeBehaviorData> = Object.freeze({
  triggers: [],
  triggersEnabled: false,
  antiDebugEnabled: false,
  antiDebug: [],
  antiVMEnabled: false,
  antiVM: [],
  executionFlow: [],
  executionFlowEnabled: false,
  systemArtifacts: [],
  systemArtifactsEnabled: false,
  persistenceEnabled: false,
  persistence: [],
  networkEnabled: false,
  network: [],
  memoryEnabled: false,
  memory: [],
  processInjectionEnabled: false,
  processInjection: [],
});

/** Returns a fresh RuntimeBehaviorData with new array references (safe for mutation) */
export function createInitialRuntimeBehavior(): RuntimeBehaviorData {
  return {
    triggers: [],
    triggersEnabled: false,
    antiDebugEnabled: false,
    antiDebug: [],
    antiVMEnabled: false,
    antiVM: [],
    executionFlow: [],
    executionFlowEnabled: false,
    systemArtifacts: [],
    systemArtifactsEnabled: false,
    persistenceEnabled: false,
    persistence: [],
    networkEnabled: false,
    network: [],
    memoryEnabled: false,
    memory: [],
    processInjectionEnabled: false,
    processInjection: [],
  };
}