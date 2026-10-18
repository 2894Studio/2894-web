import type { ComponentType } from "react";

declare const SplitText: ComponentType<{
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words" | "lines" | "words, chars" | string;
  from?: Record<string, unknown>;
  to?: Record<string, unknown>;
  threshold?: number;
  rootMargin?: string;
  textAlign?: "left" | "center" | "right";
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  staggerFrom?: string;
  mask?: boolean;
  effect?: string;
  trigger?: string;
  loop?: boolean;
  loopDelay?: number;
  hoverEffect?: string;
  color?: string;
  accentColor?: string;
  onLetterAnimationComplete?: () => void;
}>;
export default SplitText;
