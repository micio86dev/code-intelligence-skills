# Pi

Version tested: **1.5.0** (`pi -p`). **End-to-end execution was not verified.** See [status](README.md).

## Install

```bash
npx github:micio86dev/code-intelligence-skills install --agent pi            # ~/.agents/skills/code-intelligence
npx github:micio86dev/code-intelligence-skills install --agent pi --project  # .agents/skills/code-intelligence
```

Alternative, as a Pi package: `pi install git:github.com/micio86dev/code-intelligence-skills` (the repository's `package.json` has a `pi.skills` entry). **Not verified.**

## Observed

- Pi found the project skill and **read its `SKILL.md`**, then followed its guidance: it said it would not install `code-intel` without permission (the skill's rule), and offered to run `code-intel doctor` and `code-intel scan --format json` once allowed.
- It did **not** run the scan. This Pi setup starts in an *ask* (read-only) mode where shell commands need an interactive approval, which a headless run cannot give. The agent reported this plainly and asked the user to approve or switch mode, without making anything up.
- I did not switch to an auto-approving mode just to obtain a result; that is your decision to make for your own environment.

## To finish the verification yourself

In an interactive Pi session in a repository with changes, ask: "Use the code-intelligence skill to check my uncommitted changes", and approve the shell commands it requests. Expect `code-intel doctor` then `code-intel scan --format json`.

## Headless usage: close stdin

`pi -p` blocks until stdin reaches end of input when stdin is not a terminal (observed: 45 s of no output; with `< /dev/null` it answered in 5 s). In scripts use `pi -p "..." < /dev/null`.
