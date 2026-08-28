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

/**
 * One reading pointer: a library source plus the exact place inside it.
 *
 * `at` is required, and that is the point of the format. A pointer that names
 * only a source ("read Anthropic's post") makes the reader do the finding, which
 * is the work this course is supposed to have already done.
 */
const readingPointer = z.object({
  source: z.string(),
  /**
   * The place to read, and the only text rendered for this pointer. It must name
   * its own source as well as the section, because nothing else on the page
   * says which source a link belongs to.
   */
  at: z.string().min(1, 'a pointer must name the source and the section, file or chapter'),
  /** `#anchor` on the source's page, `/path` appended to it, or an absolute URL. */
  href: z
    .string()
    .regex(/^(#|\/|https?:\/\/)/, 'href must start with "#", "/" or "https://"')
    .optional(),
});

/**
 * A key point: one paragraph of our own writing, then where to read about it.
 *
 * The summary is capped at a paragraph, because this course indexes other
 * people's writing rather than replacing it. There is a floor as well as a
 * ceiling: STYLE.md asks a summary to say what the thing is, how it works and
 * what follows from it, and a couple of sentences cannot do that. Too short
 * usually means a conclusion was asserted instead of explained.
 */
const keyPoint = z.object({
  heading: z.string().min(1),
  summary: z
    .string()
    .min(1)
    .max(900, 'a point summary is one paragraph — split it, or point harder'),
  reading: z.array(readingPointer).min(1, 'a point with no reading is just an opinion'),
});

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

      /**
       * One or two sentences of orientation, above the points.
       *
       * This lives in frontmatter rather than in the Markdown body because the
       * body is reserved for hand-written notes. Keep it short: the takeaway
       * callout above it already says what the lesson is for.
       */
      intro: z.string().max(320, 'the intro is one or two sentences — the points carry the lesson').optional(),

      /**
       * The lesson itself: key points, each with its reading. The Sources list is
       * derived from these, so there is no separate `sources` field to keep in
       * step with them.
       */
      points: z.array(keyPoint).default([]),

      /** Onward reading, deliberately not pointed at from any single point. */
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
      // A finished summary has to explain a mechanism, and a couple of sentences
      // cannot — see STYLE.md. Outlines are exempt on purpose: at that stage a
      // summary is a placeholder line, and the review is about whether the
      // coverage and the sources are right. See LESSONS.md.
      if (!lesson.outline && lesson.status !== 'locked') {
        lesson.points.forEach((point, i) => {
          if (point.summary.length < 220) {
            ctx.addIssue({
              code: 'custom',
              path: ['points', i, 'summary'],
              input: point.summary,
              message:
                `summary is ${point.summary.length} characters — a finished point explains the ` +
                `mechanism (min 220). Set \`outline: true\` if it is not finished yet.`,
            });
          }
        });
      }

      if (lesson.status !== 'locked' && lesson.points.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['points'],
          input: lesson.points,
          message: `a lesson with status "${lesson.status}" must have at least one key point`,
        });
      }

      // Everything pointed at lives in the shared library — that is what makes a
      // rotted link a one-line fix rather than a hunt through 36 lessons.
      lesson.points.forEach((point, i) => {
        point.reading.forEach((pointer, j) => {
          if (!isKnownSourceId(pointer.source)) {
            ctx.addIssue({
              code: 'custom',
              path: ['points', i, 'reading', j, 'source'],
              input: pointer.source,
              message: `unknown source key "${pointer.source}" — add it to src/data/library.ts`,
            });
          }
        });
      });

      for (const key of unknownKeys(lesson.extraReading)) {
        ctx.addIssue({
          code: 'custom',
          path: ['extraReading'],
          input: key,
          message: `unknown source key "${key}" — add it to src/data/library.ts or inline the source`,
        });
      }
    }),
});

export const collections = { lessons };
