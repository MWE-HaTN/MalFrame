import { useCallback, useEffect } from "react";

/**
 * Keyboard navigation between CollapsibleSection elements.
 * - Ctrl+Shift+ArrowDown: jump to next section
 * - Ctrl+Shift+ArrowUp: jump to previous section
 * - Ctrl+Shift+A: toggle expand/collapse all sections
 */
export function useSectionNavigation() {
  const getSections = useCallback(() => {
    return Array.from(document.querySelectorAll<HTMLElement>("[data-section-key]"));
  }, []);

  const scrollToSection = useCallback((section: HTMLElement) => {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    // Focus the section header button for accessibility
    const header = section.querySelector("button");
    header?.focus();
  }, []);

  const jumpToNext = useCallback(() => {
    const sections = getSections();
    if (sections.length === 0) return;

    const next = sections.find((s) => {
      const rect = s.getBoundingClientRect();
      return rect.top > 50; // 50px threshold to avoid current section
    });

    if (next) {
      scrollToSection(next);
    } else {
      // Wrap around to first section
      scrollToSection(sections[0]);
    }
  }, [getSections, scrollToSection]);

  const jumpToPrev = useCallback(() => {
    const sections = getSections();
    if (sections.length === 0) return;

    const prev = [...sections].reverse().find((s) => {
      const rect = s.getBoundingClientRect();
      return rect.top < -10; // Above viewport
    });

    if (prev) {
      scrollToSection(prev);
    } else {
      // Wrap around to last section
      scrollToSection(sections[sections.length - 1]);
    }
  }, [getSections, scrollToSection]);

  const toggleAll = useCallback(() => {
    const sections = getSections();
    if (sections.length === 0) return;

    // Check if majority are open
    const openCount = sections.filter((s) => {
      const button = s.querySelector("button");
      return button?.getAttribute("aria-expanded") !== "false";
    }).length;

    const shouldClose = openCount > sections.length / 2;

    sections.forEach((s) => {
      const button = s.querySelector("button");
      if (!button) return;

      const isCurrentlyOpen = button.getAttribute("aria-expanded") !== "false";
      if (shouldClose ? isCurrentlyOpen : !isCurrentlyOpen) {
        button.click();
      }
    });
  }, [getSections]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (!e.shiftKey) return;

      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      const isEditing =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable;

      if (isEditing) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          jumpToNext();
          break;
        case "ArrowUp":
          e.preventDefault();
          jumpToPrev();
          break;
        case "A":
        case "a":
          e.preventDefault();
          toggleAll();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [jumpToNext, jumpToPrev, toggleAll]);
}
