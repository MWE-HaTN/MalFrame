// Dropdown options for Runtime Behavior
export const ANTI_DEBUG_CATEGORIES = [
  "API-based",
  "Exception-based",
  "Timing-based",
  "Process/Thread-based",
  "Hardware Breakpoint Detection",
  "Memory Inspection",
  "PEB/NT Headers Check",
  "Instruction-level Checks",
  "Behavioral/Environment Checks",
];
export const ANTI_DEBUG_APIS = [
  "IsDebuggerPresent",
  "CheckRemoteDebuggerPresent",
  "OutputDebugStringA/W",
  "NtQueryInformationProcess",
  "NtSetInformationThread (ThreadHideFromDebugger)",
  "ZwQueryInformationProcess",
  "PEB->BeingDebugged",
  "PEB->NtGlobalFlags",
  "GetTickCount",
  "QueryPerformanceCounter",
  "RDTSC",
  "INT3 (0xCC)",
  "ICEBP (0xF1)",
  "RaiseException",
  "SetUnhandledExceptionFilter",
  "Scan for 0xCC bytes",
  "Checksum .text section",
  "PAGE_GUARD detection",
  'FindWindow("x64dbg")',
  'GetModuleHandle("dbghelp.dll")',
  "Check for debugger DLLs (x64dbg, OllyDbg, IDA)",
];
export const ANTI_VM_METHODS = ["BIOS", "MAC", "Registry", "Driver", "CPU Count", "Sandbox Username", "Hardware Fingerprint", "Timing"];
export const ARTIFACT_TYPES = ["File", "Registry", "Mutex", "Service", "Scheduled Task", "WMI"];
export const PERSISTENCE_TYPES = ["RunKey", "StartupFolder", "Service", "Task", "WMI", "DLL Hijack", "COM Hijack"];
export const NETWORK_TYPES = ["C2", "DNS", "TLS", "HTTP POST", "Exfil", "Beacon", "DGA"];
export const MEMORY_TYPES = ["RWX", "Shellcode", "Unpacked Module", "Injection", "Heap Spray", "ROP"];
export const INJECTION_TECHNIQUES = ["Hollowing", "Classic", "APC", "Doppelgänging", "Thread Hijack", "DLL Injection", "Reflective"];
export const INJECTION_APIS = ["VirtualAllocEx", "WriteProcessMemory", "SetThreadContext", "NtUnmapViewOfSection", "CreateRemoteThread", "QueueUserAPC", "NtCreateThreadEx"];

// Note: Use STORAGE_KEYS directly from "@/lib/storageKeys" when needed
