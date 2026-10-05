import ajustes from '../data/ajustes.json';
import { getCollection } from 'astro:content';

export const waLink = () =>
  `https://wa.me/${ajustes.whatsapp}?text=${encodeURIComponent(ajustes.whatsapp_message || '')}`;

export const socials = () =>
  [
    { name: 'Facebook', url: ajustes.facebook, handle: handle(ajustes.facebook) },
    { name: 'Instagram', url: ajustes.instagram, handle: '@' + handle(ajustes.instagram) },
    { name: 'X', url: ajustes.x, handle: '@' + handle(ajustes.x) },
    { name: 'LinkedIn', url: ajustes.linkedin, handle: '/in/' + handle(ajustes.linkedin) },
  ].filter((s) => s.url);

function handle(url = '') {
  return url.replace(/\/+$/, '').split('/').pop() || '';
}

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const readingTime = (body = '') => Math.max(1, Math.round(body.split(/\s+/).length / 200));

export async function getPosts() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getProjects() {
  const p = await getCollection('proyectos');
  return p.sort((a, b) => a.data.order - b.data.order);
}
