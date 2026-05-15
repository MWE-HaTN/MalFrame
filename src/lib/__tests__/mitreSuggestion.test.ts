import { describe, it, expect } from "vitest";
import { suggestMitreTechniques, suggestMitreFromMreRuntime } from "@/lib/mitreSuggestion";

const emptyBehaviorData = {
  processTree: "",
  fileSystemMods: "",
  registryPersistence: "",
  networkActivity: "",
  memoryArtifacts: "",
  systemChanges: "",
};

describe("suggestMitreTechniques", () => {
  it("returns empty for empty input", () => {
    const result = suggestMitreTechniques(emptyBehaviorData);
    expect(result).toEqual([]);
  });

  it("suggests T1059.003 for cmd.exe in processTree", () => {
    const result = suggestMitreTechniques({
      ...emptyBehaviorData,
      processTree: "malware spawned cmd.exe /c whoami",
    });
    expect(result.some((s) => s.techniqueId === "T1059.003")).toBe(true);
  });

  it("suggests T1059.001 for powershell", () => {
    const result = suggestMitreTechniques({
      ...emptyBehaviorData,
      processTree: "powershell -enc BASE64COMMAND",
    });
    expect(result.some((s) => s.techniqueId === "T1059.001")).toBe(true);
  });

  it("suggests T1486 for encrypt in fileSystem", () => {
    const result = suggestMitreTechniques({
      ...emptyBehaviorData,
      fileSystemMods: "encrypted all files with .locked extension",
    });
    expect(result.some((s) => s.techniqueId === "T1486")).toBe(true);
  });

  it("suggests T1547.001 for startup in fileSystem", () => {
    const result = suggestMitreTechniques({
      ...emptyBehaviorData,
      fileSystemMods: "dropped to startup folder",
    });
    expect(result.some((s) => s.techniqueId === "T1547.001")).toBe(true);
  });

  it("suggests T1071 for c2 in network", () => {
    const result = suggestMitreTechniques({
      ...emptyBehaviorData,
      networkActivity: "HTTP beacon to C2 server",
    });
    expect(result.some((s) => s.techniqueId === "T1071")).toBe(true);
  });

  it("suggests T1055 for inject in memory", () => {
    const result = suggestMitreTechniques({
      ...emptyBehaviorData,
      memoryArtifacts: "process injection via VirtualAlloc",
    });
    expect(result.some((s) => s.techniqueId === "T1055")).toBe(true);
  });

  it("deduplicates same technique from multiple sources", () => {
    const result = suggestMitreTechniques({
      ...emptyBehaviorData,
      processTree: "cmd.exe",
      systemChanges: "cmd.exe executed",
    });
    const t1059 = result.filter((s) => s.techniqueId === "T1059.003");
    expect(t1059).toHaveLength(1);
  });
});

describe("suggestMitreFromMreRuntime", () => {
  const emptyRuntime = {
    antiDebug: [],
    antiVM: [],
    persistence: [],
    network: [],
    memory: [],
    processInjection: [],
    systemArtifacts: [],
  };

  it("returns empty for empty input", () => {
    const result = suggestMitreFromMreRuntime(emptyRuntime);
    expect(result).toEqual([]);
  });

  it("suggests T1622 for anti-debug tags", () => {
    const result = suggestMitreFromMreRuntime({
      ...emptyRuntime,
      antiDebug: [{ categoryTags: ["API-based"], apis: [] }],
    });
    expect(result.some((s) => s.techniqueId === "T1622")).toBe(true);
  });

  it("suggests T1497.001 for anti-VM tags", () => {
    const result = suggestMitreFromMreRuntime({
      ...emptyRuntime,
      antiVM: [{ methodTags: ["Registry"] }],
    });
    expect(result.some((s) => s.techniqueId === "T1497.001")).toBe(true);
  });
});
