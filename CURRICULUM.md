# The curriculum

Thirty-six lessons that teach how AI agents work by building a small coding agent from
first principles. This document is the list of what those lessons are and what each one
adds to the agent. The project itself is described in [README.md](README.md), the process
for writing a lesson in [LESSONS.md](LESSONS.md).

## The three tracks

Every lesson belongs to the first track. Some also carry work in the second, fewer in the
third.

1. **Learn** — ~36 self-contained 5-minute lessons covering agent loops, tools, coding agents, context engineering, planning, memory, multi-agent patterns, sandboxing, tracing and evaluation.
2. **Build** — an interactive architecture diagram that evolves as new capabilities are added to a minimal coding agent. Build should tell one continuous story: a tiny loop gradually becomes a reasonably serious coding agent.
3. **Measure** — small experiments comparing architectural choices, e.g. planning vs no planning, repo maps vs simple search, memory vs no memory, or evaluator vs no evaluator. Measure should be selective: perhaps 8–12 genuinely interesting experiments across the entire curriculum.

The curriculum advances all three together, so the site and the agent both become more
capable as the lessons are written.

## The 36 lessons

| #                                                        | Lesson                                      | Takeaway — what the reader should understand                                                                                   |
| -------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Part I — What actually is an agent?**                  |                                             |                                                                                                                         |
| 1                                                        | **Chatbot vs workflow vs agent**            | Why calling an LLM isn't an agent; what "model controls the loop" means.                                                |
| 2                                                        | **The agent loop**                          | `observe → decide → act → observe → ... → stop`. This is the central concept for everything else.                       |
| 3                                                        | **The augmented LLM**                       | How an ordinary model becomes useful through tools, retrieval and state.                                                |
| 4                                                        | **Tools and function calling**              | The model doesn't "run Python": it emits a special token the harness reads as a request, and runs it.                   |
| 5                                                        | **What is the agent harness?**              | Why the model and the agent are different things. The harness owns tools, context, permissions, execution and the loop. |
| 6                                                        | **Where does planning live?**               | Explicit plans vs implicit/receding-horizon planning; why agents don't necessarily need a separate planner.             |
| **Part II — Take apart a coding agent**                  |                                             |                                                                                                                         |
| 7                                                        | **A coding agent from first principles**    | User → repo → model → inspect files → edit → run → inspect errors → edit again.                                         |
| 8                                                        | **The coding-agent tool belt**              | `read`, `grep/search`, edit/patch, shell, test, git, browser/MCP.                                                       |
| 9                                                        | **Agent–computer interfaces (ACI)**         | Why designing good tools for an LLM is analogous to designing a good IDE for a human.                                   |
| 10                                                       | **How the agent finds relevant code**       | Why stuffing an entire repository into context performs badly.                                                          |
| 11                                                       | **Repo maps and code retrieval**            | Symbols, dependency graphs, semantic search, targeted file loading. Aider is a particularly nice concrete example.      |
| 12                                                       | **How agents modify files**                 | Whole-file generation vs search/replace vs unified diffs vs structured patch tools.                                     |
| 13                                                       | **The compiler/test suite as an oracle**    | The crucial coding-agent advantage: actions produce objective feedback.                                                 |
| 14                                                       | **The debugging loop**                      | Run → error → diagnose → modify → rerun. Why this makes coding highly agent-friendly.                                   |
| 15                                                       | **The environment**                         | Dependencies, build system, test setup, configuration and repository instructions such as `AGENTS.md`.                  |
| 16                                                       | **Sandboxing**                              | Why you shouldn't give an autonomous LLM unrestricted shell/network/filesystem access.                                  |
| 17                                                       | **Approvals and permissions**               | Read automatically; perhaps ask before destructive/network/external actions.                                            |
| 18                                                       | **Long-running coding agents**              | Checkpoints, context compaction, summaries, state and recovering after failed approaches.                               |
| **Part III — Generic agent architectures**               |                                             |                                                                                                                         |
| 19                                                       | **Prompt chaining**                         | Fixed pipeline: A → B → C. Useful, but technically a workflow rather than an autonomous agent.                          |
| 20                                                       | **Routing**                                 | One model/classifier decides which specialist/prompt/tool handles a request.                                            |
| 21                                                       | **Parallelisation**                         | Fan-out/fan-in: ask multiple workers or independently solve pieces of a problem.                                        |
| 22                                                       | **Orchestrator → workers**                  | One model dynamically decomposes a task and delegates unpredictable subtasks. Particularly relevant to coding.          |
| 23                                                       | **Evaluator → optimizer**                   | One agent generates; another critiques; generation repeats.                                                             |
| 24                                                       | **Multi-agent systems**                     | Why "more agents" isn't automatically better and often just adds coordination problems.                                 |
| 25                                                       | **Agents-as-tools vs handoffs**             | A manager calling a specialist versus transferring control to another agent.                                            |
| 26                                                       | **LLM orchestration vs code orchestration** | Which decisions should be probabilistic and which should remain deterministic code.                                     |
| **Part IV — Context, memory and infrastructure**         |                                             |                                                                                                                         |
| 27                                                       | **The context window is working memory**    | Why agent "intelligence" depends heavily on what information gets placed in context.                                    |
| 28                                                       | **Context engineering**                     | Selecting instructions, history, tool outputs and retrieved material at every turn.                                     |
| 29                                                       | **Memory isn't one thing**                  | Conversation state, scratchpad/work state, semantic memory, episodic memory and persistent user memory.                 |
| 30                                                       | **MCP**                                     | A standard interface to external tools — and "code mode", where the model writes code against it.                       |
| 31                                                       | **Tracing**                                 | Why you need the full trajectory—model calls, tool calls and outputs—not merely the final answer.                       |
| 32                                                       | **Human-in-the-loop and guardrails**        | Where autonomy should stop and deterministic checks or humans take over.                                                |
| **Part V — Why some agents are much better than others** |                                             |                                                                                                                         |
| 33                                                       | **How to evaluate an agent**                | Outcome success, intermediate actions, efficiency, safety and robustness are separate things.                           |
| 34                                                       | **SWE-bench and coding-agent evals**        | Repo + issue + executable tests gives you unusually strong ground truth.                                                |
| 35                                                       | **How coding agents get trained**           | RL on real software environments, tool use, executable rewards, instruction following and preference signals.           |
| 36                                                       | **Build the architecture yourself**         | Draw a coding agent and then generalize it into a research/customer-support/scientific agent. This is your "exam."      |

---

## Build and Measure

The two tracks are deliberately not symmetrical, for the reasons given under **The three tracks**
above: **Build is one continuous story**, and **Measure is selective**. Build therefore
appears in most lessons, because each one adds a piece to the same agent. Measure appears
in roughly a third, because an experiment is only worth running when its result could
plausibly go either way.

The parts of the curriculum already fall into that shape. Part I establishes the loop and
the harness. Part II contains almost every piece of the core coding agent. Part III is
treated as experimental variants rather than as permanent additions. Part IV upgrades the
agent's infrastructure. Part V turns it into an evaluated system.

**★ marks an experiment worth publishing on the site as a result in its own right.**

### The Build story — one project, eight versions

The progression is not 36 separate projects. It is one agent passing through eight
versions, each of which runs:

| Version | Lessons | What exists at the end of it |
| --- | --- | --- |
| **v0** | 2 | A model, a loop, one trivial tool, a turn limit, and raw JSONL logging |
| **v0.2** | 4–5 | A generic tool registry and a real harness: `ModelClient`, `AgentLoop`, `ToolRegistry`, `AgentState`, `Executor` |
| **v0.3** | 7–8 | A read-only coding agent: a workspace, a task, and enough tools to investigate a bug |
| **v0.4** | 9–12 | Model-friendly tool interfaces, proper search, a repo map, and the ability to edit files |
| **v1.0** | 14 | A self-debugging coding agent: edit → test → read the failure → edit again |
| **v1.1** | 16–18 | Sandboxed, permission-controlled, and able to resume after being killed |
| **v1.2** | 27–31 | Context budgeting, a pluggable context manager, and typed traces |
| **v1.3** | 32–36 | Guardrails, an eval runner, external benchmark results, and optional orchestration strategies |

**Lesson 14 is the first milestone that stands on its own** — a coding agent that fixes a
failing test without supervision. Everything after it makes the same agent less of a toy
rather than starting something new.

### Part I — What actually is an agent?

| Lesson | Build | Measure |
| --- | --- | --- |
| **1.** Chatbot vs workflow vs agent | — | — |
| **2.** The agent loop | **Tiny Agent v0.** The ten-line loop against a model API, one deliberately trivial tool, and a turn limit. Dump raw model calls, tool calls and results to JSONL from the first run. | How cumulative input tokens grow across tasks needing 1, 3, 5 and 10 sequential tool calls, which makes the cost of resending the conversation concrete. |
| **3.** The augmented LLM | — | — |
| **4.** Tools and function calling | Replace the hard-coded toy tool with a generic `Tool` interface and registry: schema → call → validate arguments → execute → return result. | **★ Tool descriptions.** Badly named and vaguely described tools against carefully designed ones, over ~30 synthetic tasks. Metrics: correct tool selected, arguments valid. |
| **5.** What is the agent harness? | Refactor v0 into a harness proper: `ModelClient`, `AgentLoop`, `ToolRegistry`, `AgentState`, `Executor`. No new capability — the point is the separation. | — |
| **6.** Where does planning live? | No planner yet. | Design the no-plan against plan-first comparison here, but run it at lesson 14, once there is a coding agent to run it on. |

Logging from lesson 2 is deliberate. The agent records JSONL because debugging without it
is painful, and lesson 31 later replaces that crude logger with typed traces once tracing
is understood as an architectural component. That ordering is stronger than logging
nothing until lesson 31.

### Part II — Take apart a coding agent

Most of Build happens here.

| Lesson | Build | Measure |
| --- | --- | --- |
| **7.** A coding agent from first principles | Tiny Agent becomes **Tiny Coding Agent**. Introduce `CodingTask` and `Workspace` — a repository path plus a task description. It can only inspect at this point. Create two or three tiny fixture repos. | — |
| **8.** The coding-agent tool belt | Add `list_files`, `read_file`, `grep`/search and a limited `shell`. No editing yet: it is a read-only agent that can investigate a bug. | — |
| **9.** Agent–computer interfaces (ACI) | Improve the tool API: line-numbered reads, bounded output, structured errors, separated stdout and stderr, truncation indicators, clearer descriptions. | **★ Primitive against model-friendly tools.** For example `read_file(path)` returning a whole file, against `read_file(path, start_line, end_line)`. Metrics: task success, invalid calls, tokens. |
| **10.** How the agent finds relevant code | Make search a real component: `grep`, filename search, targeted line reads. | **★ Whole repo against search.** Same localisation tasks; one condition stuffs the repository into context, the other navigates with search. Metrics: localisation accuracy, input tokens, cost. |
| **11.** Repo maps and code retrieval | The simplest useful repo map. For Python, start from `ast`: files → classes, functions, imports. The model requests files after seeing the map. | **★ Grep alone against repo map plus grep**, with semantic search as a possible third condition. Metrics: was the right file and function found, and at what context cost. |
| **12.** How agents modify files | The agent becomes writable: a real `apply_patch` or edit tool, plus `git diff`. Implement several interfaces for the experiment; ship one in the agent. | **★ Whole-file rewrite against search/replace against unified patch.** Metrics: malformed edits, test success, lines changed unnecessarily. |
| **13.** The compiler/test suite as an oracle | Add `run_tests`, and build **the first real benchmark**: 10–20 tiny coding issues with hidden tests. | No executable feedback against access to tests, holding tasks, model and budget fixed. |
| **14.** The debugging loop | The agent works autonomously: edit → test → inspect failure → edit → test. **Tiny Coding Agent v1.0 exists here.** | **★ Attempt budget.** One attempt against three against eight, plotting success against cost and tool calls. Also the point at which the lesson-6 planning comparison runs. |
| **15.** The environment | Workspace discovery: recognise `pyproject.toml`, test commands, dependencies, and repository instructions such as `AGENTS.md`. | With and without repository instructions. Do they reduce errors or tool calls? |
| **16.** Sandboxing | A real execution boundary: workspace confinement, timeouts, environment restrictions, network policy. Use an actual container or sandbox rather than hand-written OS isolation. | A controlled safety suite of benign commands plus commands that should be refused. Metrics: safe actions allowed, unsafe actions blocked. |
| **17.** Approvals and permissions | An `ExecutionPolicy`: reads automatic, writes inside the workspace allowed, destructive or network or external actions approved or denied. | — |
| **18.** Long-running coding agents | Checkpoint and resume, explicit working state, context compaction. A killed process can resume its run. | **★ Full trajectory against compaction.** Metrics: success, context tokens, cost, and whether facts established early are lost. |

### Part III — Generic agent architectures

These patterns are **not** bolted permanently onto the coding agent. Each is a strategy in
its own module — `best_of_n.py`, `orchestrator_workers.py`, `critic.py` — attached
experimentally to the same core agent. **A pattern only graduates into the main
architecture if the experiment shows it helps.** That keeps Part III from making the
architecture progressively more absurd, and it makes a negative result publishable rather
than embarrassing.

| Lesson | Build | Measure |
| --- | --- | --- |
| **19.** Prompt chaining | — | **Workflow against agent**, on one task family whose steps are predictable and one whose steps are not. Metrics: reliability, cost. This is the direct test of lesson 1's claim that being agentic is not always desirable. |
| **20.** Routing | — | Optional: route bug-fixing, explanation and test-writing tasks to specialised prompts, against one general-purpose agent. |
| **21.** Parallelisation | Leave the core agent alone. Write a runner that launches N independent attempts. | **★ Single attempt against best-of-three.** How much reliability does 3× inference buy? Plot success against cost. |
| **22.** Orchestrator → workers | An optional `delegate(subtask)` strategy in a separate module: a manager hands bounded tasks to instances of Tiny Agent. | **★ Single agent against orchestrator and workers** on decomposable, multi-file tasks. Does decomposition actually help? |
| **23.** Evaluator → optimizer | An optional reviewer strategy, not baked into the agent. | Agent alone against agent plus critic and revision. Metrics: improvement, extra tokens. A negative result here would be interesting. |
| **24.** Multi-agent systems | — | No new experiment. Synthesise 21–23 into a **cost against performance frontier**: single, best-of-N, orchestrator, critic. |
| **25.** Agents-as-tools vs handoffs | — | None. A lesson does not need an experiment merely because it exists. |
| **26.** LLM orchestration vs code orchestration | **This one does change the core agent.** Move the deterministic decisions into code: budgets, validation, test acceptance, policy enforcement, termination. The model is left only the genuinely semantic choices. | **★ Model-controlled against code-controlled completion.** The model declaring itself done, against the harness accepting completion only when the required checks pass. Metric: false declarations of success. |

### Part IV — Context, memory and infrastructure

| Lesson | Build | Measure |
| --- | --- | --- |
| **27.** The context window is working memory | A `ContextBudget` layer recording tokens by category: instructions, task, history, repository information, tool outputs. Context usage becomes visible in every run. | — |
| **28.** Context engineering | A pluggable `ContextManager` that decides which history, tool results and repository information enter each model call. | **★ Full history against sliding window against summary plus targeted retrieval**, on longer tasks. Metrics: success, cost. |
| **29.** Memory isn't one thing | No vector database merely because the lesson says memory. The agent already has task state and checkpoints; keep the kinds of memory distinct. | Optional: a summary of a previous attempt on the same repository, against starting fresh. Does episodic memory help, or anchor the agent to its earlier mistakes? |
| **30.** MCP | An MCP adapter, so MCP tools appear in the same `ToolRegistry` as native ones. Demonstrate with one reproducible server rather than restructuring the agent around MCP. Then a second adapter for **code mode**: render the same tools as a typed API and let the model write code that calls it, which needs the lesson-16 sandbox to run. | **★ Tool calls against code mode.** The same tasks with tools exposed as tool calls, then as an API the model writes code against. Cloudflare report handling "many more tools, and more complex tools" the second way, without publishing numbers, so this is a claim to test rather than repeat. Metrics: success, tokens, and how each degrades as the number of tools grows. |
| **31.** Tracing | Replace lesson 2's JSONL with typed traces: model call, tool call, observation, token count, timing, state change. Build the trace viewer on the site. | —. The traces are the instrumentation every other Measure task depends on. |
| **32.** Human-in-the-loop and guardrails | Wire the lesson-17 policy engine to real approval hooks and deterministic checks. | **★ Unguarded against policy-controlled**, on tasks and repositories containing instructions that conflict with policy. |

### Part V — Why some agents are much better than others

Evaluation is the payoff here rather than a new subject, because the benchmark has existed
since lesson 13 and the traces since lesson 2.

| Lesson | Build | Measure |
| --- | --- | --- |
| **33.** How to evaluate an agent | Turn lesson 13's benchmark runner into a real `EvalRunner`: repeated runs, a results database, and success, tokens, cost, latency, tool calls, edits and policy violations. | **Robustness.** Paraphrase task descriptions, add irrelevant files, reorder context. Does performance hold up? |
| **34.** SWE-bench and coding-agent evals | A benchmark adapter, so the agent runs against a small standard coding-agent benchmark and not only against tasks written for it. Start small; hundreds of costly runs are not needed. | **★ External benchmark.** The full agent against a deliberately stripped-down baseline, same model and budget. This is the number that comes from outside the home-grown benchmark. |
| **35.** How coding agents get trained | Train nothing. Use the stored trajectories to work out what executable rewards and training data would look like. | — |
| **36.** Build the architecture yourself | **Tiny Coding Agent v1.3.** Clean architecture, README, the interactive diagram, a runnable demo, and the generalisation from coding agent to generic agent. | **★ Ablation study.** Remove one component at a time — repo map, iterative tests, context manager, planning — and show which ones actually contributed. |

### The experiments to run first

If time is short, these eight are the ones worth having, in priority order. Each is marked
★ above.

1. **Code retrieval** — whole repo, against search, against repo map plus search (10–11).
2. **Edit interface** — whole file, against search/replace, against patch (12).
3. **Debug feedback** — one attempt against iterative testing (14).
4. **Long-context handling** — full history against compaction and context engineering (18, 28).
5. **ACI** — primitive tool interfaces against model-friendly ones (9).
6. **Agent architectures** — a single agent against one chosen multi-agent technique (21–23).
7. **Standard benchmark** — the complete agent against its minimal baseline (34).
8. **Final ablations** — which pieces mattered (36).

### The shape of a Measure page

Every experiment writes up the same way, so results can be compared and a reader knows
where to look:

**Question → hypothesis → variants → controlled variables → metric → result → traces →
what I learned.**

Recording the hypothesis before the result is what makes a negative result worth
publishing. The goal by lesson 36 is a site that does not only say *here are the
components of a coding agent*, but: **each of these was built, and here is evidence about
when it helps, when it does not, and what it costs.**
