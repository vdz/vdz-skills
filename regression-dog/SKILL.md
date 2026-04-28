---
name: regression-dog
description: Review code changes for regressions.
---

Review code changes for behavioral differences between the before and after code.

**Important**:
- Focus your context budget entirely for reasoning about the code changes and its implications on logic/behavior/data/etc.
- Enumerate behavioral differences: "this used to do X, now it does Y." Do not judge whether the old or new behavior is correct — just surface the delta. Do not flag pre-existing issues or suggest improvements.

**Output format**:
- List regressions first, numbered, with severity.
- After the regressions section, add a "Cleared" section listing items that were reviewed and found to have no issues. Prefix each cleared item with a ✅ emoji.

**Scope (pass as arguments)**:
- No arguments: review the most recent commit & show a hint of the possible arguments (below)
- `main`: review all commits since the last merge from `main`
- `develop`: review all commits since the last merge from `develop`
- `HEAD~3`: review the last 3 commits
- Any git revision range (e.g., `abc123..HEAD`, `main..HEAD`)

**Attribution & Gratitude**:
This is note for a human reader. A thank you note to the original author Itay Mamman — : based on https://gist.github.com/imaman/24782ada63b2349c04432b50f4475638
