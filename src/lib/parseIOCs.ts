/**
 * Regex-based IOC extraction from raw text.
 * Matches SHA256, SHA1, MD5, IPv4, IPv6, URLs, domains, emails, Windows file paths, mutexes.
 * Deduplicates by type:value. Filters common false positives.
 */

export interface ParsedIOC {
  type: string;
  value: string;
  description: string;
}

// False positive filters
const FALSE_POSITIVE_IPS = new Set([
  "0.0.0.0", "127.0.0.1", "255.255.255.255", "255.255.255.0",
  "127.0.0.0", "10.0.0.1", "192.168.0.1", "192.168.1.1",
]);

const FALSE_POSITIVE_DOMAINS = new Set([
  "example.com", "example.org", "example.net", "localhost",
  "schema.org", "www.w3.org", "w3.org", "xml.apache.org",
  "schemas.openxmlformats.org", "schemas.microsoft.com",
]);

const DOMAIN_FALSE_POSITIVE_SUFFIXES = [
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg", ".ico",
  ".css", ".js", ".ts", ".tsx", ".jsx", ".html", ".htm", ".xml", ".json",
  ".mp3", ".mp4", ".avi", ".mov", ".wav", ".flac",
  ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2",
  ".dll", ".exe", ".sys", ".drv", ".ocx", ".cpl",
  ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".pdf",
  ".txt", ".log", ".csv", ".ini", ".cfg", ".conf", ".yml", ".yaml",
  ".py", ".rb", ".pl", ".sh", ".bat", ".cmd", ".ps1", ".vbs",
];

const MUTEX_PATTERNS = [
  /\b(?:Global|Local)\\[A-Za-z0-9_\-{}]+/g,
  /\b(?:Global|Local)\\\\[A-Za-z0-9_\-{}]+/g,
];

interface PatternDef {
  regex: RegExp;
  type: string;
  filter?: (value: string) => boolean;
}

const PATTERNS: PatternDef[] = [
  // SHA256 (64 hex chars) — must come before SHA1 and MD5
  {
    regex: /\b[a-fA-F0-9]{64}\b/g,
    type: "File Hash (SHA256)",
    filter: (v) => !/^0{64}$/.test(v) && !/^f{64}$/i.test(v),
  },
  // SHA1 (40 hex chars)
  {
    regex: /\b[a-fA-F0-9]{40}\b/g,
    type: "File Hash (SHA1)",
    filter: (v) => !/^0{40}$/.test(v) && !/^f{40}$/i.test(v),
  },
  // MD5 (32 hex chars)
  {
    regex: /\b[a-fA-F0-9]{32}\b/g,
    type: "File Hash (MD5)",
    filter: (v) => !/^0{32}$/.test(v) && !/^f{32}$/i.test(v),
  },
  // IPv6 (simplified — full and compressed forms)
  {
    regex: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?::[0-9a-fA-F]{1,4}){1,7}|::\b/g,
    type: "IP Address",
    filter: (v) => v !== "::" && v !== "::1",
  },
  // IPv4
  {
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    type: "IP Address",
    filter: (v) => !FALSE_POSITIVE_IPS.has(v),
  },
  // URL
  {
    regex: /https?:\/\/[^\s<>"'`,;)}\]]+/g,
    type: "URL",
  },
  // Email
  {
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    type: "Email",
  },
  // Windows file path
  {
    regex: /[A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/g,
    type: "File Path",
    filter: (v) => v.length > 3, // skip "C:\" alone
  },
  // Domain (must come after URL/email to avoid partial matches)
  {
    regex: /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/g,
    type: "Domain",
    filter: (v) => {
      const lower = v.toLowerCase();
      if (FALSE_POSITIVE_DOMAINS.has(lower)) return false;
      if (DOMAIN_FALSE_POSITIVE_SUFFIXES.some((s) => lower.endsWith(s))) return false;
      // Must have at least one dot and valid TLD (2+ chars)
      const parts = lower.split(".");
      const tld = parts[parts.length - 1];
      if (tld.length < 2 || tld.length > 13) return false;
      // Skip pure numbers
      if (/^\d+$/.test(lower.replace(/\./g, ""))) return false;
      return true;
    },
  },
];

function extractMutexes(text: string): string[] {
  const results: string[] = [];
  for (const pattern of MUTEX_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push(match[0]);
    }
  }
  return results;
}

export function parseIOCsFromText(text: string): ParsedIOC[] {
  if (!text.trim()) return [];

  const seen = new Set<string>();
  const results: ParsedIOC[] = [];

  // Track hash values to avoid classifying SHA256 as SHA1/MD5
  const hashValues = new Set<string>();

  for (const { regex, type, filter } of PATTERNS) {
    const re = new RegExp(regex.source, regex.flags);
    let match;

    while ((match = re.exec(text)) !== null) {
      let value = match[0].trim();

      // Clean trailing punctuation from URLs
      if (type === "URL") {
        value = value.replace(/[.,;:!?)}\]]+$/, "");
      }

      if (filter && !filter(value)) continue;

      const key = `${type}:${value.toLowerCase()}`;
      if (seen.has(key)) continue;

      // If this is a hash, check if it was already matched as a longer hash
      const lowerValue = value.toLowerCase();
      if (type === "File Hash (MD5)" && value.length === 32) {
        const isPartOfLonger = [...hashValues].some(
          (h) => (h.length === 64 || h.length === 40) && h.includes(lowerValue)
        );
        if (isPartOfLonger) continue;
      }
      if (type === "File Hash (SHA1)" && value.length === 40) {
        const isPartOfSHA256 = [...hashValues].some(
          (h) => h.length === 64 && h.includes(lowerValue)
        );
        if (isPartOfSHA256) continue;
      }

      if (type.startsWith("File Hash")) {
        hashValues.add(value.toLowerCase());
      }

      seen.add(key);
      results.push({ type, value, description: "" });
    }
  }

  // Extract mutexes separately (different pattern structure)
  const mutexes = extractMutexes(text);
  for (const mutex of mutexes) {
    const key = `Mutex:${mutex.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ type: "Mutex", value: mutex, description: "" });
    }
  }

  // Sort by type for better readability
  const typeOrder = [
    "File Hash (SHA256)", "File Hash (SHA1)", "File Hash (MD5)",
    "IP Address", "Domain", "URL", "Email",
    "File Path", "File Name", "Mutex", "Other",
  ];
  results.sort((a, b) => {
    const ai = typeOrder.indexOf(a.type);
    const bi = typeOrder.indexOf(b.type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return results;
}
