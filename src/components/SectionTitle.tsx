import SplitText from "@/components/SplitText";

// Título de sección: las letras suben al entrar en pantalla y cierra con el cursor de la marca.
export function SectionTitle({ id, text, className = "" }: { id: string; text: string; className?: string }) {
  return (
    <h2 id={id} className={`px-[var(--gutter)] text-[clamp(2.4rem,9vw,7rem)] font-light uppercase leading-[0.9] tracking-[-0.04em] ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        <SplitText text={text} tag="span" textAlign="left" splitType="chars" delay={28} duration={1} mask trigger="view" />
      </span>
      <span aria-hidden className="cursor-blink text-cobalt">_</span>
    </h2>
  );
}
