---
name: project-verification
description: Verify changes in this Astro project after source, recipe content, configuration, styling, or build-workflow edits. Run the repository checks in the required order and report actionable failures before declaring the work complete.
---

# Project verification workflow

## Required checks

Run the project’s canonical CI command from the repository root:

```sh
pnpm run ci
```

This runs, in order:

1. `pnpm run lint`
2. `pnpm run prettier`
3. `pnpm run tsc`
4. `pnpm run build`

Use the individual commands only when isolating a failure or when the user asks for a narrower check. Keep the package manager aligned with the pinned `pnpm` version in `package.json`.

## Failure handling

- Read the first relevant error and inspect the changed files before changing anything else.
- Fix only failures caused by the task; report unrelated pre-existing failures separately.
- Re-run the failed check, then re-run `pnpm run ci` so the complete sequence is green.
- For content changes, confirm Astro content validation and the French/English pair both passed.
- For UI changes, confirm the build completed and check a visible interaction or route in the background dev server when practical.

## Completion criteria

- `pnpm run ci` exits successfully after the final edit.
- The final diff contains only task-related files.
- Any verification limitation, pre-existing failure, or untested visual behavior is stated explicitly.
