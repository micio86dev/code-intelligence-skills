# Changelog

## [0.1.3]

### Fixed

- Documentation: `gentle-ai review` cannot receive external evidence (it builds its lenses' context from the frozen candidate), so the skill and the docs no longer suggest handing `code-intel` findings to its lenses; `code-intel` is a pre-review step.

### Added

- Release workflow: opt-in npm trusted publishing with provenance.

## [0.1.2]

### Fixed

- Documentation: shell code blocks no longer carry `# comments` (in interactive zsh, the macOS default, they are passed to the command as arguments). Comments now sit in a list below each block.

## [0.1.1]

### Changed

- README: a five-minute first-use guide, npm registry install instructions, and uninstall details per agent. Documentation only; no code change.

## [0.1.0]

### Added
- The `code-intelligence` agent skill (one canonical `SKILL.md` plus references) for the `code-intel` CLI.
- `code-intelligence-skills` installer: Claude Code, Codex, OpenCode, Pi and Gentle Shell; project or user scope; dry-run; ownership manifest; refuses foreign directories and symlinks; clean uninstall.
- Claude Code plugin and marketplace manifests; Pi package manifest.
