# Plan: Web de 2894_ Studio (nuevo repo + preview en Vercel)

## Context
2894_ necesita una web de alto impacto (y **responsive**) para comercializar el estudio: IA, tecnología, creatividad. HOME según brief: Showreel interactivo → navbar central que aparece al hacer scroll (Proyectos, Servicios, Nosotros, Contacto) → galería interactiva de proyectos → Servicios "Discover. Apply. Grow." → carrusel Clients (ING, MOA, NATEEVO, INDITEX, DPROMA) → footer. La captura de referencia muestra el layout de casos/clients: 4 columnas, logo, párrafo, pill oscuro "VIEW CASE STUDY / VIEW WORK", fondo gris claro.
El repo actual (`Investigaci-n-DPROMA-`) es de research DPROMA: **no se toca**; el proyecto vive en un repo nuevo.

## Información del estudio (ya aportada, fuente: LinkedIn)
- Posicionamiento: elevar a empresas y equipos de diseño a un nuevo nivel de madurez, innovación y propósito mediante alfabetización en IA y su aplicación práctica. IA generativa + comprensión profunda del diseño de producto digital: la IA como ventaja competitiva que amplía el talento humano, mejora la productividad y refuerza el posicionamiento digital.
- Más allá de la eficiencia: crecimiento/madurez/visión estratégica del equipo; espacio para nuevas formas de creación; equipos en la vanguardia.
- Valores/pilares: **Transparencia** (relación honesta con la tecnología; qué puede y qué no puede hacer la IA; estrategias realistas, éticas, sostenibles) y **Simplificamos la complejidad** (ecosistema de herramientas IA hecho simple; "claridad creativa").
- Datos: Madrid · fundada 2025 · 2–10 empleados · 3 miembros asociados · consultoría y servicios a empresas · tel. +34 622 016 300.

## Acceso desde este entorno
| Punto | Estado | Detalle |
|---|---|---|
| Node/npm/npx | OK | Node 22, npm 10; registry npm responde |
| React Bits `npx shadcn@latest add @react-bits/SplitText-JS-CSS` | OK (probable) | `reactbits.dev` responde 200; requiere `shadcn init` (components.json) y registrar `@react-bits` |
| Skill taste-skill | A probar | Se usará **`npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"`**. Riesgo: `github.com` directo devolvió 403 desde el proxy; si falla, alternativa vía `add_repo` o pegar tú el SKILL.md |
| Sistema de diseño A-Z | OK | `docs/brand/az-branding-guide.md` en este repo (cloud-white #F7F8FA, sky-blue #7DB7FF, deep-cobalt #0A46FF, soft-gray #E6E8EC, ink-black #0B0B0D; DM Sans; busto de mármol cobalto) + skill `2894-brand-style`. Se copia al repo nuevo como fuente de tokens |
| Vercel | OK al inicio de sesión | MCP autenticado, team `2894` (`team_jWhT8XNYq9EMjmJvZFkYWY1b`). Sin CLI ni token. **Ahora mismo los MCP de Vercel/GitHub aparecen desconectados** (reconexión en curso); se revalidan al ejecutar |
| Crear repo + rama | Parcial | Sesión limitada al repo DPROMA; el repo nuevo requiere crearlo (MCP GitHub) y `add_repo` para poder hacer push |
| Drive (showreel) y Notion (referencias) | Sin acceso | Los pasas tú **antes de empezar**; te los pediré al arrancar la Fase 0 |

## Decisiones propuestas
- **Repo**: `2894Studio/2894-web` (privado); rama de trabajo `claude/2894-web-foundation`; preview de Vercel por push.
- **Stack**: Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + React Bits (SplitText) + GSAP/ScrollTrigger + Lenis. Showreel `<video>` optimizado (Vercel Blob/Mux si pesa).
- **Responsive (requisito)**: mobile-first; breakpoints 360/768/1024/1440; navbar adaptada en móvil (pill inferior/menú compacto), galería con gestos táctiles en vez de hover, tipografía fluida (`clamp`), vídeo con poster y `playsinline`, targets táctiles ≥44px, `prefers-reduced-motion`. Verificación visual en 375/768/1440 con Playwright.
- **Idioma**: ES por defecto, EN preparado (confirmar).
- **Diseño**: tokens A-Z en CSS variables; DM Sans; `design-taste-frontend` + `impeccable` guían la calidad; WCAG 2.2 AA.

## Fases
**Fase 0 – Bootstrap**: (1) pedirte showreel MP4, referencias Notion, logos y proyectos; (2) crear repo + rama, README y `docs/plan.md`; (3) `create-next-app`, `shadcn init`, taste-skill, SplitText; (4) tokens A-Z; (5) proyecto Vercel en team `2894` conectado al repo y primer preview.
**Fase 1 – Fundamentos**: layout responsive, DM Sans, escala, botón pill (referencia captura), Lenis+GSAP, contenido en `content/*.ts` separado de la UI (textos LinkedIn incluidos).
**Fase 2 – HOME (un preview por sección)**: Hero+Showreel (SplitText en la propuesta de valor) → Navbar central tras scroll → Galería de proyectos interactiva → Servicios Discover/Apply/Grow (Grow: contenido por definir) → Clients carrusel + tarjetas (confirmar permiso para logos/nombrar a DPROMA) → Footer/contacto (Resend o Supabase, a decidir).
**Fase 3 – Páginas internas**: Proyectos/case study, Servicios, Nosotros (valores Transparencia y Simplicidad), Contacto.
**Fase 4 – Calidad**: auditoría impeccable + WCAG, Lighthouse (LCP vídeo), SEO/OG, analítica, dominio.

## Contenido y placeholders (decidido)
- **Lorem ipsum** en todo texto sin fuente (descripciones de proyectos, casos de clientes, Grow, equipo, footer legal, etc.). Textos reales solo donde hay fuente: LinkedIn y brief.
- **Imágenes de stock** (Unsplash/Pexels, licencia libre) para los 6–10 proyectos; logos de clientes como wordmarks de texto temporales hasta recibir SVG.
- Todo el contenido placeholder vive en `content/*.ts` con marca `// TODO: reemplazar`, para sustituirlo sin tocar UI.
- Showreel: placeholder (vídeo stock/poster) hasta recibir el MP4.

## Lo único que te solicitaré antes de empezar (tú lo pasas)
1. Showreel MP4 (o enlace de descarga directa).
2. Referencias visuales y comerciales de Notion (capturas o enlaces).
Opcional más adelante: logos SVG reales, contenido de "Grow", dominio e idiomas.

## Verificación
- `npm run build`, `lint`, `tsc --noEmit` antes de cada push.
- Preview Vercel por rama: estado/logs de build; capturas Playwright (Chromium preinstalado) en móvil, tablet y desktop.
- Checklist: navbar solo tras scroll; SplitText respeta reduced-motion; contraste AA; sin scroll horizontal en móvil; Lighthouse ≥ 90.
