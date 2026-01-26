import { lazy, Suspense, useEffect, memo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";
import { useSEO } from "@/hooks/useSEO";
import { PageLoadingSkeleton } from "@/components/ui/dashboard-skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipLink } from "@/components/ui/skip-link";

// Lazy load all pages including Index for smaller initial bundle
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load with preload capability
const MIADashboard = lazy(() => import("./pages/MIADashboard"));
const MREDashboard = lazy(() => import("./pages/MREDashboard"));
const Tools = lazy(() => import("./pages/Tools"));
const Settings = lazy(() => import("./pages/Settings"));

// Preload functions - call on hover for instant navigation
export const preloadRoutes = {
  index: () => import("./pages/Index"),
  mia: () => import("./pages/MIADashboard"),
  mre: () => import("./pages/MREDashboard"),
  tools: () => import("./pages/Tools"),
  settings: () => import("./pages/Settings"),
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
  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 100));
  
  schedulePreload(() => {
    // Preload home page first (for quick navigation back)
    preloadOnce('index', preloadRoutes.index);
  });
  
  schedulePreload(() => {
    // Preload main dashboards (most likely to be used)
    preloadOnce('mia', preloadRoutes.mia);
    preloadOnce('mre', preloadRoutes.mre);
  });
  
  // Defer tools/settings preload further
  schedulePreload(() => {
    preloadOnce('tools', preloadRoutes.tools);
    preloadOnce('settings', preloadRoutes.settings);
  });
};


// Memoized routes to prevent unnecessary re-renders
const AppRoutes = memo(function AppRoutes() {
  useSEO();
  
  // Preload all routes when app loads
  useEffect(() => {
    preloadAllRoutes();
  }, []);
  
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/mia" element={<MIADashboard />} />
        <Route path="/mre" element={<MREDashboard />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
});

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <LanguageProvider>
        <UserProvider>
          <TooltipProvider>
            <SkipLink />
            <Toaster />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </UserProvider>
      </LanguageProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
