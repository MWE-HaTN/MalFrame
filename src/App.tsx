import { Suspense, useEffect, useState, useCallback, memo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import { trackTodayActivity } from "@/lib/activityUtils";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { toast } from "sonner";
import { PageLoadingSkeleton } from "@/components/ui/dashboard-skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipLink } from "@/components/ui/skip-link";
import { ReloadPrompt } from "@/components/ReloadPrompt";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { ShortcutsHintBar } from "@/components/ShortcutsHintBar";
import { SearchDialog } from "@/components/SearchDialog";
import { CommandPalette } from "@/components/CommandPalette";
import { IOCCrossReferenceDialog } from "@/components/IOCCrossReferenceDialog";
import {
  Index,
  NotFound,
  MIADashboard,
  MREDashboard,
  Tools,
  Settings,
} from "@/lib/preloadRoutes";

// Memoized routes to prevent unnecessary re-renders
const AppRoutes = memo(function AppRoutes() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [iocXrefOpen, setIocXrefOpen] = useState(false);

  const handleShowHelp = useCallback(() => setShortcutsOpen(true), []);
  const handleSearch = useCallback(() => setSearchOpen(true), []);
  const handleCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const handleIOCCrossRef = useCallback(() => setIocXrefOpen(true), []);

  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const handleToggleLanguage = useCallback(() => {
    const next = language === "en" ? "vn" : "en";
    setLanguage(next);
    toast.success(next === "en" ? "Language: English" : "Ngôn ngữ: Tiếng Việt");
  }, [language, setLanguage]);

  const handleToggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    toast.success(next === "dark" ? t("settings.themeDark") : t("settings.themeLight"));
  }, [theme, setTheme, t]);

  const handleCycleScale = useCallback(() => {
    const scales = [75, 100, 125, 150];
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.DISPLAY_SCALE) || "100", 10);
    const next = scales[(scales.indexOf(current) + 1) % scales.length];
    document.documentElement.style.fontSize = `${next}%`;
    localStorage.setItem(STORAGE_KEYS.DISPLAY_SCALE, String(next));
    toast.success(`${t("settings.displayScale")}: ${next}%`);
  }, [t]);

  const handleTrackToday = useCallback(() => {
    trackTodayActivity();
    toast.success(t("activity.tracked") || "Activity tracked for today!");
  }, [t]);

  useKeyboardShortcuts({
    onShowHelp: handleShowHelp,
    onSearch: handleSearch,
    onCommandPalette: handleCommandPalette,
    onIOCCrossRef: handleIOCCrossRef,
  });

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
    <>
      <Suspense fallback={<PageLoadingSkeleton />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/mia" element={<ErrorBoundary><MIADashboard /></ErrorBoundary>} />
          <Route path="/mre" element={<ErrorBoundary><MREDashboard /></ErrorBoundary>} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onSearch={handleSearch}
        onShowHelp={handleShowHelp}
        onToggleLanguage={handleToggleLanguage}
        onToggleTheme={handleToggleTheme}
        onCycleScale={handleCycleScale}
        onTrackToday={handleTrackToday}
      />
      <IOCCrossReferenceDialog open={iocXrefOpen} onOpenChange={setIocXrefOpen} />
      <ShortcutsHintBar
        onCommandPalette={handleCommandPalette}
        onSearch={handleSearch}
        onShowHelp={handleShowHelp}
      />
    </>
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
            <ReloadPrompt />
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
