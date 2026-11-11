---
name: recipe-content
description: Maintain bilingual recipe content in this Astro blog. Use when creating, editing, correcting, translating, or auditing recipe MDX files under src/content/recipes, including French spelling corrections, English synchronization, frontmatter, timings, sources, and translation pairs.
---

# Recipe content workflow

## Source of truth

French is authoritative. The matching English file must express the same meaning, structure, and level of detail. Recipe pairs share a `translationKey` and normally live under the same slug, but confirm the actual pair from frontmatter and the collection layout before editing.

## Steps

1. Read the target French file, its English counterpart, and `src/content.config.ts` before editing. Confirm the request is content work rather than a schema or UI change.
2. Make the smallest content change that satisfies the request. For a French correction, change only spelling, grammatical agreement, or verb conjugation; preserve punctuation, phrasing, tone, vocabulary, formatting, structure, and line breaks.
3. Treat the revised French content as the source for the English file. Keep frontmatter fields, ingredient ordering, step ordering, notes, galleries, and source structure aligned unless the content itself requires a deliberate locale-specific difference.
4. Normalize time expressions inside `steps` and step notes: use `s`, `min`, or `h`, with a space and no plural. Use `à` in French ranges and `to` in English ranges. Keep full unit names only in prose outside recipe steps.
5. When an existing recipe changes, set `updatedDate` to today in `YYYY-MM-DD` format in both locale files. Do not change `pubDate` unless explicitly requested.
6. Validate frontmatter against `src/content.config.ts`: preserve valid enum values, URLs, image paths, `translationKey`, and the required recipe fields. Keep quantities numeric and omit `quantity` when an ingredient has no fixed amount.
7. Run `$project-verification` before reporting completion. Inspect the final diff to confirm both locale files changed together and no unrelated content moved.

## New recipes

Create both locale files, use the same `translationKey`, and keep the slug and collection layout consistent with existing recipes. No page change is needed for a normal recipe because the existing dynamic routes generate recipe paths from the collection.

## Completion criteria

- The requested French content is corrected or added without unrequested stylistic rewriting.
- The English counterpart matches the French source in meaning and structure.
- Both files satisfy the content schema and have synchronized `updatedDate` values when applicable.
- Recipe-step timings follow the project abbreviations and locale-specific range rules.
- Verification passes, or any failure is reported with its exact command and cause.
