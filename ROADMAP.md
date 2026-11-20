# Roadmap

Not promises. Nothing here is claimed to work today.

- npm provenance: `0.1.0` is on the registry but was published manually from the release tarball, so it has no provenance attestation.
- More agents where they read the shared `.agents/skills` directory or ship a documented skill format.
- A short always-on instruction snippet per agent (`snippets/AGENTS.md` exists; per-agent wiring is not automated).
- Review-pipeline evidence: blocked upstream. `gentle-ai review` builds the lenses' context itself from the frozen candidate and has no documented input for external evidence, so `code-intel` findings cannot reach its lenses today. It needs an evidence input in Gentle AI; until then the skill uses `code-intel` as a pre-review step.
- Evals for the skill (does the agent pick the right command for a given situation).
