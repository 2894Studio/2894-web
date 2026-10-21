// Contenido de la web. Todo lo marcado TODO es placeholder (lorem ipsum / stock)
// y se sustituye aquí sin tocar los componentes.

export const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

export const studio = {
  name: "2894_",
  tagline: "Intelligent tools. Human imagination.",
  // Titular en dos tiempos, como la referencia. TODO: validar con el cliente
  headline: "Estudio de IA y diseño impulsado por research y estrategia",
  twoBeat: ["Pensado para crear.", "Hecho para conectar."],
  // Fuente: LinkedIn de 2894_
  positioning:
    "Elevamos a empresas y equipos de diseño a un nuevo nivel de madurez, innovación y propósito, con resultados reales a través de la alfabetización en IA y su aplicación práctica.",
  intro:
    "Somos un pequeño equipo de personas curiosas que combina IA generativa con un profundo conocimiento del diseño de producto digital. Convertimos la IA en una ventaja competitiva que amplifica el talento humano, mejora la productividad y refuerza el posicionamiento de tu equipo.",
  beyond: [
    "Impulsamos el crecimiento, la madurez y la visión estratégica de tu equipo.",
    "Abrimos espacio a nuevas formas de creación y exploración.",
    "Colocamos a tu equipo en la vanguardia de un entorno digital muy competitivo.",
  ],
  values: [
    {
      title: "Transparencia",
      text: "Creemos en una relación honesta con la tecnología. Hablamos claro sobre lo que la IA puede —y no puede— hacer, con estrategias realistas, éticas y sostenibles.",
    },
    {
      title: "Simplificamos la complejidad",
      text: "Entendemos todo el ecosistema de herramientas de IA y lo hacemos simple, con una mirada experta, cercana y personalizada. Convertimos la complejidad tecnológica en claridad creativa.",
    },
  ],
  servicesSummary:
    "Combinamos research, formación y herramientas con IA para que tu equipo descubra dónde aplicar la IA, la aplique con criterio y crezca con ella.",
  facts: { location: "Madrid", founded: "2025", team: "2–10 personas", sector: "Consultoría y servicios a empresas" },
  phone: "+34 622 016 300",
  email: "hola@2894.studio", // TODO: confirmar email real
};

export const nav = [
  { label: "Proyectos", href: "#proyectos" },
  { label: "Servicios", href: "#servicios" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Contacto", href: "#contacto" },
];

// TODO: sustituir por proyectos reales (imágenes de stock + lorem ipsum).
// x,y,w = posición y ancho en % del lienzo; rot = grados; depth = intensidad del parallax; ar = proporción w/h.
const cloud: { title: string; category: string; x: number; y: number; w: number; rot: number; depth: number; ar: number }[] = [
  { title: "Proyecto Uno", category: "Formación IA", x: 44, y: 6, w: 7, rot: -2, depth: 0.6, ar: 0.8 },
  { title: "Proyecto Dos", category: "Producto digital", x: 36, y: 17, w: 9, rot: 2, depth: 1, ar: 0.9 },
  { title: "Proyecto Tres", category: "Research", x: 47, y: 24, w: 6, rot: 4, depth: 1.4, ar: 0.8 },
  { title: "Proyecto Cuatro", category: "Benchmark", x: 28, y: 33, w: 6.5, rot: -3, depth: 0.5, ar: 0.75 },
  { title: "Proyecto Cinco", category: "Flujos con IA", x: 22, y: 45, w: 8, rot: 3, depth: 1.2, ar: 0.85 },
  { title: "Proyecto Seis", category: "Herramientas", x: 36, y: 50, w: 5, rot: -2, depth: 0.8, ar: 0.55 },
  { title: "Proyecto Siete", category: "Acompañamiento", x: 40, y: 58, w: 9.5, rot: 2, depth: 1.6, ar: 0.8 },
  { title: "Proyecto Ocho", category: "Formación IA", x: 24, y: 64, w: 7, rot: -4, depth: 0.7, ar: 0.9 },
  { title: "Proyecto Nueve", category: "Estrategia", x: 38, y: 80, w: 8, rot: 1, depth: 0.4, ar: 0.75 },
  { title: "Proyecto Diez", category: "Research", x: 60, y: 8, w: 7.5, rot: 2, depth: 0.9, ar: 0.75 },
  { title: "Proyecto Once", category: "Producto digital", x: 66, y: 24, w: 6.5, rot: -3, depth: 1.5, ar: 0.7 },
  { title: "Proyecto Doce", category: "Diseño con IA", x: 55, y: 30, w: 8, rot: 1, depth: 1, ar: 0.95 },
  { title: "Proyecto Trece", category: "Formación IA", x: 52, y: 40, w: 5, rot: -2, depth: 0.6, ar: 0.55 },
  { title: "Proyecto Catorce", category: "Benchmark", x: 70, y: 43, w: 7, rot: 3, depth: 1.1, ar: 0.7 },
  { title: "Proyecto Quince", category: "Flujos con IA", x: 62, y: 54, w: 6, rot: -1, depth: 0.5, ar: 0.8 },
  { title: "Proyecto Dieciséis", category: "Herramientas", x: 66, y: 65, w: 7.5, rot: 2, depth: 1.3, ar: 0.95 },
  { title: "Proyecto Diecisiete", category: "Acompañamiento", x: 50, y: 74, w: 6, rot: -3, depth: 0.8, ar: 0.7 },
  { title: "Proyecto Dieciocho", category: "Estrategia", x: 56, y: 84, w: 8, rot: 2, depth: 0.6, ar: 0.8 },
];

export const projects = cloud.map((p, i) => ({
  ...p,
  id: `p${String(i + 1).padStart(2, "0")}`,
  description: LOREM,
  meta: [p.category, "Research", "Estrategia"],
  image: `https://picsum.photos/seed/2894-cloud-${i + 1}/600/${Math.round(600 / p.ar)}`,
  imageLarge: `https://picsum.photos/seed/2894-cloud-${i + 1}/1400/1000`,
}));

export const reel = {
  label: "Play reel",
  youtubeId: "EdIrzwME-do",
  poster: "https://i.ytimg.com/vi/EdIrzwME-do/maxresdefault.jpg",
};

export const services = [
  {
    key: "Discover",
    items: ["Research", "Formaciones", "Benchmark", "Identificación de problemas"],
    text: "Entendemos cómo trabaja tu equipo hoy y dónde la IA puede aportar de verdad.",
  },
  {
    key: "Apply",
    items: ["Flujos de trabajo con IA", "Herramientas con IA", "Acompañamiento"],
    text: "Diseñamos flujos y herramientas a medida y te acompañamos mientras los adoptas.",
  },
  {
    key: "Grow",
    items: ["Lorem ipsum dolor", "Sit amet consectetur", "Adipiscing elit"], // TODO: definir contenido de Grow
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
];

// Estructura narrativa de la referencia: encargo → enfoque → resultado cualitativo.
// TODO: sustituir los wordmarks por logos SVG y los textos por los casos reales
export const clients = [
  { name: "ING", cta: "View case study" },
  { name: "MOA", cta: "View case study" },
  { name: "NATEEVO", cta: "View work" },
  { name: "INDITEX", cta: "View work" },
  { name: "DPROMA", cta: "View case study" },
].map((c) => ({
  ...c,
  text: `${c.name} se puso en contacto con nosotros para lorem ipsum dolor sit amet. Con un enfoque basado en research y formación, consectetur adipiscing elit para que su equipo sed do eiusmod tempor con resultados validados.`,
}));

export const brands = ["ING", "MOA", "NATEEVO", "INDITEX", "DPROMA", "Lorem", "Ipsum", "Dolor"]; // TODO
