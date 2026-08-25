import type { Component } from '../data/architecture';
import type { DiagramLesson, DiagramStatus } from './diagram-types';
import { href } from '../lib/href';

const STATUS_LABEL: Record<DiagramStatus, string> = {
  done: 'done',
  'in-progress': 'in progress',
  locked: 'locked',
};

interface Props {
  component: Component | null;
  status: DiagramStatus;
  lessons: DiagramLesson[];
}

export default function ComponentPanel({ component, status, lessons }: Props) {
  if (!component) {
    return (
      <aside className="panel" aria-live="polite">
        <h3>No component selected</h3>
        <p className="panel-empty">
          Pick a box in the diagram to see which lessons cover it. Locked boxes are parts of the
          architecture that haven&rsquo;t been studied yet.
        </p>
      </aside>
    );
  }

  const done = lessons.filter((l) => l.status === 'done').length;

  return (
    <aside className="panel" aria-live="polite">
      <h3>
        {component.label}
        <span className={`chip st-${status}`}>{STATUS_LABEL[status]}</span>
      </h3>
      <p className="blurb">{component.blurb}</p>
      <p className="blurb mono" style={{ fontSize: '0.78rem' }}>
        {done} / {lessons.length} lessons written
      </p>
      <ul className="panel-lessons">
        {lessons.map((lesson) => (
          <li key={lesson.slug}>
            <a href={href(`/lessons/${lesson.slug}/`)}>
              <span className={`dot st-${lesson.status}`} aria-hidden="true" />
              <span className="num">{String(lesson.n).padStart(2, '0')}</span>
              <span>{lesson.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
