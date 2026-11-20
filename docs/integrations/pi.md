# Pi

Version tested: **1.5.0** (`pi -p`). Verified end to end on 2026-11-20 with the explicit prompt, **with the gentle-pi extension disabled** (see Observed). See [status](README.md).

## Observed

One headless run (`pi -ne --tools read,bash --model opencode-go/claude-haiku-5-5 --mode json -p --no-session`) in a throwaway git repository with the skill installed at project level, the published `code-intel` 0.1.4 on `PATH`, and the prompt _"Use the code-intelligence skill to check my uncommitted changes. Keep your answer short."_

- Pi read `SKILL.md`, then ran `git status --short`, `code-intel doctor` and `code-intel scan --format json` (exit 1).
- Its answer listed the AWS-shaped credential (file and line, **value not printed**, advice to rotate), the `eval` of request data, and lodash's three high-severity advisories with the upgrade advice, and said it changed nothing.
- One wording flaw in that answer: its first sentence called the check "incomplete as coverage" although every engine had run.

What this does **not** show: `-ne` turns off all Pi extensions, including the approval layer that gentle-pi adds, so this run was not gated by that layer (it was run on purpose, by the user's decision, in a throwaway directory with only the `read` and `bash` tools). It is one run, with the explicit prompt only; a natural prompt and the always-on snippet were not tried for Pi. Gentle Shell, which is Pi plus that extension, remains unverified.

## Install

```bash
npx github:micio86dev/code-intelligence-skills install --agent pi
npx github:micio86dev/code-intelligence-skills install --agent pi --project
```

- `npx github:micio86dev/code-intelligence-skills install --agent pi`: ~/.agents/skills/code-intelligence
- `npx github:micio86dev/code-intelligence-skills install --agent pi --project`: .agents/skills/code-intelligence

Alternative, as a Pi package: `pi install git:github.com/micio86dev/code-intelligence-skills` (the repository's `package.json` has a `pi.skills` entry). Install and removal (`pi remove`) were verified project-locally; use of the skill through the package route was not tested.

## Observed

- Pi found the project skill and **read its `SKILL.md`**, then followed its guidance: it said it would not install `code-intel` without permission (the skill's rule), and offered to run `code-intel doctor` and `code-intel scan --format json` once allowed.
- It did **not** run the scan. This Pi setup starts in an *ask* (read-only) mode where shell commands need an interactive approval, which a headless run cannot give. The agent reported this plainly and asked the user to approve or switch mode, without making anything up.
- I did not switch to an auto-approving mode just to obtain a result; that is your decision to make for your own environment.

## To finish the verification yourself

In an interactive Pi session in a repository with changes, ask: "Use the code-intelligence skill to check my uncommitted changes", and approve the shell commands it requests. Expect `code-intel doctor` then `code-intel scan --format json`.

## Headless usage: close stdin

`pi -p` blocks until stdin reaches end of input when stdin is not a terminal (observed: 45 s of no output; with `< /dev/null` it answered in 5 s). In scripts use `pi -p "..." < /dev/null`.
