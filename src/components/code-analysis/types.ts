// ===== STATIC CODE ANALYSIS TYPES =====

export interface InterestingFunction {
  id: string;
  functionName: string;
  rvaAddress: string;
  role: string; // NEW: Role in malware logic (dispatcher, decryptor, C2 handler, injector, etc.)
  notes: string;
  images?: string[];
}

export interface ControlFlowEntry {
  id: string;
  loopBranchNotes: string;
  cfgObservations: string;
  stringDecryptionRoutines: string;
  images?: string[];
}

export interface APIUsageEntry {
  id: string;
  apiName: string;
  purposeBehavior: string;
  notes: string;
  images?: string[];
}

export interface ObfuscationEntry {
  id: string;
  technique: string;
  evidence: string;
  notes: string;
  images?: string[];
}

export interface StaticCodeAnalysisData {
  interestingFunctions: InterestingFunction[];
  controlFlow: ControlFlowEntry[];
  apiUsage: APIUsageEntry[];
  obfuscation: ObfuscationEntry[];
}

// ===== DYNAMIC CODE ANALYSIS TYPES =====

export interface BreakpointEvent {
  id: string;
  whereTriggered: string;
  eventType: string;
  notes: string;
  images?: string[];
}

export interface MemoryRegion {
  id: string;
  allocation: string;
  address: string;
  behavior: string;
  images?: string[];
}

export interface RuntimeAPITrace {
  id: string;
  api: string;
  arguments: string;
  returnValue: string;
  images?: string[];
}

export interface RegisterStackEntry {
  id: string;
  registersModified: string;
  stackPatterns: string;
  notes: string;
  images?: string[];
}

export interface DynamicCodeAnalysisData {
  breakpointEvents: BreakpointEvent[];
  memoryRegions: MemoryRegion[];
  runtimeApiTrace: RuntimeAPITrace[];
  registerStack: RegisterStackEntry[];
}

// ===== DEEP DIVE TYPES =====

export interface CryptoEntry {
  id: string;
  algorithm: string;
  keyIv: string;
  keyDerivation: string;
  cryptoApis: string;
  protectedData: string;
  analystHypothesis: string; // NEW: Why the author likely chose this technique
  images?: string[];
}

// DeepDiveData is defined in CodeAnalysisGroups.tsx (includes executionStages, cryptoEntries, microBehaviors)

// ===== DROPDOWN OPTIONS =====

export const OBFUSCATION_TECHNIQUES = [
  "CFF Flattening",
  "Junk code",
  "Virtualized code",
  "String encryption",
  "Stack strings",
  "Custom packer logic",
  "Opaque predicates",
  "Dead code insertion",
  "Register reassignment",
  "Other"
] as const;

export const EVENT_TYPES = [
  "Anti-debug",
  "Exception",
  "Routine start",
  "API call",
  "Memory access",
  "Thread creation",
  "Module load",
  "Other"
] as const;

export const MEMORY_ALLOCATIONS = [
  "RWX",
  "RW",
  "RX",
  "RW → RX",
  "Private",
  "Mapped",
  "Other"
] as const;

export const CRYPTO_ALGORITHMS = [
  "XOR",
  "AES",
  "AES-256-CBC",
  "AES-128-GCM",
  "RC4",
  "RSA",
  "ChaCha20",
  "Blowfish",
  "DES/3DES",
  "Custom",
  "Other"
] as const;

// ===== HELPER FUNCTIONS =====
import { generateId } from "@/lib/utils";

export const createEmptyFunction = (): InterestingFunction => ({
  id: generateId(),
  functionName: "",
  rvaAddress: "",
  role: "",
  notes: "",
  images: []
});

export const createEmptyAPIUsage = (): APIUsageEntry => ({
  id: generateId(),
  apiName: "",
  purposeBehavior: "",
  notes: "",
  images: []
});

export const createEmptyObfuscation = (): ObfuscationEntry => ({
  id: generateId(),
  technique: "",
  evidence: "",
  notes: "",
  images: []
});

export const createEmptyBreakpoint = (): BreakpointEvent => ({
  id: generateId(),
  whereTriggered: "",
  eventType: "",
  notes: "",
  images: []
});

export const createEmptyMemoryRegion = (): MemoryRegion => ({
  id: generateId(),
  allocation: "",
  address: "",
  behavior: "",
  images: []
});

export const createEmptyAPITrace = (): RuntimeAPITrace => ({
  id: generateId(),
  api: "",
  arguments: "",
  returnValue: "",
  images: []
});

export const createEmptyCryptoEntry = (): CryptoEntry => ({
  id: generateId(),
  algorithm: "",
  keyIv: "",
  keyDerivation: "",
  cryptoApis: "",
  protectedData: "",
  analystHypothesis: "",
  images: []
});

export const createEmptyControlFlow = (): ControlFlowEntry => ({
  id: generateId(),
  loopBranchNotes: "",
  cfgObservations: "",
  stringDecryptionRoutines: "",
  images: []
});

export const createEmptyRegisterStack = (): RegisterStackEntry => ({
  id: generateId(),
  registersModified: "",
  stackPatterns: "",
  notes: "",
  images: []
});