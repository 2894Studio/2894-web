// Wordmark de la marca con el guion parpadeando como un cursor (ritmo calmado, ver .blink en globals.css).
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      2894<span aria-hidden className="blink">_</span>
      <span className="sr-only">_</span>
    </span>
  );
}
