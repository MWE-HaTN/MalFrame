import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutCallbacks {
  onExport?: () => void;
  onNewCase?: () => void;
  onPrevCase?: () => void;
  onNextCase?: () => void;
  onShowHelp?: () => void;
  onSearch?: () => void;
  onCommandPalette?: () => void;
  onIOCCrossRef?: () => void;
}

/**
 * Global keyboard shortcuts for MalFrame.
 * Skips when user is typing in an input/textarea/select/contenteditable.
 */
export function useKeyboardShortcuts(callbacks: ShortcutCallbacks = {}) {
  const navigate = useNavigate();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      const isEditing =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable;

      const cb = callbacksRef.current;

      // ? — show shortcuts help (only when not editing)
      if (e.key === "?" && !isEditing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        cb.onShowHelp?.();
        return;
      }

      // Ctrl+K / Cmd+K — command palette (works even while editing)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        cb.onCommandPalette?.();
        return;
      }

      // All other shortcuts require Ctrl+Shift (or Cmd+Shift on Mac)
      if (!e.ctrlKey && !e.metaKey) return;
      if (!e.shiftKey) return;

      switch (e.key) {
        case "1":
          e.preventDefault();
          navigate("/mia");
          break;
        case "2":
          e.preventDefault();
          navigate("/mre");
          break;
        case "T":
        case "t":
          e.preventDefault();
          navigate("/tools");
          break;
        case "S":
        case "s":
          // Don't intercept Ctrl+Shift+S if browser uses it (e.g., Save As)
          if (!isEditing) {
            e.preventDefault();
            navigate("/settings");
          }
          break;
        case "E":
        case "e":
          if (!isEditing) {
            e.preventDefault();
            cb.onExport?.();
          }
          break;
        case "N":
        case "n":
          if (!isEditing) {
            e.preventDefault();
            cb.onNewCase?.();
          }
          break;
        case "ArrowLeft":
          if (!isEditing) {
            e.preventDefault();
            cb.onPrevCase?.();
          }
          break;
        case "ArrowRight":
          if (!isEditing) {
            e.preventDefault();
            cb.onNextCase?.();
          }
          break;
        case "X":
        case "x":
          if (!isEditing) {
            e.preventDefault();
            cb.onSearch?.();
          }
          break;
        case "I":
        case "i":
          if (!isEditing) {
            e.preventDefault();
            cb.onIOCCrossRef?.();
          }
          break;
      }
    },
    [navigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
