import { useState, useEffect, useRef } from "react";

/**
 * Hook for smooth typing animation using requestAnimationFrame
 * @param text - Text to animate
 * @param speed - Delay between characters in ms (default: 100)
 * @param trigger - Optional value that triggers re-animation when changed
 */
export function useTypingAnimation(text: string, speed: number = 100, trigger?: number) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const rafRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
    indexRef.current = 0;
    lastTimeRef.current = 0;
    
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      
      if (time - lastTimeRef.current >= speed) {
        if (indexRef.current < text.length) {
          indexRef.current++;
          setDisplayedText(text.slice(0, indexRef.current));
          lastTimeRef.current = time;
        } else {
          setIsComplete(true);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, speed, trigger]);

  return { displayedText, isComplete };
}
