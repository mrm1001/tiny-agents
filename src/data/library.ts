/**
 * Shared source library for the whole course.
 *
 * Every URL used anywhere on this site lives here exactly once. Lessons cite by
 * `id` in their frontmatter (`sources: [anthropic-bea, ...]`), so fixing a rotted
 * link is a one-line change rather than a hunt across 36 lesson files.
 *
 * `src/content.config.ts` imports LIBRARY and validates lesson source keys against
 * it, so an unknown key is a BUILD ERROR, not a silently missing citation.
 *
 * The `id` is also the in-page anchor: a lesson body cites a source as
 * `[Anthropic's post](#s-anthropic-bea)` and never repeats the URL.
 *
 * Hand-authored, same pattern as `src/data/architecture.ts`. Add to it freely.
 */

export type SourceKind =
  | 'post'        // blog post, essay
  | 'docs'        // official documentation
  | 'paper'       // academic paper
  | 'thread'      // forum discussion (HN, etc.)
  | 'newsletter'  // Substack and similar
  | 'repo'        // code repository or a file in one
  | 'book';

export interface Source {
  /** Stable key. Used in lesson frontmatter and as the `#s-<id>` anchor. */
  id: string;
  title: string;
  url: string;
  author?: string;
  /** Publication or site name, e.g. 'Anthropic Engineering', "Lil'Log". */
  site?: string;
  /** YYYY | YYYY-MM | YYYY-MM-DD. Omit for living documents. Formatted at render. */
  date?: string;
  kind: SourceKind;
  /** What this source actually supplies — why it is cited. */
  note?: string;
  /** A course-wide source, expected to recur across many lessons. */
  core?: true;
  /**
   * Recorded rather than dropped when a source could not be fetched or verified.
   * This doubles as a worklist: anything listed here can be retrieved by hand and
   * the entry then promoted to a normal source.
   */
  blocked?: { reason: string; tried: string };
}

export const LIBRARY: Source[] = [
  // ---------------------------------------------------------------- course-wide
  {
    id: 'anthropic-bea',
    title: 'Building effective agents',
    url: 'https://www.anthropic.com/engineering/building-effective-agents',
    author: 'Erik S. and Barry Zhang',
    site: 'Anthropic Engineering',
    date: '2024-12-19',
    kind: 'post',
    core: true,
    note:
      'The canonical workflow-vs-agent split: workflows are "orchestrated through predefined code ' +
      'paths", agents "dynamically direct their own processes and tool usage". Also the five ' +
      'workflow patterns, the augmented-LLM building block, and the stopping-conditions line. ' +
      'NB the live byline prints "Erik S." — not "Erik Schluntz" as it is widely cited — and the ' +
      'H1 is lowercase "Building effective agents", not "Building Effective AI Agents".',
  },
  {
    id: 'willison-agents',
    title:
      'I think "agent" may finally have a widely enough agreed upon definition to be useful jargon now',
    url: 'https://simonwillison.net/2025/Sep/18/agents/',
    author: 'Simon Willison',
    site: "Simon Willison's Weblog",
    date: '2025-09-18',
    kind: 'post',
    core: true,
    note:
      'The one-sentence definition: "An LLM agent runs tools in a loop to achieve a goal." Also the ' +
      'stopping nuance ("not infinite loops") and an explicit acknowledgement that the term is contested.',
  },
  {
    id: 'hf-smolagents',
    title: 'What are agents?',
    url: 'https://huggingface.co/docs/smolagents/conceptual_guides/intro_agents',
    site: 'Hugging Face — smolagents docs',
    kind: 'docs',
    core: true,
    note:
      'Rejects the binary: "\'agency\' evolves on a continuous spectrum", with a levels-of-agency ' +
      'table whose key row — "LLM output controls iteration and program continuation" — is literally ' +
      '"the model controls the loop". Also a four-line while-loop rendering of the agent loop.',
  },
  {
    id: 'huyen-agents',
    title: 'Agents',
    url: 'https://huyenchip.com/2025/01/07/agents.html',
    author: 'Chip Huyen',
    site: 'huyenchip.com',
    date: '2025-01-07',
    kind: 'post',
    core: true,
    note:
      'The rival definitional tradition, after Russell & Norvig: an agent is "anything that can ' +
      'perceive its environment and act upon that environment". Also the compounding-error figure — ' +
      '95% per step over 10 steps lands at ~60%.',
  },
  {
    id: 'weng-agents',
    title: 'LLM Powered Autonomous Agents',
    url: 'https://lilianweng.github.io/posts/2023-06-23-agent/',
    author: 'Lilian Weng',
    site: "Lil'Log",
    date: '2023-06-23',
    kind: 'post',
    core: true,
    note:
      'Architecture reference: LLM as the "brain" plus planning, memory and tool use. NB it makes no ' +
      'workflow-vs-agent distinction, so it does NOT support lesson 1\'s takeaway — cite it for ' +
      'architecture only.',
  },
  {
    id: 'ball-build-an-agent',
    title: 'How to Build an Agent',
    url: 'https://ampcode.com/notes/how-to-build-an-agent',
    author: 'Thorsten Ball',
    site: 'Amp',
    date: '2025-04-15',
    kind: 'post',
    core: true,
    note:
      '"It\'s an LLM, a loop, and enough tokens." Builds a working agent in "less than 400 lines of ' +
      'code" with three tools. Notably his loop never inspects `stop_reason` — it checks whether any ' +
      'tool calls came back — which is worth contrasting with the API-idiomatic form.',
  },
  {
    id: 'react-paper',
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
    url: 'https://arxiv.org/abs/2210.03629',
    author: 'Yao, Zhao, Yu, Du, Shafran, Narasimhan, Cao',
    site: 'arXiv:2210.03629',
    date: '2022-10-06',
    kind: 'paper',
    core: true,
    note:
      'Interleaves reasoning traces with actions. The ancestor of the loop, and the origin of an ' +
      'explicit terminal action (`finish[answer]`). NB this is a PROMPTED trajectory parsed out of ' +
      'text, not an API-level tool-call loop — do not conflate it with `stop_reason == "tool_use"`. ' +
      'Quotable body text is easier to reach via the ar5iv HTML mirror than the PDF.',
  },

  {
    id: 'openai-practical-guide',
    title: 'A practical guide to building agents',
    url: 'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf',
    // No `author`: it is corporately authored, and "OpenAI · OpenAI" reads badly.
    site: 'OpenAI',
    // From the PDF's own /CreationDate (D:20250407142051Z). The HTML landing page
    // 403s, so this is the most reliable date available.
    date: '2025-04-07',
    kind: 'docs',
    core: true,
    note:
      'The rival vendor definition, and a useful foil for Anthropic: "Agents are systems that ' +
      'independently accomplish tasks on your behalf." Says outright that "Applications that ' +
      'integrate LLMs but don\'t use them to control workflow execution—think simple chatbots, ' +
      'single-turn LLMs, or sentiment classifiers—are not agents." Note it uses "workflow" to mean ' +
      'the task itself ("a sequence of steps that must be executed to meet the user\'s goal"), NOT ' +
      'an architecture category as Anthropic does — the same word, two meanings, across the two most ' +
      'cited sources. On the loop: "a loop that lets agents operate until an exit condition is ' +
      'reached", exiting when a final-output tool fires or "the model returns a response without any ' +
      'tool calls". 34 pages; text extracts cleanly with pypdf.',
  },

  // ---------------------------------------------------- Anthropic API reference
  {
    id: 'anthropic-tool-use-loop',
    title: 'How tool use works',
    url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works',
    site: 'Claude Platform Docs',
    kind: 'docs',
    core: true,
    note:
      'The precise termination condition, stated outright: "The canonical shape is a `while` loop ' +
      'keyed on `stop_reason`", continuing while it is `"tool_use"` and exiting on any other. Also ' +
      '"The model never executes anything on its own."',
  },
  {
    id: 'anthropic-stop-reasons',
    title: 'Stop reasons and fallback',
    url: 'https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons',
    site: 'Claude Platform Docs',
    kind: 'docs',
    note:
      'The enumerated stop reasons: end_turn, max_tokens, stop_sequence, tool_use, pause_turn, ' +
      'refusal, model_context_window_exceeded. Importantly `pause_turn` is NOT terminal.',
  },
  {
    id: 'anthropic-build-tool-agent',
    title: 'Tutorial: Build a tool-using agent',
    url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/build-a-tool-using-agent',
    site: 'Claude Platform Docs',
    kind: 'docs',
    note:
      'Complete runnable loops in several languages; the Python one is literally ' +
      '`while response.stop_reason == "tool_use":`. The reference to mirror for the lesson-2 exercise.',
  },

  // ----------------------------------------------------- discussion and opinion
  {
    id: 'hn-building-effective-agents',
    title: 'Building Effective "Agents" — discussion',
    url: 'https://news.ycombinator.com/item?id=42470541',
    site: 'Hacker News',
    date: '2024-12-20',
    kind: 'thread',
    note:
      '763 points. Where practitioners argue the definition: Animats objects that "an agent is a ' +
      'party who acts for another … That\'s an autonomous system, not an agent". NB comment text was ' +
      'verified through the HN Algolia API because the HTML pages rate-limit.',
  },
  {
    id: 'bowne-harness',
    title: 'Stop Overengineering Your Agent Harness',
    url: 'https://hugobowne.substack.com/p/stop-overengineering-your-agent-harness',
    author: 'Hugo Bowne-Anderson',
    site: 'Vanishing Gradients',
    date: '2026-07-21',
    kind: 'newsletter',
    note:
      'The blunt practitioner version of lesson 1\'s thesis: "most common parlance agents don\'t have ' +
      'such reasoning loops and are more aptly described as LLM workflows".',
  },
  {
    id: 'kinney-agent-loops',
    title: 'The Anatomy of an Agent Loop',
    url: 'https://stevekinney.com/writing/agent-loops',
    author: 'Steve Kinney',
    // Date deliberately omitted rather than guessed: the page renders it
    // inconsistently (19 vs 23 March 2026). An uncertain date is a metadata gap,
    // not a reason to exclude a good source.
    kind: 'post',
    note:
      'The clearest short statement of the loop\'s two signals: "Tool calls are the continuation ' +
      'signal—they mean \'I\'m not done yet\'" and "A text-only response is the termination signal". ' +
      'Also the framing that "the loop is a solved problem" and the interesting decisions are all ' +
      'around it.',
  },
  {
    id: 'twelve-factor-own-control-flow',
    title: 'Factor 8: Own your control flow',
    url: 'https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md',
    author: 'HumanLayer',
    site: '12-Factor Agents',
    kind: 'repo',
    note:
      'The counterweight to "the model decides when to stop": sometimes YOU stop it. "Build your own ' +
      'control structures that make sense for your specific use case."',
  },

  // ------------------------------------------------------------------- BLOCKED
  // Reserved for sources that genuinely CANNOT BE RETRIEVED. Left here rather than
  // dropped, so they can be fetched by hand and promoted to normal entries.
  //
  // `blocked` is NOT for metadata problems. An ambiguous or missing publication
  // date is a gap in the entry (omit the `date` field and say so in `note`), never
  // a reason to exclude an otherwise good source — see `kinney-agent-loops`.
  {
    id: 'reddit-agent-discussion',
    title: 'Reddit — agent discussion threads (none retrieved)',
    url: 'https://www.reddit.com/r/LocalLLaMA/',
    site: 'Reddit',
    kind: 'thread',
    blocked: {
      reason:
        'This environment cannot reach reddit.com at all — both domain-scoped web search and direct ' +
        'fetch are refused. No Reddit source has been cited anywhere as a result. To use one, paste ' +
        'the URL and the relevant comment text and it can be quoted and attributed properly.',
      tried: '2026-08-27',
    },
  },
];

/** Sources expected to recur across the course. */
export const CORE_SOURCES = LIBRARY.filter((s) => s.core);

/** Sources that could not be fetched or verified — the retrieval worklist. */
export const BLOCKED_SOURCES = LIBRARY.filter((s) => s.blocked);

const BY_ID = new Map(LIBRARY.map((s) => [s.id, s]));

/** A lesson may cite a library key or supply a one-off source inline. */
export type SourceRef = string | Omit<Source, 'core' | 'blocked'>;

/**
 * Resolve a frontmatter reference to a full source. Throws rather than returning
 * undefined: an unresolvable citation should stop the build, not render blank.
 */
export function resolveSource(ref: SourceRef): Source {
  if (typeof ref !== 'string') return ref as Source;
  const found = BY_ID.get(ref);
  if (!found) {
    throw new Error(
      `Unknown source key "${ref}". Add it to src/data/library.ts or inline the source in frontmatter.`,
    );
  }
  return found;
}

export const isKnownSourceId = (id: string) => BY_ID.has(id);
