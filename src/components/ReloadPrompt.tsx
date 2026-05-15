import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

/**
 * Shows a toast notification when a new service worker version is available.
 */
export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, _setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError() {
      // SW registration failed — app still works, just not offline
    },
  });

  // Show update toast when new version detected
  useEffect(() => {
    if (needRefresh) {
      toast("New version available", {
        icon: <RefreshCw className="w-4 h-4" />,
        duration: Infinity,
        action: (
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs"
            onClick={() => updateServiceWorker(true)}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reload
          </Button>
        ),
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
