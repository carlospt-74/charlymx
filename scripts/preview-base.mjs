// Ajusta el sitio compilado para publicarlo en una subcarpeta (por ejemplo GitHub Pages:
// https://<usuario>.github.io/charlymx/). Uso: node scripts/preview-base.mjs /charlymx
// Solo se usa para la vista previa. El sitio real de charlymx.com no pasa por aquí.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.argv[2] || '').replace(/\/+$/, '');
const dir = process.argv[3] || 'dist';
if (!base.startsWith('/')) {
  console.error('Uso: node scripts/preview-base.mjs /subcarpeta [dist]');
  process.exit(1);
}

let files = 0;
const walk = (d) => {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html')) {
      const html = readFileSync(p, 'utf8')
        .replace(/\b(href|src)="\/(?!\/)/g, `$1="${base}/`)
        .replace('<head>', '<head><meta name="robots" content="noindex">');
      writeFileSync(p, html);
      files++;
    }
  }
};
walk(dir);
console.log(`Vista previa: ${files} páginas ajustadas a ${base}/`);
