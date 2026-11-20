# Gentle Shell

Version tested: **4.8.0** (`gentle-shell --link -- -p ...`). Gentle Shell is the first integration target, and **end-to-end execution was not verified headlessly**. See [status](README.md).

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
