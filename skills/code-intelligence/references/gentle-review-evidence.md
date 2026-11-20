# Passing scanner evidence to Gentle AI review lenses

Gentle AI's `gentle-ai review` runs LLM reviewer subagents (risk, resilience, readability, reliability) over a frozen diff. Those reviewers have no tools: they cannot run commands. The `risk` lens asks for "concrete exploit or scanner evidence". The parent agent (you) can supply it.

What this integration does and does not do:

- **Does:** you run `code-intel scan --format json` (and `--since <base>` for a branch) *before* delegating or starting a review, and include a short evidence block in the context you hand over.
- **Does not:** modify or hook into `gentle-ai review`, its receipts, or its frozen context. That pipeline is owned by Gentle AI. This path has not been validated end to end through `gentle-ai review` itself.

## Evidence block (paste into the review context)

```
Scanner evidence (code-intel 0.1.0, profile quick, scope: changed, complete: true)
- HIGH  semgrep  src/auth.ts:42  <ruleId>: <message>   fix: <remediation>
- MEDIUM osv-scanner  package-lock.json  GHSA-xxxx: lodash@4.17.15 ...   fix: Upgrade lodash to 4.17.21
Not run: osv-scanner (unavailable: not installed)
```

Rules: include `complete` and every engine that did not run; list findings by rule id, location, severity and remediation; never include secret values; do not claim "no vulnerabilities", say "these checks found nothing".
