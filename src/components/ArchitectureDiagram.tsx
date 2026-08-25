import { useState } from 'react';
import {
  COMPONENTS,
  EDGES,
  VIEWBOX,
  type Component,
  type ComponentId,
} from '../data/architecture';
import type { DiagramLesson, DiagramStatus } from './diagram-types';
import ComponentPanel from './ComponentPanel';

const STATUS_LABEL: Record<DiagramStatus, string> = {
  done: 'done',
  'in-progress': 'in progress',
  locked: 'locked',
};

interface Props {
  statuses: Record<ComponentId, DiagramStatus>;
  lessons: DiagramLesson[];
}

/** Padlock, drawn rather than imported, so it inherits the locked colour. */
function Lock({ x, y }: { x: number; y: number }) {
  return (
    <g className="lock-glyph" transform={`translate(${x} ${y})`} aria-hidden="true">
      <path d="M 2.6 6.2 V 4.2 a 3.4 3.4 0 0 1 6.8 0 v 2" />
      <rect x="0.8" y="6.2" width="10.4" height="8.2" rx="1.8" />
    </g>
  );
}

function Node({
  component,
  status,
  lessons,
  selected,
  onSelect,
}: {
  component: Component;
  status: DiagramStatus;
  lessons: DiagramLesson[];
  selected: boolean;
  onSelect: () => void;
}) {
  const { x, y, w, h, label } = component;
  const done = lessons.filter((l) => l.status === 'done').length;
  const meta =
    done > 0
      ? `${done}/${lessons.length} done`
      : `${lessons.length} lesson${lessons.length === 1 ? '' : 's'}`;

  return (
    <g
      className="node"
      data-status={status}
      data-selected={selected}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${label} — ${STATUS_LABEL[status]}, ${lessons.length} lesson${
        lessons.length === 1 ? '' : 's'
      }`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <rect className="node-box" x={x} y={y} width={w} height={h} rx={8} />
      <circle className="node-accent" cx={x + 16} cy={y + 26} r={4.5} />
      <text className="node-label" x={x + 28} y={y + 31}>
        {label}
      </text>
      <text className="node-meta" x={x + 28} y={y + 51}>
        {meta}
      </text>
      {status === 'locked' && <Lock x={x + w - 26} y={y + h - 26} />}
    </g>
  );
}

export default function ArchitectureDiagram({ statuses, lessons }: Props) {
  const [selected, setSelected] = useState<ComponentId | null>(null);

  const selectedComponent = COMPONENTS.find((c) => c.id === selected) ?? null;
  const lessonsFor = (id: ComponentId) => lessons.filter((l) => l.component === id);

  return (
    <div className="diagram-shell">
      <div
        className="diagram-frame"
        onKeyDown={(event) => {
          if (event.key === 'Escape') setSelected(null);
        }}
      >
        {/*
          No role="img" here: that would make every descendant presentational and
          hide the focusable nodes from assistive tech. <title>/<desc> plus real
          role="button" children keeps both the overview and the interaction.
        */}
        <svg
          className="arch-svg"
          viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
          aria-labelledby="arch-title arch-desc"
        >
          <title id="arch-title">Tiny Agents architecture, with learning progress</title>
          <desc id="arch-desc">
            Twelve components of a small coding agent. A request flows from the user into the agent
            loop, which consults the model and calls tools; tools search code, edit files and run
            the environment, whose output feeds back into the loop. Each component is a button that
            lists the lessons covering it, and shows a padlock until those lessons are written.
          </desc>

          <defs>
            <marker
              id="arch-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-hi)" />
            </marker>
          </defs>

          <g aria-hidden="true">
            {EDGES.map((edge) => (
              <path
                key={`${edge.from}-${edge.to}`}
                className={`edge${edge.dashed ? ' dashed' : ''}`}
                d={edge.d}
                markerEnd="url(#arch-arrow)"
              />
            ))}
            {EDGES.filter((e) => e.label && e.labelAt).map((edge) => (
              <text
                key={`label-${edge.from}-${edge.to}`}
                className="edge-label"
                x={edge.labelAt!.x}
                y={edge.labelAt!.y}
              >
                {edge.label}
              </text>
            ))}
            <path className="edge dashed" d="M 40 430 H 962" style={{ opacity: 0.4 }} />
            <text className="layer-caption" x={40} y={452}>
              Cross-cutting — studied alongside everything above
            </text>
          </g>

          {COMPONENTS.map((component) => (
            <Node
              key={component.id}
              component={component}
              status={statuses[component.id]}
              lessons={lessonsFor(component.id)}
              selected={selected === component.id}
              onSelect={() => setSelected(selected === component.id ? null : component.id)}
            />
          ))}
        </svg>
      </div>

      <ComponentPanel
        component={selectedComponent}
        status={selected ? statuses[selected] : 'locked'}
        lessons={selected ? lessonsFor(selected) : []}
      />
    </div>
  );
}
