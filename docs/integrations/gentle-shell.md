# Gentle Shell

Version tested: **4.8.0**. Gentle Shell is the first integration target. It was verified end to end on 2026-11-20 in an **interactive session run by the user** (a headless run is not possible: its permission modes are slash commands of the interactive interface). See [status](README.md).

## Observed

One interactive session in a throwaway git repository with the skill installed at project level (`--agent gentle-shell --project`) and the published `code-intel` on `PATH`, model `opencode-go/claude-haiku-5-5`, permission mode Auto, prompt _"Use the code-intelligence skill to check my uncommitted changes. Keep your answer short."_

- The agent read the skill, checked that `code-intel` was available and ran `code-intel scan` (exit 1, `complete: true`, 8 findings: 5 high, 3 medium).
- Its answer listed the AWS-shaped credential (file and line, **value not printed**, advice to rotate), the `eval` of request data, and lodash's advisories with the upgrade advice, and said it changed nothing and had not read the files beyond the findings.
- **A flaw, found when the user asked a follow-up ("is that key real?"):** the agent quoted the first eight characters of the key. The key is a fake, but quoting any part of a secret breaks the skill's rule. The rule is now explicit (skill 0.1.5): never quote any part of a secret, not even a prefix, even when asked.
- Two earlier attempts failed for reasons outside the skill: the default model returned a provider error, and a later attempt hit a provider rate limit; in Auto mode the permission classifier needs a reachable model, so the agent could not run anything until a working model was selected.

One session, explicit prompt only; the natural prompt and the always-on snippet were not tried for Gentle Shell.

## How the skill reaches Gentle Shell

Gentle Shell is built on Pi and reads the shared skills directory, so the same install covers it:

```bash
npx github:micio86dev/code-intelligence-skills install --agent gentle-shell
npx github:micio86dev/code-intelligence-skills install --agent gentle-shell --project
```

- `npx github:micio86dev/code-intelligence-skills install --agent gentle-shell`: ~/.agents/skills/code-intelligence
- `npx github:micio86dev/code-intelligence-skills install --agent gentle-shell --project`: .agents/skills/code-intelligence

Nothing in `code-intelligence` or in `code-intel` refers to Gentle Shell. It does not replace Gentle AI's orchestration, memory, review or permissions; it adds one skill.

## Observed

- The skill directory was visible to the session and the agent tried to read `SKILL.md`; it described the files it could see from `git status` and said it would run the scan once allowed.
- It did **not** run `code-intel`: the session is in a read-only approval mode in which shell commands need an interactive approval. Gentle Shell documents its permission modes (Normal, Auto, YOLO, Super Yolo) as a per-session user choice and says repository settings cannot set them, so a script cannot pre-authorize commands. I did not change that.

## To finish the verification yourself

Start `gentle-shell` in a repository with uncommitted changes and ask "Use the code-intelligence skill to check my uncommitted changes". In **Normal** mode approve the shell commands it requests ("Allow once"). Expect `code-intel doctor`, then `code-intel scan --format json`, then a short answer.

## Review evidence (not possible today)

Gentle AI's `review` lenses are LLM reviewers without tools, and `gentle-ai review` builds their context itself from the frozen candidate; it has no documented input for external evidence. So `code-intel` findings cannot be handed to the lenses, and the skill treats `code-intel` as a step *before* the review (see [`gentle-review-evidence.md`](../../skills/code-intelligence/references/gentle-review-evidence.md)).

## Headless usage: close stdin

As with Pi: `gentle-shell -- -p "..." < /dev/null`.
