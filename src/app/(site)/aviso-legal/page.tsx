import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, OwnerBlock } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Aviso legal · 2894_ Studio" };

// Información exigida por la Ley 34/2002 (LSSI-CE), art. 10.
export default function AvisoLegal() {
  return (
    <LegalPage title="Aviso legal">
      <h2>Quién está detrás de esta web</h2>
      <OwnerBlock />
      <p>Actividad: consultoría, formación y desarrollo de herramientas de inteligencia artificial y diseño para empresas.</p>

      <h2>Uso de la web</h2>
      <p>Esta web presenta el estudio, sus servicios y algunos de sus proyectos. Al navegar por ella aceptas usarla de forma lícita y sin dañar su funcionamiento ni el de terceros.</p>

      <h2>Propiedad intelectual</h2>
      <p>
        Los textos, el diseño, el código, el logotipo 2894_ y los vídeos y fotografías de proyectos pertenecen al estudio o a sus clientes y colaboradores, que han autorizado su uso. No pueden reproducirse sin permiso. Las marcas y logotipos de clientes y colaboradores pertenecen a sus titulares y se muestran solo para identificar el trabajo realizado con ellos. Algunas imágenes de apoyo son de bancos de imágenes y se citan en “Créditos de imagen”.
      </p>

      <h2>Enlaces a otras webs</h2>
      <p>Algunos proyectos enlazan a webs externas. No somos responsables de su contenido ni de sus políticas de privacidad.</p>

      <h2>Responsabilidad</h2>
      <p>Cuidamos que la información sea correcta y esté actualizada, pero no garantizamos la ausencia de errores ni que la web esté disponible en todo momento.</p>

      <h2>Datos personales y cookies</h2>
      <p>
        Lo explicamos en la <Link href="/privacidad">política de privacidad</Link> y en la <Link href="/cookies">política de cookies</Link>.
      </p>

      <h2>Ley aplicable</h2>
      <p>Se aplica la legislación española. Para cualquier conflicto, y salvo que la ley disponga otra cosa, las partes se someten a los juzgados y tribunales de Madrid.</p>
    </LegalPage>
  );
}
