# Reading `code-intel scan --format json`

Top level: `schemaVersion` (1), `profile`, `target.mode` (`changed|staged|since|all`), `complete`, `durationMs`, `engines[]`, `summary`, `findings[]`, `exitCode`.

## engines[]

`status` is one of `ok`, `findings`, `skipped` (with a `reason`, e.g. "no lockfile or manifest in scope"), `unavailable` (engine not installed; `reason` has the install hint), `timeout`, `error`. Only `unavailable`, `timeout` and `error` make `complete` false. `warnings[]` are non-fatal notes, e.g. a changed source file semgrep skipped because of its default ignores.

## findings[]

| Field | Meaning |
|---|---|
| `severity` | `info < low < medium < high < critical`. The default failing threshold is `high` |
| `category` | `secrets`, `sast`, `deps`, `architecture` |
| `file`, `line`, `endLine` | Repo-relative POSIX path; `line` is `null` for dependency findings (the lockfile is the location) |
| `ruleId` | The engine's rule or advisory id (`GHSA-...`, `aws-access-token`, `semgrep....`) |
| `message`, `remediation` | What is wrong and, where known, how to fix it (`Upgrade lodash to 4.17.21 or later.`) |
| `fingerprint` | Stable across line shifts; use it to say "same finding as before" |
| `alsoReportedBy` | Other engines that found the same secret; already merged, not duplicated |

A finding never contains the matched secret or the source line.

## config

`config.file` (the repository's `.code-intel.json` if present), `config.ignored` (`--ignore-repo-config` was used) and `config.inEffect`: the non-default settings and files the repository supplied (failOn, extra excludes, `.gitleaks.toml`, `.gitleaksignore`, `.semgrepignore`, a baseline). These can make a scan find less; for code you did not write, re-run with `--ignore-repo-config`.

## summary

`bySeverity`, `failOn`, `newOnly`, and `suppressed.{outsideChangedLines, baseline}`: counts of findings hidden on purpose (unchanged lines; already in the baseline). Tell the user when these are non-zero and relevant.

## Baseline

`code-intel baseline` records today's findings; `code-intel scan --new-only` then fails only on new ones. Use only when the user chooses to accept the current state.
