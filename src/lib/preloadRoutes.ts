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
