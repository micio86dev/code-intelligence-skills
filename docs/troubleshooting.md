# Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `refused: ... was not installed by this tool` | A different skill called `code-intelligence` already exists there. Rename or remove it yourself; the installer will not touch it |
| `refused: target is a symlink` | The path is a symlink (often to a shared skills folder). Install somewhere else (`--project`) or replace the link deliberately |
| `refused: installed files were modified locally` | You edited the installed copy. Keep your edits and skip the update, or `--force` to replace them. Prefer editing the source repository |
| The agent never uses the skill | Start a new session (most agents read skills at startup). Run `code-intelligence-skills status --agent <x>`; confirm the agent reads that directory (see integration notes); check the agent lists the skill (many have a `/skills` command) |
| The agent says `code-intel: command not found` | The CLI is not on the agent's `PATH`. Install it globally, or start the agent from a shell where it is on `PATH` |
| `code-intel` exits 3 | Not a pass: an engine is missing, timed out or failed. Read `engines[].reason`. In sandboxed agents (for example with network disabled) engines that need network (osv-scanner, semgrep registry rules) cannot run; allow network or use local semgrep rules |
| Nothing was installed | Correct: the installer does nothing without `--agent` |
| Windows | The installer copies files (no symlinks). Paths use your profile directory; use `--home <dir>` to point elsewhere |
