---
name: code-intelligence
description: "Trigger: security check, is this change safe, scan for secrets or vulnerabilities, vulnerable dependencies, which tests are affected by my change, are my tests good enough, mutation testing, before commit or PR. Runs the `code-intel` CLI to get deterministic evidence (gitleaks, semgrep, osv-scanner, ast-grep architecture rules, codegraph, StrykerJS) about the files that changed. Not for general code review, style or refactoring."
compatibility: "Needs the code-intel CLI (https://github.com/micio86dev/code-intelligence) on PATH and a git repository. Engines (gitleaks, semgrep, osv-scanner, ...) are installed separately by the user."
metadata:
  repository: https://github.com/micio86dev/code-intelligence-skills
---

# code-intelligence

`code-intel` runs real scanners on **what changed** and prints normalized findings. It gives you evidence; interpreting it and acting on it is your job. It has no LLM and no background process.

## First use in a repository

1. `command -v code-intel`. If it is missing, **tell the user** how to install it (README of the code-intelligence repository). Do not install tools silently.
2. `code-intel doctor`. A missing engine is reported, not fatal. Mention what is missing; do not install engines without asking.

## Pick the smallest check that answers the question

| Situation | Command | Cost |
|---|---|---|
| You changed code that touches input handling, auth, SQL, shell, crypto, file paths, dependencies, config or secrets, and are about to call the work done | `code-intel scan --format json` | seconds |
| Before a commit | `code-intel scan --staged --format json` | seconds |
| Before a PR, whole branch | `code-intel scan --since <base-branch> --format json` | seconds |
| "Which tests should I run for this change?" | `code-intel impact --json` | seconds |
| "Are my tests good enough?" or risky logic is about to merge (JS/TS) | `code-intel mutate --json` | minutes |
| The user asks for a full audit | `code-intel scan --all -p deep --format json` | slow: ask first |

**Do not** scan after every edit, on documentation-only changes, or run `deep` / `mutate` unprompted. They cost time the user is waiting for.

## Reading the result

- **Exit code** `0` ok · `1` findings at or above the threshold · `2` usage/config error · **`3` incomplete: not a pass.**
- `complete: false` means some engine did not run (`engines[].status` is `unavailable`, `timeout` or `error`, with a `reason`). Say which checks did not run. Never report "clean" or "secure" for an incomplete scan.
- Each finding has `severity`, `file`, `line`, `ruleId`, `message`, `remediation`, a stable `fingerprint`, and `alsoReportedBy`.
- `summary.suppressed.outsideChangedLines > 0` means SAST findings on lines the change did not touch were hidden on purpose. Mention it when the change is security-sensitive; `--all` shows them.
- `config.inEffect` lists settings the **repository itself** supplied (`.code-intel.json`, `.gitleaks.toml`, a baseline...). A repository can configure a scan to find less. If it is non-empty and you are reviewing code you did not write, say so, and re-run with `--ignore-repo-config`.
- No findings means "these checks found nothing". It is not proof of safety. Say it that way.

Field details: `references/findings.md`. Which command for which situation: `references/profiles.md`.

## Acting on findings

- Fix real problems in the code you changed, then **re-run the same command** to confirm.
- **Secrets:** never print, copy or commit the value. Tell the user to rotate the credential; removing it from the file is not enough once it was committed.
- **Dependencies:** upgrade as `remediation` says, then run the project's tests.
- **False positive:** explain why in one or two sentences. Suppress only with the user's agreement, narrowly and with a reason (`# nosemgrep: <rule-id>` on the line, or a `.gitleaksignore` entry).
- **Do not** edit `.code-intel.json`, the baseline, `.gitleaks.toml` or exclude globs to make findings disappear. `code-intel baseline` is for when the user decides to accept the current state.
- **mutate:** a surviving mutant is a behavior change your tests did not notice. Add or strengthen a test for that line, then re-run on that file.

## Privacy

`osv-scanner` sends package names and versions from lockfiles to the OSV API, and semgrep registry rulesets download rules (no source code leaves the machine). If the user forbids that, run `code-intel scan -e secrets,sast` with local semgrep rules.

## Feeding a review

When a reviewer or review tool asks for scanner evidence, give it the findings (rule, file:line, severity, remediation) from the JSON, never a secret value. See `references/gentle-review-evidence.md`.

## References (load only when needed)

- `references/findings.md`: JSON fields, severities, fingerprints, baseline
- `references/profiles.md`: scopes, profiles, engines, what each costs
- `references/gentle-review-evidence.md`: passing evidence to Gentle AI review lenses
- `references/property-testing.md`: when and how to add property-based tests (technique, no engine)
