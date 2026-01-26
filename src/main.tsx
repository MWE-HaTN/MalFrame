import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Hide loading skeleton immediately when React starts
(window as Window & { __hideLoading?: () => void }).__hideLoading?.();

// Preload MITRE cache in background - lazy import to reduce initial bundle
const scheduleDataPreload = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 200));
scheduleDataPreload(() => {
  import("./lib/mitreUtils").then(m => m.loadMitreData()).catch(() => {
    // Silently fail - will retry when needed
  });
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
