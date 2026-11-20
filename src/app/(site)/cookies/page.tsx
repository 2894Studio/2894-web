import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Política de cookies · 2894_ Studio" };

// Art. 22.2 LSSI-CE y guía de cookies de la AEPD: sin cookies que no sean técnicas no hace falta pedir consentimiento.
export default function Cookies() {
  return (
    <LegalPage title="Cookies">
      <h2>Esta web no usa cookies</h2>
      <p>
        No usamos cookies propias ni de terceros, ni guardamos nada en tu navegador para seguirte o identificarte. Por eso no te mostramos un aviso para aceptarlas.
      </p>

      <h2>Medimos las visitas sin cookies</h2>
      <p>
        Para saber cuántas personas visitan la web y qué secciones interesan más, usamos Vercel Web Analytics. Cuenta visitas y páginas vistas de forma agregada y anónima: no usa cookies, no almacena nada en tu dispositivo, no crea un perfil tuyo ni te sigue entre webs. Registramos también si se pulsa un botón concreto, como el de WhatsApp, el correo o la web de un proyecto, pero sin saber quién lo pulsa.
      </p>
      <p>
        Además, para mostrar el contenido, el navegador descarga imágenes y vídeos desde los servidores de Google y la web se sirve desde Vercel. Son peticiones técnicas necesarias y no se usan para identificarte.
      </p>

      <h2>Si esto cambia</h2>
      <p>
        Si en el futuro añadimos herramientas que usen cookies no necesarias (por ejemplo, publicidad o analítica con identificadores), actualizaremos esta página y te pediremos permiso antes de activarlas, con la opción de rechazarlas tan fácil como aceptarlas.
      </p>

      <h2>Cómo borrar o bloquear cookies</h2>
      <p>Puedes borrar o bloquear las cookies desde la configuración de tu navegador (Chrome, Safari, Firefox o Edge).</p>
    </LegalPage>
  );
}
