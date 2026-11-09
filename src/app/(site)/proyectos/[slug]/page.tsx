import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { CoverVideo } from "@/components/CoverVideo";
import { ProjectCarousel } from "@/components/ProjectCarousel";
import { getProject, getProjects } from "@/lib/projects";

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProject((await params).slug);
  return p ? { title: `${p.title} · 2894_ Studio`, description: p.summary } : {};
}

// Página de caso: portada (imagen o vídeo), datos, texto y carrusel opcional, todo desde la carpeta del proyecto en Drive.
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProject((await params).slug);
  if (!p) notFound();
  const meta = [p.client, p.year, p.category].filter(Boolean).join(" · ");
  return (
    <main className="min-h-svh bg-cloud px-[var(--gutter)] pb-24 pt-8 text-ink">
      <nav aria-label="Volver" className="flex items-center justify-between">
        <Link href="/" className="inline-flex min-h-11 items-center text-lg font-bold">
          <Logo />
        </Link>
        <Link href="/#proyectos" className="inline-flex min-h-11 items-center text-sm font-medium uppercase tracking-wide hover:text-cobalt">
          ← Todos los proyectos
        </Link>
      </nav>

      <header className="mt-[clamp(3rem,10vh,7rem)] max-w-5xl">
        {meta && <p className="text-sm uppercase tracking-wide text-ink/70">{meta}</p>}
        <h1 className="mt-3 text-[clamp(2.6rem,8vw,7rem)] font-light uppercase leading-none tracking-[-0.04em] text-balance">{p.title}</h1>
        {p.summary && <p className="mt-6 max-w-2xl text-xl">{p.summary}</p>}
      </header>

      <figure className="relative mt-12 overflow-hidden rounded-3xl bg-ink/5" style={{ aspectRatio: p.cover.width && p.cover.height && p.cover.width > p.cover.height ? `${p.cover.width} / ${p.cover.height}` : "16 / 9" }}>
        {p.cover.kind === "video" ? (
          <CoverVideo src={p.cover.src} className="h-full w-full object-cover" />
        ) : (
          <Image src={p.cover.src} alt={p.cover.alt} fill priority sizes="100vw" className="object-cover" />
        )}
      </figure>

      {p.bodyHtml && (
        <div
          className="mt-12 max-w-2xl text-lg leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-cobalt [&_h2]:mt-12 [&_h2]:text-3xl [&_h2]:font-light [&_h2]:uppercase [&_h2]:tracking-tight [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-medium [&_li]:mt-2 [&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-5 [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6"
          // Texto de la Ficha de Drive, ya reducido a etiquetas seguras (src/lib/ficha.ts).
          dangerouslySetInnerHTML={{ __html: p.bodyHtml }}
        />
      )}

      {p.carousel.length > 0 && <ProjectCarousel items={p.carousel} title={p.title} />}

      {p.link && (
        <a href={p.link} target="_blank" rel="noreferrer" className="spring mt-12 inline-flex min-h-12 items-center rounded-full bg-cobalt px-6 font-medium text-cloud hover:bg-ink">
          Ver el proyecto
        </a>
      )}
    </main>
  );
}
