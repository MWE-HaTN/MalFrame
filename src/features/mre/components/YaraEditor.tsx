import { useEffect, useRef, memo } from "react";
import { EditorView, keymap, placeholder as phPlugin } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { yara } from "@/lib/yaraLanguage";

interface YaraEditorProps {
  value: string;
  onChange: (value: string) => void;
}

// Cyber theme matching MalFrame's dark aesthetic
const cyberTheme = EditorView.theme({
  "&": {
    backgroundColor: "hsl(var(--card))",
    color: "hsl(var(--foreground))",
    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
    fontSize: "13px",
    borderRadius: "6px",
    border: "1px solid hsl(var(--border))",
  },
  ".cm-content": {
    caretColor: "hsl(var(--primary))",
    padding: "12px 0",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "hsl(var(--primary))",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "hsl(var(--primary) / 0.15)",
  },
  ".cm-activeLine": {
    backgroundColor: "hsl(var(--primary) / 0.05)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "hsl(var(--primary) / 0.08)",
  },
  ".cm-gutters": {
    backgroundColor: "hsl(var(--card))",
    color: "hsl(var(--muted-foreground))",
    border: "none",
    borderRight: "1px solid hsl(var(--border))",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px",
    fontSize: "11px",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "hsl(var(--muted))",
    color: "hsl(var(--muted-foreground))",
    border: "none",
  },
  ".cm-matchingBracket": {
    backgroundColor: "hsl(var(--primary) / 0.2)",
    outline: "1px solid hsl(var(--primary) / 0.4)",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
}, { dark: true });

// Syntax highlighting colors
const yaraHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "hsl(var(--primary))", fontWeight: "600" },
  { tag: tags.variableName, color: "#c792ea" },  // purple for $variables
  { tag: tags.string, color: "hsl(var(--accent))" },
  { tag: tags.regexp, color: "#f78c6c" },         // orange for regex
  { tag: tags.number, color: "#f78c6c" },
  { tag: tags.lineComment, color: "hsl(var(--muted-foreground))", fontStyle: "italic" },
  { tag: tags.propertyName, color: "#82aaff" },   // blue for meta keys
  { tag: tags.modifier, color: "#c792ea" },        // purple for modifiers
  { tag: tags.operator, color: "hsl(var(--foreground))" },
  { tag: tags.name, color: "hsl(var(--foreground))" },
  { tag: tags.bracket, color: "hsl(var(--muted-foreground))" },
  { tag: tags.special(tags.string), color: "#f78c6c" }, // hex strings
]);

export const YaraEditor = memo(function YaraEditor({ value, onChange }: YaraEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        yara(),
        cyberTheme,
        syntaxHighlighting(yaraHighlight),
        keymap.of([...defaultKeymap, indentWithTab]),
        phPlugin("// rule example_rule {\n//   meta:\n//     description = \"...\"\n//   strings:\n//     $hex = { 48 65 6C 6C 6F }\n//   condition:\n//     $hex\n// }"),
        updateListener,
        EditorView.lineWrapping,
        EditorState.tabSize.of(4),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g., on case switch)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="yara-editor [&_.cm-editor]:rounded-md [&_.cm-editor]:min-h-[200px] [&_.cm-editor]:max-h-[500px]"
    />
  );
});
