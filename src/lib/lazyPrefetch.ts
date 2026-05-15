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
  prefetchOnce('mitre', () => import("@/features/mia/components/MitreAttackMapping"));

export const prefetchIOCTable = () => 
  prefetchOnce('ioc', () => import("@/features/mia/components/IOCTable"));

export const prefetchTimelineTable = () => 
  prefetchOnce('timeline', () => import("@/features/mia/components/TimelineTable"));

export const prefetchEvidenceArtifacts = () => 
  prefetchOnce('evidence', () => import("@/features/mia/components/EvidenceArtifacts"));

// MRE Dashboard prefetchers
export const prefetchMBCMapping = () => 
  prefetchOnce('mbc', () => import("@/features/mre/components/MBCMapping"));

export const prefetchRuntimeBehavior = () => 
  prefetchOnce('runtime', () => import("@/features/mre/components/runtime-behavior/RuntimeBehavior"));

export const prefetchCodeAnalysis = () => 
  prefetchOnce('code-analysis', () => import("@/features/mre/components/CodeAnalysisGroups"));

export const prefetchStaticAnalysisCards = () => 
  prefetchOnce('static-cards', () => import("@/features/mre/components/StaticAnalysisCards"));

export const prefetchSecurityPosture = () => 
  prefetchOnce('security', () => import("@/features/mre/components/SecurityPosture"));

export const prefetchPESectionEntry = () =>
  prefetchOnce('pe-section', () => import("@/features/mre/components/PESectionEntry"));

export const prefetchYaraEditor = () =>
  prefetchOnce('yara-editor', () => import("@/features/mre/components/YaraEditor"));

export const prefetchGraphView = () =>
  prefetchOnce('graph-view', () => import("@/components/GraphView"));
