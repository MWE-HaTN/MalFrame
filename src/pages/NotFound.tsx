import { useLocation, Link } from "react-router-dom";
import { useEffect, memo } from "react";
import { useLanguage } from "@/hooks/useLanguage";

const NotFound = memo(function NotFound() {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    // Lazy import debug logger to avoid bundling in initial chunk
    import("@/lib/debugLogger").then(m =>
      m.debugWarn("404 Error: User attempted to access non-existent route:", location.pathname)
    ).catch(() => {});
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t("notFound.title")}</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          {t("notFound.returnHome")}
        </Link>
      </div>
    </div>
  );
});

export default NotFound;
