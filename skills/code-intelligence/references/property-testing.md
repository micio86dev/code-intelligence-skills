# Property-based testing (technique, not an engine)

`code-intel` does not run property-based tests: they are a test-library technique, so there is nothing to wrap. Suggest them when `code-intel mutate` shows survivors in pure logic (parsers, validators, serializers, arithmetic, sorting/merging, state machines), because properties cover input ranges that hand-picked examples miss.

| Language | Library |
|---|---|
| JavaScript/TypeScript | `fast-check` |
| Python | `hypothesis` |
| Rust | `proptest` |
| Go | `testing/quick`, `gopter` |

Useful properties: round-trip (`decode(encode(x)) == x`), idempotence (`f(f(x)) == f(x)`), invariants (sorted output is a permutation of the input), "never throws" for arbitrary input, and agreement with a slow, obviously-correct reference implementation.

Workflow: take a surviving mutant, state the property it violates, write it as a property test, re-run `code-intel mutate <file>` and confirm the mutant is now killed. Keep generators small and seeds reproducible. Do not add the dependency without asking the user.
