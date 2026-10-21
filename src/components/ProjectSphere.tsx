"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FINE_POINTER, gsap, REDUCED } from "@/lib/gsap";
import { projects, type Project } from "@/content/site";
import { ProjectDialog } from "@/components/ProjectDialog";

const N = projects.length;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
// Puntos sobre la esfera (espiral de Fibonacci), sin llegar a los polos.
const POINTS = projects.map((_, i) => {
  const y = 0.88 - (i / (N - 1)) * 1.76;
  const r = Math.sqrt(1 - y * y);
  const th = i * GOLDEN;
  return { x: Math.cos(th) * r, y, z: Math.sin(th) * r, az: Math.atan2(Math.cos(th) * r, Math.sin(th) * r), el: Math.asin(y) };
});

// Esfera 3D de proyectos: gira sola, se arrastra con inercia, el scroll la acelera y el nombre sigue al cursor.
export function ProjectSphere() {
  const stage = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const label = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Project | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [front, setFront] = useState(projects[0].title);
  const [inside, setInside] = useState(false);
  const moved = useRef(false);

  useEffect(() => {
    const el = stage.current;
    const g = group.current;
    if (!el || !g) return;
    const reduced = window.matchMedia(REDUCED).matches;
    const fine = window.matchMedia(FINE_POINTER).matches;
    const s = { rx: -14, ry: 0, vx: 0, vy: reduced ? 0 : 0.14, R: 280, drag: false, lx: 0, ly: 0, frontIdx: 0 };
    const ks = projects.map(() => ({ k: reduced ? 1 : 0 }));

    const resize = () => {
      s.R = el.clientWidth * 0.36;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const render = () => {
      if (!s.drag) {
        s.ry += s.vy;
        s.rx += s.vx;
        s.vx *= 0.94;
        s.vy += ((reduced ? 0 : 0.14) - s.vy) * 0.035; // vuelve al giro base tras un impulso
        s.rx += (-14 - s.rx) * 0.01;
      }
      s.rx = Math.max(-70, Math.min(70, s.rx));
      g.style.transform = `rotateX(${s.rx}deg) rotateY(${s.ry}deg)`;
      const rx = (s.rx * Math.PI) / 180;
      const ry = (s.ry * Math.PI) / 180;
      let best = -2;
      POINTS.forEach((p, i) => {
        const c = cards.current[i];
        if (!c) return;
        const k = ks[i].k;
        // profundidad tras la rotación del grupo (para atenuar y activar solo la cara visible)
        const yc = -p.y;
        const z1 = -p.x * Math.sin(ry) + p.z * Math.cos(ry);
        const z2 = yc * Math.sin(rx) + z1 * Math.cos(rx);
        if (z2 > best) {
          best = z2;
          s.frontIdx = i;
        }
        const w = s.R * 0.6;
        c.style.width = `${w}px`;
        c.style.height = `${w * 1.25}px`;
        c.style.marginLeft = `${-w / 2}px`;
        c.style.marginTop = `${-w * 0.625}px`;
        c.style.transform = `rotateY(${p.az}rad) rotateX(${p.el}rad) translateZ(${s.R * k}px) scale(${Math.min(1, k * 1.15)})`;
        c.style.opacity = String(Math.max(0, Math.min(1, k)) * (0.22 + 0.78 * ((z2 + 1) / 2)));
        c.style.pointerEvents = z2 > 0.05 && k > 0.8 ? "auto" : "none";
      });
    };

    let raf = 0;
    const loop = () => {
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Aparición A: las imágenes salen del centro y se abren con rebote elástico.
    let appeared = reduced;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !appeared) {
          appeared = true;
          gsap.to(ks, { k: 1, duration: 1.9, ease: "elastic.out(1, 0.62)", stagger: { each: 0.09, from: "center" } });
          s.vy = 6; // impulso inicial que decae hacia el giro base
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);

    // El scroll empuja el giro (momentum).
    let lastY = window.scrollY;
    const onScroll = () => {
      const d = window.scrollY - lastY;
      lastY = window.scrollY;
      if (!reduced) s.vy = Math.max(-9, Math.min(9, s.vy + d * 0.03));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Arrastre con inercia.
    const down = (e: PointerEvent) => {
      s.drag = true;
      moved.current = false;
      s.lx = e.clientX;
      s.ly = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!s.drag) return;
      const dx = e.clientX - s.lx;
      const dy = e.clientY - s.ly;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
      s.lx = e.clientX;
      s.ly = e.clientY;
      s.ry += dx * 0.35;
      s.rx -= dy * 0.25;
      s.vy = dx * 0.35;
      s.vx = -dy * 0.25;
    };
    const up = () => {
      s.drag = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    // Etiqueta que se pega al cursor con retardo.
    const lx = label.current ? gsap.quickTo(label.current, "x", { duration: 0.45, ease: "power3.out" }) : null;
    const ly = label.current ? gsap.quickTo(label.current, "y", { duration: 0.45, ease: "power3.out" }) : null;
    const follow = (e: PointerEvent) => {
      lx?.(e.clientX + 18);
      ly?.(e.clientY + 18);
    };
    if (fine) el.addEventListener("pointermove", follow);

    // En táctil no hay hover: se muestra el nombre de la imagen frontal.
    const t = window.setInterval(() => setFront(projects[s.frontIdx].title), 250);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("pointermove", follow);
      window.clearInterval(t);
      gsap.killTweensOf(ks);
    };
  }, []);

  return (
    <>
      <div
        ref={stage}
        onPointerEnter={() => setInside(true)}
        onPointerLeave={() => {
          setInside(false);
          setHovered(null);
        }}
        className="relative mx-auto aspect-square w-[min(94vw,88svh)] cursor-grab touch-pan-y select-none active:cursor-grabbing [perspective:1400px]"
        aria-label="Esfera de proyectos"
      >
        <div ref={group} className="absolute inset-0 [transform-style:preserve-3d]">
          {projects.map((p, i) => (
            <div key={p.id} ref={(n) => { cards.current[i] = n; }} className="absolute left-1/2 top-1/2 opacity-0 [transform-style:preserve-3d]">
              <button
                type="button"
                aria-label={`${p.title}, ${p.category}. Ver caso`}
                onPointerEnter={() => setHovered(p.title)}
                onClick={() => !moved.current && setActive(p)}
                className="group relative block h-full w-full overflow-hidden bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
              >
                <Image src={p.image} alt="" fill sizes="240px" draggable={false} className="object-cover transition-transform duration-700 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:scale-110" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Nombre pegado al cursor (puntero fino) */}
      <div
        ref={label}
        aria-hidden
        className={`pointer-events-none fixed left-0 top-0 z-40 hidden transition-opacity duration-300 [@media(hover:hover)_and_(pointer:fine)]:block ${inside && hovered ? "opacity-100" : "opacity-0"}`}
      >
        <span className="block overflow-hidden rounded-full bg-cobalt px-4 py-2 text-sm font-medium uppercase tracking-wide text-cloud">
          <span key={hovered ?? ""} className="label-in block whitespace-nowrap">
            {hovered ?? " "}
          </span>
        </span>
      </div>

      {/* Táctil: nombre de la imagen frontal */}
      <p aria-hidden className="mt-4 text-center text-lg font-light uppercase tracking-tight [@media(hover:hover)_and_(pointer:fine)]:hidden">
        {front}
      </p>

      <details className="mx-auto mt-8 w-[min(94vw,60rem)]">
        <summary className="min-h-11 cursor-pointer py-3 text-base uppercase tracking-wide">Índice</summary>
        <ul className="mt-2 grid gap-x-8 sm:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => setActive(p)} className="flex min-h-11 w-full items-baseline justify-between gap-4 py-2 text-left uppercase hover:text-cobalt focus-visible:outline-2 focus-visible:outline-cobalt">
                <span className="text-base tracking-tight">{p.title}</span>
                <span className="text-sm">{p.category}</span>
              </button>
            </li>
          ))}
        </ul>
      </details>

      <ProjectDialog project={active} onClose={() => setActive(null)} />
    </>
  );
}
