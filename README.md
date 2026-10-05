# charlymx.com

Sitio personal de Charly. Está hecho con **Astro**, se administra con **Pages CMS** y se publica en **Cloudflare Pages**.

## 1. Subir a GitHub
1. Crea un repositorio nuevo en GitHub (por ejemplo `charlymx-sitio`).
2. Sube el contenido de esta carpeta a la raíz del repositorio. Desde GitHub web, usa "Add file → Upload files" y arrastra todo, incluidos `.pages.yml` y `.gitignore`.

## 2. Publicar en Cloudflare Pages
1. En Cloudflare, ve a **Workers & Pages → Create → Pages → Connect to Git** y elige el repositorio.
2. Configura la compilación:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Variable de entorno: `NODE_VERSION` = `20`
3. Cuando termine, ve a **Custom domains** y agrega `charlymx.com` y `www.charlymx.com`. Como el dominio ya está en Cloudflare, el DNS se configura solo.
4. `buenasnoticias.charlymx.com` no se toca: es otro proyecto.

## 3. Administrar con Pages CMS
1. Entra a **https://app.pagescms.org**, inicia sesión con GitHub y abre el repositorio.
2. Verás estas secciones:
   - **Blog:** artículos nuevos. Quedan como *Borrador* hasta que apagues ese interruptor. Categorías: Mi fé, IA, NFL, Flag football, Fútbol.
   - **Proyectos:** nombre, descripción, estado, enlace y logo. "Prototipo" e "Idea" aparecen en *En el laboratorio*.
   - **Inicio:** titular, presentación, el mazo de fotos (foto, encuadre, etiqueta y pie) y si se muestra la sección de los Broncos.
   - **Sobre mí:** bio, fotos y tarjetas de "Lo que me mueve".
   - **Ajustes del sitio:** WhatsApp, mensaje inicial y redes.
3. Cada vez que guardas, Cloudflare vuelve a publicar el sitio en 1 o 2 minutos.

El archivo `src/content/blog/2026-10-05-ejemplo-borrador.md` es un borrador de ejemplo que no se publica. Puedes borrarlo cuando escribas tu primer artículo.

## Sección de los Broncos
Los resultados y el calendario se cargan en vivo desde la API pública de ESPN, en hora de Monterrey. Si la API falla, la sección se oculta sola. Para seguir a otro equipo, cambia "Equipo NFL" en Ajustes (por ejemplo `kc`, `dal`).

## Trabajar en tu computadora (opcional)
```
npm install
npm run dev      # http://localhost:4321
npm run build    # genera /dist
```
