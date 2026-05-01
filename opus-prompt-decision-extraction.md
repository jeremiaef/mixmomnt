# Opus Prompt: Design claum's Decision Extraction Engine

## Context

I am building **claum** — a lightweight decision-capture tool for Claude Code. Unlike [claude-mem](https://github.com/thedotmack/claude-mem), which captures *everything* (all tool outputs, observations, thoughts) and compresses it with AI, claum captures *only decisions* — explicit or implicit agreements, choices, and resolved preferences.

claum's core thesis: **decisions are 1-2% of a conversation but carry 80% of the context you need in future sessions.** If we extract decisions precisely, we can inject context at 1/20th the token cost of claude-mem.

## Input Format

claum receives a JSONL snapshot of a Claude Code session. Each line is an event. Here are the key event types:

```json
{"type": "user", "content": "let's use Next.js with App Router for this portfolio"}
{"type": "assistant", "content": "...", "thinking": "The user wants Next.js App Router..."}
{"type": "tool_use", "name": "Bash", "input": {"command": "npx create-next-app@latest . --ts --tailwind"}}
{"type": "tool_result", "content": "Success! Created Next.js app..."}
{"type": "file-history-snapshot", "snapshot": {"trackedFileBackups": {"src/app/page.tsx": {"version": 3}}}}
```

## Your Task

Analyze the attached JSONL transcript(s) and design a **decision extraction algorithm** that a lightweight Python tool can implement without LLM calls at runtime.

### Part 1: Decision Archaeology

For each transcript, produce:

1. **Decision Inventory** — List every decision, agreement, or resolved choice found. For each:
   - `decision_text`: The core choice in 1 sentence
   - `rationale`: Why this choice was made (if stated)
   - `confidence`: 1-10 (how clear is this as a decision?)
   - `signal_type`: One of:
     - `EXPLICIT` — "let's use X", "we decided Y", "going with Z"
     - `IMPLICIT_PREF` — "X feels right", "I prefer X", "X is better"
     - `CONFIRMATION` — "yes", "sure", "let's do it", "agreed" in response to a proposal
     - `REVERSAL` — "actually", "wait", "scratch that", "nevermind" + new choice
     - `CONSENSUS` — debate/back-and-forth ending in convergence
     - `ACTION_CONFIRM` — tool execution that validates a prior discussion
   - `signal_quote`: The exact text that signaled this was a decision
   - `contradicted`: Was this later reversed? (true/false)
   - `executed`: Was a tool run that implements this? (true/false)
   - `scope`: `ARCHITECTURAL` | `DEPENDENCY` | `STYLE` | `PROCESS` | `SCOPE`

2. **Missed Decisions** — Were there any choices you *know* happened but couldn't find explicit evidence for? Describe what was missing.

3. **False Positives** — What looks like a decision but isn't? (e.g., "let's see if this works" is exploration, not commitment)

### Part 2: Pattern Synthesis

From your analysis, derive **generalizable heuristics** a non-LLM tool can use. Organize by signal type:

For each signal type, provide:
- **Trigger patterns**: Regexes, keyword lists, or structural patterns
- **Validation rules**: How to confirm this is a real decision, not noise
- **Confidence scoring**: What boosts or reduces confidence
- **Edge cases**: When this pattern fails

Example format:

```
SIGNAL: EXPLICIT
- Triggers: r"(?i)(let's|we should|we will|decided to|going with|settled on)\s+(.+)"
- Validation: The matched group must contain a noun phrase (technology, approach, file path)
- Boost: +2 if followed by tool execution within 3 messages
- Reduce: -3 if preceded by "maybe" or "I think" within same message
- Edge case: "let's see" = exploration, not decision

SIGNAL: CONSENSUS
- Triggers: 3+ alternating user/assistant messages ending in short affirmative
- Validation: Final message must contain agreement language OR be followed by tool use
- Boost: +2 if debate included explicit alternatives ("X vs Y")
- Reduce: -2 if final message is a question
- Edge case: "ok" after a command output is acknowledgement, not consensus
```

### Part 3: Algorithm Design

Design the full extraction pipeline as pseudocode or a step-by-step algorithm. It should:

1. **Ingest** a JSONL transcript
2. **Pre-filter** messages that can never contain decisions (tool results with only stdout, system meta-events, etc.)
3. **Extract candidates** using layered signal detection
4. **Validate** candidates against contradictions and tool execution evidence
5. **Cluster** related decisions (e.g., "use Next.js" + "App Router" + "static export" are one architectural decision)
6. **Score** final decisions on confidence, importance, and durability
7. **Output** a structured list ready for SQLite insertion

The algorithm must be implementable in Python with only `sqlite3`, `re`, and lightweight NLP (no transformers, no LLM calls at runtime).

### Part 4: Decision Ontology

Design a lightweight taxonomy for classifying decisions. For each category, define:
- What belongs in it
- How to detect it from text/tool-use patterns
- Injection priority (architectural decisions should outrank style choices)

Categories to define:
- `ARCHITECTURAL` — framework, routing, state management, build system
- `DEPENDENCY` — package/library choices, versions
- `STYLE` — colors, spacing, naming, formatting
- `PROCESS` — git workflow, testing strategy, deployment
- `SCOPE` — what to build, what to skip, MVP boundaries

### Part 5: Compression Rules

For each extracted decision, define how to compress it into an injection-ready string:
- Maximum length per decision
- What to keep vs. discard (keep choice + rationale, discard debate history)
- How to handle decisions with multiple parts (clustered decisions)
- Prefix format for injection (e.g., `[Prior decision] ...`)

## Deliverables

Please provide:
1. Full analysis of the attached transcript(s)
2. Pattern library with trigger regexes and validation rules
3. Pseudocode for the extraction pipeline
4. Decision ontology with detection rules
5. Compression rules for injection

## Constraints

- Runtime extraction must complete in <500ms for a 1-hour session transcript
- No LLM calls at extraction time (rule-based and lightweight NLP only)
- Target: ≥80% precision, ≥70% recall on decision extraction
- Token budget: extracted decisions for a session should compress to ≤2KB

## Attached Files

[Paste your JSONL snapshot content here, or attach 2-3 representative transcripts]
