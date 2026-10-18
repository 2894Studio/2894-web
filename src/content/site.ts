// Contenido de la web. Todo lo marcado TODO es placeholder (lorem ipsum / stock)
// y se sustituye aquí sin tocar los componentes.

export const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

export const studio = {
  name: "2894_",
  tagline: "Intelligent tools. Human imagination.",
  // Fuente: LinkedIn de 2894_
  positioning:
    "Elevamos a empresas y equipos de diseño a un nuevo nivel de madurez, innovación y propósito, con resultados reales a través de la alfabetización en IA y su aplicación práctica.",
  intro:
    "Combinamos nuestra experiencia en IA generativa con un profundo conocimiento del diseño de producto digital, convirtiendo la IA en una ventaja competitiva que amplifica el talento humano, mejora la productividad y refuerza el posicionamiento de tu equipo en el ecosistema digital.",
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

// TODO: sustituir por proyectos reales (imágenes de stock + lorem ipsum)
export const projects = [
  { id: "p01", title: "Proyecto Uno", category: "Formación IA", year: "2026" },
  { id: "p02", title: "Proyecto Dos", category: "Producto digital", year: "2026" },
  { id: "p03", title: "Proyecto Tres", category: "Research", year: "2025" },
  { id: "p04", title: "Proyecto Cuatro", category: "Flujos con IA", year: "2025" },
  { id: "p05", title: "Proyecto Cinco", category: "Herramientas con IA", year: "2025" },
  { id: "p06", title: "Proyecto Seis", category: "Benchmark", year: "2025" },
  { id: "p07", title: "Proyecto Siete", category: "Acompañamiento", year: "2025" },
  { id: "p08", title: "Proyecto Ocho", category: "Formación IA", year: "2025" },
].map((p, i) => ({
  ...p,
  description: LOREM,
  image: `https://picsum.photos/seed/2894-${i + 1}/900/1100`,
}));

export const services = [
  {
    key: "Discover",
    items: ["Research", "Formaciones", "Benchmark", "Identificación de problemas"],
    text: LOREM,
  },
  {
    key: "Apply",
    items: ["Flujos de trabajo optimizados con IA", "Creación de herramientas con IA", "Acompañamiento"],
    text: LOREM,
  },
  {
    key: "Grow",
    items: ["Lorem ipsum dolor", "Sit amet consectetur", "Adipiscing elit"], // TODO: definir contenido de Grow
    text: LOREM,
  },
];

// TODO: sustituir los wordmarks de texto por logos SVG y textos reales de cada caso
export const clients = [
  { name: "ING", text: LOREM, cta: "View case study" },
  { name: "MOA", text: LOREM, cta: "View case study" },
  { name: "NATEEVO", text: LOREM, cta: "View work" },
  { name: "INDITEX", text: LOREM, cta: "View work" },
  { name: "DPROMA", text: LOREM, cta: "View case study" },
];
