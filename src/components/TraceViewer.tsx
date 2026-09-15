import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Replays one recorded agent run (a `traces` collection entry). Serialisable
 * props built in Lesson.astro, hydrated with client:load — same island pattern
 * as ArchitectureDiagram, but with real <button>s and one aria-live region on the
 * detail pane, so stepping announces once rather than twice.
 *
 * Each step is drawn as a chat bubble with an avatar — a person for you, a bot
 * for the assistant, a wrench for tool output — aligned right vs. left so the
 * turn-taking reads at a glance. The timeline dots are tinted the same way.
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

type Speaker = 'user' | 'assistant' | 'tool' | 'system';

// Who is "speaking" at each step, the label shown above the bubble, and the
// aria-label for the timeline. tool_use is still the assistant's turn (it is
// deciding to call a tool); tool_result is the tool answering back.
const SPEAKER: Record<Step['kind'], { speaker: Speaker; label: string }> = {
  user: { speaker: 'user', label: 'You' },
  thinking: { speaker: 'assistant', label: 'Assistant · thinking' },
  text: { speaker: 'assistant', label: 'Assistant' },
  tool_use: { speaker: 'assistant', label: 'Assistant · calls a tool' },
  tool_result: { speaker: 'tool', label: 'Tool' },
  end: { speaker: 'system', label: 'End of run' },
};

const SPK_COLOR: Record<Speaker, string> = {
  user: 'var(--spk-user)',
  assistant: 'var(--accent)',
  tool: 'var(--spk-tool)',
  system: 'var(--muted)',
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
  const { speaker, label } = SPEAKER[step.kind];

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

      {/* Timeline: one real button per step, tinted by who is speaking */}
      <ol
        className="trace-timeline"
        style={{ display: 'flex', gap: 4, listStyle: 'none', margin: '0 0 0.75rem', padding: 0, overflowX: 'auto' }}
      >
        {steps.map((s, i) => {
          const c = SPK_COLOR[SPEAKER[s.kind].speaker];
          return (
            <li key={s.i}>
              <button
                type="button"
                aria-pressed={i === cur}
                aria-label={`Step ${i + 1}: ${SPEAKER[s.kind].label}`}
                onClick={() => go(i)}
                title={SPEAKER[s.kind].label}
                style={{
                  ...btn,
                  minWidth: 26,
                  padding: '2px 6px',
                  borderColor: i === cur ? c : 'var(--accent-dim)',
                  borderTop: `3px solid ${c}`,
                  background: i <= cur ? 'var(--surface-hi)' : 'transparent',
                  fontWeight: i === cur ? 700 : 400,
                  opacity: i <= cur ? 1 : 0.6,
                }}
              >
                {i + 1}
              </button>
            </li>
          );
        })}
      </ol>

      {/* Detail pane — the only live region */}
      <div aria-live="polite" style={{ minHeight: '6.5rem' }}>
        {step.kind === 'end' ? (
          <EndPill step={step} />
        ) : (
          <div
            className="trace-bubble-row"
            key={cur}
            style={{
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start',
              flexDirection: speaker === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <Avatar speaker={speaker} />
            <div
              className="trace-bubble"
              style={{
                maxWidth: '90%',
                padding: '0.5rem 0.7rem',
                background: `color-mix(in srgb, ${SPK_COLOR[speaker]} 8%, var(--bg-raised))`,
                border: `1px solid color-mix(in srgb, ${SPK_COLOR[speaker]} 32%, var(--bg-raised))`,
                borderRadius: speaker === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
              }}
            >
              <span
                style={{
                  display: 'block',
                  marginBottom: '0.25rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                  color: SPK_COLOR[speaker],
                }}
              >
                {label}
              </span>
              <StepBody step={step} expanded={expanded} setExpanded={setExpanded} mono={mono} />
            </div>
          </div>
        )}
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
      <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: '0.35rem', ...mono }}>
        <WrenchGlyph />
        <span>
          {step.name}(
          {Object.entries(step.input ?? {}).map(([k, v], i) => (
            <span key={k}>{i > 0 ? ', ' : ''}{k}={JSON.stringify(v)}</span>
          ))}
          )
        </span>
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
  return null;
}

// The end step is not a turn in the conversation, so it reads as a centered
// pill rather than a bubble.
function EndPill({ step }: { step: Step }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.8rem',
          borderRadius: 999,
          background: 'var(--surface)',
          border: '1px solid var(--accent-dim)',
          color: 'var(--muted)',
          fontSize: '0.9em',
        }}
      >
        <IconFlag />
        The loop stopped:&nbsp;
        <strong style={{ color: 'var(--fg)' }}>
          {step.reason === 'stop_reason' ? `the model finished (${step.stopReason})` : step.reason}
        </strong>
      </span>
    </div>
  );
}

// --- Avatars ---------------------------------------------------------------
// A coloured disc per speaker with a white line-art glyph. Decorative, so
// aria-hidden; the bubble's speaker label carries the meaning for screen readers.
function Avatar({ speaker }: { speaker: Speaker }) {
  const icon =
    speaker === 'user' ? <IconPerson /> : speaker === 'tool' ? <IconWrench /> : <IconBot />;
  return (
    <span
      aria-hidden="true"
      style={{
        flex: 'none',
        width: 34,
        height: 34,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: SPK_COLOR[speaker],
        color: '#fff',
      }}
    >
      {icon}
    </span>
  );
}

const svg = {
  width: 19,
  height: 19,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function IconPerson() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function IconBot() {
  return (
    <svg {...svg}>
      <rect x="4.5" y="8" width="15" height="10.5" rx="3" />
      <path d="M12 8V4.6" />
      <circle cx="12" cy="3.4" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="9.4" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="13" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg {...svg}>
      <path d="M14.7 6.3a3.6 3.6 0 0 0 4.6 4.6l-9.2 9.2a2.1 2.1 0 0 1-3-3l9.2-9.2a3.6 3.6 0 0 0-1.6-1.6z" />
      <path d="M14.7 6.3l3.5-3.5a3.6 3.6 0 0 1 1.1 5.7" />
    </svg>
  );
}

function IconFlag() {
  return (
    <svg {...svg} width={16} height={16}>
      <path d="M5 21V4" />
      <path d="M5 5h11l-2 3 2 3H5" />
    </svg>
  );
}

// A small wrench sat inline before a tool call, in the tool colour, so the call
// reads as "the assistant reaching for a tool".
function WrenchGlyph() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--spk-tool)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: 'none', transform: 'translateY(1px)' }}
    >
      <path d="M14.7 6.3a3.6 3.6 0 0 0 4.6 4.6l-9.2 9.2a2.1 2.1 0 0 1-3-3l9.2-9.2a3.6 3.6 0 0 0-1.6-1.6z" />
    </svg>
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
