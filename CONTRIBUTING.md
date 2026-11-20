# Contributing

```bash
git clone https://github.com/micio86dev/code-intelligence-skills && cd code-intelligence-skills
npm test          # installer behavior, skill constraints, plugin manifests, pack/install/uninstall
```

Requires Node.js 22+. There are no dependencies to install.

## Principles

- **One canonical skill.** Workflow knowledge lives in `skills/code-intelligence/` only. Adapters (Claude plugin manifest, Pi package manifest, installer targets) point at it; they never copy or fork it.
- **Verified or marked unverified.** A compatibility claim in the docs needs a recorded real invocation. Otherwise say "unverified".
- **Skill text is advisory, so make it precise.** Keep `SKILL.md` short; move detail to `references/`. Keep the `description` under 1024 characters and start it with the trigger phrases.
- **The installer stays safe by construction.** Every behavior change needs a test in `test/installer.test.mjs` (foreign directories, symlinks, local edits, dry-run, uninstall).
- Conventional Commits.

## Changing the skill

1. Edit `skills/code-intelligence/**`.
2. Update `CHANGELOG.md`; keep `package.json` and `.claude-plugin/plugin.json` versions equal (a test enforces it).
3. `npm test`. If you have Claude Code: `claude plugin validate .`.
4. Re-run the agent you care about against a scratch repository and record the result in `docs/integrations/`.
