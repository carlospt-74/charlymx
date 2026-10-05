import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

import { CATEGORIES } from './lib/constants';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().nullish(),
    category: z.enum(CATEGORIES),
    tags: z.array(z.string()).nullish().transform((v) => v ?? []),
    date: z.coerce.date(),
    cover: z.string().nullish(),
    featured: z.boolean().nullish().transform((v) => !!v),
    draft: z.boolean().nullish().transform((v) => !!v),
  }),
});

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/proyectos' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    status: z.enum(['En vivo', 'Recién lanzado', 'Prototipo', 'Idea']),
    url: z.string().nullish(),
    image: z.string().nullish(),
    image_bg: z.string().nullish(),
    featured: z.boolean().nullish().transform((v) => v !== false),
    order: z.number().nullish().transform((v) => v ?? 99),
  }),
});

export const collections = { blog, proyectos };
