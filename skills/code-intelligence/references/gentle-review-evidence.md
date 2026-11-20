# Scanner evidence around Gentle AI review

Gentle AI's `gentle-ai review` runs LLM reviewer subagents (risk, resilience, readability, reliability) over a frozen diff. Those reviewers have no tools: they cannot run commands. The `risk` lens asks for "concrete exploit or scanner evidence", but nothing can carry that evidence to it today (see below).

What this does and does not do, checked against `gentle-ai review` (help text and its documented lifecycle):

- **Does:** run `code-intel scan --format json` (and `--since <base>` for a branch) *before* starting a review and fix what it reports, so the frozen candidate the lenses see no longer contains known scanner findings. Keep the evidence block below in the commit or pull request description, or in the context of any subagent *you* launch yourself.
- **Cannot today:** put that block in front of the `gentle-ai review` lenses. `gentle-ai review` builds each reviewer's context itself, from the frozen candidate, and its provider transports relay opaque bytes only; it has no documented input for external evidence, and the lenses have no tools to run `code-intel` themselves. So the `risk` lens does not receive this evidence through any path this project can build. Do not tell the user the review "included scanner evidence".
- **Needs upstream support:** an evidence input on `gentle-ai review` (for example a file of findings that is frozen together with the candidate). Until Gentle AI offers one, this stays a pre-review step.

## Evidence block (for the commit, the pull request, or a subagent you launch)

```
Scanner evidence (code-intel 0.1.0, profile quick, scope: changed, complete: true)
- HIGH  semgrep  src/auth.ts:42  <ruleId>: <message>   fix: <remediation>
- MEDIUM osv-scanner  package-lock.json  GHSA-xxxx: lodash@4.17.15 ...   fix: Upgrade lodash to 4.17.21
Not run: osv-scanner (unavailable: not installed)
```

Rules: include `complete` and every engine that did not run; list findings by rule id, location, severity and remediation; never include secret values; do not claim "no vulnerabilities", say "these checks found nothing".
