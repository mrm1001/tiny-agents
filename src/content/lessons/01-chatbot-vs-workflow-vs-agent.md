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
        at: '§ "What are agents?"'
        href: "#what-are-agents"
        why: >
          Anthropic's definitions of the second and third kinds, one sentence each: workflows are
          systems where models and tools "are orchestrated through predefined code paths", and agents
          are systems where models "dynamically direct their own processes and tool usage". Both
          sentences are quoted throughout the field, so read them in the original.
      - source: openai-practical-guide
        at: 'p. 4, "What is an agent?"'
        href: "#page=4"
        why: >
          The same boundary drawn by exclusion, which is often clearer: chatbots, single-turn model
          calls and sentiment classifiers "are not agents". Note that the two documents use
          "workflow" differently — for OpenAI it means the task being carried out, not a category of
          architecture.
      - source: ms-agents-for-beginners
        at: "01-intro-to-ai-agents/README.md"
        href: "/blob/main/01-intro-to-ai-agents/README.md"
        why: >
          A third explanation of the same distinction, with a list of use cases. Its code examples
          use a framework rather than building the loop directly, which makes a useful comparison
          with the approach this course takes.

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
        at: '§ "An introduction to agentic systems"'
        href: "#an-introduction-to-agentic-systems"
        why: >
          A table that grades systems by how much control the model has, from none up to writing the
          program itself. The middle row, "LLM output controls iteration and program continuation",
          is a precise statement of the distinction described above.
      - source: willison-agents
        at: '§ "Tools in a loop to achieve a goal"'
        href: "#tools-in-a-loop-to-achieve-a-goal"
        why: >
          A one-sentence definition, "An LLM agent runs tools in a loop to achieve a goal", followed
          by an explanation of what each part of it is doing. A good sanity check once you have read
          the two vendor definitions above.
      - source: openai-practical-guide
        at: 'p. 14, "Single-agent systems"'
        href: "#page=14"
        why: >
          A description of the loop that avoids any particular API's vocabulary: "a loop that lets
          agents operate until an exit condition is reached". Lesson 2 covers this loop in detail.

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
        at: '§ "Agent Overview"'
        href: "#agent_overview"
        why: >
          The textbook definition, credited to Russell and Norvig: an agent is "anything that can
          perceive its environment and act upon that environment". Read this to see how much wider
          the older definition is than the ones the vendors use.
      - source: hf-smolagents
        at: '§ "An introduction to agentic systems" — the spectrum claim'
        href: "#an-introduction-to-agentic-systems"
        why: >
          The explicit refusal to draw a line, stated as "'agency' evolves on a continuous
          spectrum". This is the clearest statement of the position that the binary question is the
          wrong question.
      - source: anthropic-bea
        at: '§ "Building blocks, workflows, and agents"'
        href: "#building-blocks-workflows-and-agents"
        why: >
          Five named workflow patterns, with a diagram for each and a note on when to use it.
          Lessons 19 to 23 take one pattern each, so reading this section early gives you the map.

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
        at: '§ "When (and when not) to use agents"'
        href: "#when-and-when-not-to-use-agents"
        why: >
          Anthropic's own recommendation to start small: "finding the simplest solution possible,
          and only increasing complexity when needed". The section also describes the kinds of task
          where the extra complexity does pay off.
      - source: huyen-agents
        at: '§ "Agent Overview" — the compounding-error arithmetic'
        href: "#agent_overview"
        why: >
          The 95%-per-step calculation worked through, with the numbers for several step counts. Read
          it if the multiplication above was surprising, because everything about evaluation later in
          the course follows from it.
      - source: openai-practical-guide
        at: 'p. 5, "When should you build an agent?"'
        href: "#page=5"
        why: >
          Three conditions OpenAI suggests using to decide whether a task justifies an agent:
          complex decision-making, rules that are hard to maintain, and heavy reliance on
          unstructured data.

extraReading:
  - hn-building-effective-agents
  - bowne-harness
  - weng-agents
---

This lesson sets up the vocabulary the rest of the course uses. Lesson 2 builds the loop described
in the second point below.
