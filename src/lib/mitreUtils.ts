/**
 * MITRE ATT&CK Data Utilities
 * Fetches and parses MITRE ATT&CK Enterprise data from official GitHub repository
 * Repository: mitre-attack/attack-stix-data
 */

import { 
  MitreStixBundleSchema, 
  type MitreStixBundle,
} from "@/lib/validationSchemas";
import { debugWarn, debugError } from "@/lib/debugLogger";
import { truncate } from "@/lib/utils";

const MITRE_STIX_URL = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json";

export interface SubTechnique {
  id: string;
  name: string;
}

export interface MitreTechnique {
  id: string;
  name: string;
  subtechniques: SubTechnique[];
}

export interface MitreTactic {
  id: string;
  name: string;
  code: string;
  techniques: MitreTechnique[];
}

// Mapping from STIX phase names to our tactic IDs
const PHASE_TO_TACTIC_ID: Record<string, string> = {
  "reconnaissance": "reconnaissance",
  "resource-development": "resource_development",
  "initial-access": "initial_access",
  "execution": "execution",
  "persistence": "persistence",
  "privilege-escalation": "privilege_escalation",
  "defense-evasion": "defense_evasion",
  "credential-access": "credential_access",
  "discovery": "discovery",
  "lateral-movement": "lateral_movement",
  "collection": "collection",
  "command-and-control": "command_and_control",
  "exfiltration": "exfiltration",
  "impact": "impact",
};

// Tactic order for proper display
const TACTIC_ORDER = [
  "reconnaissance",
  "resource_development", 
  "initial_access",
  "execution",
  "persistence",
  "privilege_escalation",
  "defense_evasion",
  "credential_access",
  "discovery",
  "lateral_movement",
  "collection",
  "command_and_control",
  "exfiltration",
  "impact",
];

// Size limits for validation
const BYTES_PER_MB = 1024 * 1024;
const MAX_MITRE_DATA_SIZE_MB = 50; // MITRE Enterprise ATT&CK is ~20MB, using 50MB for headroom
const MAX_MITRE_DATA_SIZE = MAX_MITRE_DATA_SIZE_MB * BYTES_PER_MB;

// Retry configuration for network resilience
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Delays execution for a specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculates exponential backoff delay with jitter
 * Jitter prevents thundering herd by adding 0-30% random variation
 */
function getBackoffDelay(attempt: number): number {
  const JITTER_FACTOR = 0.3; // 30% maximum random variation
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * JITTER_FACTOR * exponentialDelay;
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelayMs);
}

/**
 * Determines if an error is retryable (network errors, 5xx, 429)
 */
function isRetryableError(error: unknown, response?: Response): boolean {
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Server errors (5xx) and rate limiting (429) are retryable
  if (response) {
    return response.status >= 500 || response.status === 429;
  }
  
  return false;
}

/**
 * Fetches MITRE ATT&CK data from official GitHub repository and parses it
 * into the format used by the dashboard. Includes retry logic with exponential backoff.
 */
export async function fetchMitreData(): Promise<{ tactics: MitreTactic[]; version: string }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(MITRE_STIX_URL);
      
      if (!response.ok) {
        // Check if this is a retryable error
        if (isRetryableError(null, response) && attempt < RETRY_CONFIG.maxRetries) {
          const delayMs = getBackoffDelay(attempt);
          debugWarn(`[MITRE] Fetch failed with status ${response.status}, retrying in ${Math.round(delayMs)}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`);
          await delay(delayMs);
          continue;
        }
        throw new Error(`Failed to fetch MITRE data: ${response.statusText}`);
      }
      
      // Check content-length header first (if available)
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_MITRE_DATA_SIZE) {
        throw new Error(`MITRE data exceeds maximum allowed size (${MAX_MITRE_DATA_SIZE_MB}MB)`);
      }
      
      // Read as text first to validate size before parsing
      // Note: text.length is character count, not byte size, so we use Blob for accurate measurement
      const responseText = await response.text();
      const responseByteSize = new Blob([responseText]).size;
      if (responseByteSize > MAX_MITRE_DATA_SIZE) {
        throw new Error(`MITRE data exceeds maximum allowed size (${MAX_MITRE_DATA_SIZE_MB}MB)`);
      }
      
      // Parse and validate with Zod schema
      const rawBundle = JSON.parse(responseText);
      const parseResult = MitreStixBundleSchema.safeParse(rawBundle);
      
      if (!parseResult.success) {
        debugError("[MITRE] Schema validation failed:", parseResult.error.format());
        throw new Error("MITRE data failed schema validation - data structure is invalid");
      }
      
      return parseMitreStixData(parseResult.data);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      if (isRetryableError(error, undefined) && attempt < RETRY_CONFIG.maxRetries) {
        const delayMs = getBackoffDelay(attempt);
        debugWarn(`[MITRE] Fetch error: ${lastError.message}, retrying in ${Math.round(delayMs)}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`);
        await delay(delayMs);
        continue;
      }
      
      // Non-retryable error or max retries reached
      throw lastError;
    }
  }
  
  // Should not reach here, but TypeScript needs this
  throw lastError || new Error("Failed to fetch MITRE data after retries");
}

/**
 * Parses MITRE STIX bundle data into our format
 */
export function parseMitreStixData(bundle: MitreStixBundle): { tactics: MitreTactic[]; version: string } {
  const objects = bundle.objects;
  
  // Extract version from x-mitre-collection object
  let version = "unknown";
  const collection = objects.find(obj => obj.type === "x-mitre-collection");
  if (collection) {
    // Try x_mitre_version first (e.g., "18.1")
    if (collection.x_mitre_version) {
      version = `v${collection.x_mitre_version}`;
    } else {
      // Fallback to external_references
      const extRef = collection.external_references?.find(r => r.source_name === "mitre-attack");
      if (extRef?.external_id) {
        version = extRef.external_id;
      }
    }
  }
  
  // Extract tactics
  const stixTactics = objects
    .filter(obj => obj.type === "x-mitre-tactic" && !obj.x_mitre_deprecated && !obj.revoked)
    .map(obj => {
      const extRef = obj.external_references?.find(r => r.source_name === "mitre-attack");
      const phaseName = extRef?.external_id?.toLowerCase().replace(/^ta\d+$/, '') || '';
      
      // Derive the phase name from the tactic shortname in the reference URL
      let tacticId = "";
      const refUrl = obj.external_references?.find(r => r.source_name === "mitre-attack")?.url || "";
      const urlMatch = refUrl.match(/\/tactics\/TA\d+/);
      
      // Get the proper phase name from kill chain references in techniques
      const objName = obj.name || "";
      return {
        stixId: obj.id,
        name: objName.toUpperCase(),
        code: extRef?.external_id || "",
        shortName: objName.toLowerCase().replace(/\s+/g, "-"),
      };
    });
  
  // Extract main techniques (not sub-techniques)
  const mainTechniques = objects
    .filter(obj => 
      obj.type === "attack-pattern" && 
      !obj.x_mitre_deprecated && 
      !obj.revoked &&
      !obj.x_mitre_is_subtechnique &&
      obj.external_references?.some(r => r.source_name === "mitre-attack" && r.external_id?.match(/^T\d{4}$/))
    )
    .map(obj => {
      const extRef = obj.external_references?.find(r => r.source_name === "mitre-attack");
      const phases = obj.kill_chain_phases?.filter(p => p.kill_chain_name === "mitre-attack") || [];
      return {
        id: extRef?.external_id || "",
        name: obj.name || "",
        phases: phases.map(p => p.phase_name),
        subtechniques: [] as SubTechnique[],
      };
    });
  
  // Extract sub-techniques
  const subTechniques = objects
    .filter(obj => 
      obj.type === "attack-pattern" && 
      !obj.x_mitre_deprecated && 
      !obj.revoked &&
      obj.x_mitre_is_subtechnique &&
      obj.external_references?.some(r => r.source_name === "mitre-attack" && r.external_id?.match(/^T\d{4}\.\d{3}$/))
    )
    .map(obj => {
      const extRef = obj.external_references?.find(r => r.source_name === "mitre-attack");
      return {
        id: extRef?.external_id || "",
        name: obj.name || "",
        parentId: extRef?.external_id?.split('.')[0] || "",
      };
    });
  
  // Group sub-techniques with their parent techniques
  for (const subTech of subTechniques) {
    const parent = mainTechniques.find(t => t.id === subTech.parentId);
    if (parent) {
      parent.subtechniques.push({
        id: subTech.id,
        name: subTech.name,
      });
    }
  }
  
  // Sort sub-techniques by ID
  for (const tech of mainTechniques) {
    tech.subtechniques.sort((a, b) => a.id.localeCompare(b.id));
  }
  
  // Build tactics with their techniques
  const tacticsMap = new Map<string, MitreTactic>();
  
  for (const tactic of stixTactics) {
    const tacticId = PHASE_TO_TACTIC_ID[tactic.shortName] || tactic.shortName.replace(/-/g, "_");
    tacticsMap.set(tactic.shortName, {
      id: tacticId,
      name: tactic.name,
      code: tactic.code,
      techniques: [],
    });
  }
  
  // Assign techniques to tactics based on kill chain phases
  for (const tech of mainTechniques) {
    for (const phase of tech.phases) {
      const tactic = tacticsMap.get(phase);
      if (tactic) {
        tactic.techniques.push({
          id: tech.id,
          name: tech.name,
          subtechniques: tech.subtechniques,
        });
      }
    }
  }
  
  // Sort techniques within each tactic by ID
  for (const tactic of tacticsMap.values()) {
    tactic.techniques.sort((a, b) => a.id.localeCompare(b.id));
  }
  
  // Sort tactics in the correct order
  const sortedTactics: MitreTactic[] = [];
  for (const tacticId of TACTIC_ORDER) {
    for (const [phaseName, tactic] of tacticsMap.entries()) {
      if (tactic.id === tacticId) {
        sortedTactics.push(tactic);
        break;
      }
    }
  }
  
  return { tactics: sortedTactics, version };
}

import { STORAGE_KEYS } from "@/lib/storageKeys";

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for technique lookup to avoid recreation on each call
let cachedTechniqueLookup: Map<string, { tacticIds: string[]; name: string; fullName: string }> | null = null;
let cachedTacticsHash: string | null = null;

/**
 * Creates a simple hash of tactics for cache invalidation
 */
function createTacticsHash(tactics: MitreTactic[]): string {
  return tactics.map(t => `${t.id}:${t.techniques.length}`).join('|');
}

// In-memory cache to avoid repeated localStorage access and parsing
let inMemoryMitreCache: { tactics: MitreTactic[]; version: string } | null = null;
let inMemoryCacheValid = false;

// Prevent concurrent fetches with a promise lock
let fetchPromise: Promise<{ tactics: MitreTactic[]; version: string }> | null = null;

/**
 * Loads MITRE data from memory cache, localStorage cache, or fetches from GitHub
 * Uses a promise lock to prevent concurrent fetches when switching tabs rapidly
 */
export async function loadMitreData(): Promise<{ tactics: MitreTactic[]; version: string }> {
  // First check in-memory cache (fastest) - always return if valid
  if (inMemoryMitreCache && inMemoryCacheValid) {
    return inMemoryMitreCache;
  }
  
  // If a fetch is already in progress, wait for it
  if (fetchPromise) {
    return fetchPromise;
  }
  
  // Check localStorage cache
  const cachedData = localStorage.getItem(STORAGE_KEYS.MITRE_CACHE);
  const cacheExpiry = localStorage.getItem(STORAGE_KEYS.MITRE_CACHE_EXPIRY);
  
  if (cachedData && cacheExpiry) {
    const expiryTime = parseInt(cacheExpiry, 10);
    if (Date.now() < expiryTime) {
      try {
        const parsed = JSON.parse(cachedData);
        // Treat version === "unknown" as invalid cache so we refetch fresh
        if (parsed.tactics && parsed.version && parsed.version !== "unknown") {
          // Store in memory cache
          inMemoryMitreCache = parsed;
          inMemoryCacheValid = true;
          return parsed;
        }
      } catch (e) {
        debugWarn("Failed to parse cached MITRE data, will fetch fresh");
      }
    }
  }
  
  // Create a fetch promise and store it to prevent concurrent fetches
  fetchPromise = (async () => {
    try {
      // Fetch fresh data from GitHub
      const { tactics, version } = await fetchMitreData();
      
      // Cache the data
      const cachePayload = { tactics, version };
      inMemoryMitreCache = cachePayload;
      inMemoryCacheValid = true;
      
      localStorage.setItem(STORAGE_KEYS.MITRE_CACHE, JSON.stringify(cachePayload));
      localStorage.setItem(STORAGE_KEYS.MITRE_VERSION, version);
      localStorage.setItem(STORAGE_KEYS.MITRE_CACHE_EXPIRY, String(Date.now() + CACHE_DURATION_MS));
      
      // Invalidate technique lookup cache when data changes
      cachedTechniqueLookup = null;
      cachedTacticsHash = null;
      
      return cachePayload;
    } finally {
      // Clear the promise lock after completion (success or failure)
      fetchPromise = null;
    }
  })();
  
  return fetchPromise;
}

/**
 * Creates a lookup map for quick technique/sub-technique searches
 * Uses in-memory caching to avoid recreation on each call
 */
export function createTechniqueLookup(tactics: MitreTactic[]): Map<string, { tacticIds: string[]; name: string; fullName: string }> {
  // Check if we can use cached lookup
  const currentHash = createTacticsHash(tactics);
  if (cachedTechniqueLookup && cachedTacticsHash === currentHash) {
    return cachedTechniqueLookup;
  }
  
  const lookup = new Map<string, { tacticIds: string[]; name: string; fullName: string }>();
  
  for (const tactic of tactics) {
    for (const tech of tactic.techniques) {
      // Add main technique
      const existing = lookup.get(tech.id);
      if (existing) {
        existing.tacticIds.push(tactic.id);
      } else {
        lookup.set(tech.id, {
          tacticIds: [tactic.id],
          name: truncate(tech.name, 25),
          fullName: tech.name,
        });
      }
      
      // Add sub-techniques
      for (const sub of tech.subtechniques) {
        const subExisting = lookup.get(sub.id);
        if (subExisting) {
          subExisting.tacticIds.push(tactic.id);
        } else {
          lookup.set(sub.id, {
            tacticIds: [tactic.id],
            name: truncate(sub.name, 25),
            fullName: `${tech.name}: ${sub.name}`,
          });
        }
      }
    }
  }
  
  // Cache the lookup
  cachedTechniqueLookup = lookup;
  cachedTacticsHash = currentHash;
  
  return lookup;
}
