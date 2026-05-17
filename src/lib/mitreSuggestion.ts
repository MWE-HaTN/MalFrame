/**
 * MITRE ATT&CK Auto-Suggestion Engine
 * Scans behavior data and suggests relevant MITRE techniques based on keyword/tag matching.
 */

import type { BehaviorAnalysisData } from "@/features/mia/types";

export interface MitreSuggestion {
  techniqueId: string;
  techniqueName: string;
  tacticId: string;
  source: string;
  confidence: "high" | "medium" | "low";
}

interface SuggestionRule {
  keywords: string[];
  techniqueId: string;
  techniqueName: string;
  tacticId: string;
  confidence: "high" | "medium" | "low";
}

const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

// ── Free-text rules for MIA BehaviorAnalysisData ──────────────────────────

const PROCESS_TREE_RULES: SuggestionRule[] = [
  { keywords: ["cmd.exe", "cmd /", "cmd /c", "cmd /k", "command prompt"], techniqueId: "T1059.003", techniqueName: "Command and Scripting Interpreter: Windows Command Shell", tacticId: "execution", confidence: "high" },
  { keywords: ["powershell", "pwsh"], techniqueId: "T1059.001", techniqueName: "Command and Scripting Interpreter: PowerShell", tacticId: "execution", confidence: "high" },
  { keywords: ["wscript", "cscript", "vbscript", "jscript", "wscript.shell"], techniqueId: "T1059.005", techniqueName: "Command and Scripting Interpreter: Visual Basic", tacticId: "execution", confidence: "high" },
  { keywords: ["rundll32"], techniqueId: "T1218.011", techniqueName: "System Binary Proxy Execution: Rundll32", tacticId: "defense_evasion", confidence: "high" },
  { keywords: ["regsvr32"], techniqueId: "T1218.010", techniqueName: "System Binary Proxy Execution: Regsvr32", tacticId: "defense_evasion", confidence: "high" },
  { keywords: ["mshta"], techniqueId: "T1218.005", techniqueName: "System Binary Proxy Execution: Mshta", tacticId: "defense_evasion", confidence: "high" },
  { keywords: ["certutil"], techniqueId: "T1105", techniqueName: "Ingress Tool Transfer", tacticId: "command_and_control", confidence: "medium" },
  { keywords: ["bitsadmin"], techniqueId: "T1197", techniqueName: "BITS Jobs", tacticId: "persistence", confidence: "medium" },
  { keywords: ["inject", "hollow", "process hollowing"], techniqueId: "T1055.012", techniqueName: "Process Injection: Process Hollowing", tacticId: "defense_evasion", confidence: "high" },
  { keywords: ["create remote thread", "createremotethread"], techniqueId: "T1055.003", techniqueName: "Process Injection: Thread Execution Hijacking", tacticId: "defense_evasion", confidence: "high" },
  { keywords: ["mimikatz", "sekurlsa", "kerberos"], techniqueId: "T1003", techniqueName: "OS Credential Dumping", tacticId: "credential_access", confidence: "high" },
];

const FILE_SYSTEM_RULES: SuggestionRule[] = [
  { keywords: ["startup", "startup folder", "\\start menu\\", "appdata\\roaming\\microsoft\\windows\\start menu"], techniqueId: "T1547.001", techniqueName: "Boot or Logon Autostart Execution: Registry Run Keys / Startup Folder", tacticId: "persistence", confidence: "high" },
  { keywords: ["temp\\", "\\tmp\\", "dropper", "drop payload"], techniqueId: "T1105", techniqueName: "Ingress Tool Transfer", tacticId: "command_and_control", confidence: "medium" },
  { keywords: ["hidden", "alternate data stream", ":$data", " ads "], techniqueId: "T1564.001", techniqueName: "Hide Artifacts: NTFS File Attributes", tacticId: "defense_evasion", confidence: "high" },
  { keywords: ["encrypt", "ransom", ".locked", ".encrypted", ".crypto"], techniqueId: "T1486", techniqueName: "Data Encrypted for Impact", tacticId: "impact", confidence: "high" },
  { keywords: ["self-delete", "self delete", "delete itself", "file deletion"], techniqueId: "T1070.004", techniqueName: "Indicator Removal: File Deletion", tacticId: "defense_evasion", confidence: "medium" },
  { keywords: ["recycle bin", "recycler"], techniqueId: "T1070.004", techniqueName: "Indicator Removal: File Deletion", tacticId: "defense_evasion", confidence: "low" },
  { keywords: [".dll side-load", "side-load", "sideload"], techniqueId: "T1574.002", techniqueName: "Hijack Execution Flow: DLL Side-Loading", tacticId: "persistence", confidence: "high" },
];

const REGISTRY_RULES: SuggestionRule[] = [
  { keywords: ["run key", "runonce", "currentversion\\run", "currentversion\\runonce"], techniqueId: "T1547.001", techniqueName: "Boot or Logon Autostart Execution: Registry Run Keys / Startup Folder", tacticId: "persistence", confidence: "high" },
  { keywords: ["createservice", "create service", "new service"], techniqueId: "T1543.003", techniqueName: "Create or Modify System Process: Windows Service", tacticId: "persistence", confidence: "high" },
  { keywords: ["schtasks", "scheduled task", "at.exe"], techniqueId: "T1053.005", techniqueName: "Scheduled Task/Job: Scheduled Task", tacticId: "persistence", confidence: "high" },
  { keywords: ["wmi", "win32_", "wmic"], techniqueId: "T1546.003", techniqueName: "Event Triggered Execution: WMI Event Subscription", tacticId: "persistence", confidence: "high" },
  { keywords: ["com hijack", "clsid hijack"], techniqueId: "T1546.015", techniqueName: "Event Triggered Execution: COM Object Hijacking", tacticId: "persistence", confidence: "high" },
  { keywords: ["dll hijack", "dll search order"], techniqueId: "T1574.001", techniqueName: "Hijack Execution Flow: DLL Search Order Hijacking", tacticId: "persistence", confidence: "high" },
  { keywords: ["image file execution options", "ifeo", "debugger"], techniqueId: "T1546.012", techniqueName: "Event Triggered Execution: Image File Execution Options Injection", tacticId: "persistence", confidence: "high" },
];

const NETWORK_RULES: SuggestionRule[] = [
  { keywords: ["c2", "command and control", "c&c", "cnc"], techniqueId: "T1071", techniqueName: "Application Layer Protocol", tacticId: "command_and_control", confidence: "high" },
  { keywords: ["beacon", "beaconing"], techniqueId: "T1071", techniqueName: "Application Layer Protocol", tacticId: "command_and_control", confidence: "high" },
  { keywords: ["dns query", "dns request", "dns tunnel", "dns exfil"], techniqueId: "T1071.004", techniqueName: "Application Layer Protocol: DNS", tacticId: "command_and_control", confidence: "high" },
  { keywords: ["http post", "http get", "https request", "web request"], techniqueId: "T1071.001", techniqueName: "Application Layer Protocol: Web Protocols", tacticId: "command_and_control", confidence: "high" },
  { keywords: ["dga", "domain generation", "random domain"], techniqueId: "T1568.002", techniqueName: "Dynamic Resolution: Domain Generation Algorithms", tacticId: "command_and_control", confidence: "high" },
  { keywords: ["exfil", "exfiltrat", "data transfer", "data exfil"], techniqueId: "T1041", techniqueName: "Exfiltration Over C2 Channel", tacticId: "exfiltration", confidence: "high" },
  { keywords: ["tls", "ssl", "certificate", "encrypted channel"], techniqueId: "T1573", techniqueName: "Encrypted Channel", tacticId: "command_and_control", confidence: "medium" },
  { keywords: ["tor", ".onion", "onion routing"], techniqueId: "T1090.003", techniqueName: "Proxy: Multi-hop Proxy", tacticId: "command_and_control", confidence: "high" },
  { keywords: ["user-agent", "user agent"], techniqueId: "T1071.001", techniqueName: "Application Layer Protocol: Web Protocols", tacticId: "command_and_control", confidence: "low" },
];

const MEMORY_RULES: SuggestionRule[] = [
  { keywords: ["inject", "injection", "code injection"], techniqueId: "T1055", techniqueName: "Process Injection", tacticId: "defense_evasion", confidence: "high" },
  { keywords: ["rwx", "read write execute", "rwx memory"], techniqueId: "T1055", techniqueName: "Process Injection", tacticId: "defense_evasion", confidence: "high" },
  { keywords: ["shellcode", "shell code"], techniqueId: "T1055", techniqueName: "Process Injection", tacticId: "defense_evasion", confidence: "high" },
  { keywords: ["unpacked", "unpack", "depacked"], techniqueId: "T1027.002", techniqueName: "Obfuscated Files or Information: Software Packing", tacticId: "defense_evasion", confidence: "medium" },
  { keywords: ["heap spray", "heapspray"], techniqueId: "T1055", techniqueName: "Process Injection", tacticId: "defense_evasion", confidence: "medium" },
  { keywords: ["reflective", "reflective loading", "reflective dll"], techniqueId: "T1620", techniqueName: "Reflective Code Loading", tacticId: "defense_evasion", confidence: "high" },
];

const SYSTEM_RULES: SuggestionRule[] = [
  { keywords: ["new service", "service created", "service installed"], techniqueId: "T1543.003", techniqueName: "Create or Modify System Process: Windows Service", tacticId: "persistence", confidence: "high" },
  { keywords: ["scheduled task", "task created", "task scheduled"], techniqueId: "T1053.005", techniqueName: "Scheduled Task/Job: Scheduled Task", tacticId: "persistence", confidence: "high" },
  { keywords: ["firewall", "firewall rule", "netsh"], techniqueId: "T1562.004", techniqueName: "Impair Defenses: Disable or Modify System Firewall", tacticId: "defense_evasion", confidence: "high" },
  { keywords: ["proxy", "proxy config", "proxy setting"], techniqueId: "T1090", techniqueName: "Proxy", tacticId: "command_and_control", confidence: "medium" },
  { keywords: ["credential", "password", "mimikatz", "lazagne"], techniqueId: "T1003", techniqueName: "OS Credential Dumping", tacticId: "credential_access", confidence: "high" },
  { keywords: ["keylog", "key log", "keystroke"], techniqueId: "T1056.001", techniqueName: "Input Capture: Keylogging", tacticId: "collection", confidence: "high" },
  { keywords: ["screenshot", "screen capture", "print screen"], techniqueId: "T1113", techniqueName: "Screen Capture", tacticId: "collection", confidence: "high" },
  { keywords: ["clipboard", "clip capture"], techniqueId: "T1115", techniqueName: "Clipboard Data", tacticId: "collection", confidence: "medium" },
  { keywords: ["disable defender", "disable antivirus", "disable security"], techniqueId: "T1562.001", techniqueName: "Impair Defenses: Disable or Modify Tools", tacticId: "defense_evasion", confidence: "high" },
];

// Source label mapping
const SOURCE_LABELS: Record<string, string> = {
  processTree: "processTree",
  fileSystemMods: "fileSystem",
  registryPersistence: "registry",
  networkActivity: "network",
  memoryArtifacts: "memory",
  systemChanges: "system",
};

/**
 * Scans a text field against a set of rules, returning matching suggestions.
 */
function matchRules(text: string, rules: SuggestionRule[], source: string): MitreSuggestion[] {
  if (!text.trim()) return [];
  const lower = text.toLowerCase();
  const results: MitreSuggestion[] = [];

  for (const rule of rules) {
    const matched = rule.keywords.some((kw) => lower.includes(kw));
    if (matched) {
      results.push({
        techniqueId: rule.techniqueId,
        techniqueName: rule.techniqueName,
        tacticId: rule.tacticId,
        source,
        confidence: rule.confidence,
      });
    }
  }

  return results;
}

/**
 * Deduplicates suggestions by techniqueId, keeping the highest confidence.
 */
function deduplicateSuggestions(suggestions: MitreSuggestion[]): MitreSuggestion[] {
  const map = new Map<string, MitreSuggestion>();

  for (const s of suggestions) {
    const existing = map.get(s.techniqueId);
    if (!existing || CONFIDENCE_RANK[s.confidence] > CONFIDENCE_RANK[existing.confidence]) {
      map.set(s.techniqueId, s);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    // Sort by confidence desc, then by techniqueId
    const confDiff = CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
    if (confDiff !== 0) return confDiff;
    return a.techniqueId.localeCompare(b.techniqueId);
  });
}

/**
 * Suggests MITRE techniques from MIA BehaviorAnalysisData free-text fields.
 */
export function suggestMitreTechniques(behaviorData: BehaviorAnalysisData): MitreSuggestion[] {
  const allSuggestions: MitreSuggestion[] = [
    ...matchRules(behaviorData.processTree, PROCESS_TREE_RULES, SOURCE_LABELS.processTree),
    ...matchRules(behaviorData.fileSystemMods, FILE_SYSTEM_RULES, SOURCE_LABELS.fileSystemMods),
    ...matchRules(behaviorData.registryPersistence, REGISTRY_RULES, SOURCE_LABELS.registryPersistence),
    ...matchRules(behaviorData.networkActivity, NETWORK_RULES, SOURCE_LABELS.networkActivity),
    ...matchRules(behaviorData.memoryArtifacts, MEMORY_RULES, SOURCE_LABELS.memoryArtifacts),
    ...matchRules(behaviorData.systemChanges, SYSTEM_RULES, SOURCE_LABELS.systemChanges),
  ];

  return deduplicateSuggestions(allSuggestions);
}
