import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Política de cookies · 2894_ Studio" };

// Art. 22.2 LSSI-CE y guía de cookies de la AEPD: sin cookies que no sean técnicas no hace falta pedir consentimiento.
export default function Cookies() {
  return (
    <LegalPage title="Cookies">
      <h2>Esta web no usa cookies de seguimiento</h2>
      <p>
        No usamos cookies propias ni de terceros con fines analíticos, publicitarios o de personalización, y no guardamos nada en tu navegador para seguir tu actividad. Por eso no te mostramos un aviso para aceptarlas.
      </p>
      <p>
        Para que la web funcione, el navegador descarga imágenes y vídeos desde los servidores de Google y la web se sirve desde Vercel. Son peticiones técnicas necesarias para mostrar el contenido y no se usan para identificarte.
      </p>

      <h2>Si esto cambia</h2>
      <p>
        Si en el futuro añadimos medición de visitas u otras herramientas que usen cookies no necesarias, actualizaremos esta página y te pediremos permiso antes de activarlas, con la opción de rechazarlas tan fácil como aceptarlas.
      </p>

      <h2>Cómo borrar o bloquear cookies</h2>
      <p>Puedes borrar o bloquear las cookies desde la configuración de tu navegador (Chrome, Safari, Firefox o Edge).</p>
    </LegalPage>
  );
}
