import { memo } from "react";

/**
 * SkipLink component for keyboard accessibility
 * Allows keyboard users to skip navigation and jump directly to main content
 */
export const SkipLink = memo(function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
});
