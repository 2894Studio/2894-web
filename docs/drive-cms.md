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

## 3. Conexión (una sola vez)

1. Entra en https://console.cloud.google.com con la cuenta del estudio y crea un proyecto (por ejemplo, `2894-web`).
2. **APIs y servicios → Biblioteca** → busca **Google Drive API** → **Habilitar**.
3. **IAM y administración → Cuentas de servicio → Crear cuenta de servicio** (nombre: `web`). No hace falta darle roles.
4. Abre la cuenta creada → **Claves → Agregar clave → Crear clave nueva → JSON**. Se descarga un archivo `.json`: guárdalo en un sitio seguro y no lo compartas.
5. En Drive, comparte la carpeta `2894_ Proyectos` con el email de la cuenta de servicio (termina en `iam.gserviceaccount.com`) como **Lector**.
6. En Vercel → proyecto **2894-web** → **Settings → Environment Variables**, añade (para Production y Preview):
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: el contenido completo del archivo `.json`.
   - `DRIVE_PROJECTS_FOLDER_ID`: el id de la carpeta (lo que va después de `/folders/` en su dirección).
   - `REVALIDATE_SECRET`: una palabra larga inventada (para el enlace "Publicar cambios").
7. Vuelve a desplegar (Deployments → ⋯ → Redeploy).

Mientras no estén estas variables, la web muestra los proyectos de ejemplo.
