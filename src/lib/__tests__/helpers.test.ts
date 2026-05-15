import { describe, it, expect } from "vitest";
import {
  extractLogText,
  toLogEntries,
  formatFieldLabel,
  formatLabelWithColon,
  formatSignatureStatus,
  formatDllMitigations,
  clamp,
  isAllEmpty,
  isMeaningful,
  hasAnyMeaningfulValue,
  getPackedSemanticLevel,
  getRWXSemanticLevel,
  getEntropySemanticLevel,
} from "@/lib/export/helpers";

describe("extractLogText", () => {
  it("returns empty string for null/undefined", () => {
    expect(extractLogText(null)).toBe("");
    expect(extractLogText(undefined)).toBe("");
  });

  it("returns string as-is", () => {
    expect(extractLogText("hello")).toBe("hello");
  });

  it("joins LogEntry array with separator", () => {
    const entries = [
      { id: "1", text: "first", images: [], timestamp: "" },
      { id: "2", text: "second", images: [], timestamp: "" },
    ];
    expect(extractLogText(entries)).toBe("first\n\nsecond");
  });

  it("uses custom separator", () => {
    const entries = [
      { id: "1", text: "a", images: [], timestamp: "" },
      { id: "2", text: "b", images: [], timestamp: "" },
    ];
    expect(extractLogText(entries, "\n")).toBe("a\nb");
  });

  it("filters empty text entries", () => {
    const entries = [
      { id: "1", text: "ok", images: [], timestamp: "" },
      { id: "2", text: "", images: [], timestamp: "" },
    ];
    expect(extractLogText(entries)).toBe("ok");
  });
});

describe("toLogEntries", () => {
  it("returns array as-is", () => {
    const arr = [{ id: "1", text: "x", images: [], timestamp: "" }];
    expect(toLogEntries(arr)).toBe(arr);
  });

  it("converts string to LogEntry array", () => {
    const result = toLogEntries("hello");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("hello");
  });

  it("returns empty array for empty string", () => {
    expect(toLogEntries("")).toEqual([]);
    expect(toLogEntries("  ")).toEqual([]);
  });

  it("returns empty array for non-string/non-array", () => {
    expect(toLogEntries(123)).toEqual([]);
    expect(toLogEntries(null)).toEqual([]);
  });
});

describe("formatFieldLabel", () => {
  it("converts camelCase to readable", () => {
    expect(formatFieldLabel("sha256")).toBe("Sha256");
    expect(formatFieldLabel("fileName")).toBe("File Name");
    expect(formatFieldLabel("compileTime")).toBe("Compile Time");
  });
});

describe("formatLabelWithColon", () => {
  it("adds colon and non-breaking space", () => {
    expect(formatLabelWithColon("Name")).toBe("Name :");
  });

  it("handles existing colon", () => {
    expect(formatLabelWithColon("Name:")).toBe("Name :");
  });

  it("returns empty for empty input", () => {
    expect(formatLabelWithColon("")).toBe("");
    expect(formatLabelWithColon("  ")).toBe("");
  });
});

describe("formatSignatureStatus", () => {
  it("maps known statuses", () => {
    expect(formatSignatureStatus("signed_valid")).toBe("Signed (Valid)");
    expect(formatSignatureStatus("unsigned")).toBe("Unsigned");
    expect(formatSignatureStatus("unknown")).toBe("Unknown");
  });

  it("returns empty for undefined", () => {
    expect(formatSignatureStatus(undefined)).toBe("");
  });

  it("returns raw value for unknown status", () => {
    expect(formatSignatureStatus("custom")).toBe("custom");
  });
});

describe("formatDllMitigations", () => {
  it("joins array with commas", () => {
    expect(formatDllMitigations(["ASLR", "DEP"])).toBe("ASLR, DEP");
  });

  it("returns None for empty/undefined", () => {
    expect(formatDllMitigations(undefined)).toBe("None");
    expect(formatDllMitigations([])).toBe("None");
  });
});

describe("clamp", () => {
  it("clamps to min", () => expect(clamp(-5, 0, 10)).toBe(0));
  it("clamps to max", () => expect(clamp(15, 0, 10)).toBe(10));
  it("returns value in range", () => expect(clamp(5, 0, 10)).toBe(5));
});

describe("isAllEmpty", () => {
  it("returns true for all empty", () => {
    expect(isAllEmpty({ a: "", b: "", c: null })).toBe(true);
  });

  it("returns false when some have value", () => {
    expect(isAllEmpty({ a: "", b: "hello" })).toBe(false);
  });
});

describe("isMeaningful", () => {
  it("returns true for meaningful values", () => {
    expect(isMeaningful("hello")).toBe(true);
    expect(isMeaningful("0")).toBe(true);
  });

  it("returns false for empty/none/n/a", () => {
    expect(isMeaningful("")).toBe(false);
    expect(isMeaningful("-")).toBe(false);
    expect(isMeaningful("none")).toBe(false);
    expect(isMeaningful("n/a")).toBe(false);
    expect(isMeaningful(null)).toBe(false);
    expect(isMeaningful(undefined)).toBe(false);
  });
});

describe("hasAnyMeaningfulValue", () => {
  it("returns true if any field has value", () => {
    expect(hasAnyMeaningfulValue([
      { label: "a", value: "" },
      { label: "b", value: "yes" },
    ])).toBe(true);
  });

  it("returns false if all empty", () => {
    expect(hasAnyMeaningfulValue([
      { label: "a", value: "" },
      { label: "b", value: "-" },
    ])).toBe(false);
  });
});

describe("getPackedSemanticLevel", () => {
  it("returns HIGH_RISK for YES", () => {
    expect(getPackedSemanticLevel("YES")).toBe("HIGH_RISK");
    expect(getPackedSemanticLevel("true")).toBe("HIGH_RISK");
  });

  it("returns GOOD for NO", () => {
    expect(getPackedSemanticLevel("NO")).toBe("GOOD");
  });

  it("returns null for unknown", () => {
    expect(getPackedSemanticLevel("maybe")).toBeNull();
  });
});

describe("getRWXSemanticLevel", () => {
  it("returns HIGH_RISK for RWX", () => {
    expect(getRWXSemanticLevel("RWX")).toBe("HIGH_RISK");
  });

  it("returns SUSPICIOUS for RW", () => {
    expect(getRWXSemanticLevel("RW")).toBe("SUSPICIOUS");
  });

  it("returns GOOD for RX", () => {
    expect(getRWXSemanticLevel("RX")).toBe("GOOD");
  });
});

describe("getEntropySemanticLevel", () => {
  it("returns HIGH_RISK for high entropy", () => {
    expect(getEntropySemanticLevel("7.5")).toBe("HIGH_RISK");
  });

  it("returns SUSPICIOUS for medium entropy", () => {
    expect(getEntropySemanticLevel("6.8")).toBe("SUSPICIOUS");
  });

  it("returns NEUTRAL for low entropy", () => {
    expect(getEntropySemanticLevel("4.0")).toBe("NEUTRAL");
  });

  it("returns null for NaN", () => {
    expect(getEntropySemanticLevel("abc")).toBeNull();
  });
});
