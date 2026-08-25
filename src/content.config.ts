import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

/**
 * Frontmatter is the contract between lesson content and the homepage diagram.
 * Both enums are closed on purpose: a typo in `status` or `component` should
 * fail the build rather than silently render a node as locked.
 */
export const STATUSES = ['done', 'in-progress', 'locked'] as const;

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lessons' }),
  schema: z.object({
    n: z.number().int().min(1).max(36),
    title: z.string(),
    part: z.string(),
    component: z.enum([
      'overview',
      'loop',
      'model',
      'tools',
      'retrieval',
      'edit',
      'environment',
      'guardrails',
      'context',
      'orchestration',
      'tracing',
      'eval',
    ]),
    status: z.enum(STATUSES),
    takeaway: z.string(),
  }),
});

export const collections = { lessons };
