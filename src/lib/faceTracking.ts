// Seguimiento de la cara con la cámara (MediaPipe Face Detector, todo en el navegador: la imagen no sale del dispositivo).
// Devuelve la posición de la cara normalizada (-1..1, en espejo) para que el busto mire a la persona.

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

export type FaceTracker = { stop: () => void };

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
      stop: () => {
        stopped = true;
        cancelAnimationFrame(raf);
        detector.close();
        stopStream();
      },
    };
  } catch (e) {
    stopStream();
    throw e;
  }
}
