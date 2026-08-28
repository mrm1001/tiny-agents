import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';
import { isKnownSourceId } from './data/library';

/**
 * Frontmatter is the contract between lesson content and the homepage diagram.
 * The enums are closed on purpose: a typo in `status` or `component` should fail
 * the build rather than silently render a node as locked.
 *
 * Note that Zod's `z.object` STRIPS unknown keys silently — so any new field must
 * be added here or it is quietly dropped rather than erroring.
 */
export const STATUSES = ['done', 'in-progress', 'locked'] as const;

const SOURCE_KINDS = ['post', 'docs', 'paper', 'thread', 'newsletter', 'repo', 'book'] as const;

/** The twelve architecture components — used for a lesson's own component and,
 *  on a source, for what that source is about. See Topic in src/data/library.ts. */
const COMPONENT_IDS = [
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
] as const;

/** A source supplied inline, for one-offs that don't belong in the shared library. */
const inlineSource = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'source id must be lower-case kebab-case'),
  title: z.string(),
  // z.url(), not z.string().url() — the latter is deprecated in Zod 4.
  url: z.url(),
  author: z.string().optional(),
  site: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'date must be YYYY, YYYY-MM or YYYY-MM-DD')
    .optional(),
  kind: z.enum(SOURCE_KINDS).default('post'),
  topics: z.array(z.enum(COMPONENT_IDS)).default([]),
  note: z.string().optional(),
});

/** Either a key into src/data/library.ts, or a full inline source. */
const sourceRef = z.union([z.string(), inlineSource]);

/** Collect unresolvable library keys so they can be reported with a real path. */
function unknownKeys(refs: Array<z.infer<typeof sourceRef>>): string[] {
  return refs.filter((r): r is string => typeof r === 'string').filter((r) => !isKnownSourceId(r));
}

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lessons' }),
  schema: z
    .object({
      n: z.number().int().min(1).max(36),
      title: z.string(),
      part: z.string(),
      component: z.enum(COMPONENT_IDS),
      status: z.enum(STATUSES),
      takeaway: z.string(),

      /** What the lesson is written from. Library keys or inline sources. */
      sources: z.array(sourceRef).default([]),
      /** Optional onward reading, rendered under its own heading. */
      extraReading: z.array(sourceRef).default([]),

      /**
       * Placeholder stage: the body is a bulleted outline of what will be covered,
       * not finished prose. Exempts the lesson from the reading-time budget and
       * renders a note on the page saying so.
       */
      outline: z.boolean().default(false),

      /** A runnable exercise in the repo, and the trace recording it produces. */
      exercise: z
        .object({
          dir: z.string(),
          command: z.string(),
          trace: z.string().optional(),
        })
        .optional(),
    })
    // Issues MUST carry a `path`. Astro derives the reported line from
    // `issue.path[0]`; with an empty path it prints "**:" and points at line 0.
    .superRefine((lesson, ctx) => {
      if (lesson.status !== 'locked' && lesson.sources.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['sources'],
          input: lesson.sources,
          message: `a lesson with status "${lesson.status}" must cite at least one source`,
        });
      }

      for (const [field, refs] of [
        ['sources', lesson.sources],
        ['extraReading', lesson.extraReading],
      ] as const) {
        for (const key of unknownKeys(refs)) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            input: key,
            message: `unknown source key "${key}" — add it to src/data/library.ts or inline the source`,
          });
        }
      }
    }),
});

export const collections = { lessons };
