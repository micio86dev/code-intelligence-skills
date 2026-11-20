# Roadmap

Not promises. Nothing here is claimed to work today.

- npm registry publishing (needs an npm account and token).
- More agents where they read the shared `.agents/skills` directory or ship a documented skill format.
- A short always-on instruction snippet per agent (`snippets/AGENTS.md` exists; per-agent wiring is not automated).
- Review-pipeline evidence: a validated path for handing `code-intel` findings to Gentle AI's review lenses. Today the skill tells the parent agent to include them in the context it hands over, which has not been verified end to end through `gentle-ai review`.
- Evals for the skill (does the agent pick the right command for a given situation).
