import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { COMPONENTS, type ComponentId } from './architecture';

export type Status = 'done' | 'in-progress' | 'locked';
export type Lesson = CollectionEntry<'lessons'>;

export interface ComponentProgress {
  id: ComponentId;
  status: Status;
  lessons: Lesson[];
  done: number;
  total: number;
}

export interface Progress {
  /** Lessons in curriculum order. */
  lessons: Lesson[];
  /** Lessons grouped by part, in first-appearance order. */
  parts: Array<{ part: string; lessons: Lesson[] }>;
  byComponent: Record<ComponentId, ComponentProgress>;
  totals: {
    lessons: number;
    lessonsDone: number;
    lessonsStarted: number;
    components: number;
    componentsLive: number;
  };
}

export const STATUS_LABEL: Record<Status, string> = {
  done: 'done',
  'in-progress': 'in progress',
  locked: 'locked',
};

/**
 * A component is `done` only when all of its lessons are; `in-progress` if any
 * lesson has been started. Derived rather than stored, so the diagram can never
 * disagree with the lesson files.
 */
function statusFor(lessons: Lesson[]): Status {
  if (lessons.length === 0) return 'locked';
  if (lessons.every((l) => l.data.status === 'done')) return 'done';
  if (lessons.some((l) => l.data.status !== 'locked')) return 'in-progress';
  return 'locked';
}

export async function getProgress(): Promise<Progress> {
  const lessons = (await getCollection('lessons')).sort((a, b) => a.data.n - b.data.n);

  const byComponent = {} as Record<ComponentId, ComponentProgress>;
  for (const component of COMPONENTS) {
    const mine = lessons.filter((l) => l.data.component === component.id);
    byComponent[component.id] = {
      id: component.id,
      status: statusFor(mine),
      lessons: mine,
      done: mine.filter((l) => l.data.status === 'done').length,
      total: mine.length,
    };
  }

  const parts: Progress['parts'] = [];
  for (const lesson of lessons) {
    let group = parts.find((p) => p.part === lesson.data.part);
    if (!group) {
      group = { part: lesson.data.part, lessons: [] };
      parts.push(group);
    }
    group.lessons.push(lesson);
  }

  return {
    lessons,
    parts,
    byComponent,
    totals: {
      lessons: lessons.length,
      lessonsDone: lessons.filter((l) => l.data.status === 'done').length,
      lessonsStarted: lessons.filter((l) => l.data.status !== 'locked').length,
      components: COMPONENTS.length,
      componentsLive: Object.values(byComponent).filter((c) => c.status === 'done').length,
    },
  };
}

/** Plain-object view of the diagram status, safe to pass to the React island. */
export function statusMap(progress: Progress): Record<ComponentId, Status> {
  const out = {} as Record<ComponentId, Status>;
  for (const c of COMPONENTS) out[c.id] = progress.byComponent[c.id].status;
  return out;
}
