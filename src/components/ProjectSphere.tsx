"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Pill } from "@/components/Pill";
import { FINE_POINTER, gsap, REDUCED } from "@/lib/gsap";
import type { SphereItem } from "@/lib/projects";

type Project = SphereItem;
// Puntos repartidos con el mismo ángulo entre vecinos (nunca dos tarjetas en la misma dirección) y alturas
// alternas en tres franjas, para que el conjunto respire y no se amontone.
const pointsFor = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const band = [0.6, 0, -0.6][(i * 2) % 3]; // arriba, centro, abajo (orden alterno)
    const y = n > 3 ? band : 0;
    return { y, r: Math.sqrt(1 - y * y * 0.35), th: (i / n) * Math.PI * 2 };
  });
const BASE_SPEED = 0.0024; // rad por frame
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

// Esfera de proyectos: gira solo sobre el eje vertical y cada imagen mira siempre al frente.
// `controlled`: la aparición la hace otra pieza (la apertura, con las piezas del busto), así que las tarjetas
// están colocadas desde el principio; `cardsRef` expone sus elementos para que esa pieza vuele hasta ellas.
export function ProjectSphere({
  items: projects,
  controlled = false,
  cardsRef,
  sizeClass = "w-[min(94vw,80svh)]",
}: {
  items: SphereItem[];
  controlled?: boolean;
  cardsRef?: MutableRefObject<(HTMLDivElement | null)[]>;
  sizeClass?: string;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const ownCards = useRef<(HTMLDivElement | null)[]>([]);
  const cards = cardsRef ?? ownCards;
  const label = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Project | null>(null);
  const [pinned, setPinned] = useState<Project | null>(null);
  const [inside, setInside] = useState(false);
  const [front, setFront] = useState(projects[0].title);
  const moved = useRef(false);
  const shown = pinned ?? hovered;
  // Índice del proyecto seleccionado (hover o fijado): ese crece, el giro se detiene y los demás se atenúan.
  const focusRef = useRef(-1);
  useEffect(() => {
    focusRef.current = shown ? projects.findIndex((p) => p.id === shown.id) : -1;
  }, [shown, projects]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const reduced = window.matchMedia(REDUCED).matches;
    const fine = window.matchMedia(FINE_POINTER).matches;
    const s = { a: 0, v: reduced ? 0 : BASE_SPEED, R: 280, Rx: 280, drag: false, lx: 0, frontIdx: 0 };
    const POINTS = pointsFor(projects.length);
    const ks = projects.map(() => ({ k: reduced || controlled ? 1 : 0 }));
    const em = projects.map(() => 0); // énfasis de cada tarjeta (0 normal, 1 seleccionada)
    let dim = 0; // atenuación del resto mientras hay una seleccionada

    const resize = () => {
      s.R = Math.min(el.clientWidth * 0.4, 420);
      s.Rx = s.R; // anillo compacto: no invade la zona del texto
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const render = () => {
      const focus = focusRef.current;
      if (!s.drag) {
        s.a += s.v;
        // Con una seleccionada el giro se frena hasta pararse; si no, vuelve despacio al giro base.
        s.v += ((reduced || focus >= 0 ? 0 : BASE_SPEED) - s.v) * (focus >= 0 ? 0.12 : 0.02);
      }
      dim += ((focus >= 0 ? 1 : 0) - dim) * 0.14;
      let best = -2;
      POINTS.forEach((p, i) => {
        const c = cards.current[i];
        if (!c) return;
        const k = ks[i].k;
        const th = p.th + s.a;
        const x = Math.sin(th) * p.r;
        const z = Math.cos(th) * p.r;
        if (z > best) {
          best = z;
          s.frontIdx = i;
        }
        const depth = (z + 1) / 2; // 0 detrás, 1 delante
        em[i] += ((i === focus ? 1 : 0) - em[i]) * 0.16;
        const e = em[i];
        const w = s.R * 0.36; // pequeñas; la seleccionada crece
        const grow = 1 + e * 1.4;
        c.style.width = `${w}px`;
        c.style.height = `${w * 1.25}px`;
        c.style.marginLeft = `${-w / 2}px`;
        c.style.marginTop = `${-w * 0.625}px`;
        c.style.transform = `translate3d(${x * s.Rx * k}px, ${-p.y * s.R * k}px, ${z * s.R * k}px) scale(${Math.min(1, k * 1.15) * (0.6 + depth * 0.4) * grow})`;
        // Delante más nítido, detrás desvanecido; con una seleccionada, las demás pasan a segundo plano.
        const base = 0.25 + depth * depth * 0.75;
        c.style.opacity = String(Math.max(0, Math.min(1, k)) * lerpN(base, Math.max(base, 1) * (i === focus ? 1 : 0.28), dim));
        c.style.zIndex = String(e > 0.05 ? 300 : Math.round(depth * 100));
        c.style.pointerEvents = z > -0.15 && k > 0.8 ? "auto" : "none";
      });
    };

    let raf = 0;
    const loop = () => {
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Aparición: las imágenes salen del centro con rebote.
    let appeared = reduced || controlled;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !appeared) {
          appeared = true;
          gsap.to(ks, { k: 1, duration: 1.9, ease: "elastic.out(1, 0.62)", stagger: { each: 0.09, from: "center" } });
          s.v = 0.03;
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);

    // El scroll empuja el giro con suavidad.
    let lastY = window.scrollY;
    const onScroll = () => {
      const d = window.scrollY - lastY;
      lastY = window.scrollY;
      if (!reduced) s.v = Math.max(-0.02, Math.min(0.02, s.v + d * 0.00014));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Arrastre horizontal con inercia.
    const down = (e: PointerEvent) => {
      s.drag = true;
      moved.current = false;
      s.lx = e.clientX;
    };
    const move = (e: PointerEvent) => {
      if (!s.drag) return;
      const dx = e.clientX - s.lx;
      if (Math.abs(dx) > 3) moved.current = true;
      s.lx = e.clientX;
      s.a += dx * 0.006;
      s.v = dx * 0.006;
    };
    const up = () => {
      s.drag = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    const lx = label.current ? gsap.quickTo(label.current, "x", { duration: 0.45, ease: "power3.out" }) : null;
    const ly = label.current ? gsap.quickTo(label.current, "y", { duration: 0.45, ease: "power3.out" }) : null;
    const follow = (e: PointerEvent) => {
      lx?.(e.clientX + 18);
      ly?.(e.clientY + 18);
    };
    if (fine) el.addEventListener("pointermove", follow);

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
  }, [controlled, cards, projects]);

  // Esc o clic fuera sueltan la reseña fijada.
  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPinned(null);
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-sphere-card]") && !t.closest("[data-review]")) setPinned(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [pinned]);

  return (
    <div className="relative">
      <div
        ref={stage}
        onPointerEnter={() => setInside(true)}
        onPointerLeave={() => {
          setInside(false);
          setHovered(null);
        }}
        className={`relative mx-auto aspect-square ${sizeClass} touch-pan-y select-none [perspective:1600px] [transform-style:preserve-3d]`}
        aria-label="Esfera de proyectos"
      >
        {projects.map((p, i) => (
          <div key={p.id} ref={(n) => { cards.current[i] = n; }} data-sphere-card className="absolute left-1/2 top-1/2 opacity-0">
            <button
              type="button"
              aria-label={`${p.title}, ${p.category}. Ver reseña`}
              aria-pressed={pinned?.id === p.id}
              onPointerEnter={() => setHovered(p)}
              onFocus={() => setHovered(p)}
              onClick={() => !moved.current && setPinned((cur) => (cur?.id === p.id ? null : p))}
              className={`group relative block h-full w-full overflow-hidden bg-ink/5 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt ${pinned?.id === p.id ? "outline-2 outline-offset-4 outline-cobalt" : ""}`}
            >
              <Image src={p.image} alt="" fill sizes="220px" draggable={false} className="object-cover transition-transform duration-700 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:scale-110" />
            </button>
          </div>
        ))}
      </div>

      {/* Reseña del proyecto: abajo a la izquierda en escritorio (no se pierde con la navegación), bajo la esfera en móvil */}
      <aside
        data-review
        aria-live="polite"
        className={`mx-[var(--gutter)] mt-6 max-w-sm transition-[opacity,translate] duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] lg:absolute lg:bottom-0 lg:left-[var(--gutter)] lg:mx-0 lg:mt-0 lg:w-[calc((100%-min(94vw,80svh))/2-2rem)] ${shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        {shown && (
          <div key={shown.id} className="label-in">
            <p className="text-sm uppercase tracking-wide">{shown.category}</p>
            <h3 className="mt-2 text-3xl font-light uppercase tracking-tight">{shown.title}</h3>
            <p className="mt-3 text-base">{shown.review}</p>
            <div className="mt-5 flex items-center gap-3">
              <Pill href={`/proyectos/${shown.id}`}>Ver caso</Pill>
              {pinned && (
                <button type="button" onClick={() => setPinned(null)} className="spring min-h-11 rounded-full border border-ink px-4 text-sm font-medium uppercase hover:bg-ink hover:text-cloud">
                  Cerrar
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      <div
        ref={label}
        aria-hidden
        className={`pointer-events-none fixed left-0 top-0 z-40 hidden transition-opacity duration-300 [@media(hover:hover)_and_(pointer:fine)]:block ${inside && hovered ? "opacity-100" : "opacity-0"}`}
      >
        <span className="block overflow-hidden rounded-full bg-cobalt px-4 py-2 text-sm font-medium uppercase tracking-wide text-cloud">
          <span key={hovered?.id ?? ""} className="label-in block whitespace-nowrap">
            {hovered?.title ?? " "}
          </span>
        </span>
      </div>

      <p aria-hidden className={`mt-4 text-center text-lg font-light uppercase tracking-tight [@media(hover:hover)_and_(pointer:fine)]:hidden ${shown ? "hidden" : ""}`}>
        {front}
      </p>

    </div>
  );
}
