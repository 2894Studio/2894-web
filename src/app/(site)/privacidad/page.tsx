import type { Metadata } from "next";
import { LegalPage, OwnerBlock } from "@/components/legal/LegalPage";
import { studio } from "@/content/site";

export const metadata: Metadata = { title: "Política de privacidad · 2894_ Studio" };

// Información del Reglamento (UE) 2016/679 (RGPD), arts. 13 y 14, y de la Ley Orgánica 3/2018 (LOPDGDD).
export default function Privacidad() {
  return (
    <LegalPage title="Privacidad">
      <h2>Responsable</h2>
      <OwnerBlock />

      <h2>Qué datos tratamos</h2>
      <p>
        Esta web no tiene formularios ni crea cuentas de usuario. Solo tratamos los datos que nos envías al escribirnos por correo o por WhatsApp: tu nombre, tus datos de contacto, la empresa y lo que nos cuentes sobre tu proyecto.
      </p>
      <p>
        Al visitar la web, el proveedor de alojamiento (Vercel) registra de forma técnica la dirección IP y el navegador para servir las páginas y protegerlas frente a ataques. No usamos esos datos para identificarte ni para hacer perfiles.
      </p>

      <h2>Para qué y con qué base legal</h2>
      <ul>
        <li>Responder a tu mensaje y preparar una propuesta: aplicación de medidas precontractuales a petición tuya (art. 6.1.b RGPD).</li>
        <li>Mantener la relación profesional si trabajamos juntos: ejecución del contrato (art. 6.1.b RGPD).</li>
        <li>Seguridad y funcionamiento de la web: interés legítimo (art. 6.1.f RGPD).</li>
      </ul>

      <h2>Cuánto tiempo los guardamos</h2>
      <p>Mientras dure la conversación o la relación profesional y, después, durante los plazos que exige la ley (por ejemplo, fiscales). Los registros técnicos del alojamiento se borran de forma automática en pocos días.</p>

      <h2>Quién más puede verlos</h2>
      <p>
        No cedemos tus datos a terceros salvo obligación legal. Usamos proveedores que los tratan por cuenta nuestra: Vercel (alojamiento de la web), Google (correo y almacenamiento de las imágenes y vídeos de la web) y WhatsApp/Meta si nos escribes por esa vía. Algunos están en Estados Unidos y se acogen al Marco de Privacidad de Datos UE-EE. UU. o a cláusulas contractuales tipo de la Comisión Europea.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad de tus datos escribiendo a <a href={`mailto:${studio.email}`}>{studio.email}</a>. Si crees que no hemos atendido bien tu petición, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noreferrer">aepd.es</a>).
      </p>
    </LegalPage>
  );
}
