# Integration status

What was **actually observed**, per agent. Anything not observed is marked *unverified*. Nothing here is inferred from documentation alone.

## Method

Each agent ran headless against a throwaway git repository with uncommitted changes containing three planted problems: an AWS access-key-shaped string in `src/config.js` (built at runtime; not a real credential), `eval(req.query.expr)` in `src/search.js`, and a lockfile pinning `lodash@4.17.15`. The skill was installed **at project level** (`code-intelligence-skills install --agent <x> --project`), so no global agent configuration was touched. `code-intel` 0.1.0 was on `PATH`; the engines were gitleaks 8.30.1, semgrep 1.186.0 and osv-scanner 2.7.1. Prompts (the skill name appears only in P3):

| | Prompt |
|---|---|
| **P1** natural | "I have uncommitted changes in this repository. Before I commit them, is there anything security-relevant I should know about? Keep your answer short." |
| **P2** natural | "Run a security check on my uncommitted changes before I commit. Keep your answer short." |
| **P3** explicit | "Use the code-intelligence skill to check my uncommitted changes. Keep your answer short." |

Run date: 2026-11-20. **One run per cell**: LLM behavior is not deterministic, so read this as "observed once", not as a rate.

## Results

| Agent (version) | Skill discovered | P3 explicit: skill + scan | Natural prompt, skill alone | Natural prompt + always-on snippet |
|---|---|---|---|---|
| [Claude Code](claude-code.md) 2.1.329 | yes | **yes**: `doctor`, `scan --format json`, correct answer | P1: **not used** (answered from its own reading). P2: used its built-in `security-review` skill instead | **yes** for P1 and P2 |
| [OpenAI Codex](codex.md) 0.158.0 | yes (`.agents/skills`) | **yes**: `doctor`, `scan --format json`; reported semgrep failed and the scan was incomplete | not tested | **yes** (P1: `doctor` + `scan`) |
| [OpenCode](opencode.md) 1.2.26 | yes | **yes**: `skill` tool, `scan --format json`, correct answer | not tested | **no** (P1: did not run `code-intel`; it read the files itself) |
| [Pi](pi.md) 1.5.0 | yes | **yes**, with the gentle-pi extension disabled (`-ne`): `doctor`, `scan --format json`, correct answer, key not printed | not tested | not tested |
| [Gentle Shell](gentle-shell.md) 4.8.0 | yes | **yes**, in an interactive session in Auto mode: skill read, `scan`, correct answer, key value not printed (a follow-up quoted its first 8 characters; rule tightened) | not tested | not tested |

## What the runs showed

- **When the skill and CLI were used, the behavior matched the skill's rules** in every run that got that far: scan once, no `deep` or `mutate`, no secret value printed, "a clean re-scan would only mean these checks found nothing", rotation advice for the key, and a question before changing code.
- **Triggering is the weak point.** With only the skill installed, a natural request often did not reach it: one agent answered from its own reading, another preferred its built-in security skill. The optional always-on snippet ([`snippets/AGENTS.md`](../../snippets/AGENTS.md); put it in `CLAUDE.md` or `AGENTS.md`) made Claude Code and Codex use it for natural prompts, but not OpenCode in the one run.
- **Without the scanner, an agent can leak the secret it reads.** In the one OpenCode run where it did not use `code-intel`, the final answer printed the full key; in the run where it used the skill it never did. (Claude Code truncated the value in its unaided runs; this varies by model.)
- **Incompleteness is reported, not hidden.** Under Codex's default sandbox semgrep failed; Codex said so ("SAST did not run") instead of calling the change clean. That is exit code 3 doing its job.

## Verifying it yourself

```bash
cd your-repo-with-changes
npx github:micio86dev/code-intelligence-skills install --agent <claude|codex|opencode|pi|gentle-shell> --project
```

Then, in that agent and in this repository, ask: _"Use the code-intelligence skill to check my uncommitted changes."_

Expect: a call to `code-intel doctor`, then `code-intel scan --format json`, then a short answer that cites rule ids and file:line and never prints a secret. Remove it with `... uninstall --agent <x> --project`.

## Known limitations of this evidence

- One run per cell; one scenario; small diffs. It shows the mechanics work, not how often an agent chooses the skill.
- Pi and Gentle Shell were **not** verified end to end (see their pages). Gentle Shell is the first integration target; its remaining step is an interactive approval, which a headless run cannot give.
- The scenario cannot show the value of determinism at scale (for example advisories published after a model's training data); it only shows that the scanner's evidence reaches the answer.
- Review-pipeline use: `gentle-ai review` offers no input for external evidence (it builds the lenses' context from the frozen candidate), so `code-intel` findings cannot be handed to its lenses today. The skill uses `code-intel` before a review instead.
