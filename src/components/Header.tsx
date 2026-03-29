// Header component with navigation
import { useEffect, useState, useRef, useCallback, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Settings, Terminal, Wrench, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { preloadRoutes } from "@/lib/preloadRoutes";
import { LazyEasterEgg, ACTIVATION_COUNT } from "./header/EasterEgg";
import { ActivityBadge } from "./header/ActivityBadge";

const SESSION_VISITED_KEY = "dashboard-visited-session";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [hasVisitedDashboard, setHasVisitedDashboard] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const logoClickCount = useRef(0);

  // Reset click count when navigating to different pages
  useEffect(() => {
    logoClickCount.current = 0;
  }, [location.pathname]);

  // Handle logo click for Easter Egg
  const handleLogoClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    
    // Increment click count
    logoClickCount.current += 1;
    
    // Check if Easter Egg should trigger
    if (logoClickCount.current >= ACTIVATION_COUNT) {
      setShowEasterEgg(true);
      logoClickCount.current = 0;
      return;
    }
    
    // Navigate to home with typing trigger (only on first click behavior)
    if (logoClickCount.current === 1) {
      navigate("/", { state: { skipDashboardRedirect: true, triggerTyping: true } });
    }
  }, [navigate]);

  const navItems = [
    { path: "/tools", labelKey: "nav.tools", icon: Wrench, preload: preloadRoutes.tools },
    { path: "/settings", labelKey: "nav.settings", icon: Settings, preload: preloadRoutes.settings },
  ];

  const isMIA = location.pathname === "/mia";
  const isMRE = location.pathname === "/mre";
  const isOnDashboard = isMIA || isMRE;
  const isOnToolsOrSettings = location.pathname === "/tools" || location.pathname === "/settings";

  // Check session storage on mount
  useEffect(() => {
    const sessionVisited = sessionStorage.getItem(SESSION_VISITED_KEY);
    if (sessionVisited) {
      setHasVisitedDashboard(true);
    }
  }, []);

  // Save current dashboard preference when on dashboard
  useEffect(() => {
    if (isOnDashboard) {
      localStorage.setItem(STORAGE_KEYS.LAST_DASHBOARD, location.pathname);
      sessionStorage.setItem(SESSION_VISITED_KEY, "true");
      setHasVisitedDashboard(true);
    }
  }, [location.pathname, isOnDashboard]);

  // Show switch: on dashboard pages OR on tools/settings after visiting a dashboard
  const showDashboardSwitch = isOnDashboard || (isOnToolsOrSettings && hasVisitedDashboard);
  
  // Determine which dashboard is "active" for the switch
  const savedDashboard = localStorage.getItem(STORAGE_KEYS.LAST_DASHBOARD) || "/mia";

  // Preload dashboard on hover
  const handleDashboardHover = useCallback(() => {
    if (isOnDashboard) {
      // Preload the other dashboard
      if (isMRE) preloadRoutes.mia();
      else preloadRoutes.mre();
    } else {
      // Preload saved dashboard
      if (savedDashboard === "/mre") preloadRoutes.mre();
      else preloadRoutes.mia();
    }
  }, [isOnDashboard, isMRE, savedDashboard]);

  // Different behavior: on dashboard = switch, on tools/settings = go back
  const handleDashboardButtonClick = () => {
    if (isOnDashboard) {
      // Switch to the other dashboard
      const newPath = isMRE ? "/mia" : "/mre";
      localStorage.setItem(STORAGE_KEYS.LAST_DASHBOARD, newPath);
      navigate(newPath);
    } else {
      // Go back to saved dashboard
      navigate(savedDashboard);
    }
  };

  // Button text depends on current location
  const getButtonText = () => {
    if (isOnDashboard) {
      return isMRE ? t("header.switchToIA") : t("header.switchToRE");
    }
    return savedDashboard === "/mre" ? t("header.backToRE") : t("header.backToIA");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo - Easter Egg trigger */}
        <div
          onClick={handleLogoClick}
          aria-label="Go to home"
          className="flex items-center gap-3 group cursor-pointer select-none"
        >
          <div className="relative transition-transform duration-150 group-hover:scale-105">
            <div className="w-9 h-9 rounded-sm bg-primary/20 border border-primary/50 flex items-center justify-center glow-primary group-hover:bg-primary/30 group-hover:border-primary transition-colors duration-150">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full status-active" />
          </div>
          <div className="flex flex-col">
            <span className="font-terminal font-bold text-sm text-primary tracking-wider">
              {t("header.logo")}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono tracking-wide">
              {t("header.tagline")}
            </span>
          </div>
        </div>

        {/* Easter Egg Dialog - Lazy loaded */}
        <LazyEasterEgg open={showEasterEgg} onOpenChange={setShowEasterEgg} />

        {/* Activity Badge + Dashboard Switch + Navigation */}
        <div className="flex items-center gap-2">
          {/* Activity Badge */}
          <ActivityBadge />

          {/* Dashboard Switch */}
          {showDashboardSwitch && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDashboardButtonClick}
              onMouseEnter={handleDashboardHover}
              className="flex items-center justify-center gap-2 w-[140px] h-[30px] px-3 rounded-sm font-mono text-xs uppercase tracking-wider transition-colors duration-100 border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary active:bg-primary/20 group/switch"
            >
              <ArrowLeftRight className="w-4 h-4 transition-transform duration-150 group-hover/switch:rotate-180" />
              <span>{getButtonText()}</span>
            </Button>
          )}


          {/* Navigation */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onMouseEnter={item.preload}
                  className={cn(
                    "flex items-center justify-center gap-2 h-[30px] px-3 rounded-sm text-xs font-mono uppercase tracking-wider transition-colors duration-100 border group/nav",
                    isActive
                      ? "bg-primary/20 text-primary border-primary/50 glow-primary"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10 border-primary/50 hover:border-primary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}


