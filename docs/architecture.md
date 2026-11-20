# Architecture

```
code-intelligence-skills
├── skills/code-intelligence/        ← the one canonical skill (SKILL.md + references/)
├── installer/install.mjs                  ← copies it where an agent reads skills (no deps)
├── .claude-plugin/                  ← Claude Code plugin + marketplace manifest → skills/
├── package.json  "pi": {...}        ← Pi / Gentle Shell package manifest        → skills/
└── snippets/AGENTS.md               ← optional always-on hint
```

There is exactly one copy of the workflow knowledge. Each integration is a pointer to it:

| Agent | How it receives the skill |
|---|---|
| Claude Code | plugin (`.claude-plugin/`) or `~/.claude/skills/code-intelligence` via the installer |
| Codex, OpenCode, Pi, Gentle Shell | `~/.agents/skills/code-intelligence` via the installer, or Pi/Gentle Shell package install |

Agent-specific facts (paths, formats) are in the installer's `AGENTS` table and in `docs/integrations/`. They are the only place agent names appear; the `code-intel` CLI has none.

## Why a skill and not an MCP server or plugin code

The CLI already has a stable interface (flags, JSON, exit codes) that every agent can call. A skill only has to teach *when* and *how to interpret*, which is text. No process to run, no per-agent code to keep in sync.

## What this repository does not do

It does not run scans, interpret findings, store memory, orchestrate agents or review code. Those belong to `code-intel`, your agent, and your agent framework respectively.

## Installer state

`<skills-dir>/code-intelligence/.code-intelligence-skills.json` records package, version, time and a SHA-256 per installed file. States: `absent`, `installed`, `modified` (a file differs from the manifest), `foreign` (a directory with a conflicting file and no manifest), `symlink`. Install, update and uninstall refuse on `foreign`, `symlink` and (without `--force`) `modified`.
