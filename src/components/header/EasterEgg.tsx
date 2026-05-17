/**
 * Hidden feature component - Content encoded for privacy
 * This file contains obfuscated configuration data
 */
import { useState, useEffect, memo, useMemo } from "react";
import { LinkedinIcon } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Obfuscated data - base64 encoded for privacy
const _0x = {
  a: "TWFsd2FyZSBBbmFseXNpcyB8IERGSVI=",
  b: "TVdFIEhhVE4=", 
  c: "aHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2luL2hhLXRyYW4tbXdlc2lvZQ==",
  d: "IlRha2UgeW91ciB0aW1lIg==",
  e: "QnVpbHQgYnk6",
  f: "Rm9jdXM6",
  g: "UHJvZmlsZTo=",
};

// Decode helper
const _d = (s: string) => {
  try {
    return atob(s);
  } catch {
    return "";
  }
};

// Get decoded content
const _c = () => ({
  l1: { p: "-", l: _d(_0x.e), v: _d(_0x.b) },
  l2: { p: "-", l: _d(_0x.f), v: _d(_0x.a) },
  l3: { p: "-", l: _d(_0x.g), u: _d(_0x.c) },
  l4: { v: _d(_0x.d) },
});

interface EasterEggProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EasterEggDialog = memo(function EasterEggDialog({ 
  open, 
  onOpenChange 
}: EasterEggProps) {
  const { t } = useLanguage();
  const [visibleLines, setVisibleLines] = useState(0);
  const [typingText, setTypingText] = useState("");
  const [currentTypingLine, setCurrentTypingLine] = useState(-1);
  
  const content = useMemo(() => _c(), []);
  const lines = useMemo(() => [
    { full: `${content.l1.l} ${content.l1.v}`, prefix: content.l1.p },
    { full: `${content.l2.l} ${content.l2.v}`, prefix: content.l2.p },
    { full: content.l3.l, prefix: content.l3.p, hasLink: true, url: content.l3.u },
    { full: content.l4.v, isQuote: true },
  ], [content]);

  // Reset animation when dialog opens
  useEffect(() => {
    if (open) {
      setVisibleLines(0);
      setTypingText("");
      setCurrentTypingLine(0);
    }
  }, [open]);

  // Typing animation
  useEffect(() => {
    if (!open || currentTypingLine < 0 || currentTypingLine >= lines.length) return;

    const line = lines[currentTypingLine];
    const fullText = line.full;
    
    if (typingText.length < fullText.length) {
      const timer = setTimeout(() => {
        setTypingText(fullText.slice(0, typingText.length + 1));
      }, 30);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setVisibleLines(prev => prev + 1);
        setTypingText("");
        setCurrentTypingLine(prev => prev + 1);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, currentTypingLine, typingText, lines]);

  const renderLine = (lineIndex: number, line: typeof lines[0]) => {
    const isTyping = currentTypingLine === lineIndex;
    const isVisible = visibleLines > lineIndex || isTyping;
    
    if (!isVisible) return null;

    if (line.isQuote) {
      return (
        <div key={lineIndex} className="pt-3 border-t border-border/50 text-center">
          <p className="text-muted-foreground italic">
            {isTyping ? (
              <>{typingText}<span className="animate-blink">_</span></>
            ) : line.full}
          </p>
        </div>
      );
    }

    if (line.hasLink) {
      return (
        <div key={lineIndex} className="flex items-center gap-2">
          <span className="text-primary">{line.prefix}</span>
          <span className="text-muted-foreground">
            {isTyping ? (
              <>{typingText}<span className="animate-blink">_</span></>
            ) : line.full}
          </span>
          {visibleLines > lineIndex && (
            <a
              href={line.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-sm bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 hover:border-primary transition-all duration-300 hover:shadow-[0_0_10px_hsl(var(--primary)/0.5)] animate-fade-in"
              aria-label={t("aria.externalProfile")}
            >
              <LinkedinIcon className="w-4 h-4" />
            </a>
          )}
        </div>
      );
    }

    const colonIdx = line.full.indexOf(": ");
    const hasLabelValue = colonIdx !== -1;
    const label = hasLabelValue ? line.full.slice(0, colonIdx) : "";
    const value = hasLabelValue ? line.full.slice(colonIdx + 2) : "";

    return (
      <p key={lineIndex} className="text-muted-foreground">
        <span className="text-primary">{line.prefix}</span>{" "}
        {isTyping ? (
          hasLabelValue && typingText.length > colonIdx + 1 ? (
            <>
              <span>{typingText.slice(0, colonIdx + 2)}</span>
              <span className="text-foreground">{typingText.slice(colonIdx + 2)}</span>
              <span className="animate-blink">_</span>
            </>
          ) : (
            <>{typingText}<span className="animate-blink">_</span></>
          )
        ) : (
          <>{label}: <span className="text-foreground">{value}</span></>
        )}
      </p>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-primary/50 bg-background/95 backdrop-blur [&>button]:top-6 [&>button]:text-primary [&>button]:transition-all [&>button]:duration-300 [&>button:hover]:opacity-100 [&>button:hover]:text-primary [&>button:hover]:drop-shadow-[0_0_8px_hsl(var(--primary))]">
        <DialogHeader>
          <DialogTitle className="font-terminal text-primary flex items-center gap-2 text-lg">
            <span className="text-muted-foreground">&gt;</span>
            <span className="animate-glitch">whoami</span>
            <span className="animate-blink">_</span>
          </DialogTitle>
          <DialogDescription className="sr-only">{t("aria.developerProfileInfo")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 font-mono text-sm min-h-[140px]">
          {lines.map((line, idx) => renderLine(idx, line))}
        </div>
      </DialogContent>
    </Dialog>
  );
});

// Export the dialog directly - lazy loading is handled by the parent chunk
export const LazyEasterEgg = EasterEggDialog;

// Threshold for activation
export const ACTIVATION_COUNT = 5;
