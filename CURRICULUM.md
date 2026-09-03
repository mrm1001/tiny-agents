# Tiny Agents — Project Overview

Build a public, interactive website called **Tiny Agents** that teaches how AI agents work by progressively building a small coding agent from first principles.

The site should combine three things:

1. **Learn** — ~36 self-contained 5-minute lessons covering agent loops, tools, coding agents, context engineering, planning, memory, multi-agent patterns, sandboxing, tracing and evaluation.
2. **Build** — an interactive architecture diagram that evolves as new capabilities are added to a minimal coding agent. Each lesson should show the relevant code change and a simple execution trace.
3. **Measure** — small experiments comparing architectural choices, e.g. planning vs no planning, repo maps vs simple search, memory vs no memory, or evaluator vs no evaluator.

Key pages/features:

* Homepage with current architecture and learning progress. The homepage could show a summary view of the architectural components that have been explored with locks showing the ones that have not yet been looked at. The learning progress becomes the architecture diagram.
* Lesson pages with a short explanation, diagram, code snippet and optional deeper reading.
* Interactive **Agent Architecture Atlas** explaining common agent patterns.
* **Agent Playground** where visitors can configure tools/architecture and inspect a simulated or real trajectory.
* Experiments/evals section with results and conclusions.
* Journey/progress page showing what has been implemented and explored. It should also have a "what I learned" short paragraph.
* Open-source miniature coding-agent implementation linked to the lessons.

Design should feel like a polished technical playground rather than an online course: clean, visual, interactive and aimed at engineers.

Core principle: **the website and coding agent should become progressively more capable as the curriculum advances, so the project itself demonstrates understanding of agentic AI.**

A suggestion for the curriculum divided into 36 lessons:

| #                                                        | Your 5-minute lesson                        | What you should understand afterwards                                                                                   |
| -------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Part I — What actually is an agent?**                  |                                             |                                                                                                                         |
| 1                                                        | **Chatbot vs workflow vs agent**            | Why calling an LLM isn't an agent; what "model controls the loop" means.                                                |
| 2                                                        | **The agent loop**                          | `observe → decide → act → observe → ... → stop`. This is the central concept for everything else.                       |
| 3                                                        | **The augmented LLM**                       | How an ordinary model becomes useful through tools, retrieval and state.                                                |
| 4                                                        | **Tools and function calling**              | The model doesn't actually "run Python": it requests an action and the harness executes it.                             |
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
| 30                                                       | **MCP**                                     | How an agent gets a standardized interface to external resources and tools.                                             |
| 31                                                       | **Tracing**                                 | Why you need the full trajectory—model calls, tool calls and outputs—not merely the final answer.                       |
| 32                                                       | **Human-in-the-loop and guardrails**        | Where autonomy should stop and deterministic checks or humans take over.                                                |
| **Part V — Why some agents are much better than others** |                                             |                                                                                                                         |
| 33                                                       | **How to evaluate an agent**                | Outcome success, intermediate actions, efficiency, safety and robustness are separate things.                           |
| 34                                                       | **SWE-bench and coding-agent evals**        | Repo + issue + executable tests gives you unusually strong ground truth.                                                |
| 35                                                       | **How coding agents get trained**           | RL on real software environments, tool use, executable rewards, instruction following and preference signals.           |
| 36                                                       | **Build the architecture yourself**         | Draw a coding agent and then generalize it into a research/customer-support/scientific agent. This is your "exam."      |

