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
 * Hand-authored, same pattern as `src/data/architecture.ts`. Add to it freely —
 * see SOURCES.md at the repo root for how to curate it.
 *
 * Sources that exist as a file are cached at `sources/raw/<id>.<ext>` with their
 * extracted text alongside — see `sources/README.md`. Run
 * `uv run scripts/ingest-source.py --list` to see what is cached.
 *
 * PREFERRED HUNTING GROUNDS, when looking for a source for a new lesson:
 *   anthropic.com/engineering    Anthropic engineering blog
 *   platform.claude.com/docs     Claude platform documentation
 *   openai.com  (see caveat)     OpenAI blog and guides
 *   arxiv.org                    papers
 * Plus the real agent codebases listed further down. Caveat on OpenAI: the
 * `openai.com/index/*` blog paths hard-403 every automated fetch, while
 * `cdn.openai.com` file URLs work — so prefer their PDFs, or ask for a paste.
 *
 * Strip tracking parameters from every URL before adding it (`?utm_source=…` etc.).
 */

import type { ComponentId } from './architecture';

/**
 * What a source is *about*, drawn from the same twelve architecture components the
 * lessons are mapped to. Reusing that vocabulary means "which sources can serve
 * this lesson?" is a lookup rather than a guess, and a typo is a type error.
 *
 * Tag generously — a source that genuinely speaks to five components should list
 * five. Under-tagging hides a source from the lesson that needed it.
 */
export type Topic = ComponentId;

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
  /** Which architecture components this source speaks to. Required: see Topic. */
  topics: Topic[];
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
    topics: ['overview', 'loop', 'orchestration'],
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
    topics: ['overview', 'loop'],
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
    topics: ['overview', 'loop', 'tools'],
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
    topics: ['overview', 'model', 'eval'],
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
    topics: ['model', 'context', 'tools'],
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
    topics: ['loop', 'tools', 'edit'],
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
    topics: ['loop', 'model'],
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
    topics: ['overview', 'loop', 'orchestration', 'guardrails'],
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
    topics: ['loop', 'tools'],
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
    topics: ['loop'],
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
    topics: ['loop', 'tools'],
    note:
      'Complete runnable loops in several languages; the Python one is literally ' +
      '`while response.stop_reason == "tool_use":`. The reference to mirror for the lesson-2 exercise.',
  },

  // ------------------------------------------- Anthropic engineering, by subject
  {
    id: 'anthropic-writing-tools',
    // The real H1, which differs from the URL slug.
    title: 'Writing effective tools for agents — with agents',
    url: 'https://www.anthropic.com/engineering/writing-tools-for-agents',
    author: 'Ken Aizawa',
    site: 'Anthropic Engineering',
    date: '2025-09-11',
    kind: 'post',
    topics: ['tools'],
    core: true,
    note:
      'For the tool-belt and ACI lessons (8, 9): "Tools are a new kind of software which reflects a ' +
      'contract between deterministic systems and non-deterministic agents." Warns that "More tools ' +
      'don\'t always lead to better outcomes" and that wrapping existing APIs is a common error; ' +
      'tools should "return only high signal information".',
  },
  {
    id: 'anthropic-context-engineering',
    title: 'Effective context engineering for AI agents',
    url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents',
    author: "Anthropic Applied AI team",
    site: 'Anthropic Engineering',
    date: '2025-09-29',
    kind: 'post',
    topics: ['context'],
    core: true,
    note:
      'The spine for lessons 27–28: "Context engineering refers to the set of strategies for curating ' +
      'and maintaining the optimal set of tokens during LLM inference", and the distinction from ' +
      'prompt engineering — prompts are instructions, context is "the entire context state" across ' +
      'many turns.',
  },
  {
    id: 'anthropic-demystifying-evals',
    title: 'Demystifying evals for AI agents',
    url: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents',
    author: 'Mikaela Grace, Jeremy Hadfield, Rodrigo Olivares and Jiri De Jonghe',
    site: 'Anthropic Engineering',
    date: '2026-01-09',
    kind: 'post',
    topics: ['eval', 'tracing'],
    core: true,
    note:
      'For lessons 33–34: "Start early and don\'t wait for the perfect suite. Source realistic tasks ' +
      'from the failures you see." And the line that ties evals to lesson 31 on tracing — "Read the ' +
      'transcripts!"',
  },

  // ------------------------------------------------- real coding-agent codebases
  // Worth reading against our own toy agent: these are what the real thing looks
  // like. Most useful from lesson 7 onward.
  {
    id: 'mini-swe-agent',
    title: 'mini-swe-agent — the minimal AI software engineering agent',
    url: 'https://github.com/SWE-agent/mini-swe-agent',
    author: 'Princeton and Stanford (SWE-bench team)',
    site: 'GitHub',
    kind: 'repo',
    topics: ['loop', 'tools', 'environment', 'tracing', 'guardrails'],
    core: true,
    note:
      'The single best comparison for this course: ~100 lines of Python for the agent class, and it ' +
      'still scores >74% on SWE-bench verified. Three design notes land directly on our lessons — it ' +
      '"does not have any tools other than bash" and skips the tool-calling interface entirely ' +
      '(lessons 8–9); it has "a completely linear history — every step of the agent just appends to ' +
      'the messages", so "there\'s no difference between the trajectory and the messages" (lessons 2 ' +
      'and 31); and it runs each action with `subprocess.run` so actions are independent and trivially ' +
      'sandboxed (lessons 15–16).',
  },
  {
    id: 'swe-agent-paper',
    title: 'SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering',
    url: 'https://arxiv.org/abs/2405.15793',
    author: 'Yang, Jimenez, Wettig, Lieret, Yao, Narasimhan, Press',
    site: 'arXiv:2405.15793 (NeurIPS 2024)',
    date: '2024-05-06',
    kind: 'paper',
    topics: ['tools', 'retrieval', 'edit', 'eval'],
    core: true,
    note:
      'The primary source for lesson 9 — this is where the term "Agent-Computer Interface (ACI)" ' +
      'comes from. Pair it with mini-swe-agent for one of the most useful arguments in the course: ' +
      'the SAME team concluded a year later that most of the custom tooling "is not needed at all".',
  },
  {
    id: 'swe-agent-background',
    title: 'SWE-agent — project overview',
    url: 'https://github.com/SWE-agent/SWE-agent/blob/main/docs/background/index.md',
    site: 'GitHub — SWE-agent docs',
    kind: 'docs',
    topics: ['overview', 'tools', 'retrieval'],
    note:
      'The short version of the ACI argument: "simple LM-centric commands and feedback formats to ' +
      'make it easier for the LM to browse the repository, view, edit and execute code files."',
  },
  {
    id: 'openai-codex',
    title: 'openai/codex — lightweight coding agent that runs in your terminal',
    url: 'https://github.com/openai/codex',
    author: 'OpenAI',
    site: 'GitHub',
    kind: 'repo',
    topics: ['tools', 'environment', 'guardrails'],
    note: 'A production terminal coding agent to compare architectures against, from lesson 7 onward.',
  },
  {
    id: 'openhands-sdk',
    title: 'OpenHands software-agent-sdk',
    url: 'https://github.com/OpenHands/software-agent-sdk',
    author: 'OpenHands',
    site: 'GitHub',
    kind: 'repo',
    topics: ['loop', 'tools'],
    note:
      'A modular SDK for software agents — useful for the harness lessons (5, 18) as a worked example ' +
      'of where the boundaries get drawn.',
  },
  {
    id: 'gemini-cli',
    title: 'gemini-cli — an open-source AI agent in your terminal',
    url: 'https://github.com/google-gemini/gemini-cli',
    author: 'Google',
    site: 'GitHub',
    kind: 'repo',
    topics: ['tools', 'guardrails'],
    note: 'A third terminal-agent implementation, for comparing tool surfaces and permission models.',
  },
  {
    id: 'agent-lightning',
    title: 'agent-lightning — a trainer for AI agents',
    url: 'https://github.com/microsoft/agent-lightning',
    author: 'Microsoft',
    site: 'GitHub',
    kind: 'repo',
    topics: ['model'],
    note: 'For lesson 35: what it actually takes to train an agent rather than just prompt one.',
  },

  // ------------------------------------------- evaluation and training background
  {
    id: 'dietz-llm-as-judge',
    title:
      'LLM-as-a-Judge: Approaches, Failure Modes to Be Aware Of, and What Really Works (The Essentials)',
    url: 'https://www.cs.unh.edu/~dietz/papers/llm-judge-book-essentials.pdf',
    author: 'Laura Dietz',
    site: 'University of New Hampshire',
    date: '2026',
    kind: 'book',
    topics: ['eval'],
    core: true,
    note:
      'Substantial for lesson 33, and the sharpest thing here on why eval numbers lie. Surveys the ' +
      'judge approaches (holistic, multi-criteria, preference, nugget) and names the failure modes: ' +
      'sycophancy, LLM narcissism, homogenization, leniency, circularity, and leaking evaluation ' +
      'secrets. Its remedy is a division of labour where "human experts decide what matters and the ' +
      'AI is restricted to canonicalizing and matching at scale". A working draft — cached locally at ' +
      'sources/raw/, and the upstream file has already changed size since, so quote from the cache.',
  },
  {
    id: 'cs229-notes',
    title: 'CS229 Lecture Notes',
    url: 'https://cs229.stanford.edu/main_notes.pdf',
    author: 'Tengyu Ma and Andrew Ng',
    site: 'Stanford CS229',
    date: '2026-08-23',
    kind: 'book',
    topics: ['model'],
    note:
      'Mostly OUT OF SCOPE for this course — 278 pages of classical supervised ML, with one mention of ' +
      '"agent" in the whole document. Cite it for exactly one thing: §18 (p. 222) on reinforcement ' +
      'learning with verifiable rewards, which is lesson 35\'s subject in miniature — "a programming ' +
      'problem may have unit tests" as the reward signal, plus the o1 and DeepSeek-R1 scaling results. ' +
      'Part VI (ch. 19, 21) is the MDP and policy-gradient background if that lesson needs it.',
  },

  // ----------------------------------------------------- discussion and opinion
  {
    id: 'hn-building-effective-agents',
    title: 'Building Effective "Agents" — discussion',
    url: 'https://news.ycombinator.com/item?id=42470541',
    site: 'Hacker News',
    date: '2024-12-20',
    kind: 'thread',
    topics: ['overview'],
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
    topics: ['overview', 'loop'],
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
    topics: ['loop'],
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
    topics: ['loop', 'guardrails', 'orchestration'],
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
    id: 'openai-agents-sdk-evolution',
    title: 'The next evolution of the Agents SDK',
    url: 'https://openai.com/index/the-next-evolution-of-the-agents-sdk/',
    author: 'OpenAI',
    site: 'OpenAI',
    kind: 'post',
    topics: ['orchestration', 'loop'],
    blocked: {
      reason:
        'openai.com/index/* returns HTTP 403 to every automated request — plain curl, a full browser ' +
        'header set, and WebFetch all get the same bot-block page. Note the contrast: cdn.openai.com ' +
        'serves files fine (see openai-practical-guide), it is the blog paths that are closed. Paste ' +
        'the text and it can be quoted and attributed properly.',
      tried: '2026-08-28',
    },
  },
  {
    id: 'reddit-agent-discussion',
    title: 'Reddit — agent discussion threads (none retrieved)',
    url: 'https://www.reddit.com/r/LocalLLaMA/',
    site: 'Reddit',
    kind: 'thread',
    topics: ['overview'],
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

/**
 * Sources that speak to a component — i.e. the candidate reading for any lesson
 * mapped to it. Blocked sources are excluded by default: they cannot be read yet,
 * so offering them as candidates just wastes a look.
 */
export function sourcesForTopic(topic: Topic, includeBlocked = false): Source[] {
  return LIBRARY.filter(
    (s) => s.topics.includes(topic) && (includeBlocked || !s.blocked),
  );
}

/** How many readable sources exist per component — i.e. where the gaps are. */
export function topicCoverage(): Array<{ topic: Topic; count: number }> {
  const counts = new Map<Topic, number>();
  for (const s of LIBRARY) {
    if (s.blocked) continue;
    for (const t of s.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}
