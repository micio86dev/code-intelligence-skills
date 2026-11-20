# OpenCode

Verified with OpenCode **1.2.26** (`opencode run`; see [status](README.md)).

## Install

```bash
npx github:micio86dev/code-intelligence-skills install --agent opencode            # ~/.agents/skills/code-intelligence
npx github:micio86dev/code-intelligence-skills install --agent opencode --project  # .agents/skills/code-intelligence
```

## Observed

- **Explicit request (P3):** OpenCode's `skill` tool loaded `code-intelligence`, then it ran `git status --short`, `command -v code-intel` and `code-intel scan --format json`. The answer listed the credential (rotate immediately), the `eval`, and lodash with the fix version, and never printed the secret.
- **Natural request + `AGENTS.md` snippet (P1):** did **not** run `code-intel`; the agent inspected the diff and read the files itself, and its answer **printed the full key value**. This is the contrast case: without the scanner path the secret reached the answer.
- **Natural request, skill alone:** not tested.

## Headless usage: close stdin

`opencode run` blocks forever when stdin is not a terminal and is never closed (observed: zero output until killed). In scripts and CI run it as:

```bash
opencode run "..." < /dev/null
```

This is OpenCode's behavior, not this project's, but it looks exactly like a hang in the skill, so it is recorded here. The same applies to Pi.

## Notes

- OpenCode's own permission settings decide whether `code-intel` may run; this project does not change them. In the verified runs the commands were allowed by the configuration already in place (no approval prompt appeared). If your configuration asks for approval, a headless run cannot answer, so add an allow rule for `code-intel` rather than disabling checks.
