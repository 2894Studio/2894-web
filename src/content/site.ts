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
  email: "hola@2894.studio", // TODO: confirmar email real
};

// Datos legales (aviso legal, privacidad, cookies). TODO: los aporta el estudio; mientras, se ve "[pendiente]".
export const legal = {
  owner: "", // titular: razón social (p. ej. "2894 Studio S.L.") o nombre y apellidos si es autónomo
  taxId: "", // NIF / CIF
  street: "", // calle y número
  postalCode: "", // código postal
  city: "Madrid",
  registry: "", // datos del Registro Mercantil (solo sociedades)
  updated: "noviembre de 2026",
};

// Colaboraciones (logos en /public/brand/partners). TODO: sustituir por los logos oficiales.
export const partners = [
  { name: "IE University", href: "https://www.ie.edu/university/", logo: "" },
  { name: "UDIT", href: "https://www.udit.es/", logo: "" },
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
    items: ["Creación de herramientas", "Creación de productos", "Creación de contenido con IA"],
  },
  {
    key: "Grow",
    text: "Crecimiento y madurez del equipo, visión estratégica y nuevas formas de creación.",
    items: ["Formaciones", "Sistema de diseño", "Asesoramiento en políticas de IA"],
  },
];

// TODO: sustituir por los clientes y disciplinas reales; las imágenes salen en hover.
export const clients = [
  // Orden pedido por el estudio: Inditex, ING, Nateevo, DPROMA, MOA.
  { name: "INDITEX", disciplines: ["Research", "Strategy", "Design", "Development"], image: stock[13].src, alt: stock[13].title },
  { name: "ING", disciplines: ["Research", "Strategy"], image: stock[10].src, alt: stock[10].title },
  { name: "NATEEVO", disciplines: ["Design", "Development"], image: stock[12].src, alt: stock[12].title },
  { name: "DPROMA", disciplines: ["Research", "Design"], image: stock[14].src, alt: stock[14].title },
  { name: "MOA", disciplines: ["Strategy", "Design"], image: stock[11].src, alt: stock[11].title },
];

// Showreel en alta calidad, servido desde la web (public/showreel, generado desde el original de Drive "_Showreel").
export const reel = {
  hls: "/showreel/master.m3u8",
  poster: "/showreel/poster.jpg",
};

