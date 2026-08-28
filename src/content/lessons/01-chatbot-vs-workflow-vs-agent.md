---
n: 1
title: "Chatbot vs workflow vs agent"
part: "I — What actually is an agent?"
component: overview
status: in-progress
takeaway: "Why calling an LLM isn't an agent; what \"model controls the loop\" means."

points:
  - heading: "A workflow's path is written by you; an agent's is chosen at runtime"
    summary: >
      Three rungs, not two. One LLM call is a call. Chain several behind branches you wrote in
      advance and you have a workflow. Let the model decide what happens next and you have an
      agent. The step from the first rung to the second is engineering; the step from the second
      to the third is a transfer of authority, and that is why the word matters.
    reading:
      - source: anthropic-bea
        at: '§ "What are agents?"'
        href: "#what-are-agents"
        why: >
          Both halves of the split in one sentence each — workflows are "orchestrated through
          predefined code paths", agents "dynamically direct their own processes and tool usage".
      - source: openai-practical-guide
        at: 'p. 4, "What is an agent?"'
        href: "#page=4"
        why: >
          The same boundary drawn from the other side, by exclusion: chatbots, single-turn LLMs and
          sentiment classifiers "are not agents". Read it alongside Anthropic and notice that
          "workflow" here means the *task*, not the architecture — one word, two meanings, across
          the two most-cited sources in the field.
      - source: ms-agents-for-beginners
        at: "01-intro-to-ai-agents/README.md"
        href: "/blob/main/01-intro-to-ai-agents/README.md"
        why: >
          A third framing, with use cases. Useful as a contrast: it reaches for a framework where
          this course writes the loop by hand.

  - heading: "The real question is who decides whether there is another step"
    summary: >
      "The model controls the loop" sounds like a slogan, but it resolves to one mechanical
      question. In a workflow the answer is in your source code — a bounded `for`, an `if` on a
      classifier — and you can read the file and list every path. In an agent the answer arrives
      in the model's response, so nobody wrote down how many steps there would be.
    reading:
      - source: hf-smolagents
        at: '§ "An introduction to agentic systems"'
        href: "#an-introduction-to-agentic-systems"
        why: >
          The levels-of-agency table. One row — "LLM output controls iteration and program
          continuation" — is what "controls the loop" means, stated mechanically rather than as a
          metaphor.
      - source: willison-agents
        at: '§ "Tools in a loop to achieve a goal"'
        href: "#tools-in-a-loop-to-achieve-a-goal"
        why: >
          The shortest usable definition, then taken apart clause by clause. Fourteen words, all
          load-bearing.
      - source: openai-practical-guide
        at: 'p. 14, "Single-agent systems"'
        href: "#page=14"
        why: >
          The same loop described without reference to any API — "a loop that lets agents operate
          until an exit condition is reached". Lesson 2 builds exactly this.

  - heading: "The definition is contested, and reading the disagreement is the skill"
    summary: >
      Most introductions hand you one definition and move on, which leaves you unable to read the
      field. Ask four sources whether a fixed pipeline that calls a search API is an agent and you
      get three different answers, because they are applying different tests — control flow for
      Anthropic and OpenAI, a spectrum for Hugging Face, perception-and-action for Huyen. The
      habit to build is asking *which test is this person applying?*
    reading:
      - source: huyen-agents
        at: '§ "Agent Overview"'
        href: "#agent_overview"
        why: >
          The rival tradition, after Russell & Norvig: an agent is "anything that can perceive its
          environment and act upon that environment". Under this test a thermostat qualifies and
          that search pipeline is an agent — under Anthropic's, neither is.
      - source: hf-smolagents
        at: '§ "An introduction to agentic systems" — the spectrum claim'
        href: "#an-introduction-to-agentic-systems"
        why: >
          The explicit refusal to draw a line at all: "'agency' evolves on a continuous spectrum".
      - source: anthropic-bea
        at: '§ "Building blocks, workflows, and agents"'
        href: "#building-blocks-workflows-and-agents"
        why: >
          Five named workflow patterns with the line drawn for each. Lessons 19–23 take one apiece,
          so this section is worth knowing early.

  - heading: "More agency is a cost, not a score"
    summary: >
      Handing control to the model buys flexibility on tasks you could not enumerate in advance,
      and costs predictability, latency, money, and the ability to say what your system will do.
      It also compounds: steps multiply rather than add, so a ten-step agent built from a
      95%-reliable step succeeds about 60% of the time. If a workflow solves your problem, the
      workflow is the better system.
    reading:
      - source: anthropic-bea
        at: '§ "When (and when not) to use agents"'
        href: "#when-and-when-not-to-use-agents"
        why: >
          The advice from the post that popularised the distinction: "finding the simplest solution
          possible, and only increasing complexity when needed".
      - source: huyen-agents
        at: '§ "Agent Overview" — the compounding-error arithmetic'
        href: "#agent_overview"
        why: >
          Where the 60% comes from, worked through. This one calculation explains why the second
          half of this course is guardrails, evaluation and human checkpoints.
      - source: openai-practical-guide
        at: 'p. 5, "When should you build an agent?"'
        href: "#page=5"
        why: >
          The complementary test — the conditions under which the extra complexity does pay for
          itself.

extraReading:
  - hn-building-effective-agents
  - bowne-harness
  - weng-agents
---

Three rungs, one question, and a disagreement worth understanding before you read anything else
on the subject.
