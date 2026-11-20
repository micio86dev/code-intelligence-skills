# code-intelligence-skills

The agent-integration layer for [`code-intelligence`](https://github.com/micio86dev/code-intelligence) (the `code-intel` CLI). It contains **one canonical skill** that teaches an AI coding agent *when* to run `code-intel`, how to read its JSON, and what to do (and not do) with the findings, plus a small installer and the manifests that let each agent pick it up.

The CLI does the deterministic work (secret, SAST, dependency and architecture scans on the files you changed; affected tests; mutation testing). The skill is the agent-facing instruction manual for it. Nothing here runs a scan.

## What problem it solves

Without guidance an agent either never runs the scanners, or runs a full scan after every edit and burns your time. The skill encodes the middle path:

- run `code-intel scan --format json` once, after a security-relevant change, before saying "done";
- treat exit code 3 ("incomplete") as **not a pass** and say which checks did not run;
- never print or commit a secret, never silence findings by editing config, never install tools without asking;
- use `impact` to choose tests, and `mutate` only when test quality is the question.

See [`skills/code-intelligence/SKILL.md`](skills/code-intelligence/SKILL.md): it is short on purpose.

## What it deliberately does not do

- **No orchestration, memory, model selection, skill management or code review.** Those belong to your agent framework. This repository does not replace Gentle AI, Gentle Shell, or any agent: it adds one skill to them.
- **No code of its own that scans anything**, no MCP server, no daemon, no hooks, no background process.
- **No per-agent copies of the workflow.** One `SKILL.md`; every integration points at it.
- **No installation unless you name an agent**, and it never modifies an agent's configuration files.

## Install

Install the CLI first ([instructions](https://github.com/micio86dev/code-intelligence#install)), then the skill for the agents you actually use:

```bash
npx github:micio86dev/code-intelligence-skills install --agent claude,pi
npx github:micio86dev/code-intelligence-skills install --agent codex --project    # this repository only
npx github:micio86dev/code-intelligence-skills install --agent all --dry-run      # preview, change nothing
```

`--agent` takes `claude`, `codex`, `opencode`, `pi`, `gentle-shell` (comma separated) or `all`. Details, paths and alternatives (Claude Code plugin, `pi install`) are in [docs/installation.md](docs/installation.md).

| Agent | Skill location (user scope) |
|---|---|
| Claude Code | `~/.claude/skills/code-intelligence` |
| Codex, OpenCode, Pi, Gentle Shell | `~/.agents/skills/code-intelligence` |

## First use (five minutes)

1. **Install the CLI and the scanners** the skill relies on (the skill never installs anything by itself):
   ```bash
   npm install -g code-intelligence
   brew install gitleaks semgrep osv-scanner      # or follow what `code-intel doctor` prints
   code-intel doctor
   ```
2. **Install the skill** for your agent, then check it landed:
   ```bash
   npx code-intelligence-skills install --agent claude     # or codex, opencode, pi, gentle-shell
   npx code-intelligence-skills status --agent claude
   ```
3. **Ask your agent explicitly**, in a repository with uncommitted changes: _"Use the code-intelligence skill to check my changes."_ It should run `code-intel doctor` and then `code-intel scan --format json`, and report findings with their severity and a fix. Vague requests such as "is this safe?" may be answered with the agent's own built-in tools instead; the per-agent results are below.
4. **To see it catch something**, follow the ten-minute [first test in the CLI README](https://github.com/micio86dev/code-intelligence#first-test-10-minutes-nothing-touches-your-real-projects) first (it needs no agent), then repeat step 3 inside that throwaway repository.
5. **Remove it** whenever you like: `npx code-intelligence-skills uninstall --agent claude` removes exactly what was installed.

## Verification status per agent

Whether each agent really discovers and *uses* the skill was tested by running it headless on a throwaway repository, and the results, limitations and exact versions are recorded in **[docs/integrations/](docs/integrations/README.md)**. An agent is only listed as working there if a real invocation was observed. Anything not observed is marked **unverified**.

## Use with several agents

All agents read the same skill text and call the same CLI, so the behavior is consistent. Install it for each agent you use; agents that share `~/.agents/skills` need it only once.

## Update, disable, remove

```bash
code-intelligence-skills status --agent all
npx github:micio86dev/code-intelligence-skills install --agent claude      # update
npx github:micio86dev/code-intelligence-skills uninstall --agent claude    # removes exactly what it installed
```

The installer records what it installed in `.code-intelligence-skills.json`. It refuses to overwrite a directory it did not create, never writes through a symlink, never replaces files you edited unless you pass `--force`, and keeps any file you added next to the skill when uninstalling. To remove everything: run `uninstall --agent all` (and `--project` for per-repository installs), then uninstall the CLI.

## Layout

```
skills/code-intelligence/     the skill (SKILL.md + references/)
installer/install.mjs         zero-dependency installer
.claude-plugin/               Claude Code plugin + marketplace manifest (points at skills/)
package.json  "pi"            Pi / Gentle Shell package manifest (points at skills/)
snippets/AGENTS.md            optional always-on hint
docs/                         installation, architecture, integrations, troubleshooting
```

## Documentation

[Installation](docs/installation.md) · [Architecture](docs/architecture.md) · [Integration guides](docs/integrations/README.md) · [Troubleshooting](docs/troubleshooting.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md) · [Roadmap](ROADMAP.md)

## License

MIT
