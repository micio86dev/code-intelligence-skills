# Installation

You need two things: the **`code-intel` CLI** (and the scanners you want it to drive) and the **skill** that tells your agent when to use it. They are installed separately and independently, and nothing is installed unless you ask for it.

## 1. The CLI

See [code-intelligence](https://github.com/micio86dev/code-intelligence#install). In short:

```bash
npm install -g code-intelligence
brew install gitleaks semgrep osv-scanner ast-grep
code-intel doctor
```

- `brew install gitleaks semgrep osv-scanner ast-grep`: the engines you want

## 2. The skill, for the agents you use

```bash
npx code-intelligence-skills install --agent claude,pi
npx github:micio86dev/code-intelligence-skills install --agent codex --project
npx github:micio86dev/code-intelligence-skills install --agent all --dry-run
```

- `npx code-intelligence-skills install --agent claude,pi`: from the npm registry; npx github:micio86dev/code-intelligence-skills works too
- `npx github:micio86dev/code-intelligence-skills install --agent codex --project`: this repository only
- `npx github:micio86dev/code-intelligence-skills install --agent all --dry-run`: preview

| Agent | Installed to (user scope) | Project scope (`--project`) |
|---|---|---|
| `claude` | `~/.claude/skills/code-intelligence` | `.claude/skills/code-intelligence` |
| `codex`, `opencode`, `pi`, `gentle-shell` | `~/.agents/skills/code-intelligence` | `.agents/skills/code-intelligence` |

Agents that share a directory are installed once. Alternatives that avoid the installer entirely: the Claude Code plugin (`/plugin marketplace add micio86dev/code-intelligence-skills`) and `pi install git:github.com/micio86dev/code-intelligence-skills`. See [docs/integrations](integrations/) for what has actually been verified for each agent.

## Check, update, remove

What each path leaves behind after removal (observed, 2026-11-20):

- `uninstall` removes the files it installed. The empty `skills/` parent directory it may have created stays.
- Claude Code plugin: `claude plugin uninstall code-intelligence@code-intelligence-skills` and `claude plugin marketplace remove code-intelligence-skills` deactivate it (`installed_plugins.json` is emptied), but Claude Code keeps an inert cached copy under its plugins cache directory.
- Pi: `pi remove git:github.com/micio86dev/code-intelligence-skills` (add `-l --approve` for a project-local install) removes the package and its files.

```bash
code-intelligence-skills status --agent all
npx github:micio86dev/code-intelligence-skills install --agent claude
npx github:micio86dev/code-intelligence-skills uninstall --agent claude
```

- `npx github:micio86dev/code-intelligence-skills install --agent claude`: updates when the version changed
- `npx github:micio86dev/code-intelligence-skills uninstall --agent claude`: removes exactly what was installed

## What the installer will not do

- Overwrite a directory it did not create (it reports `refused` and exits 1).
- Write through a symlink (several people symlink skills into `~/.claude/skills`; those are left alone).
- Replace files you edited, unless you pass `--force`.
- Delete files you added next to the skill: uninstall removes only what the manifest lists and keeps the directory if anything else is in it.
- Touch any agent configuration file. It only creates the one skill directory.
