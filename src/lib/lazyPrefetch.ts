// Prefetch functions for lazy components
// These preload the component modules before they're needed

// Track prefetched modules to avoid duplicate fetches
const prefetched = new Set<string>();

function prefetchOnce(key: string, loader: () => Promise<unknown>) {
  if (prefetched.has(key)) return;
  prefetched.add(key);
  loader().catch(() => prefetched.delete(key));
}

// MIA Dashboard prefetchers
export const prefetchMitreMapping = () => 
  prefetchOnce('mitre', () => import("@/components/MitreAttackMapping"));

export const prefetchIOCTable = () => 
  prefetchOnce('ioc', () => import("@/components/IOCTable"));

export const prefetchTimelineTable = () => 
  prefetchOnce('timeline', () => import("@/components/TimelineTable"));

export const prefetchEvidenceArtifacts = () => 
  prefetchOnce('evidence', () => import("@/components/EvidenceArtifacts"));

// MRE Dashboard prefetchers
export const prefetchMBCMapping = () => 
  prefetchOnce('mbc', () => import("@/components/MBCMapping"));

export const prefetchRuntimeBehavior = () => 
  prefetchOnce('runtime', () => import("@/components/runtime-behavior/RuntimeBehavior"));

export const prefetchCodeAnalysis = () => 
  prefetchOnce('code-analysis', () => import("@/components/CodeAnalysisGroups"));

export const prefetchStaticAnalysisCards = () => 
  prefetchOnce('static-cards', () => import("@/components/StaticAnalysisCards"));

export const prefetchSecurityPosture = () => 
  prefetchOnce('security', () => import("@/components/SecurityPosture"));

export const prefetchPESectionEntry = () => 
  prefetchOnce('pe-section', () => import("@/components/PESectionEntry"));
