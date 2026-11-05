# Proyectos desde Google Drive

La web lee los proyectos de una carpeta de Google Drive. Para añadir o cambiar un proyecto no hace falta tocar código.

## 1. Cómo se organiza la carpeta

```
2894_ Proyectos/                    ← carpeta raíz
  01 Dproma/                        ← una carpeta por proyecto; el número es el orden en la web
    Ficha                           ← Google Doc con los datos y el texto
    portada.jpg  (o portada.mp4)    ← la portada que eliges (imagen o vídeo)
    02.jpg, 03.jpg, video.mp4 …     ← resto de fotos y vídeos (se ordenan por nombre)
    Carrusel/                       ← opcional: sus fotos forman el carrusel bajo el texto
  02 Scamper/
  _Borrador nuevo/                  ← lo que empieza por "_" no se publica
```

- **Nombre de la carpeta**: `NN Nombre`. El número ordena los proyectos; el nombre da la dirección de la página (`01 Site de Ideación` → `/proyectos/site-de-ideacion`).
- **Portada**: el archivo llamado `portada` (con cualquier extensión). Si no hay, se usa la primera foto; si el proyecto solo tiene vídeo, el primer vídeo.
- **En la esfera**: al pasar el ratón por un proyecto se suceden todas sus fotos (las de la carpeta, no las del carrusel) como un vídeo. Si la portada es un vídeo, o el proyecto solo tiene vídeo, al pasar el ratón se reproduce sin sonido.
- **Carrusel**: solo aparece en la página del proyecto y solo si existe la subcarpeta `Carrusel`.
- **Formatos**: fotos JPG/PNG/WebP; vídeos MP4 (H.264), mejor en 1080p y por debajo de 50 MB.

### La Ficha (Google Doc)

```
Título: Dproma
Categoría: Research
Cliente: DPROMA
Año: 2025
Resumen: Una o dos frases. Es la reseña que aparece al seleccionar el proyecto en la esfera.
Enlace: https://… (opcional)
---
A partir de esta línea, el texto del proyecto. Se respetan los títulos, la negrita, la cursiva,
las listas y los enlaces del documento.
```

Todos los campos son opcionales; sin Ficha, el título es el nombre de la carpeta.

## 2. Ver los cambios en la web

La web vuelve a leer Drive sola cada hora. Para verlos al momento, abre (y guarda como marcador "Publicar cambios"):

`https://<dominio>/api/revalidate?secret=<REVALIDATE_SECRET>`

## 3. Conexión (una sola vez, sin Google Cloud ni tarjeta)

La web lee Drive con un **Apps Script**: un pequeño programa gratuito que se publica con la misma cuenta de Gmail del estudio.

1. Entra en https://script.google.com con la cuenta del estudio → **Proyecto nuevo**. Ponle de nombre `2894_ web`.
2. Borra lo que haya y pega el contenido de `docs/drive-apps-script.gs` (en la carpeta de Drive hay un documento "Script de conexión" con la clave y el id ya rellenados).
3. Arriba, elige la función **probar** → **Ejecutar**. La primera vez Google pide permiso para leer tu Drive: **Revisar permisos** → tu cuenta → *Configuración avanzada* → *Ir a 2894_ web* → **Permitir**. En el registro debe salir la lista de proyectos.
4. **Implementar → Nueva implementación** → tipo **Aplicación web** → *Ejecutar como*: **yo** · *Quién tiene acceso*: **Cualquier usuario** → **Implementar**. Copia la **URL de la aplicación web** (termina en `/exec`).
5. En Vercel → proyecto **2894-web** → **Settings → Environment Variables**, añade (Production y Preview):
   - `DRIVE_SCRIPT_URL`: la URL del paso 4.
   - `DRIVE_SCRIPT_KEY`: la clave que aparece en el script (`KEY`).
   - `REVALIDATE_SECRET`: una palabra larga inventada (para el enlace "Publicar cambios").
6. Vuelve a desplegar (Deployments → ⋯ → Redeploy).

**Privacidad:** la carpeta sigue privada. El script comparte "por enlace" solo las fotos y vídeos de los proyectos publicados (para que la web pueda mostrarlos); las Fichas y las carpetas que empiezan por `_` no se comparten. Si pasas un proyecto a borrador, sus fotos ya compartidas siguen accesibles con su enlace (imposible de adivinar); para retirarlas del todo, quita el permiso "cualquiera con el enlace" en Drive.

**Si cambias el script** (o la clave): Implementar → Gestionar implementaciones → editar → *Nueva versión*. La URL no cambia.

Mientras no estén estas variables, la web muestra los proyectos de ejemplo.
