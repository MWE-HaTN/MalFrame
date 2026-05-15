import { describe, it, expect } from "vitest";
import { parseIOCsFromText } from "@/lib/parseIOCs";

describe("parseIOCsFromText", () => {
  it("returns empty array for empty input", () => {
    expect(parseIOCsFromText("")).toEqual([]);
    expect(parseIOCsFromText("   ")).toEqual([]);
  });

  it("extracts SHA256 hashes", () => {
    const hash = "a".repeat(64);
    const result = parseIOCsFromText(`Sample hash: ${hash}`);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("File Hash (SHA256)");
    expect(result[0].value).toBe(hash);
  });

  it("extracts SHA1 hashes", () => {
    const hash = "b".repeat(40);
    const result = parseIOCsFromText(`SHA1: ${hash}`);
    expect(result.some((r) => r.type === "File Hash (SHA1)")).toBe(true);
  });

  it("extracts MD5 hashes", () => {
    const hash = "c".repeat(32);
    const result = parseIOCsFromText(`MD5: ${hash}`);
    expect(result.some((r) => r.type === "File Hash (MD5)")).toBe(true);
  });

  it("avoids classifying SHA256 substring as SHA1/MD5", () => {
    const sha256 = "aabbccdd".repeat(8); // 64 chars
    const result = parseIOCsFromText(sha256);
    // Should only have SHA256, not SHA1 or MD5
    expect(result.some((r) => r.type === "File Hash (SHA256)")).toBe(true);
    expect(result.some((r) => r.type === "File Hash (SHA1)")).toBe(false);
    expect(result.some((r) => r.type === "File Hash (MD5)")).toBe(false);
  });

  it("extracts IPv4 addresses", () => {
    const result = parseIOCsFromText("C2 server: 203.0.113.50:443");
    expect(result.some((r) => r.type === "IP Address" && r.value === "203.0.113.50")).toBe(true);
  });

  it("filters false positive IPs", () => {
    const result = parseIOCsFromText("localhost 127.0.0.1 0.0.0.0");
    expect(result.some((r) => r.type === "IP Address")).toBe(false);
  });

  it("extracts URLs", () => {
    const result = parseIOCsFromText("Download from http://evil.com/payload.exe");
    expect(result.some((r) => r.type === "URL" && r.value.includes("evil.com"))).toBe(true);
  });

  it("extracts domains", () => {
    const result = parseIOCsFromText("Domain: malware-c2.xyz");
    expect(result.some((r) => r.type === "Domain" && r.value === "malware-c2.xyz")).toBe(true);
  });

  it("filters false positive domains", () => {
    const result = parseIOCsFromText("See example.com and localhost");
    expect(result.some((r) => r.type === "Domain")).toBe(false);
  });

  it("extracts emails", () => {
    const result = parseIOCsFromText("Contact: attacker@evil.com");
    expect(result.some((r) => r.type === "Email" && r.value === "attacker@evil.com")).toBe(true);
  });

  it("extracts Windows file paths", () => {
    const result = parseIOCsFromText("Dropped to C:\\Users\\Public\\malware.exe");
    expect(result.some((r) => r.type === "File Path" && r.value.includes("malware.exe"))).toBe(true);
  });

  it("extracts mutex names", () => {
    const result = parseIOCsFromText("Mutex: Global\\MyMalwareMutex123");
    expect(result.some((r) => r.type === "Mutex")).toBe(true);
  });

  it("deduplicates same IOC", () => {
    const text = "IP: 1.2.3.4 and again 1.2.3.4";
    const result = parseIOCsFromText(text);
    const ipResults = result.filter((r) => r.type === "IP Address" && r.value === "1.2.3.4");
    expect(ipResults).toHaveLength(1);
  });

  it("handles mixed IOC types in one text", () => {
    const text = `
      Sample: ${"a".repeat(64)}
      C2: 192.168.100.50
      URL: http://evil.com/beacon
      Email: bad@actor.org
    `;
    const result = parseIOCsFromText(text);
    expect(result.length).toBeGreaterThanOrEqual(4);
  });
});
