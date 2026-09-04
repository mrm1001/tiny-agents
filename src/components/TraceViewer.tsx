import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Replays one recorded agent run (a `traces` collection entry). Serialisable
 * props built in Lesson.astro, hydrated with client:load — same island pattern
 * as ArchitectureDiagram, but with real <button>s and one aria-live region on the
 * detail pane, so stepping announces once rather than twice.
 *
 * The "messages" counter is the teaching point: it grows as the conversation does
 * and every step resends all of it. It grows linearly — the quadratic cost is the
 * Measure chart's job, not this counter's.
 */
interface Step {
  i: number;
  mi: number | null;
  ri: number | null;
  kind: 'user' | 'thinking' | 'tool_use' | 'text' | 'tool_result' | 'end';
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
  output?: string;
  isError?: boolean;
  reason?: string;
  stopReason?: string | null;
}
interface Trace {
  steps: Step[];
  config: { tools: string[]; maxTurns: number };
  usage: { inputTokens: number; outputTokens: number; requests: number };
}

const KIND_LABEL: Record<Step['kind'], string> = {
  user: 'user',
  thinking: 'thinking',
  tool_use: 'tool call',
  text: 'assistant',
  tool_result: 'tool result',
  end: 'end',
};

export default function TraceViewer({ trace }: { trace: Trace }) {
  const { steps } = trace;
  const [cur, setCur] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const step = steps[cur];
  const messages = (step.mi ?? -1) + 1; // messages in the conversation at this point
  const atStart = cur === 0;
  const atEnd = cur === steps.length - 1;

  const go = useCallback(
    (next: number) => {
      setExpanded(false);
      setCur(Math.max(0, Math.min(steps.length - 1, next)));
    },
    [steps.length],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
  };

  // Keep the selected timeline button in view as you step.
  useEffect(() => {
    rootRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [cur]);

  const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.85em' };

  return (
    <div
      ref={rootRef}
      className="trace-viewer"
      role="group"
      aria-label="Recorded agent run"
      tabIndex={0}
      onKeyDown={onKey}
      style={{ border: '1px solid var(--accent-dim)', borderRadius: 8, background: 'var(--bg-raised)', padding: '0.75rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <button type="button" onClick={() => go(cur - 1)} disabled={atStart} style={btn}>← Prev</button>
        <button type="button" onClick={() => go(cur + 1)} disabled={atEnd} style={btn}>Next →</button>
        <button type="button" onClick={() => go(0)} disabled={atStart} style={btn}>Restart</button>
        <span style={{ marginLeft: 'auto', ...mono }}>
          step {cur + 1}/{steps.length} · <strong>messages: {messages}</strong>
        </span>
      </div>

      {/* Timeline: one real button per step */}
      <ol
        className="trace-timeline"
        style={{ display: 'flex', gap: 4, listStyle: 'none', margin: '0 0 0.75rem', padding: 0, overflowX: 'auto' }}
      >
        {steps.map((s, i) => (
          <li key={s.i}>
            <button
              type="button"
              aria-pressed={i === cur}
              aria-label={`Step ${i + 1}: ${KIND_LABEL[s.kind]}`}
              onClick={() => go(i)}
              title={KIND_LABEL[s.kind]}
              style={{
                ...btn,
                minWidth: 26,
                padding: '2px 6px',
                borderColor: i === cur ? 'var(--accent)' : 'var(--accent-dim)',
                background: i <= cur ? 'var(--surface-hi)' : 'transparent',
                fontWeight: i === cur ? 700 : 400,
              }}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>

      {/* Detail pane — the only live region */}
      <div aria-live="polite" style={{ minHeight: '5.5rem' }}>
        <p style={{ margin: '0 0 0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.72rem', color: 'var(--accent)' }}>
          {KIND_LABEL[step.kind]}
        </p>
        <StepBody step={step} expanded={expanded} setExpanded={setExpanded} mono={mono} />
      </div>
    </div>
  );
}

function StepBody({
  step, expanded, setExpanded, mono,
}: { step: Step; expanded: boolean; setExpanded: (b: boolean) => void; mono: React.CSSProperties }) {
  if (step.kind === 'user' || step.kind === 'thinking' || step.kind === 'text') {
    return <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{step.text}</p>;
  }
  if (step.kind === 'tool_use') {
    return (
      <p style={{ margin: 0, ...mono }}>
        {step.name}(
        {Object.entries(step.input ?? {}).map(([k, v], i) => (
          <span key={k}>{i > 0 ? ', ' : ''}{k}={JSON.stringify(v)}</span>
        ))}
        )
      </p>
    );
  }
  if (step.kind === 'tool_result') {
    const out = step.output ?? '';
    const long = out.length > 160;
    const shown = expanded || !long ? out : out.slice(0, 160) + '…';
    return (
      <div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', ...mono, color: step.isError ? 'var(--fg)' : undefined }}>{shown}</pre>
        {long && (
          <button type="button" onClick={() => setExpanded(!expanded)} style={{ ...btn, marginTop: 6 }}>
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    );
  }
  // end
  return (
    <p style={{ margin: 0 }}>
      The loop stopped: <strong>{step.reason === 'stop_reason' ? `the model finished (${step.stopReason})` : step.reason}</strong>.
    </p>
  );
}

const btn: React.CSSProperties = {
  font: 'inherit',
  fontSize: '0.85em',
  padding: '3px 10px',
  borderRadius: 6,
  border: '1px solid var(--accent-dim)',
  background: 'var(--surface)',
  color: 'var(--fg)',
  cursor: 'pointer',
};
