import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getProject, getProjects } from "@/lib/projects";

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProject((await params).slug);
  return p ? { title: `${p.title} · 2894_ Studio`, description: p.summary } : {};
}

// Página de caso: portada, datos, texto y galería (imágenes y vídeos), todo editable desde /studio.
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProject((await params).slug);
  if (!p) notFound();
  const meta = [p.client, p.year, ...p.categories].filter(Boolean).join(" · ");
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

      <figure className="mt-12 overflow-hidden rounded-3xl bg-ink/5">
        {p.video ? (
          <video src={p.video} poster={p.cover.url} controls playsInline className="aspect-video w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover.url} alt={p.cover.alt} className="aspect-[16/9] w-full object-cover" />
        )}
      </figure>

      {p.body.length > 0 && (
        <div className="mt-12 max-w-2xl space-y-5 text-lg leading-relaxed">
          {p.body.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </div>
      )}

      {p.gallery.length > 0 && (
        <section aria-label="Galería" className="mt-16 grid gap-4 sm:grid-cols-2">
          {p.gallery.map((m, i) =>
            m.type === "video" ? (
              <video key={i} src={m.url} controls playsInline className="aspect-video w-full rounded-2xl object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={m.url} alt={m.alt ?? ""} loading="lazy" className="w-full rounded-2xl object-cover" />
            ),
          )}
        </section>
      )}

      {p.link && (
        <a href={p.link} target="_blank" rel="noreferrer" className="spring mt-12 inline-flex min-h-12 items-center rounded-full bg-cobalt px-6 font-medium text-cloud hover:bg-ink">
          Ver el proyecto
        </a>
      )}
    </main>
  );
}
