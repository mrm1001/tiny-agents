/**
 * Single source of truth for the homepage architecture diagram.
 *
 * Coordinates are hand-tuned against the viewBox below so the layout can be
 * edited here without touching the renderer. Edge geometry is authored the same
 * way — explicit path strings beat a generic router for ten hand-placed edges.
 */

export const VIEWBOX = { w: 1000, h: 588 } as const;

export type ComponentId =
  | 'overview'
  | 'loop'
  | 'model'
  | 'tools'
  | 'retrieval'
  | 'edit'
  | 'environment'
  | 'guardrails'
  | 'context'
  | 'orchestration'
  | 'tracing'
  | 'eval';

export type Layer = 'input' | 'harness' | 'model' | 'tools' | 'world' | 'meta';

export interface Component {
  id: ComponentId;
  label: string;
  blurb: string;
  layer: Layer;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const LAYER_LABELS: Record<Layer, string> = {
  input: 'Input',
  harness: 'Harness',
  model: 'Model',
  tools: 'Tools',
  world: 'World',
  meta: 'Cross-cutting',
};

export const COMPONENTS: Component[] = [
  {
    id: 'overview',
    label: 'User & task',
    blurb: 'Where a request enters the system, and what separates an agent from a chatbot or a fixed workflow.',
    layer: 'input',
    x: 40, y: 40, w: 196, h: 72,
  },
  {
    id: 'model',
    label: 'Model',
    blurb: 'The LLM decides what to do next. It never executes anything itself — it only asks.',
    layer: 'model',
    x: 282, y: 40, w: 196, h: 72,
  },
  {
    id: 'loop',
    label: 'Agent loop',
    blurb: 'observe → decide → act → observe → … → stop. The one idea everything else hangs off.',
    layer: 'harness',
    x: 282, y: 180, w: 196, h: 76,
  },
  {
    id: 'tools',
    label: 'Tool belt',
    blurb: 'The actions the harness is willing to execute, and how their interfaces are designed for a model.',
    layer: 'tools',
    x: 524, y: 180, w: 196, h: 76,
  },
  {
    id: 'retrieval',
    label: 'Code search',
    blurb: 'Finding the few relevant files instead of pushing a whole repository through the context window.',
    layer: 'tools',
    x: 766, y: 110, w: 196, h: 64,
  },
  {
    id: 'edit',
    label: 'Edit & patch',
    blurb: 'How a model turns an intention into a file change: whole-file, search/replace, diff or structured patch.',
    layer: 'tools',
    x: 766, y: 196, w: 196, h: 64,
  },
  {
    id: 'environment',
    label: 'Environment',
    blurb: 'Build, tests and dependencies. The compiler is an oracle: actions here produce objective feedback.',
    layer: 'world',
    x: 766, y: 282, w: 196, h: 76,
  },
  {
    id: 'guardrails',
    label: 'Guardrails',
    blurb: 'Sandboxing, approvals and the points where autonomy should stop and a human or a check takes over.',
    layer: 'harness',
    x: 524, y: 300, w: 196, h: 76,
  },
  {
    id: 'context',
    label: 'Context & memory',
    blurb: 'What gets placed in the window each turn — and the several different things "memory" actually means.',
    layer: 'harness',
    x: 282, y: 300, w: 196, h: 76,
  },
  {
    id: 'orchestration',
    label: 'Patterns',
    blurb: 'Chaining, routing, fan-out, orchestrator–workers, evaluator–optimizer, handoffs. All of Part III.',
    layer: 'meta',
    x: 40, y: 464, w: 288, h: 84,
  },
  {
    id: 'tracing',
    label: 'Tracing',
    blurb: 'You need the whole trajectory — every model call, tool call and output — not just the final answer.',
    layer: 'meta',
    x: 357, y: 464, w: 288, h: 84,
  },
  {
    id: 'eval',
    label: 'Evaluation',
    blurb: 'Outcome, intermediate actions, efficiency, safety and robustness are separate measurements.',
    layer: 'meta',
    x: 674, y: 464, w: 288, h: 84,
  },
];

export interface Edge {
  from: ComponentId;
  to: ComponentId;
  /** Explicit SVG path, hand-routed to avoid crossing nodes. */
  d: string;
  label?: string;
  dashed?: boolean;
  /** Where to anchor the edge label, if it has one. */
  labelAt?: { x: number; y: number };
}

export const EDGES: Edge[] = [
  // request in — routed through the left gutter so it enters the loop's side
  { from: 'overview', to: 'loop', d: 'M 236 76 H 254 V 210 H 278' },
  // loop <-> model, as a parallel pair either side of centre
  { from: 'loop', to: 'model', d: 'M 364 180 V 116' },
  { from: 'model', to: 'loop', d: 'M 396 112 V 176' },
  // loop -> tools
  { from: 'loop', to: 'tools', d: 'M 478 218 H 520' },
  // tools fan out
  { from: 'tools', to: 'retrieval', d: 'M 720 200 C 748 200, 748 142, 762 142' },
  { from: 'tools', to: 'edit', d: 'M 720 222 H 762' },
  { from: 'tools', to: 'environment', d: 'M 720 244 C 750 244, 750 320, 762 320' },
  // objective feedback, all the way round the bottom and back into the loop
  {
    from: 'environment',
    to: 'loop',
    d: 'M 864 358 V 416 H 262 V 236 H 278',
    label: 'feedback',
    dashed: true,
    labelAt: { x: 563, y: 406 },
  },
  // harness inputs
  { from: 'context', to: 'loop', d: 'M 380 300 V 260' },
  { from: 'guardrails', to: 'tools', d: 'M 622 300 V 260' },
];
