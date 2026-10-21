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

// TODO: sustituir por proyectos reales. Escena de stock + pantalla del proyecto dentro de un dispositivo.
export const projects = [
  { id: "p01", title: "Proyecto Uno", meta: ["Formación IA", "Research", "Acompañamiento"], tone: "cobalt" },
  { id: "p02", title: "Proyecto Dos", meta: ["Producto digital", "Diseño con IA", "Herramientas"], tone: "ink" },
  { id: "p03", title: "Proyecto Tres", meta: ["Research", "Benchmark", "Estrategia"], tone: "sky" },
  { id: "p04", title: "Proyecto Cuatro", meta: ["Flujos con IA", "Formación IA", "Acompañamiento"], tone: "paper" },
].map((p, i) => ({
  ...p,
  scene: `https://picsum.photos/seed/2894-scene-${i + 1}/1400/1000`,
}));

export const reel = {
  label: "Play reel",
  // TODO: URL pública (Vimeo/YouTube/Drive) del showreel
  url: process.env.NEXT_PUBLIC_SHOWREEL_URL ?? "",
  poster: "https://picsum.photos/seed/2894-reel/1920/1080",
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
