/**
 * MBC Auto-Suggestion Engine
 * Scans MRE runtime behavior tags and suggests relevant MBC behaviors.
 * Also provides MBC version checking against GitHub.
 */

import { STORAGE_KEYS } from "@/lib/storageKeys";

// Minimal interface for MRE runtime behavior to avoid circular imports
interface MreRuntimeLike {
  antiDebug: { categoryTags: string[]; apis: string[] }[];
  antiVM: { methodTags: string[] }[];
  persistence: { typeTags: string[] }[];
  network: { behaviorTags: string[] }[];
  memory: { eventTags: string[] }[];
  processInjection: { techniqueTags: string[] }[];
  systemArtifacts: { typeTags: string[] }[];
}

export interface MBCSuggestion {
  behaviorId: string;
  behaviorName: string;
  objectiveId: string;
  objectiveName: string;
  source: string;
  confidence: "high" | "medium" | "low";
}

interface MBCRule {
  tag: string;
  behaviorId: string;
  behaviorName: string;
  objectiveId: string;
  objectiveName: string;
  confidence: "high" | "medium" | "low";
}

const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

// ── Anti-Debug rules ──────────────────────────────────────────────────────

const ANTI_DEBUG_RULES: MBCRule[] = [
  // Category-based
  { tag: "API-based", behaviorId: "B0001.005", behaviorName: "IsDebuggerPresent", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "Exception-based", behaviorId: "B0001.014", behaviorName: "Self-Debugging", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "Timing-based", behaviorId: "B0001.020", behaviorName: "Timing/Delay Check", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "Process/Thread-based", behaviorId: "B0001", behaviorName: "Debugger Detection", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "Hardware Breakpoint Detection", behaviorId: "B0001", behaviorName: "Debugger Detection", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "Memory Inspection", behaviorId: "B0001", behaviorName: "Debugger Detection", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "PEB/NT Headers Check", behaviorId: "B0001.012", behaviorName: "PEB->BeingDebugged", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "Instruction-level Checks", behaviorId: "B0001", behaviorName: "Debugger Detection", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "Behavioral/Environment Checks", behaviorId: "B0001", behaviorName: "Debugger Detection", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  // API-based
  { tag: "IsDebuggerPresent", behaviorId: "B0001.005", behaviorName: "IsDebuggerPresent", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "CheckRemoteDebuggerPresent", behaviorId: "B0001.002", behaviorName: "CheckRemoteDebuggerPresent", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "NtQueryInformationProcess", behaviorId: "B0001.008", behaviorName: "NtQueryInformationProcess", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "GetTickCount", behaviorId: "B0001.020", behaviorName: "Timing/Delay Check", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "QueryPerformanceCounter", behaviorId: "B0001.020", behaviorName: "Timing/Delay Check", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "RDTSC", behaviorId: "B0001.020", behaviorName: "Timing/Delay Check", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
];

// ── Anti-VM rules ─────────────────────────────────────────────────────────

const ANTI_VM_RULES: MBCRule[] = [
  { tag: "BIOS", behaviorId: "B0009.006", behaviorName: "CPUID Check", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "MAC", behaviorId: "B0009.002", behaviorName: "Check for Specific MAC Address", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "Registry", behaviorId: "B0009.003", behaviorName: "Check for Specific Registry Keys", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "Driver", behaviorId: "B0009.001", behaviorName: "Check for Specific Hardware", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "CPU Count", behaviorId: "B0007.006", behaviorName: "Check Number of Processors", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "Sandbox Username", behaviorId: "B0007.014", behaviorName: "Check Username", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "Hardware Fingerprint", behaviorId: "B0009.001", behaviorName: "Check for Specific Hardware", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
  { tag: "Timing", behaviorId: "B0009.013", behaviorName: "Timing Attack", objectiveId: "OB0001", objectiveName: "Anti-Behavioral Analysis", confidence: "high" },
];

// ── Persistence rules ─────────────────────────────────────────────────────

const PERSISTENCE_RULES: MBCRule[] = [
  { tag: "RunKey", behaviorId: "F0012", behaviorName: "Registry Run Keys / Startup Folder", objectiveId: "OB0012", objectiveName: "Persistence", confidence: "high" },
  { tag: "StartupFolder", behaviorId: "F0012", behaviorName: "Registry Run Keys / Startup Folder", objectiveId: "OB0012", objectiveName: "Persistence", confidence: "high" },
  { tag: "Service", behaviorId: "F0011", behaviorName: "Modify Existing Service", objectiveId: "OB0012", objectiveName: "Persistence", confidence: "high" },
  { tag: "Task", behaviorId: "F0012", behaviorName: "Registry Run Keys / Startup Folder", objectiveId: "OB0012", objectiveName: "Persistence", confidence: "medium" },
  { tag: "WMI", behaviorId: "F0012", behaviorName: "Registry Run Keys / Startup Folder", objectiveId: "OB0012", objectiveName: "Persistence", confidence: "medium" },
  { tag: "DLL Hijack", behaviorId: "F0015", behaviorName: "Hijack Execution Flow", objectiveId: "OB0006", objectiveName: "Defense Evasion", confidence: "high" },
  { tag: "COM Hijack", behaviorId: "F0015", behaviorName: "Hijack Execution Flow", objectiveId: "OB0006", objectiveName: "Defense Evasion", confidence: "high" },
];

// ── Network rules ─────────────────────────────────────────────────────────

const NETWORK_RULES: MBCRule[] = [
  { tag: "C2", behaviorId: "B0030", behaviorName: "C2 Communication", objectiveId: "OB0004", objectiveName: "Command and Control", confidence: "high" },
  { tag: "DNS", behaviorId: "C0011", behaviorName: "DNS Communication", objectiveId: "OC0001", objectiveName: "Communication", confidence: "high" },
  { tag: "TLS", behaviorId: "C0002", behaviorName: "HTTP Communication", objectiveId: "OC0001", objectiveName: "Communication", confidence: "medium" },
  { tag: "HTTP POST", behaviorId: "C0002", behaviorName: "HTTP Communication", objectiveId: "OC0001", objectiveName: "Communication", confidence: "high" },
  { tag: "Exfil", behaviorId: "E1020", behaviorName: "Automated Exfiltration", objectiveId: "OB0010", objectiveName: "Exfiltration", confidence: "high" },
  { tag: "Beacon", behaviorId: "B0030", behaviorName: "C2 Communication", objectiveId: "OB0004", objectiveName: "Command and Control", confidence: "high" },
  { tag: "DGA", behaviorId: "B0031", behaviorName: "Domain Name Generation", objectiveId: "OB0004", objectiveName: "Command and Control", confidence: "high" },
];

// ── Memory rules ──────────────────────────────────────────────────────────

const MEMORY_RULES: MBCRule[] = [
  { tag: "RWX", behaviorId: "C0008", behaviorName: "Change Memory Protection", objectiveId: "OC0006", objectiveName: "Memory", confidence: "high" },
  { tag: "Shellcode", behaviorId: "E1055", behaviorName: "Process Injection", objectiveId: "OB0006", objectiveName: "Defense Evasion", confidence: "high" },
  { tag: "Unpacked Module", behaviorId: "F0001", behaviorName: "Software Packing", objectiveId: "OB0002", objectiveName: "Anti-Static Analysis", confidence: "high" },
  { tag: "Injection", behaviorId: "E1055", behaviorName: "Process Injection", objectiveId: "OB0006", objectiveName: "Defense Evasion", confidence: "high" },
  { tag: "Heap Spray", behaviorId: "C0006", behaviorName: "Heap Spray", objectiveId: "OC0006", objectiveName: "Memory", confidence: "high" },
  { tag: "ROP", behaviorId: "C0009", behaviorName: "Stack Pivot", objectiveId: "OC0006", objectiveName: "Memory", confidence: "medium" },
];

// ── Process Injection rules ───────────────────────────────────────────────

const INJECTION_RULES: MBCRule[] = [
  { tag: "Hollowing", behaviorId: "E1055", behaviorName: "Process Injection", objectiveId: "OB0006", objectiveName: "Defense Evasion", confidence: "high" },
  { tag: "Classic", behaviorId: "E1055", behaviorName: "Process Injection", objectiveId: "OB0006", objectiveName: "Defense Evasion", confidence: "high" },
  { tag: "APC", behaviorId: "E1055", behaviorName: "Process Injection", objectiveId: "OB0006", objectiveName: "Defense Evasion", confidence: "high" },
  { tag: "Doppelganging", behaviorId: "E1055", behaviorName: "Process Injection", objectiveId: "OB0006", objectiveName: "Defense Evasion", confidence: "high" },
  { tag: "Thread Hijack", behaviorId: "E1055", behaviorName: "Process Injection", objectiveId: "OB0006", objectiveName: "Defense Evasion", confidence: "high" },
  { tag: "DLL Injection", behaviorId: "E1055", behaviorName: "Process Injection", objectiveId: "OB0006", objectiveName: "Defense Evasion", confidence: "high" },
  { tag: "Reflective", behaviorId: "E1055", behaviorName: "Process Injection", objectiveId: "OB0006", objectiveName: "Defense Evasion", confidence: "high" },
];

// ── System Artifact rules ─────────────────────────────────────────────────

const ARTIFACT_RULES: MBCRule[] = [
  { tag: "File", behaviorId: "C0016", behaviorName: "Create File", objectiveId: "OC0005", objectiveName: "File System", confidence: "medium" },
  { tag: "Registry", behaviorId: "E1112", behaviorName: "Modify Registry", objectiveId: "OB0006", objectiveName: "Defense Evasion", confidence: "high" },
  { tag: "Mutex", behaviorId: "C0042", behaviorName: "Create Mutex", objectiveId: "OC0009", objectiveName: "Process", confidence: "high" },
  { tag: "Service", behaviorId: "F0011", behaviorName: "Modify Existing Service", objectiveId: "OB0012", objectiveName: "Persistence", confidence: "high" },
  { tag: "Scheduled Task", behaviorId: "F0012", behaviorName: "Registry Run Keys / Startup Folder", objectiveId: "OB0012", objectiveName: "Persistence", confidence: "low" },
  { tag: "WMI", behaviorId: "F0012", behaviorName: "Registry Run Keys / Startup Folder", objectiveId: "OB0012", objectiveName: "Persistence", confidence: "low" },
];

// ── Helper ────────────────────────────────────────────────────────────────

function matchTagRules(
  entries: { tags: string[] }[],
  rules: MBCRule[],
  source: string,
): MBCSuggestion[] {
  const results: MBCSuggestion[] = [];

  for (const entry of entries) {
    for (const tag of entry.tags) {
      for (const rule of rules) {
        if (tag === rule.tag) {
          results.push({
            behaviorId: rule.behaviorId,
            behaviorName: rule.behaviorName,
            objectiveId: rule.objectiveId,
            objectiveName: rule.objectiveName,
            source,
            confidence: rule.confidence,
          });
        }
      }
    }
  }

  return results;
}

function deduplicateSuggestions(suggestions: MBCSuggestion[]): MBCSuggestion[] {
  const map = new Map<string, MBCSuggestion>();

  for (const s of suggestions) {
    const existing = map.get(s.behaviorId);
    if (!existing || CONFIDENCE_RANK[s.confidence] > CONFIDENCE_RANK[existing.confidence]) {
      map.set(s.behaviorId, s);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const confDiff = CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
    if (confDiff !== 0) return confDiff;
    return a.behaviorId.localeCompare(b.behaviorId);
  });
}

/**
 * Suggests MBC behaviors from MRE RuntimeBehaviorData structured tags.
 */
export function suggestMBCBehaviors(runtime: MreRuntimeLike): MBCSuggestion[] {
  const allSuggestions: MBCSuggestion[] = [
    ...matchTagRules(
      runtime.antiDebug.flatMap((e) => [
        { tags: e.categoryTags },
        { tags: e.apis },
      ]),
      ANTI_DEBUG_RULES,
      "antiDebug",
    ),
    ...matchTagRules(
      runtime.antiVM.map((e) => ({ tags: e.methodTags })),
      ANTI_VM_RULES,
      "antiVM",
    ),
    ...matchTagRules(
      runtime.persistence.map((e) => ({ tags: e.typeTags })),
      PERSISTENCE_RULES,
      "persistence",
    ),
    ...matchTagRules(
      runtime.network.map((e) => ({ tags: e.behaviorTags })),
      NETWORK_RULES,
      "network",
    ),
    ...matchTagRules(
      runtime.memory.map((e) => ({ tags: e.eventTags })),
      MEMORY_RULES,
      "memory",
    ),
    ...matchTagRules(
      runtime.processInjection.map((e) => ({ tags: e.techniqueTags })),
      INJECTION_RULES,
      "injection",
    ),
    ...matchTagRules(
      runtime.systemArtifacts.map((e) => ({ tags: e.typeTags })),
      ARTIFACT_RULES,
      "artifacts",
    ),
  ];

  return deduplicateSuggestions(allSuggestions);
}

// ── MBC Version Check ─────────────────────────────────────────────────────

const MBC_LOCAL_VERSION = "v3.2";
const MBC_REPO_API = "https://api.github.com/repos/MBCProject/mbc-markdown/releases/latest";
const VERSION_CHECK_CACHE_MS = 24 * 60 * 60 * 1000; // 24h

export interface MBCVersionResult {
  current: string;
  remote: string | null;
  newer: boolean;
}

/**
 * Checks if a newer MBC version is available on GitHub.
 * Caches the result for 24h to avoid rate limiting.
 */
export async function checkMBCVersion(): Promise<MBCVersionResult> {
  // Check cache first
  const cached = localStorage.getItem(STORAGE_KEYS.MBC_REMOTE_VERSION);
  const cacheExpiry = localStorage.getItem(STORAGE_KEYS.MBC_VERSION_CHECK_EXPIRY);

  if (cached && cacheExpiry) {
    const expiry = parseInt(cacheExpiry, 10);
    if (Date.now() < expiry) {
      const remote = cached;
      return {
        current: MBC_LOCAL_VERSION,
        remote,
        newer: isNewerVersion(remote, MBC_LOCAL_VERSION),
      };
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(MBC_REPO_API, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      return { current: MBC_LOCAL_VERSION, remote: null, newer: false };
    }

    const data = await response.json();
    const remoteVersion: string = data.tag_name || data.name || "";

    // Cache the result
    localStorage.setItem(STORAGE_KEYS.MBC_REMOTE_VERSION, remoteVersion);
    localStorage.setItem(STORAGE_KEYS.MBC_VERSION_CHECK_EXPIRY, String(Date.now() + VERSION_CHECK_CACHE_MS));

    return {
      current: MBC_LOCAL_VERSION,
      remote: remoteVersion,
      newer: isNewerVersion(remoteVersion, MBC_LOCAL_VERSION),
    };
  } catch {
    return { current: MBC_LOCAL_VERSION, remote: null, newer: false };
  }
}

/**
 * Simple version comparison: extracts numeric parts and compares.
 * "v3.2" vs "v3.3" → true (remote is newer)
 */
function isNewerVersion(remote: string, local: string): boolean {
  const parseVersion = (v: string) => {
    const match = v.match(/(\d+)\.(\d+)/);
    if (!match) return [0, 0];
    return [parseInt(match[1], 10), parseInt(match[2], 10)];
  };

  const [rMajor, rMinor] = parseVersion(remote);
  const [lMajor, lMinor] = parseVersion(local);

  if (rMajor > lMajor) return true;
  if (rMajor === lMajor && rMinor > lMinor) return true;
  return false;
}
