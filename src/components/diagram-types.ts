import type { ComponentId } from '../data/architecture';

export type DiagramStatus = 'done' | 'in-progress' | 'locked';

/** Slim, serialisable view of a lesson — the island only needs these fields. */
export interface DiagramLesson {
  n: number;
  slug: string;
  title: string;
  status: DiagramStatus;
  component: ComponentId;
}
