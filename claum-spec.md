# claum Improvement Spec

## Context
claum is a decision-capture tool for Claude Code. It hooks into session lifecycle events (PreCompact, Stop, UserPromptSubmit) to snapshot conversations and inject past decisions into context. It is being dogfooded via the `mixmomnt` project.

**Design philosophy:** Study [claude-mem](https://github.com/thedotmack/claude-mem)'s architecture but stay lightweight. claude-mem is feature-rich (Chroma DB, web UI, AI compression) but heavy on tokens and dependencies. claum aims for comparable smart context injection at a fraction of the token cost.

## Current State
| Component | Status |
|---|---|
| Snapshotting (`claum snapshot`) | **Working** — full JSONL transcripts saved to disk |
| Hooks (PreCompact, Stop, UserPromptSubmit) | **Working** — merged into `~/.claude/settings.json` |
| Database (`claum.db`) | **Partial** — `sessions` table populated, `decisions` and `conflicts` empty |
| Injection (`claum inject`) | **Broken** — runs on every prompt but has no decisions to inject |
| Decision extraction | **Missing** — no pipeline from snapshot JSONL → `decisions` table |

## User Stories

### US-1: Extract decisions from session snapshots
**As a** user, **I want** claum to automatically identify and store key decisions from my conversation history, **so that** future sessions can reference them.

**Acceptance Criteria:**
- [ ] After `claum snapshot` runs, a `claum extract` command can parse the JSONL transcript and populate the `decisions` table
- [ ] Each decision record contains: `id`, `session_id`, `timestamp`, `decision_text` (what was decided), `rationale` (why), `confidence_score` (0.0–1.0), `tags` (array of keywords)
- [ ] Local mode extraction targets explicit decision signals: phrases like "let's use", "we decided", "agreed on", "going with", "don't use", "rule:"
- [ ] Content wrapped in `<private>` tags is excluded from extraction and snapshots (privacy control)
- [ ] If no decisions are found, the command exits cleanly with a message like "No decisions extracted"
- [ ] The hook config supports an optional `PostSnapshot` hook that auto-runs `claum extract` after `claum snapshot`

### US-2: Inject relevant decisions into Claude Code context
**As a** user, **I want** claum to inject only the most relevant past decisions into my active session, **so that** Claude remembers context without token bloat.

**Acceptance Criteria:**
- [ ] `claum inject` reads the current user prompt and queries the `decisions` table for relevant entries
- [ ] Relevance is scored using the configured embeddings backend (`hash` in local mode, `sentence-transformers` in enhanced mode)
- [ ] Uses **progressive disclosure** — injects context proportionally to the question, not a fixed batch:
  - For simple questions: 0–1 decisions, ~50 tokens
  - For project-specific questions: up to `top_decisions` (default: 5), ~200 tokens
  - For broad "where did we leave off?" questions: up to `max_tokens` (default: 300)
- [ ] Injected text is prefixed with a clear marker: `\n[Prior decision] ...\n` so Claude can distinguish memory from current context
- [ ] Total injected tokens do not exceed `max_tokens` config value (default: 300)
- [ ] If no relevant decisions exist, `claum inject` outputs nothing (zero tokens added)
- [ ] Injection latency is logged; target <100ms for local mode

### US-3: Surface decisions via CLI
**As a** user, **I want** to view and manage extracted decisions from the command line, **so that** I can audit what claum remembers.

**Acceptance Criteria:**
- [ ] `claum decisions` lists all decisions with ID, timestamp, and truncated text
- [ ] `claum decisions --session <id>` filters by session
- [ ] `claum decisions --tag <tag>` filters by tag
- [ ] `claum decisions delete <id>` removes a decision
- [ ] `claum decisions add "<text>" --rationale "<why>"` allows manual entry

### US-4: Persist high-confidence decisions to Claude Code built-in memory
**As a** user, **I want** claum to promote durable decisions into Claude's native memory system, **so that** they survive even if claum's database is reset.

**Acceptance Criteria:**
- [ ] A `claum persist` command promotes decisions with `confidence_score >= 0.8` to the Claude Code memory directory
- [ ] Output format is a markdown file in `~/.claude/projects/<project>/memory/` with frontmatter:
  ```yaml
  ---
  name: claum_<slugified_decision_text>
  description: <truncated decision text>
  type: project
  source: claum
  session_id: <session_id>
  ---
  ```
- [ ] The body contains the decision text, rationale, and a **Why:** / **How to apply:** structure matching Claude Code memory conventions
- [ ] A decision is only persisted once (tracked by a `persisted_to_memory` boolean column in the DB)
- [ ] `claum persist --dry-run` previews what would be written without creating files

### US-5: Safety and validation
**As a** user, **I want** claum to never break Claude Code and give me visibility into whether it's working correctly, **so that** I can trust it and debug it without being a technical expert.

**Acceptance Criteria:**
- [ ] `claum inject` is wrapped in a try/except that fails **silently** — if extraction or injection crashes, it outputs nothing and lets Claude Code continue normally
- [ ] Injection latency is logged; if it exceeds 500ms, claum skips injection and logs a warning instead of blocking
- [ ] `claum validate <snapshot.jsonl>` runs extraction on a snapshot and prints a human-readable report:
  ```
  Decisions found: 12
  High confidence (8-10): 5
  Medium confidence (5-7): 4
  Low confidence (1-4): 3
  
  Examples:
  ✓ "Use Next.js App Router" — confidence 9, signal: EXPLICIT
  ? "Maybe try Tailwind later" — confidence 3, signal: IMPLICIT_PREF (might be noise)
  ✗ "ok" — confidence 1, signal: CONFIRMATION (false positive?)
  ```
- [ ] `claum validate` supports `--interactive` mode: prints each decision and asks "Keep? (y/n)" to build a labeled dataset for tuning
- [ ] `claum doctor` checks the setup: hooks installed, database writable, no hook collisions with other tools
- [ ] Per-project isolation: decisions are filtered by `cwd` (current working directory) so mixmomnt decisions don't leak into meetstabl.com sessions
- [ ] `claum prune` removes decisions older than 30 days or with confidence < 4, with `--dry-run` to preview

## Cost Efficiency Goals
claum must be measurably cheaper than claude-mem in token usage:

| Metric | Target | Why |
|---|---|---|
| Per-prompt injection | ≤ 200 tokens avg | claude-mem often adds 500+ tokens |
| Snapshot storage | ~50KB per hour of chat | Store decisions, not every tool output |
| Relevance precision | ≥ 80% top-1 match | Avoid injecting irrelevant context |
| Latency overhead | ≤ 100ms | Must feel instant on every prompt |

**Key strategy:** claum stores *decisions* (condensed, 1–2 sentences) rather than *observations* (full tool outputs, thinking blocks). A 2-hour session might generate 10–20 decisions totaling ~2KB, versus claude-mem's raw transcript approach which can hit 100KB+.

## Technical Constraints
- Python 3.12+, depends on `click` and `numpy`
- SQLite database at `~/.claum/claum.db`
- Config file at `~/.claum/config.toml`
- Hooks managed in `~/.claude/settings.json` (do not break existing hook format)
- Local mode must work without GPU or heavy ML dependencies
- Keep changes backward-compatible with existing `claum snapshot` behavior
- All token counts measured using the same tokenizer Claude Code uses (cl100k_base)

## Priority Order
1. **P0** — US-1 (Decision extraction). Without this, nothing else works.
2. **P0** — US-2 (Injection). Without this, claum provides zero value to Claude Code.
3. **P1** — US-3 (CLI surface). Needed for debugging and user trust.
4. **P2** — US-4 (Memory bridge). High value but depends on P0 working well.
5. **P1** — US-5 (Safety & validation). Prevents claum from breaking Claude Code and gives you confidence it works.

## Architecture Inspiration from claude-mem
Study [claude-mem](https://github.com/thedotmack/claude-mem) for these specific patterns, then implement lighter alternatives:

| claude-mem Feature | claum Equivalent | Weight Reduction |
|---|---|---|
| Chroma vector DB | SQLite + hash embeddings | No extra service |
| AI-powered compression | Rule-based extraction + optional LLM summary | No per-snapshot API call |
| 5 lifecycle hooks | 3 hooks (skip SessionStart, PostToolUse) | Less noise, faster |
| Web UI (`localhost:37777`) | CLI-only (`claum decisions`) | No Bun/Express dependency |
| Full observation capture | Decision-only extraction | ~20x less storage |
| Progressive disclosure | Dynamic token budget per question | Same intelligence, less tokens |
| `<private>` tags | `<private>...</private>` exclusion | Same privacy guarantee |

**What to adopt:** Progressive disclosure, privacy tags, relevance scoring, token budgeting.
**What to skip:** Web UI, background worker service, full observation capture, Chroma dependency.

## Compression Strategy (Enhanced Mode)
For users who enable `mode = "enhanced"`, add an optional compression step:
- After extraction, run a lightweight local model (e.g., `transformers` pipeline with a small summarization model) to condense verbose decisions into 1-sentence summaries
- Store both `original_text` and `compressed_text` in the DB
- Local mode uses `original_text`; enhanced mode uses `compressed_text` for injection
- Target: 50% token reduction per decision with >95% meaning retention

## Open Questions for Opus
- Should `claum extract` be a separate command or bundled into `claum snapshot` via a `--extract` flag?
- For local mode relevance scoring, is the existing `hash` embedding sufficient, or should we use a lightweight TF-IDF fallback?
- Should the `UserPromptSubmit` hook be updated to run `claum extract` + `claum inject` in sequence when a session ends and restarts?
- Should compression be a post-extraction step or a separate `claum compress` command?
- How do we measure "relevance precision" in practice — manual labeling or an automated test harness?
