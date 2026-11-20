"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { startFaceTracking, type FaceTracker } from "@/lib/faceTracking";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Página /busto con el busto en 3D real (GLB): gira siguiendo al ratón (o a la cámara, si se activa).
// three.js se carga desde un CDN en el navegador (igual que MediaPipe en faceTracking.ts), así que no añade
// dependencias al proyecto. Mientras el modelo carga —o si WebGL/la descarga fallan— se ve el busto 2D de siempre.
const THREE_URL = "https://esm.sh/three@0.170.0";
const GLTF_URL = `${THREE_URL}/examples/jsm/loaders/GLTFLoader.js`;
const ENV_URL = `${THREE_URL}/examples/jsm/environments/RoomEnvironment.js`;
const MODEL_URL = "/brand/bust.glb";
const PLACEHOLDER = "/brand/head.webp";
const ALT = "Busto de 2894_: una cabeza azul con nubes";

const IMG_W = 1063, IMG_H = 1518;
const BBOX = [0.206, 0.108, 0.752, 0.882]; // figura dentro del PNG del busto 2D
const FIG_H = BBOX[3] - BBOX[1];
// El GLB (Tripo) trae la cabeza mirando a +X: se gira -90° en Y para que mire a cámara (+Z). De frente mide
// 0,49 de ancho por 0,98 de alto, y 0,70 de fondo (de la nuca a la nariz).
const MODEL_YAW = -Math.PI / 2;
const MODEL_ASPECT = 0.5; // ancho / alto del busto 3D visto de frente
const TURN_ROOM = 0.07; // holgura extra (fracción del alto) a cada lado para los textos: al girar, la silueta se ensancha
const MAX_YAW = 0.5; // rad (~29°) de giro máximo a izquierda/derecha
const MAX_PITCH = 0.26; // rad (~15°) de giro máximo arriba/abajo
const TEX_MOBILE = 2048; // lado máximo de las texturas en móvil (el GLB trae tres de 4096²: ~250 MB de GPU)
const SMOOTH = 7; // frecuencia del muelle: más alto, más rápido

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type CamState = "off" | "asking" | "on" | "denied";

// Tamaño de la figura en pantalla: el mismo que tenía el busto 2D, sin salirse del ancho.
function figureBox(W: number, H: number) {
  const bh2d = Math.min(H * 0.95, (((W * 0.82) / (BBOX[2] - BBOX[0])) * IMG_H) / IMG_W);
  const figH = Math.min(bh2d * FIG_H, (W * 0.82) / MODEL_ASPECT);
  return { bh2d, bw2d: (bh2d * IMG_W) / IMG_H, figH, figW: figH * MODEL_ASPECT };
}

export function Bust3DScene() {
  const reduced = useReducedMotion();
  if (reduced) return <StaticBust />;
  return <LiveBust />;
}

function LiveBust() {
  const stage = useRef<HTMLDivElement>(null);
  const canvasBox = useRef<HTMLDivElement>(null);
  const placeholder = useRef<HTMLDivElement>(null);
  const sides = useRef<HTMLDivElement>(null);
  const mirrorVideo = useRef<HTMLDivElement>(null);
  const look = useRef({ active: false, x: 0, y: 0 });
  const tracker = useRef<FaceTracker | null>(null);
  const [cam, setCam] = useState<CamState>("off");
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<number | null>(0); // % de descarga del GLB (null: sin estado que mostrar)

  // Cámara opcional: solo si la persona la activa. La imagen se procesa en el dispositivo y no se guarda.
  const startCam = () => {
    setCam("asking");
    startFaceTracking(
      (x, y) => {
        look.current.active = true;
        look.current.x = x;
        look.current.y = y;
      },
      () => (look.current.active = false),
    )
      .then((t) => {
        tracker.current = t;
        mirrorVideo.current?.replaceChildren(t.video);
        setCam("on");
      })
      .catch(() => setCam("denied"));
  };
  const stopCam = () => {
    tracker.current?.stop();
    tracker.current = null;
    look.current.active = false;
    setCam("off");
  };

  // Maquetación: imagen de relleno y textos laterales pegados al contorno del busto.
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const measure = () => {
      const W = st.clientWidth, H = st.clientHeight;
      const { bh2d, bw2d, figW, figH } = figureBox(W, H);
      const ph = placeholder.current;
      if (ph) {
        ph.style.width = `${bw2d}px`;
        ph.style.height = `${bh2d}px`;
        ph.style.left = `${(W - bw2d) / 2}px`;
        ph.style.top = `${(H - bh2d) / 2}px`;
      }
      const l = sides.current?.querySelector<HTMLElement>('[data-side="l"]');
      const r = sides.current?.querySelector<HTMLElement>('[data-side="r"]');
      if (!l || !r) return;
      const wide = W >= 640;
      const gap = clamp(W * 0.03, 24, 56);
      const room = figH * TURN_ROOM;
      const figL = (W - figW) / 2 - room, figR = (W + figW) / 2 + room;
      Object.assign(l.style, wide ? { left: "auto", right: `${W - figL + gap}px`, top: `${H / 2}px`, transform: "translateY(-50%)" } : { left: "", right: "", top: "", transform: "" });
      Object.assign(r.style, wide ? { right: "auto", left: `${figR + gap}px`, top: `${H / 2}px`, transform: "translateY(-50%)" } : { left: "", right: "", top: "", transform: "" });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    return () => ro.disconnect();
  }, []);

  // Escena 3D.
  useEffect(() => {
    const st = stage.current, box = canvasBox.current;
    if (!st || !box) return;
    let alive = true;
    let cleanup = () => {};

    (async () => {
      try {
        const [THREE, gltfMod, envMod] = await Promise.all([
          import(/* webpackIgnore: true */ /* turbopackIgnore: true */ THREE_URL) as Promise<any>,
          import(/* webpackIgnore: true */ /* turbopackIgnore: true */ GLTF_URL) as Promise<any>,
          import(/* webpackIgnore: true */ /* turbopackIgnore: true */ ENV_URL) as Promise<any>,
        ]);
        const gltf = await new gltfMod.GLTFLoader().loadAsync(MODEL_URL, (e: ProgressEvent) => {
          if (alive && e.lengthComputable && e.total) setProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
        });
        if (!alive) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        const canvas = renderer.domElement;
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", ALT);
        canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y;";
        box.appendChild(canvas);

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envTex = pmrem.fromScene(new envMod.RoomEnvironment(), 0.04).texture;
        scene.environment = envTex;
        scene.environmentIntensity = 0.9;
        const key = new THREE.DirectionalLight(0xffffff, 1.6);
        key.position.set(1.5, 2, 3);
        scene.add(key);

        // El busto se normaliza a 1 de alto y se centra; `pivot` es lo que gira.
        const model = gltf.scene;
        model.rotation.y = MODEL_YAW; // de cara a cámara (antes de medir la caja)

        // Texturas: filtrado anisótropo para que no se pierdan al girar y, en móvil, reducidas para no agotar la GPU.
        const small = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
        const anis = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        const seen = new Set<any>();
        model.traverse((o: any) => {
          for (const m of ([] as any[]).concat(o.material ?? [])) {
            for (const v of Object.values(m as Record<string, any>)) {
              if (!v?.isTexture || seen.has(v)) continue;
              seen.add(v);
              v.anisotropy = anis;
              const img = v.image, side = Math.max(img?.width ?? 0, img?.height ?? 0);
              if (small && side > TEX_MOBILE) {
                const f = TEX_MOBILE / side, c = document.createElement("canvas");
                c.width = Math.round(img.width * f);
                c.height = Math.round(img.height * f);
                c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
                img.close?.();
                v.image = c;
              }
              v.needsUpdate = true;
            }
          }
        });
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const k = 1 / (size.y || 1);
        model.scale.setScalar(k);
        model.position.copy(center).multiplyScalar(-k);
        const pivot = new THREE.Group();
        pivot.rotation.order = "YXZ"; // primero cabecea (X local) y luego gira (Y del mundo)
        pivot.add(model);
        scene.add(pivot);

        const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
        const fit = () => {
          const W = st.clientWidth, H = st.clientHeight;
          if (!W || !H) return;
          const { figH } = figureBox(W, H);
          renderer.setSize(W, H, false);
          camera.aspect = W / H;
          // Distancia a la que el busto (1 de alto) ocupa figH píxeles.
          const d = H / figH / (2 * Math.tan((camera.fov * Math.PI) / 360));
          camera.position.set(0, 0, d);
          camera.lookAt(0, 0, 0);
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
        };

        const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
        let raf = 0, last = 0;
        const tick = (now: number) => {
          raf = 0;
          const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
          last = now;
          const tx = look.current.active ? look.current.x : target.x;
          const ty = look.current.active ? look.current.y : target.y;
          const f = 1 - Math.exp(-SMOOTH * dt);
          cur.x += (tx - cur.x) * f;
          cur.y += (ty - cur.y) * f;
          pivot.rotation.y = cur.x * MAX_YAW; // +x: el busto mira a su derecha (la derecha de la pantalla)
          pivot.rotation.x = cur.y * MAX_PITCH; // +y: el busto mira hacia abajo
          renderer.render(scene, camera);
          if (alive && (look.current.active || Math.abs(tx - cur.x) + Math.abs(ty - cur.y) > 0.0005)) raf = requestAnimationFrame(tick);
          else last = 0;
        };
        const kick = () => {
          if (!raf && alive) raf = requestAnimationFrame(tick);
        };
        const onMove = (e: PointerEvent) => {
          const r = box.getBoundingClientRect();
          target.x = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1);
          target.y = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2), -1, 1);
          kick();
        };
        const onLeave = () => {
          target.x = 0;
          target.y = 0;
          kick();
        };

        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(st);
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        const poll = window.setInterval(() => look.current.active && kick(), 100); // reanuda el bucle cuando llega la cámara
        setReady(true);
        setProgress(null);

        cleanup = () => {
          cancelAnimationFrame(raf);
          window.clearInterval(poll);
          ro.disconnect();
          window.removeEventListener("pointermove", onMove);
          document.documentElement.removeEventListener("pointerleave", onLeave);
          model.traverse((o: any) => {
            o.geometry?.dispose?.();
            for (const m of ([] as any[]).concat(o.material ?? [])) {
              for (const v of Object.values(m as Record<string, any>)) if (v?.isTexture) v.dispose();
              (m as any).dispose?.();
            }
          });
          envTex.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
          canvas.remove();
        };
        if (!alive) cleanup();
      } catch {
        // Sin WebGL o sin descarga: se queda el busto 2D.
        if (alive) setProgress(null);
      }
    })();

    return () => {
      alive = false;
      cleanup();
      tracker.current?.stop();
    };
  }, []);

  return (
    <section aria-label="2894_ Studio, una nueva forma de diseñar" className="relative h-svh">
      <div ref={stage} className="relative h-svh overflow-hidden bg-cloud">
        {/* Busto 2D: se ve mientras carga el 3D y si este falla */}
        <div ref={placeholder} className={`absolute transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PLACEHOLDER} alt={ready ? "" : ALT} className="h-full w-full object-contain" />
        </div>

        {progress !== null && (
          <p role="status" className="pointer-events-none absolute bottom-[calc(28px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.22em] text-ink/55">
            Cargando el busto en 3D{progress > 0 ? ` · ${progress} %` : "…"}
          </p>
        )}

        {/* Busto 3D */}
        <div ref={canvasBox} className={`absolute inset-0 transition-opacity duration-700 [filter:drop-shadow(0_18px_36px_rgb(11_11_13/0.12))] ${ready ? "opacity-100" : "opacity-0"}`} />

        {/* "2894_ Studio" y la frase, sutiles, a los lados del busto (en móvil, arriba) */}
        <p className="sr-only">2894_ Studio. Una nueva forma de diseñar</p>
        <div ref={sides} aria-hidden className="pointer-events-none absolute inset-0 text-[11px] font-medium uppercase leading-[1.5] tracking-[0.22em] text-ink/55 max-sm:[&>span]:!top-[calc(84px+env(safe-area-inset-top,0px))] sm:text-xs">
          <span data-side="l" className="absolute left-[var(--gutter)] top-[calc(20px+env(safe-area-inset-top,0px))] block sm:text-right">
            2894<span className="blink">_</span>
            <br />
            Studio
          </span>
          <span data-side="r" className="absolute right-[var(--gutter)] top-[calc(20px+env(safe-area-inset-top,0px))] block text-right sm:text-left">
            Una nueva forma
            <br />
            de diseñar
          </span>
        </div>

        {/* Cámara opcional */}
        <div className="absolute bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-[var(--gutter)] z-20 flex flex-col items-end gap-2">
          {/* El espejo existe siempre (oculto) para poder colocar la imagen de la cámara en cuanto llega. */}
          <div hidden={cam !== "on"} className="w-[clamp(150px,18vw,240px)] overflow-hidden rounded-3xl border border-white/60 bg-ink shadow-[0_12px_40px_rgb(11_11_13/0.18)] max-sm:w-[132px]">
            <div ref={mirrorVideo} aria-hidden className="relative aspect-[4/3] w-full [&>video]:absolute [&>video]:inset-0 [&>video]:h-full [&>video]:w-full [&>video]:-scale-x-100 [&>video]:object-cover" />
            <button type="button" onClick={stopCam} className="flex min-h-11 w-full items-center justify-center bg-white/90 text-xs font-medium text-ink hover:bg-white">
              Desactivar cámara
            </button>
          </div>
          {cam !== "on" && (
            <>
              <button
                type="button"
                onClick={startCam}
                disabled={cam === "asking"}
                className="spring inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 bg-white/80 px-4 text-sm font-medium text-ink backdrop-blur-md hover:bg-ink hover:text-cloud disabled:opacity-60"
              >
                {cam === "asking" ? "Esperando permiso…" : "Que el busto te mire (cámara)"}
              </button>
              <p className="max-w-[16rem] text-right text-xs text-ink/60">
                {cam === "denied" ? "Sin acceso a la cámara: el busto sigue al ratón." : "Opcional. La imagen se procesa en tu dispositivo y no se guarda."}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// Movimiento reducido: el busto quieto con los textos.
function StaticBust() {
  return (
    <section aria-label="2894_ Studio, una nueva forma de diseñar" className="grid min-h-svh place-items-center gap-8 bg-cloud px-[var(--gutter)] py-16 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-ink/60">2894_ Studio · Una nueva forma de diseñar</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PLACEHOLDER} alt={ALT} className="h-[70svh] w-auto" />
    </section>
  );
}
