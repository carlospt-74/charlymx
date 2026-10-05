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

## Modo oscuro
Paleta "Tinta cálida": negro cálido y fotos con marco crema. La primera vez sigue la preferencia del celular o la computadora. El botón redondo del encabezado lo cambia, y la elección se recuerda. Los colores están en `src/styles/global.css`, en el bloque `html[data-theme=dark]`.

## Mis equipos (Broncos, Rayados y los que agregues)
- Se editan en Pages CMS → **Mis equipos**. Cada equipo tiene liga (NFL, Liga MX, MLB, LMB, LMP o Tocho), nombre, abreviatura, ID de ESPN (opcional), escudo, colores, diseño de la franja y dirección de su página.
- En el Inicio aparece una tarjeta por equipo, y cada uno tiene su página: `/nfl/` y `/liga-mx/`, o la dirección que le pongas.
- Si agregas o cambias un equipo, Cloudflare vuelve a publicar el sitio y se crea su página.

- **LMB (Liga Mexicana de Béisbol)** usa la API pública de estadísticas de MLB (`statsapi.mlb.com`, la que alimenta a MiLB.com), no ESPN. El ID del equipo es su número en esa API (Sultanes = `562`; liga 125, categoría 23). Muestra resultados, próximos partidos (incluye playoffs) y la tabla de su zona.
- **MLB** usa la misma API de ESPN (`baseball/mlb`); el ID es la abreviatura en minúsculas (Bravos = `atl`). En su página se muestran los últimos 10 resultados.

### De dónde salen los datos
- **ESPN** (NFL, Liga MX, MLB) y **MLB Stats API** (LMB y LMP). Las dos son públicas, no oficiales y sin llave.
Todos los datos vienen de la API pública de ESPN, la misma para la NFL y para la Liga MX. Se consultan desde el navegador y no requieren llave.
- **Calendario y resultados:** `https://site.api.espn.com/apis/site/v2/sports/{liga}/teams/{equipo}/schedule`. En futbol, los próximos partidos se piden aparte con `?fixture=true`.
- **Tablas:** `https://site.api.espn.com/apis/v2/sports/{liga}/standings`.
- **Lista de equipos** (para encontrar el ID): `https://site.api.espn.com/apis/site/v2/sports/{liga}/teams`.
- **Liga:** `football/nfl` para la NFL, `soccer/mex.1` para la Liga MX y `baseball/mlb` para la MLB.
- Si el ID de ESPN de un equipo de Liga MX se deja vacío, el sitio lo busca solo por la abreviatura (MTY) o el nombre.
- Es una API pública pero no oficial: ESPN podría cambiar su formato. Si eso pasa, solo hay que ajustar `src/lib/sports.ts`. Mientras tanto, las tarjetas muestran un aviso y el resto del sitio sigue funcionando.

## Imágenes ligeras
- Las fotos del sitio ya están en **WebP**: pasaron de unos 1.7 MB en total a unos 160 KB.
- Para fotos nuevas, usa **WebP** de máximo 1200–1600 px de ancho (puedes convertirlas gratis en squoosh.app). Para logos y escudos, usa **SVG** o un WebP cuadrado de menos de 50 KB.
- Pages CMS muestra este recordatorio en cada campo de imagen.

## Trabajar en tu computadora (opcional)
```
npm install
npm run dev      # http://localhost:4321
npm run build    # genera /dist
```

- **Tocho (Sportwey)** usa `api.sportwey.com` (la que alimenta app.sportwey.com). En el campo "ID del equipo" va el ID del torneo; la tabla se calcula con los resultados publicados.
