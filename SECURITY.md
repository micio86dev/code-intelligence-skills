# Security policy

Please report suspected vulnerabilities **privately** through GitHub's "Report a vulnerability" button on this repository's Security tab, not as a public issue. Include the version (`code-intelligence-skills --version`), the command, and a minimal reproduction.

Scope: the installer (`installer/install.mjs`) and the skill content. Vulnerabilities in the `code-intel` CLI belong in [its repository](https://github.com/micio86dev/code-intelligence); vulnerabilities in the scanners it drives belong to those projects.

## What the installer promises

- It writes only inside the skill directory it installs (`.../skills/code-intelligence`), never elsewhere. Manifest entries must be plain relative paths (no `..`, no absolute paths, a restricted character set); anything else makes the manifest invalid and the directory is refused.
- In `--project` mode (the repository is untrusted) it refuses symlinks anywhere between the repository root and the skill directory; in user scope it refuses symlinks at or below the skill directory (a symlinked `~/.claude` from a dotfile manager keeps working).
- Known limit: checks happen at install time, not atomically with the write, so there is no protection against another process racing on the same directory.
- It never overwrites a directory it did not create, never writes through a symlink, and never deletes files it did not install.
- It records what it installed (with SHA-256 hashes) in `.code-intelligence-skills.json`; uninstall removes exactly those files.
- It makes no network requests, runs no subprocesses and has no dependencies.

These properties are covered by `test/installer.test.mjs`.

## What the skill asks of agents

The skill instructs agents never to print or commit a secret value, not to install tools silently, and not to edit configuration or baselines to hide findings. A skill is advisory text: it cannot technically enforce this on a given agent.
