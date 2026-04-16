import { Suspense, useEffect, memo } from "react";
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
import {
  Index,
  NotFound,
  MIADashboard,
  MREDashboard,
  Tools,
  Settings,
  preloadAllRoutes,
} from "@/lib/preloadRoutes";

// Memoized routes to prevent unnecessary re-renders
const AppRoutes = memo(function AppRoutes() {
  useSEO();

  // Preload all routes when app loads
  useEffect(() => {
    preloadAllRoutes();
  }, []);

  // Prevent browser from navigating to dropped files outside designated drop zones
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", prevent);
    return () => {
      document.removeEventListener("dragover", prevent);
      document.removeEventListener("drop", prevent);
    };
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
