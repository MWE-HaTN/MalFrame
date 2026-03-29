import { lazy } from "react";

// Lazy load all pages
export const Index = lazy(() => import("@/pages/Index"));
export const NotFound = lazy(() => import("@/pages/NotFound"));
export const MIADashboard = lazy(() => import("@/pages/MIADashboard"));
export const MREDashboard = lazy(() => import("@/pages/MREDashboard"));
export const Tools = lazy(() => import("@/pages/Tools"));
export const Settings = lazy(() => import("@/pages/Settings"));

// Preload functions - call on hover for instant navigation
export const preloadRoutes = {
  index: () => import("@/pages/Index"),
  mia: () => import("@/pages/MIADashboard"),
  mre: () => import("@/pages/MREDashboard"),
  tools: () => import("@/pages/Tools"),
  settings: () => import("@/pages/Settings"),
};

// Track which routes have been preloaded
const preloadedRoutes = new Set<string>();

// Preload a specific route only once
function preloadOnce(key: string, loader: () => Promise<unknown>) {
  if (preloadedRoutes.has(key)) return;
  preloadedRoutes.add(key);
  loader().catch(() => preloadedRoutes.delete(key));
}

// Preload routes after initial render for faster first paint
export const preloadAllRoutes = () => {
  const schedulePreload = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 100));

  schedulePreload(() => {
    preloadOnce("index", preloadRoutes.index);
  });

  schedulePreload(() => {
    preloadOnce("mia", preloadRoutes.mia);
    preloadOnce("mre", preloadRoutes.mre);
  });

  schedulePreload(() => {
    preloadOnce("tools", preloadRoutes.tools);
    preloadOnce("settings", preloadRoutes.settings);
  });
};
