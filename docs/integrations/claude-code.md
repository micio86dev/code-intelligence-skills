# Claude Code

Verified with Claude Code **2.1.329** (see [status](README.md) for method and caveats).

## Install

```bash
npx github:micio86dev/code-intelligence-skills install --agent claude
npx github:micio86dev/code-intelligence-skills install --agent claude --project
```

- `npx github:micio86dev/code-intelligence-skills install --agent claude`: ~/.claude/skills/code-intelligence
- `npx github:micio86dev/code-intelligence-skills install --agent claude --project`: .claude/skills/code-intelligence

Claude Code also supports plugins: this repository ships `.claude-plugin/plugin.json` and `marketplace.json` (both pass `claude plugin validate`). Installing through a marketplace was **not verified** (it needs the repository to be public first); the installer path above was.

## Observed

- The skill was listed to the agent at startup (project `.claude/skills`).
- **Explicit request (P3):** invoked the `code-intelligence` skill, ran `code-intel doctor` and `code-intel scan --format json`, and answered with the secret (merged from two engines, value not printed), the `eval`, and the five lodash advisories with the fix version. It stated that a clean re-scan would only mean the checks found nothing, did not run `deep` or `mutate`, and asked before changing code.
- **Natural request, skill alone:** P1 was answered from the agent's own reading (correctly, with the key truncated) without the skill; P2 used Claude Code's built-in `security-review` skill instead.
- **Natural request + `CLAUDE.md` snippet:** both P1 and P2 invoked the skill and ran the scan, and the agent read the new `config.inEffect` field ("no repo config altering it").

## Tips

- To make natural phrasings reach the skill, add [`snippets/AGENTS.md`](../../snippets/AGENTS.md) to the project's `CLAUDE.md`.
- Allow the CLI for a session with `--allowedTools "Bash(code-intel:*)"` (headless) or your usual permission rules.
- Claude Code's own `security-review` skill competes for requests worded as "security review"/"security check". Say "use the code-intelligence skill" or "run code-intel" when you want the scanners.
