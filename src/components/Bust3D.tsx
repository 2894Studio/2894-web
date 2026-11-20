"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { CloudSky, SKY_DEFAULTS, type SkyControls } from "@/components/CloudSky";
import { startHeadPose, type FaceTracker, type HandMotion, type HeadPose } from "@/lib/faceTracking";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Página /busto con el busto en 3D real (GLB).
//  · Ratón / táctil: sin tocar, el busto mira al puntero; arrastrando se orbita por todos los ángulos (delante, detrás,
//    arriba y abajo) con inercia. Flechas del teclado para girarlo, doble clic o "Volver al frente" para recolocarlo.
//  · Cámara (opcional): el busto repite el movimiento de la cabeza de la persona en los tres ejes (giro, cabeceo e
//    inclinación). Solo movimiento: no se leen gestos ni expresiones.
//  · Nubes: las nubes volumétricas de Grow (CloudSky, solo las nubes, sin el cielo azul) flotan detrás del busto y
//    reaccionan al cursor; entran con un fundido cuando el busto ya ha cargado. Con la cámara activa, el viento de las
//    nubes sube con el movimiento de la mano (solo se mide la velocidad: sin gestos).
//  · Modo noche (prop `night`, que decide BustPage): fondo oscuro, luz de luna con contraluz azul en el busto y nubes
//    iluminadas por la luna; la luz pasa de día a noche con un fundido.
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
const MODEL_ASPECT = 0.5; // ancho / alto del busto visto de frente
const MODEL_WIDEST = 0.72; // ancho / alto de su silueta más ancha (de perfil)
const TURN_ROOM = 0.11; // holgura extra (fracción del alto) a cada lado para los textos: de perfil la silueta se ensancha
const MAX_YAW = 0.5; // rad (~29°): giro hacia el puntero sin arrastrar
const MAX_PITCH = 0.26; // rad (~15°)
const PITCH_LIMIT = 1.5; // rad (~86°): al orbitar se puede ver desde arriba y desde abajo, sin dar la vuelta de campana
const DRAG = 0.008; // rad por píxel arrastrado (~0,46°/px)
const KEY_STEP = 0.22; // rad por pulsación de flecha
const SMOOTH = 7; // frecuencia del muelle: más alto, más rápido
const TEX_MOBILE = 2048; // lado máximo de las texturas en móvil (el GLB trae tres de 4096²: ~250 MB de GPU)

// Cámara: la postura con la que se activa (o al pulsar "Centrar") es el frente del busto.
const CAL_FRAMES = 15; // cuadros que se promedian para calibrar
const HEAD_GAIN = 1; // 1 = el busto gira lo mismo que la cabeza
const HEAD_SMOOTH = 0.5; // suavizado de la medición (0..1; más alto = más directo)
const HEAD_LIMIT = { yaw: 1.75, pitch: 1.2, roll: 0.8 }; // rad

// Viento: Grow va de 0 a 4 (1 por defecto); aquí la ráfaga de la mano puede subir más, y se calma sola.
const WIND_MAX = 8;
const HAND_MIN = 1.5; // largos de mano por segundo: por debajo es temblor o un gesto lento y no cuenta
const HAND_MAX = 10; // a esta velocidad (un saludo enérgico) el viento llega al máximo

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type CamState = "off" | "asking" | "on" | "denied";
type Euler3 = { yaw: number; pitch: number; roll: number };
type HeadTarget = Euler3 & { active: boolean };

// Tamaño de la figura en pantalla: el mismo que tenía el busto 2D, sin salirse del ancho (ni siquiera de perfil).
function figureBox(W: number, H: number) {
  const bh2d = Math.min(H * 0.95, (((W * 0.82) / (BBOX[2] - BBOX[0])) * IMG_H) / IMG_W);
  const figH = Math.min(bh2d * FIG_H, (W * 0.94) / MODEL_WIDEST);
  return { bh2d, bw2d: (bh2d * IMG_W) / IMG_H, figH, figW: figH * MODEL_ASPECT };
}

// Modo noche: luz de luna (fría y más tenue) con un contraluz azul que recorta la silueta sobre el fondo oscuro.
const DAY = { env: 0.9, key: 1.6, rim: 0, exposure: 1, keyColor: [1, 1, 1] };
const NIGHT = { env: 0.32, key: 0.75, rim: 2.4, exposure: 1.05, keyColor: [0.62, 0.72, 1] };
const NIGHT_FADE = 0.7; // s que tarda la luz en pasar de día a noche
const SKY_DAY = { lit: "#fefefe", shade: "#9db4d4" };
const SKY_NIGHT = { lit: "#a9bbea", shade: "#222d57" }; // nubes a la luz de la luna

export function Bust3DScene({ night = false }: { night?: boolean }) {
  const reduced = useReducedMotion();
  if (reduced) return <StaticBust night={night} />;
  return <LiveBust night={night} />;
}

function LiveBust({ night }: { night: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const canvasBox = useRef<HTMLDivElement>(null);
  const placeholder = useRef<HTMLDivElement>(null);
  const sides = useRef<HTMLDivElement>(null);
  const mirrorVideo = useRef<HTMLDivElement>(null);
  const sky = useRef<SkyControls>({ ...SKY_DEFAULTS }); // controles de las nubes (el viento lo mueve la mano)
  const hand = useRef(0); // esfuerzo de la mano, 0..1
  const windBar = useRef<HTMLDivElement>(null);
  const head = useRef<HeadTarget>({ active: false, yaw: 0, pitch: 0, roll: 0 }); // objetivo que marca la cámara (ya en espejo)
  const api = useRef<{ reset: () => void; setNight: (n: boolean) => void } | null>(null);
  const nightRef = useRef(night); // para la escena, que se crea de forma asíncrona
  useEffect(() => {
    nightRef.current = night;
    api.current?.setNight(night);
  }, [night]);
  const tracker = useRef<FaceTracker | null>(null);
  const cal = useRef<{ n: number; sum: Euler3; neutral: Euler3 | null; sm: Euler3 | null; vote: { s: number; n: number } }>(newCal());
  const [cam, setCam] = useState<CamState>("off");
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<number | null>(0); // % de descarga del GLB (null: sin estado que mostrar)
  const [hint, setHint] = useState(true);
  const [away, setAway] = useState(false); // el busto no está de frente: se ofrece volver
  const [skies, setSkies] = useState(false); // nubes de fondo: se montan al cargar el busto (o a los 3 s, si este falla)

  useEffect(() => {
    if (ready) return setSkies(true);
    const t = window.setTimeout(() => setSkies(true), 3000);
    return () => window.clearTimeout(t);
  }, [ready]);

  // Cada medición de la cámara: suavizado, postura neutra y paso a los ejes del busto.
  const onPose = (p: HeadPose) => {
    const c = cal.current;
    // Comprobación del signo del giro: la matriz de pose y la posición de la nariz entre las mejillas deben coincidir.
    // Si lo contradicen de forma sostenida, se invierten el giro lateral y la inclinación.
    if (Math.abs(p.side) > 0.05 && Math.abs(p.yaw) > 0.05) {
      c.vote.s += Math.sign(p.yaw * p.side);
      c.vote.n++;
    }
    const sg = c.vote.n >= 10 && c.vote.s < 0 ? -1 : 1;
    const sm = (c.sm ??= { yaw: p.yaw, pitch: p.pitch, roll: p.roll });
    sm.yaw += (p.yaw - sm.yaw) * HEAD_SMOOTH;
    sm.pitch += (p.pitch - sm.pitch) * HEAD_SMOOTH;
    sm.roll += (p.roll - sm.roll) * HEAD_SMOOTH;
    if (c.n < CAL_FRAMES) {
      c.sum.yaw += sm.yaw;
      c.sum.pitch += sm.pitch;
      c.sum.roll += sm.roll;
      if (++c.n === CAL_FRAMES) c.neutral = { yaw: c.sum.yaw / CAL_FRAMES, pitch: c.sum.pitch / CAL_FRAMES, roll: c.sum.roll / CAL_FRAMES };
      return;
    }
    const n = c.neutral!;
    // La imagen de la cámara no va en espejo, pero el busto sí actúa como un espejo: el giro lateral y la inclinación
    // cambian de signo; el cabeceo (arriba/abajo) no.
    head.current = {
      active: true,
      yaw: clamp(-sg * (sm.yaw - n.yaw) * HEAD_GAIN, -HEAD_LIMIT.yaw, HEAD_LIMIT.yaw),
      pitch: clamp((sm.pitch - n.pitch) * HEAD_GAIN, -HEAD_LIMIT.pitch, HEAD_LIMIT.pitch),
      roll: clamp(-sg * (sm.roll - n.roll) * HEAD_GAIN, -HEAD_LIMIT.roll, HEAD_LIMIT.roll),
    };
  };

  const onHand = (m: HandMotion | null) => {
    hand.current = m ? clamp((m.speed - HAND_MIN) / (HAND_MAX - HAND_MIN), 0, 1) : 0;
  };

  // Cámara opcional: solo si la persona la activa. La imagen se procesa en el dispositivo y no se guarda.
  const startCam = () => {
    setCam("asking");
    cal.current = newCal();
    startHeadPose(onPose, () => (head.current.active = false), onHand)
      .then((t) => {
        tracker.current = t;
        mirrorVideo.current?.replaceChildren(t.video);
        setCam("on");
        setHint(false);
      })
      .catch(() => setCam("denied"));
  };
  const stopCam = () => {
    tracker.current?.stop();
    tracker.current = null;
    head.current = { active: false, yaw: 0, pitch: 0, roll: 0 };
    cal.current = newCal();
    hand.current = 0;
    setCam("off");
  };
  // "Centrar": la postura actual pasa a ser el frente.
  const recenter = () => {
    const c = cal.current;
    c.n = 0;
    c.sum = { yaw: 0, pitch: 0, roll: 0 };
    c.neutral = null;
  };

  // Viento de las nubes: sube de golpe con la mano y se calma poco a poco; sin cámara vuelve a 1 y el bucle se detiene.
  const camOn = cam === "on";
  useEffect(() => {
    if (!camOn && sky.current.wind === 1) return;
    let raf = 0, last = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
      last = now;
      if (!camOn) hand.current = 0;
      const w = sky.current.wind, target = 1 + hand.current * (WIND_MAX - 1);
      sky.current.wind = w + (target - w) * (1 - Math.exp(-(target > w ? 6 : 0.9) * dt));
      if (windBar.current) windBar.current.style.transform = `scaleX(${clamp((sky.current.wind - 1) / (WIND_MAX - 1), 0, 1)})`;
      if (!camOn && Math.abs(sky.current.wind - 1) < 0.01) {
        sky.current.wind = 1;
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [camOn]);

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
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;";
        box.appendChild(canvas);

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envTex = pmrem.fromScene(new envMod.RoomEnvironment(), 0.04).texture;
        scene.environment = envTex;
        const key = new THREE.DirectionalLight(0xffffff, DAY.key);
        key.position.set(1.5, 2, 3);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0x6f98ff, 0); // contraluz: solo de noche
        rim.position.set(-2.5, 1.5, -2.5);
        scene.add(rim);

        // Día ↔ noche: la luz se interpola (k = 0 día, 1 noche) en vez de saltar.
        let nk = nightRef.current ? 1 : 0, nTarget = nk, nRaf = 0, nLast = 0;
        const applyLight = () => {
          const mix = (a: number, b: number) => a + (b - a) * nk;
          scene.environmentIntensity = mix(DAY.env, NIGHT.env);
          key.intensity = mix(DAY.key, NIGHT.key);
          key.color.setRGB(mix(DAY.keyColor[0], NIGHT.keyColor[0]), mix(DAY.keyColor[1], NIGHT.keyColor[1]), mix(DAY.keyColor[2], NIGHT.keyColor[2]));
          rim.intensity = mix(DAY.rim, NIGHT.rim);
          renderer.toneMappingExposure = mix(DAY.exposure, NIGHT.exposure);
        };
        const nightFrame = (now: number) => {
          nRaf = 0;
          const dt = nLast ? Math.min(0.05, (now - nLast) / 1000) : 1 / 60;
          nLast = now;
          nk += Math.sign(nTarget - nk) * Math.min(Math.abs(nTarget - nk), dt / NIGHT_FADE);
          applyLight();
          renderer.render(scene, camera);
          if (alive && nk !== nTarget) nRaf = requestAnimationFrame(nightFrame);
          else nLast = 0;
        };
        const setNight = (n: boolean) => {
          nTarget = n ? 1 : 0;
          if (!nRaf && alive && nk !== nTarget) nRaf = requestAnimationFrame(nightFrame);
        };
        applyLight();

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

        // ── Orientación ──
        // "follow": mira al puntero. "free": orbitando (arrastre / flechas): yaw ilimitado (da la vuelta entera) y pitch
        // hasta ±86°. Con la cámara activa manda la cabeza de la persona. El giro del arrastre es de mesa giratoria:
        // yaw sobre el eje vertical del busto y pitch sobre el eje horizontal de la pantalla (orden de Euler XYZ).
        const ID = new THREE.Quaternion();
        const eul = new THREE.Euler();
        const qT = new THREE.Quaternion();
        let mode: "follow" | "free" = "follow";
        let yaw = 0, pitch = 0, vYaw = 0, vPitch = 0; // objetivo en modo libre y su inercia (rad/s)
        let dragging = false, lastX = 0, lastY = 0, lastT = 0, isAway = false;
        const hover = { x: 0, y: 0 };

        const syncFromPivot = () => {
          eul.setFromQuaternion(pivot.quaternion, "XYZ");
          yaw = eul.y;
          pitch = clamp(eul.x, -PITCH_LIMIT, PITCH_LIMIT);
        };
        const targetQuat = (dt: number) => {
          const h = head.current;
          if (h.active) {
            mode = "follow";
            eul.set(h.pitch, h.yaw, h.roll, "YXZ"); // la cabeza: giro, luego cabeceo, luego inclinación
          } else if (mode === "free") {
            if (!dragging && Math.abs(vYaw) + Math.abs(vPitch) > 0.002) {
              yaw += vYaw * dt;
              pitch += vPitch * dt;
              if (Math.abs(pitch) >= PITCH_LIMIT) vPitch = 0;
              pitch = clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT);
              const decay = Math.exp(-3.2 * dt); // la inercia se apaga en ~1 s
              vYaw *= decay;
              vPitch *= decay;
              if (Math.abs(vYaw) + Math.abs(vPitch) <= 0.002) vYaw = vPitch = 0;
            }
            eul.set(pitch, yaw, 0, "XYZ");
          } else {
            eul.set(hover.y * MAX_PITCH, hover.x * MAX_YAW, 0, "XYZ");
          }
          return qT.setFromEuler(eul);
        };

        let raf = 0, last = 0;
        const tick = (now: number) => {
          raf = 0;
          const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
          last = now;
          const q = targetQuat(dt);
          pivot.quaternion.slerp(q, 1 - Math.exp(-SMOOTH * dt));
          renderer.render(scene, camera);
          const nowAway = mode === "free" && !head.current.active && q.angleTo(ID) > 0.12;
          if (nowAway !== isAway) {
            isAway = nowAway;
            setAway(nowAway);
          }
          const moving = head.current.active || dragging || vYaw !== 0 || vPitch !== 0 || pivot.quaternion.angleTo(q) > 0.0005;
          if (alive && moving) raf = requestAnimationFrame(tick);
          else last = 0;
        };
        const kick = () => {
          if (!raf && alive) raf = requestAnimationFrame(tick);
        };
        const reset = () => {
          mode = "follow";
          vYaw = vPitch = 0;
          kick();
        };
        api.current = { reset, setNight };
        setNight(nightRef.current); // por si la persona cambió de modo mientras cargaba el modelo

        const onDown = (e: PointerEvent) => {
          if (head.current.active || (e.pointerType === "mouse" && e.button !== 0)) return;
          if (mode === "follow") syncFromPivot();
          mode = "free";
          dragging = true;
          vYaw = vPitch = 0;
          lastX = e.clientX;
          lastY = e.clientY;
          lastT = e.timeStamp;
          try {
            box.setPointerCapture(e.pointerId);
          } catch {}
          setHint(false);
          kick();
        };
        const onMove = (e: PointerEvent) => {
          if (dragging) {
            const dx = e.clientX - lastX, dy = e.clientY - lastY;
            const dtm = Math.max(1, e.timeStamp - lastT) / 1000;
            lastX = e.clientX;
            lastY = e.clientY;
            lastT = e.timeStamp;
            yaw += dx * DRAG;
            pitch = clamp(pitch + dy * DRAG, -PITCH_LIMIT, PITCH_LIMIT);
            vYaw = clamp(vYaw + ((dx * DRAG) / dtm - vYaw) * 0.4, -14, 14);
            vPitch = clamp(vPitch + ((dy * DRAG) / dtm - vPitch) * 0.4, -14, 14);
          } else {
            const r = box.getBoundingClientRect();
            hover.x = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1);
            hover.y = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2), -1, 1);
          }
          kick();
        };
        const onUp = (e: PointerEvent) => {
          if (!dragging) return;
          dragging = false;
          if (e.timeStamp - lastT > 90) vYaw = vPitch = 0; // se soltó parado: sin inercia
          try {
            box.releasePointerCapture(e.pointerId);
          } catch {}
          kick();
        };
        const onLeave = () => {
          hover.x = 0;
          hover.y = 0;
          kick();
        };
        const onKey = (e: KeyboardEvent) => {
          if (head.current.active) return;
          if (e.key === "Home" || e.key === "0") {
            e.preventDefault();
            reset();
            return;
          }
          const d: Record<string, [number, number]> = { ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP] };
          const s = d[e.key];
          if (!s) return;
          e.preventDefault();
          if (mode === "follow") syncFromPivot();
          mode = "free";
          vYaw = vPitch = 0;
          yaw += s[0];
          pitch = clamp(pitch + s[1], -PITCH_LIMIT, PITCH_LIMIT);
          setHint(false);
          kick();
        };

        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(st);
        box.addEventListener("pointerdown", onDown);
        box.addEventListener("dblclick", reset);
        box.addEventListener("keydown", onKey);
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        document.documentElement.addEventListener("pointerleave", onLeave);
        const poll = window.setInterval(() => head.current.active && kick(), 100); // reanuda el bucle cuando llega la cámara
        setReady(true);
        setProgress(null);

        cleanup = () => {
          cancelAnimationFrame(raf);
          cancelAnimationFrame(nRaf);
          window.clearInterval(poll);
          ro.disconnect();
          box.removeEventListener("pointerdown", onDown);
          box.removeEventListener("dblclick", reset);
          box.removeEventListener("keydown", onKey);
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
          document.documentElement.removeEventListener("pointerleave", onLeave);
          api.current = null;
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

  const sk = night ? SKY_NIGHT : SKY_DAY;
  const muted = night ? "text-cloud/60" : "text-ink/55";
  const note = night ? "text-cloud/65" : "text-ink/60";
  const pill = night ? "border-white/20 bg-white/10 text-cloud hover:bg-cloud hover:text-ink" : "border-ink/15 bg-white/80 text-ink hover:bg-ink hover:text-cloud";

  return (
    <section aria-label="2894_ Studio, una nueva forma de diseñar" className="relative h-svh">
      <div ref={stage} className={`relative h-svh overflow-hidden transition-colors duration-700 ${night ? "bg-[#070a14]" : "bg-cloud"}`}>
        {/* Nubes de Grow, sin cielo: detrás de todo lo demás */}
        <div aria-hidden className={`absolute inset-0 transition-opacity duration-[1400ms] ${skies ? "opacity-100" : "opacity-0"}`}>
          {skies && <CloudSky controls={sky} lit={sk.lit} shade={sk.shade} />}
        </div>

        {/* Busto 2D: se ve mientras carga el 3D y si este falla */}
        <div ref={placeholder} className={`absolute transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PLACEHOLDER} alt={ready ? "" : ALT} className={`h-full w-full object-contain ${night ? "brightness-75" : ""}`} />
        </div>

        {progress !== null && (
          <p role="status" className={`pointer-events-none absolute bottom-[calc(28px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.22em] ${muted}`}>
            Cargando el busto en 3D{progress > 0 ? ` · ${progress} %` : "…"}
          </p>
        )}
        {ready && hint && !camOn && (
          <p aria-hidden className={`pointer-events-none absolute bottom-[calc(28px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.22em] ${muted}`}>
            Arrastra para verlo desde todos los ángulos
          </p>
        )}

        {/* Busto 3D: arrastrable (y con flechas del teclado) */}
        <div
          ref={canvasBox}
          tabIndex={ready ? 0 : -1}
          role="group"
          aria-label="Busto 3D de 2894_. Arrastra o usa las flechas del teclado para girarlo; doble clic o la tecla Inicio lo devuelven al frente."
          className={`absolute inset-0 select-none outline-none transition-opacity duration-700 focus-visible:outline-2 focus-visible:-outline-offset-8 focus-visible:outline-cobalt ${night ? "[filter:drop-shadow(0_0_44px_rgb(125_183_255/0.22))]" : "[filter:drop-shadow(0_18px_36px_rgb(11_11_13/0.12))]"} ${ready ? "opacity-100" : "pointer-events-none opacity-0"} ${camOn ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
        />

        {/* "2894_ Studio" y la frase, sutiles, a los lados del busto (en móvil, arriba) */}
        <p className="sr-only">2894_ Studio. Una nueva forma de diseñar</p>
        <div ref={sides} aria-hidden className={`pointer-events-none absolute inset-0 text-[11px] font-medium uppercase leading-[1.5] tracking-[0.22em] ${muted} max-sm:[&>span]:!top-[calc(84px+env(safe-area-inset-top,0px))] sm:text-xs`}>
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

        {/* Volver al frente (solo si se ha orbitado) */}
        {away && !camOn && (
          <button
            type="button"
            onClick={() => api.current?.reset()}
            className={`spring absolute bottom-[calc(88px+env(safe-area-inset-bottom,0px))] left-[var(--gutter)] z-20 inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium backdrop-blur-md ${pill}`}
          >
            <span aria-hidden>↺</span> Volver al frente
          </button>
        )}

        {/* Cámara opcional */}
        <div className="absolute bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-[var(--gutter)] z-20 flex flex-col items-end gap-2">
          {/* El espejo existe siempre (oculto) para poder colocar la imagen de la cámara en cuanto llega. */}
          <div hidden={!camOn} className={`w-[clamp(150px,18vw,240px)] overflow-hidden rounded-3xl border ${night ? "border-white/15" : "border-white/60"} bg-ink shadow-[0_12px_40px_rgb(11_11_13/0.18)] max-sm:w-[132px]`}>
            <div ref={mirrorVideo} aria-hidden className="relative aspect-[4/3] w-full [&>video]:absolute [&>video]:inset-0 [&>video]:h-full [&>video]:w-full [&>video]:-scale-x-100 [&>video]:object-cover" />
            {/* Viento que levanta tu mano */}
            <div aria-hidden className="flex items-center gap-2 bg-ink px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-cloud/80">
              Viento
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-cloud/20">
                <span ref={windBar} className="block h-full origin-left rounded-full bg-sky" style={{ transform: "scaleX(0)" }} />
              </span>
            </div>
            <div className={`grid grid-cols-2 ${night ? "bg-white/10" : "bg-white/90"}`}>
              <button type="button" onClick={recenter} className={`flex min-h-11 items-center justify-center text-xs font-medium ${night ? "text-cloud hover:bg-white/20" : "text-ink hover:bg-white"}`}>
                Centrar
              </button>
              <button type="button" onClick={stopCam} className={`flex min-h-11 items-center justify-center border-l text-xs font-medium ${night ? "border-white/15 text-cloud hover:bg-white/20" : "border-ink/10 text-ink hover:bg-white"}`}>
                Apagar
              </button>
            </div>
          </div>
          {camOn ? (
            <p className={`max-w-[16rem] text-right text-xs ${note}`}>El busto repite el movimiento de tu cabeza y el viento de las nubes sube con el de tu mano: sacúdela delante de la cámara. «Centrar» fija tu postura actual como el frente.</p>
          ) : (
            <>
              <button
                type="button"
                onClick={startCam}
                disabled={cam === "asking"}
                className={`spring inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium backdrop-blur-md disabled:opacity-60 ${pill}`}
              >
                {cam === "asking" ? "Activando la cámara…" : "Cámara: mueve el busto y las nubes"}
              </button>
              <p className={`max-w-[16rem] text-right text-xs ${note}`}>
                {cam === "denied" ? "Sin acceso a la cámara: puedes girar el busto arrastrándolo." : "Opcional. Solo se sigue el movimiento de la cabeza y de la mano, no los gestos; la imagen se procesa en tu dispositivo y no se guarda."}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function newCal() {
  return { n: 0, sum: { yaw: 0, pitch: 0, roll: 0 } as Euler3, neutral: null as Euler3 | null, sm: null as Euler3 | null, vote: { s: 0, n: 0 } };
}

// Movimiento reducido: el busto quieto con los textos.
function StaticBust({ night }: { night: boolean }) {
  return (
    <section aria-label="2894_ Studio, una nueva forma de diseñar" className={`grid min-h-svh place-items-center gap-8 px-[var(--gutter)] py-16 text-center ${night ? "bg-[#070a14]" : "bg-cloud"}`}>
      <p className={`text-xs font-medium uppercase tracking-[0.22em] ${night ? "text-cloud/65" : "text-ink/60"}`}>2894_ Studio · Una nueva forma de diseñar</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PLACEHOLDER} alt={ALT} className={`h-[70svh] w-auto ${night ? "brightness-75" : ""}`} />
    </section>
  );
}
