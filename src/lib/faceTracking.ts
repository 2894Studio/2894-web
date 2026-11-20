// Seguimiento de la cara con la cámara (MediaPipe Face Detector, todo en el navegador: la imagen no sale del dispositivo).
// Devuelve la posición de la cara normalizada (-1..1, en espejo) para que el busto mire a la persona.

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

// `video` es la imagen de la cámara (para mostrarla como espejo); no se graba ni se envía a ningún sitio.
export type FaceTracker = { stop: () => void; video: HTMLVideoElement };

export async function startFaceTracking(onFace: (x: number, y: number) => void, onLost: () => void): Promise<FaceTracker> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("sin-camara");
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } }, audio: false });
  const stopStream = () => stream.getTracks().forEach((t) => t.stop());
  try {
    const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM);
    const make = (delegate: "GPU" | "CPU") =>
      FaceDetector.createFromOptions(fileset, { baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: "VIDEO", minDetectionConfidence: 0.5 });
    const detector = await make("GPU").catch(() => make("CPU")); // sin GPU disponible, en CPU
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();

    let raf = 0, stopped = false, last = -1, missed = 0;
    const loop = () => {
      if (stopped) return;
      raf = requestAnimationFrame(loop);
      if (video.currentTime === last || video.readyState < 2) return;
      last = video.currentTime;
      const box = detector.detectForVideo(video, performance.now()).detections[0]?.boundingBox;
      if (!box) {
        if (++missed > 20) onLost();
        return;
      }
      missed = 0;
      const cx = (box.originX + box.width / 2) / video.videoWidth;
      const cy = (box.originY + box.height / 2) / video.videoHeight;
      // Espejo horizontal: si la persona se mueve a su derecha, el busto mira a ese lado de la pantalla.
      onFace(Math.max(-1, Math.min(1, (0.5 - cx) * 2.4)), Math.max(-1, Math.min(1, (cy - 0.45) * 2.4)));
    };
    raf = requestAnimationFrame(loop);
    return {
      video,
      stop: () => {
        stopped = true;
        cancelAnimationFrame(raf);
        detector.close();
        stopStream();
        video.remove();
      },
    };
  } catch (e) {
    stopStream();
    throw e;
  }
}

// ───────────────────────── Orientación 3D de la cabeza ─────────────────────────
// Para que el busto repita el movimiento de la cabeza (no los gestos): MediaPipe Face Landmarker devuelve la matriz
// de pose de la cara en el espacio de la cámara (derecha-izquierda X, arriba Y, hacia la cámara +Z; imagen sin espejo).
// De ella se sacan los tres giros. No se piden las blendshapes (expresiones): solo el movimiento.
const LANDMARKER_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Giros en radianes, imagen sin espejo. yaw: alrededor de Y (negativo = la persona gira hacia SU derecha);
// pitch: alrededor de X (negativo = mira arriba); roll: alrededor de Z (positivo = inclina hacia SU hombro derecho).
// `side`: -0,5..0,5, dónde cae la nariz entre las mejillas en la imagen (sirve para comprobar el signo del yaw).
export type HeadPose = { yaw: number; pitch: number; roll: number; side: number };

// Ángulos de Euler (orden YXZ: primero yaw, luego pitch, luego roll) de una matriz 4x4 en columnas, con la escala quitada.
function eulerYXZ(d: number[]) {
  const n0 = Math.hypot(d[0], d[1], d[2]) || 1, n1 = Math.hypot(d[4], d[5], d[6]) || 1, n2 = Math.hypot(d[8], d[9], d[10]) || 1;
  const m11 = d[0] / n0, m21 = d[1] / n0, m31 = d[2] / n0, m22 = d[5] / n1;
  const m13 = d[8] / n2, m23 = d[9] / n2, m33 = d[10] / n2;
  const pitch = Math.asin(-Math.max(-1, Math.min(1, m23)));
  if (Math.abs(m23) < 0.9999999) return { yaw: Math.atan2(m13, m33), pitch, roll: Math.atan2(m21, m22) };
  return { yaw: Math.atan2(-m31, m11), pitch, roll: 0 };
}

// Movimiento de la mano: velocidad del centro de la palma en "largos de mano" por segundo (no depende de lo cerca que
// esté de la cámara). `vx`/`vy`: esa misma velocidad por ejes, tal como la ve la persona en el espejo: vx > 0 es hacia su
// derecha (la derecha de la pantalla) y vy > 0 es hacia abajo. `null`: ya no se ve ninguna mano. Solo se mide el
// movimiento. `pinch`: separación entre la punta del pulgar y la del índice, en largos de mano (para el zoom de pellizco,
// como en un trackpad); `dt`: segundos entre esta medición y la anterior.
export type HandMotion = { speed: number; vx: number; vy: number; pinch: number; dt: number };
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// `onHand` (opcional): mide también el movimiento de la mano con la misma cámara. Si ese modelo no carga, el seguimiento
// de la cabeza sigue funcionando igual.
export async function startHeadPose(onPose: (p: HeadPose) => void, onLost: () => void, onHand?: (m: HandMotion | null) => void): Promise<FaceTracker> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("sin-camara");
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
  const stopStream = () => stream.getTracks().forEach((t) => t.stop());
  try {
    const { FaceLandmarker, HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM);
    const make = (delegate: "GPU" | "CPU") =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: LANDMARKER_MODEL, delegate },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true,
      });
    const landmarker = await make("GPU").catch(() => make("CPU")); // sin GPU disponible, en CPU
    const makeHands = (delegate: "GPU" | "CPU") =>
      HandLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: HAND_MODEL, delegate }, runningMode: "VIDEO", numHands: 1 });
    const hands = onHand ? await makeHands("GPU").catch(() => makeHands("CPU")).catch(() => null) : null;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();

    // Mano: se mide cada dos cuadros; la velocidad sale del recorrido del centro de la palma entre mediciones.
    let frame = 0, lostHand = 0, prev: { x: number; y: number; t: number } | null = null;
    const PALM = [0, 5, 9, 13, 17]; // muñeca y base de los cuatro dedos
    const trackHand = () => {
      const lm = hands!.detectForVideo(video, performance.now()).landmarks?.[0];
      if (!lm) {
        prev = null;
        if (++lostHand === 3) onHand!(null);
        return;
      }
      lostHand = 0;
      const W = video.videoWidth, H = video.videoHeight;
      const x = (PALM.reduce((a, i) => a + lm[i].x, 0) / PALM.length) * W;
      const y = (PALM.reduce((a, i) => a + lm[i].y, 0) / PALM.length) * H;
      const size = Math.hypot((lm[9].x - lm[0].x) * W, (lm[9].y - lm[0].y) * H) || 1; // muñeca → base del dedo corazón
      const t = video.currentTime;
      if (prev && t > prev.t) {
        const dt = t - prev.t;
        // La imagen de la cámara no va en espejo, pero la persona se ve en espejo: el eje horizontal cambia de signo.
        const pinch = Math.hypot((lm[4].x - lm[8].x) * W, (lm[4].y - lm[8].y) * H) / size; // puntas del pulgar (4) y el índice (8)
        onHand!({ speed: Math.hypot(x - prev.x, y - prev.y) / size / dt, vx: -(x - prev.x) / size / dt, vy: (y - prev.y) / size / dt, pinch, dt });
      }
      prev = { x, y, t };
    };

    let raf = 0, stopped = false, last = -1, missed = 0;
    const loop = () => {
      if (stopped) return;
      raf = requestAnimationFrame(loop);
      if (video.currentTime === last || video.readyState < 2) return;
      last = video.currentTime;
      if (hands && (frame++ & 1) === 0) trackHand();
      const res = landmarker.detectForVideo(video, performance.now());
      const m = res.facialTransformationMatrixes?.[0]?.data;
      const lm = res.faceLandmarks?.[0];
      if (!m || m.length < 16 || !lm) {
        if (++missed > 20) onLost();
        return;
      }
      missed = 0;
      // Mejilla 234 (derecha de la persona) y 454 (izquierda), punta de la nariz 1.
      const w = lm[454].x - lm[234].x;
      const side = w ? (lm[1].x - (lm[234].x + lm[454].x) / 2) / Math.abs(w) : 0;
      onPose({ ...eulerYXZ(Array.from(m)), side });
    };
    raf = requestAnimationFrame(loop);
    return {
      video,
      stop: () => {
        stopped = true;
        cancelAnimationFrame(raf);
        landmarker.close();
        hands?.close();
        stopStream();
        video.remove();
      },
    };
  } catch (e) {
    stopStream();
    throw e;
  }
}
