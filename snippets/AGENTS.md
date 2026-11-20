## Code intelligence (optional always-on hint)

When a change touches input handling, authentication, SQL, shell commands, file paths, cryptography, dependencies or secrets, run `code-intel scan --format json` before reporting the work done, and treat exit code 3 as "checks did not complete", never as a pass. Do not scan after every edit and do not run `deep` or `mutate` unprompted. Details: the `code-intelligence` skill.
