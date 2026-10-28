// Contenido de la web. Todo lo marcado TODO es placeholder (stock / datos de ejemplo)
// y se sustituye aquí sin tocar los componentes.

import { stock } from "./stock";

export const studio = {
  name: "2894_",
  tagline: "Intelligent tools. Human imagination.",
  // TODO: validar con el cliente
  headline: "Estudio de IA y diseño",
  twoBeat: ["Pensado para crear.", "Hecho para conectar."],
  facts: { location: "Madrid", founded: "2025", sector: "Consultoría y servicios a empresas" },
  phone: "+34 622 016 300",
  email: "hola@2894.studio", // TODO: confirmar email real
};

export const nav = [
  { label: "Proyectos", href: "#proyectos" },
  { label: "Servicios", href: "#servicios" },
  { label: "Clientes", href: "#clients" },
  { label: "Contacto", href: "#contacto" },
];

// TODO: sustituir por proyectos reales (máximo 10: forman la esfera 3D).
const list = [
  ["Proyecto Uno", "Formación IA"],
  ["Proyecto Dos", "Producto digital"],
  ["Proyecto Tres", "Research"],
  ["Proyecto Cuatro", "Benchmark"],
  ["Proyecto Cinco", "Flujos con IA"],
  ["Proyecto Seis", "Herramientas con IA"],
  ["Proyecto Siete", "Acompañamiento"],
  ["Proyecto Ocho", "Formación IA"],
  ["Proyecto Nueve", "Estrategia"],
  ["Proyecto Diez", "Diseño con IA"],
] as const;

export const projects = list.map(([title, category], i) => ({
  id: `p${i + 1}`,
  title,
  category,
  meta: [category, "Research", "Estrategia"],
  // TODO: reseña real de cada proyecto
  review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
  image: stock[i].src,
  imageAlt: stock[i].title,
  credit: stock[i].credit,
}));

export type Project = (typeof projects)[number];

// Fuente de los textos: LinkedIn de 2894_ (Grow: resumen del apartado "más allá de la eficiencia"; validar con el cliente).
export const services = [
  { key: "Discover", text: "Research, formaciones, benchmark e identificación de problemas." },
  { key: "Apply", text: "Flujos de trabajo y herramientas con IA, con acompañamiento." },
  { key: "Grow", text: "Crecimiento y madurez del equipo, visión estratégica y nuevas formas de creación." },
];

// TODO: sustituir por los clientes y disciplinas reales; las imágenes salen en hover.
export const clients = [
  { name: "ING", disciplines: ["Research", "Strategy"], image: stock[10].src, alt: stock[10].title },
  { name: "MOA", disciplines: ["Strategy", "Design"], image: stock[11].src, alt: stock[11].title },
  { name: "NATEEVO", disciplines: ["Design", "Development"], image: stock[12].src, alt: stock[12].title },
  { name: "INDITEX", disciplines: ["Research", "Strategy", "Design", "Development"], image: stock[13].src, alt: stock[13].title },
  { name: "DPROMA", disciplines: ["Research", "Design"], image: stock[14].src, alt: stock[14].title },
];

export const reel = {
  youtubeId: "EdIrzwME-do",
  poster: "https://i.ytimg.com/vi/EdIrzwME-do/maxresdefault.jpg",
};

// Imágenes que aparecen alrededor de "Apply" durante el recorrido horizontal.
export const applyImages = [15, 2, 16, 5, 17, 7].map((i) => ({ src: stock[i].src, alt: stock[i].title }));
