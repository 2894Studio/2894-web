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
  whatsapp: "34622016300", // número en formato internacional para wa.me
  whatsappText: "Hola 2894_, me gustaría hablar sobre un proyecto.",
  email: "operations2894@gmail.com",
};

// Datos legales (aviso legal, privacidad, cookies). TODO: los aporta el estudio; mientras, se ve "[pendiente]".
export const legal = {
  owner: "2894 Studio SL",
  taxId: "", // NIF / CIF
  street: "Calle Luarca 4, 4.º B",
  postalCode: "", // TODO: código postal de Calle Luarca 4 (Fuenlabrada)
  city: "Fuenlabrada (Madrid)",
  registry: "", // datos del Registro Mercantil (solo sociedades)
  updated: "noviembre de 2026",
};

// Colaboraciones (logos oficiales de sus webs, en /public/brand/partners).
export const partners = [
  { name: "IE University", href: "https://www.ie.edu/university/", logo: "/brand/partners/ie.svg", h: "h-12" },
  { name: "UDIT", href: "https://www.udit.es/", logo: "/brand/partners/udit.png", h: "h-8" },
];

export const nav = [
  { label: "Proyectos", href: "#proyectos" },
  { label: "Clientes", href: "#clients" },
  { label: "Servicios", href: "#servicios" },
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
// Servicios repartidos por fase (propuesta, pendiente de validar con el estudio):
// Discover = entender y decidir · Apply = construir con IA · Grow = que el equipo y la organización lo sostengan.
export const services = [
  { key: "Discover", text: "Research, formaciones, benchmark e identificación de problemas.", items: ["Investigación", "Consultoría"] },
  {
    key: "Apply",
    text: "Vibe coding y diseño con IA: prototipos que funcionan desde el primer día, flujos de trabajo y herramientas propias, con acompañamiento.",
    items: ["Creación de herramientas", "Creación de productos", "Sistema de diseño", "Creación de contenido con IA"],
  },
  {
    key: "Grow",
    text: "Crecimiento y madurez del equipo, visión estratégica y nuevas formas de creación.",
    items: ["Formaciones", "Asesoramiento en políticas de IA"],
  },
];

// Clientes: al pasar por encima, pase tipo GIF con las fotos de su carpeta en Drive (_Clientes) o, si no hay,
// con las del proyecto indicado en `project` (slug de la carpeta del proyecto).
export const clients = [
  // Orden pedido por el estudio: Inditex, ING, Nateevo, DPROMA, MOA.
  { name: "INDITEX", project: "storyboard-en-video-para-zara-home", logo: { src: "/brand/clients/inditex.svg", ratio: 320 / 65 }, disciplines: ["Research", "Strategy", "Design", "Development"], image: stock[13].src, alt: stock[13].title },
  { name: "ING", project: "formaciones", logo: { src: "/brand/clients/ing.svg", ratio: 264.6 / 89.4 }, disciplines: ["Research", "Strategy"], image: stock[10].src, alt: stock[10].title },
  { name: "NATEEVO", project: "formaciones", logo: { src: "/brand/clients/nateevo.svg", ratio: 811 / 181 }, disciplines: ["Design", "Development"], image: stock[12].src, alt: stock[12].title },
  { name: "DPROMA", project: "dproma", logo: { src: "/brand/clients/dproma.svg", ratio: 2546.8 / 1354.7, scale: 1.6 }, disciplines: ["Research", "Design"], image: stock[14].src, alt: stock[14].title },
  { name: "MOA", project: "taller-personajes-consistentes" as string | undefined, logo: { src: "/brand/clients/moa.png", ratio: 437 / 129 } as { src: string; ratio: number; scale?: number } | undefined, disciplines: ["Strategy", "Design"], image: stock[11].src, alt: stock[11].title },
];

// Showreel en alta calidad, servido desde la web (public/showreel, generado desde el original de Drive "_Showreel").
export const reel = {
  hls: "/showreel/master.m3u8",
  poster: "/showreel/poster.jpg",
};

