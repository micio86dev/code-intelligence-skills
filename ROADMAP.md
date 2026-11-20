# Roadmap

Not promises. Nothing here is claimed to work today.

- npm provenance for `0.1.0` to `0.1.3`: those versions were published by hand and have no attestation; npm does not allow adding one later. Releases from `0.1.4` on are published by the workflow with trusted publishing.
- More agents where they read the shared `.agents/skills` directory or ship a documented skill format.
- A short always-on instruction snippet per agent (`snippets/AGENTS.md` exists; per-agent wiring is not automated).
- Review-pipeline evidence: blocked upstream. `gentle-ai review` builds the lenses' context itself from the frozen candidate and has no documented input for external evidence, so `code-intel` findings cannot reach its lenses today. It needs an evidence input in Gentle AI; until then the skill uses `code-intel` as a pre-review step.
- Evals for the skill (does the agent pick the right command for a given situation).
