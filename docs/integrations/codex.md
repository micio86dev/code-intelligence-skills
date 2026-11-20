# OpenAI Codex

Verified with Codex CLI **0.158.0** (`codex exec`; see [status](README.md)).

## Install

```bash
npx github:micio86dev/code-intelligence-skills install --agent codex
npx github:micio86dev/code-intelligence-skills install --agent codex --project
```

- `npx github:micio86dev/code-intelligence-skills install --agent codex`: ~/.agents/skills/code-intelligence
- `npx github:micio86dev/code-intelligence-skills install --agent codex --project`: .agents/skills/code-intelligence

Codex read the skill from the project's `.agents/skills`. Whether it reads `~/.agents/skills` (user scope) was **not** tested here.

## Observed

- **Explicit request (P3):** the agent read the skill, ran `command -v code-intel && code-intel doctor`, then `code-intel scan --format json`. Its answer reported the credential (rotate, do not commit), the five lodash advisories with the fix version, and **"Semgrep crashed, so SAST did not run"**, so the `eval` was not found and the scan was reported as incomplete rather than clean. This is exit code 3 working as designed.
- **Natural request + `AGENTS.md` snippet (P1):** ran `doctor` and `scan` the same way.
- **Natural request, skill alone:** not tested.

## Limitation: sandbox

With Codex's default `workspace-write` sandbox, semgrep exited with an error (its reason line was a Python traceback header; the cause was not isolated, and `code-intel` now prints the exception line with paths scrubbed). gitleaks and osv-scanner completed. If you need SAST under Codex, run it with a sandbox that lets semgrep work, or use local semgrep rules. Whether network or a state-directory write was the cause is **unverified**.

## Tip

`codex exec` prints "Reading additional input from stdin..."; in scripts redirect `< /dev/null`.
