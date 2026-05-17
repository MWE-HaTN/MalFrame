import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bug, Microscope, ArrowRight, Database, FileJson, Terminal, Target, Shield } from "lucide-react";
import { Header } from "@/components/Header";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect, memo } from "react";
import { preloadRoutes } from "@/lib/preloadRoutes";
import { useTypingAnimation } from "@/hooks/useTypingAnimation";
import { STORAGE_KEYS } from "@/lib/storageKeys";

// Lazy load MITRE & MBC utils to reduce initial bundle
const loadMitreData = () => import("@/lib/mitreUtils").then(m => m.loadMitreData());
const loadMBCData = () => import("@/features/mre/hooks/useMBCData").then(m => m.loadMBCData());

// Tracks whether the user explicitly navigated to index this session (survives F5, clears on tab close)
const INDEX_EXPLICIT_SESSION_KEY = "index-explicit-visit";

type IndexLocationState = {
  skipDashboardRedirect?: boolean;
  triggerTyping?: boolean;
};

export default function Index() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [tacticCount, setTacticCount] = useState<number>(14);
  const [behaviorCount, setBehaviorCount] = useState<number>(0);
  const [typingTrigger, setTypingTrigger] = useState(0);

  useEffect(() => {
    document.title = "MalFrame";

    const state = location.state as IndexLocationState | null;

    // Trigger typing animation when coming from logo click
    if (state?.triggerTyping) {
      setTypingTrigger(prev => prev + 1);
      // Clear state to prevent re-triggering on refresh — preserve React Router internal state
      navigate(location.pathname, { replace: true, state: {} });
    }

    // User explicitly navigated here (e.g. logo click) — mark session so F5 won't redirect
    if (state?.skipDashboardRedirect || state?.triggerTyping) {
      sessionStorage.setItem(INDEX_EXPLICIT_SESSION_KEY, "true");
      return;
    }

    // User already visited index intentionally this session (handles F5 after logo click)
    if (sessionStorage.getItem(INDEX_EXPLICIT_SESSION_KEY)) return;

    // Fresh session: auto-redirect to last used dashboard
    const savedDashboard = localStorage.getItem(STORAGE_KEYS.LAST_DASHBOARD) || "/mia";
    if (savedDashboard && savedDashboard !== "/mia") {
      navigate(savedDashboard, { replace: true });
    }
  }, [navigate, location.state, location.pathname]);

  // Load MITRE & MBC data on mount (lightweight, cached)
  useEffect(() => {
    loadMitreData()
      .then(({ tactics }) => setTacticCount(tactics.length))
      .catch(() => setTacticCount(14));

    loadMBCData()
      .then((data) => {
        const total = data.objectives.reduce((sum, obj) => sum + obj.behaviors.length, 0);
        setBehaviorCount(total);
      })
      .catch(() => setBehaviorCount(0));
  }, []);

  const { displayedText } = useTypingAnimation("MALWARE ANALYST", 120, typingTrigger);

  return (
    <div className="min-h-screen bg-background cyber-grid flex flex-col">
      <Header />
      
      <main id="main-content" className="container max-w-7xl mx-auto py-12 relative z-10 flex-1">
        {/* Hero Section */}
        <section className="text-center mb-16 pt-12 relative">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-terminal font-bold text-primary mb-4 tracking-wider">
            <span className="text-primary">&gt;</span>{" "}
            <span>{displayedText}</span>
            <span className="animate-blink text-primary">_</span>
          </h1>
          
          <h2 className="text-lg md:text-xl lg:text-2xl font-terminal font-medium mb-6 tracking-wide text-gradient-cyber">
            {t("index.hero.subtitle")}
          </h2>
          
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-10 font-mono leading-loose">
            {t("index.hero.description")}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 items-center px-4 sm:px-0">
            <Link
              to="/mia"
              onMouseEnter={preloadRoutes.mia}
              className="group flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 w-full sm:w-auto sm:min-w-[320px] bg-primary/5 text-primary border border-primary/60 rounded-sm font-mono uppercase tracking-wider text-[10px] sm:text-xs hover:bg-primary/15 hover:border-primary glow-primary transition-all duration-200"
            >
              <Bug className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{t("index.cta.mia")}</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-150" />
            </Link>
            <Link
              to="/mre"
              onMouseEnter={preloadRoutes.mre}
              className="group flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 w-full sm:w-auto sm:min-w-[320px] bg-primary/5 text-primary border border-primary/60 rounded-sm font-mono uppercase tracking-wider text-[10px] sm:text-xs hover:bg-primary/15 hover:border-primary glow-primary transition-all duration-200"
            >
              <Microscope className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{t("index.cta.mre")}</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-150" />
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
        {/* Row 1: Primary dashboards */}
        <FeatureCard
          icon={<Bug className="w-5 h-5" />}
          title={t("home.miaCard")}
          description={t("home.miaCardDesc")}
        />
        <FeatureCard
          icon={<Microscope className="w-5 h-5" />}
          title={t("home.mreCard")}
          description={t("home.mreCardDesc")}
        />
        <FeatureCard
          icon={<Database className="w-5 h-5" />}
          title={t("home.localStorage")}
          description={t("home.localStorageDesc")}
        />
        {/* Row 2: Analysis & output */}
        <FeatureCard
          icon={<Target className="w-5 h-5" />}
          title={t("home.mitreCard")}
          description={t("home.mitreCardDesc").replace("{count}", String(tacticCount))}
        />
        <FeatureCard
          icon={<Shield className="w-5 h-5" />}
          title={t("home.behaviorCard")}
          description={t("home.behaviorCardDesc")}
        />
        <FeatureCard
          icon={<FileJson className="w-5 h-5" />}
          title={t("home.exportOptions")}
          description={t("home.exportOptionsDesc")}
        />
        </section>

        {/* Stats Section */}
        <section className="section-collapsible p-10 text-center">
          <h2 className="text-xl font-terminal font-bold text-primary text-glow mb-10 tracking-wider">
            &gt; {t("home.statsTitle")}_
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            <StatItem value={String(tacticCount).padStart(2, '0')} label={t("home.mitreTactics")} />
            <StatItem value={behaviorCount > 0 ? String(behaviorCount) : "..."} label={t("home.mbcBehaviors")} />
            <StatItem value="2" label={t("home.analysisWorkflows")} />
            <StatItem value="∞" label={t("home.casesSupported")} />
            <StatItem value="100%" label={t("home.localPrivate")} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container text-center text-xs text-muted-foreground font-mono">
          <p className="flex items-center justify-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            {t("home.footer")}
          </p>
        </div>
      </footer>
    </div>
  );
}

const FeatureCard = memo(function FeatureCard({ 
  icon, 
  title, 
  description, 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="section-collapsible feature-card p-6 cursor-default">
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center mb-5">
          <div className="text-primary">{icon}</div>
        </div>
        <h3 className="text-sm font-terminal font-semibold text-primary mb-3 tracking-wider">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground font-mono leading-relaxed">{description}</p>
      </div>
    </div>
  );
});

const StatItem = memo(function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-terminal font-bold text-primary text-glow">{value}</div>
      <div className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">{label}</div>
    </div>
  );
});

