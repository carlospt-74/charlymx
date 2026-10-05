# charlymx

Portal personal de CharlyMx, publicado en https://charlymx.com con Cloudflare Workers (static assets).

- `public/index.html`: página de "En construcción".
- `wrangler.jsonc`: configuración del Worker y dominios personalizados.
- `mockups/`: propuestas de diseño del portal.

## Despliegue

Cada push a la rama configurada en Cloudflare (Settings → Builds → Branch control) construye y publica el sitio con Workers Builds. El build usa el token `charlymx build token`.
