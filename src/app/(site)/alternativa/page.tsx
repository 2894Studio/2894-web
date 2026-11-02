import { redirect } from "next/navigation";

// La versión alternativa pasó a ser la portada: los enlaces antiguos llevan al inicio.
export default function Alternativa() {
  redirect("/");
}
