# Scopes, profiles and cost

| Flag | Scope |
|---|---|
| (none) / `--changed` | Uncommitted changes vs `HEAD`, plus untracked files |
| `--staged` | Only what is staged |
| `--since <ref>` | Working tree vs a ref, e.g. `main` |
| `--all` | Whole repository |

| Profile | Categories | Per-engine time limit |
|---|---|---|
| `quick` (default) | secrets (gitleaks), sast (semgrep), deps (osv-scanner, trivy fallback) | 60 s |
| `deep` | + architecture (ast-grep rules from the project's `sgconfig.yml`) | 10 min |

Typical quick scan of a few changed files: a few seconds (semgrep start-up dominates). Select engines with `-e secrets,sast,deps,architecture` or by engine name.

## Other commands

- `code-intel impact [--staged | --since <ref>] --json`: tests affected by the change. `method: "codegraph"` is transitive (needs `codegraph init` once); `method: "heuristic"` lists only direct importers and name matches and says so in `notes`.
- `code-intel mutate [files] [--min-score N] --json`: JavaScript/TypeScript only, needs `@stryker-mutator/core` in the project. Mutates only the changed lines. Minutes, not seconds. Keep the project's `npm test` to tests only (a linter in it makes every mutant look killed). A score of 0% usually means the test command ran no tests.

## When something is missing

`unavailable` engines print an install hint. Offer it to the user; do not run installers yourself. `--allow-missing` downgrades a missing engine to a warning: only use it if the user accepts that check not running.
