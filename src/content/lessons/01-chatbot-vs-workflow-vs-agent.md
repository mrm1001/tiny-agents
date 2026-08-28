---
n: 1
title: "Chatbot vs workflow vs agent"
part: "I — What actually is an agent?"
component: overview
status: in-progress
takeaway: "Why calling an LLM isn't an agent; what \"model controls the loop\" means."

points:
  - heading: "Three kinds of system, and what separates them"
    summary: >
      There are three kinds of system in this area, and separating them matters because they need
      different amounts of engineering and fail in different ways. The first is a single call to a
      language model: your program sends some text, the model returns some text, and your program
      carries on. The second is a workflow, in which several model calls are wired together along a
      path you write in advance, such as classify an incoming email, then route it by category, then
      draft a reply. The third is an agent, in which the model itself chooses what happens next,
      including how many steps there will be. Moving from the first to the second means writing more
      code; moving from the second to the third means giving up the ability to say in advance what
      your program will do.
    reading:
      - source: anthropic-bea
        at: 'Anthropic, "Building effective agents" § What are agents?'
        href: "#what-are-agents"
      - source: openai-practical-guide
        at: 'OpenAI, "A practical guide to building agents" p. 4, What is an agent?'
        href: "#page=4"
      - source: ms-agents-for-beginners
        at: "Microsoft course · 01-intro-to-ai-agents/README.md"
        href: "/blob/main/01-intro-to-ai-agents/README.md"

  - heading: "Who decides whether there is another step"
    summary: >
      A tool is a function you make available to the model, described to it by a name and a schema
      for its arguments. A tool call is the model asking, in its reply, for one of those functions to
      be run with particular arguments; your code runs it and sends the result back. The distinction
      between a workflow and an agent comes down to who decides whether another tool call happens. In
      a workflow that decision lives in your source code, so you can read the file and list every
      path the program is able to take. In an agent the decision arrives inside the model's reply,
      which means the number of steps is not known until the run has finished.
    reading:
      - source: hf-smolagents
        at: "smolagents docs § An introduction to agentic systems"
        href: "#an-introduction-to-agentic-systems"
      - source: willison-agents
        at: "Willison § Tools in a loop to achieve a goal"
        href: "#tools-in-a-loop-to-achieve-a-goal"
      - source: openai-practical-guide
        at: "OpenAI guide p. 14, Single-agent systems"
        href: "#page=14"

  - heading: "Why the sources disagree about the word"
    summary: >
      Writers on this subject disagree about what counts as an agent, and the disagreement is not
      carelessness: they are applying different tests. Anthropic and OpenAI both ask who controls the
      flow of the program, so under their definition a fixed pipeline is a workflow no matter how
      capable the model inside it is. Hugging Face declines to draw a line at all and instead grades
      systems by how much agency they have. Chip Huyen uses the older definition from artificial
      intelligence textbooks, in which an agent is anything that perceives an environment and acts
      upon it, and that definition includes systems the other two would exclude. Knowing which test
      an author is applying makes their writing much easier to follow.
    reading:
      - source: huyen-agents
        at: 'Chip Huyen, "Agents" § Agent Overview'
        href: "#agent_overview"
      - source: hf-smolagents
        at: "smolagents docs § An introduction to agentic systems, the spectrum claim"
        href: "#an-introduction-to-agentic-systems"
      - source: anthropic-bea
        at: 'Anthropic, "Building effective agents" § Building blocks, workflows, and agents'
        href: "#building-blocks-workflows-and-agents"

  - heading: "The costs of letting the model decide"
    summary: >
      Handing control to the model buys flexibility on tasks whose steps you could not write down in
      advance, and the price is paid in predictability, latency and money. Failures also become
      harder to reproduce, because two runs of the same task can take different paths. The
      reliability cost compounds rather than accumulating: if each step succeeds 95% of the time and
      a task needs ten steps, the whole run succeeds about 60% of the time, because the
      probabilities multiply. That calculation is the reason the later parts of this course spend so
      long on guardrails, evaluation and human checkpoints. When a workflow can do the job, it is
      usually the better choice.
    reading:
      - source: anthropic-bea
        at: 'Anthropic, "Building effective agents" § When (and when not) to use agents'
        href: "#when-and-when-not-to-use-agents"
      - source: huyen-agents
        at: 'Chip Huyen, "Agents" § Agent Overview, the compounding-error arithmetic'
        href: "#agent_overview"
      - source: openai-practical-guide
        at: "OpenAI guide p. 5, When should you build an agent?"
        href: "#page=5"

intro: >
  This lesson sets up the vocabulary the rest of the course uses. Lesson 2 builds the loop described
  in the second point below.

extraReading:
  - hn-building-effective-agents
  - bowne-harness
  - weng-agents
---

<!-- Everything below the frontmatter is your notes. Delete these two bullets. -->

- Rough notes go here, in ordinary Markdown: bullets, nested lists, `code`, **bold**, links,
  code fences, tables. They render in the panel at the foot of the lesson.
- Nothing here counts towards the five-minute reading budget, and `check:style` leaves it alone.
