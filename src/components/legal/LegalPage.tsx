import Link from "next/link";
import { Logo } from "@/components/Logo";
import { legal, studio } from "@/content/site";

// Dato legal pendiente: se marca a la vista para no publicar nada inventado.
export const Pending = ({ value, label }: { value: string; label: string }) =>
  value ? <>{value}</> : <mark className="rounded bg-sky/40 px-1 text-ink">[pendiente: {label}]</mark>;

export const address = () => [legal.street, [legal.postalCode, legal.city].filter(Boolean).join(" "), "España"].filter(Boolean).join(", ");

export function OwnerBlock() {
  return (
    <ul className="mt-5 list-none space-y-1 pl-0">
      <li>
        <strong>Titular:</strong> <Pending value={legal.owner} label="razón social o nombre" />
      </li>
      <li>
        <strong>NIF:</strong> <Pending value={legal.taxId} label="NIF/CIF" />
      </li>
      <li>
        <strong>Domicilio:</strong> {legal.street ? address() : <Pending value="" label="calle, número y código postal" />}
      </li>
      <li>
        <strong>Correo:</strong> <a href={`mailto:${studio.email}`}>{studio.email}</a>
      </li>
      <li>
        <strong>Teléfono:</strong> <a href={`tel:${studio.phone.replace(/\s/g, "")}`}>{studio.phone}</a>
      </li>
      <li>
        <strong>Registro Mercantil:</strong> <Pending value={legal.registry} label="Registro Mercantil de Madrid, tomo, folio y hoja" />
      </li>
    </ul>
  );
}

// Página legal: misma cabecera que las páginas de proyecto, texto a una columna legible.
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-svh bg-cloud px-[var(--gutter)] pb-24 pt-8 text-ink">
      <nav aria-label="Volver" className="flex items-center justify-between">
        <Link href="/" className="inline-flex min-h-11 items-center text-lg font-bold">
          <Logo />
        </Link>
        <Link href="/#contacto" className="inline-flex min-h-11 items-center text-sm font-medium uppercase tracking-wide hover:text-cobalt">
          ← Volver a la web
        </Link>
      </nav>
      <article className="mt-[clamp(3rem,10vh,7rem)] max-w-2xl text-lg leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-cobalt [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-medium [&_li]:mt-2 [&_p]:mt-5 [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6">
        <h1 className="text-[clamp(2.4rem,7vw,5.5rem)] font-light uppercase leading-none tracking-[-0.04em]">{title}</h1>
        <p className="text-sm uppercase tracking-wide text-ink/70">Última actualización: {legal.updated}</p>
        {children}
      </article>
    </main>
  );
}
