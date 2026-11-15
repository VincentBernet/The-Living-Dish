# The Living Dish

This is a bilingual French/English Astro 7 food-history blog. French is the default locale and the source of truth for recipe content. The editorial goal is to use dishes as a way to explain culture, history, technique, and change over time.

## Always-on rules

- Keep changes minimal and scoped to the request.
- Prefer `.astro` components for static UI. Use React islands only when client-side state or interaction is required.
- Keep shared application logic in `src/lib/`; use the existing helpers in `src/lib/recipes.ts` for recipe collection queries and locale handling.
- Keep French and English pages structurally mirrored, changing only locale-specific values and copy.
- Preserve existing user changes and inspect the diff before finishing.

### Recipe content

- Recipe files live at `src/content/recipes/{locale}/{slug}.mdx`; locales are `fr` and `en`.
- A French/English pair must share the same `translationKey`.
- Keep structured recipe data in frontmatter and cultural or historical narrative in the MDX body.
- French corrections are limited to spelling, grammatical agreement, and verb conjugation. Preserve meaning, punctuation, phrasing, tone, vocabulary, structure, formatting, and line breaks unless a rewrite is explicitly requested.
- When French recipe content changes, update the corresponding English file to the same meaning, structure, and level of detail. French is the source of truth.
- Write French recipe `steps` in the second-person plural imperative with implicit vouvoiement: « Épluchez l'oignon », « Faites chauffer l'huile », « Versez le fumet ». Keep instructions direct and omit the explicit pronoun « vous » whenever possible.
- In recipe steps, write time units as `s`, `min`, and `h`, with a space and no plural. Use `à` for French ranges and `to` for English ranges. Outside steps, full unit names are allowed when natural.
- Whenever an existing recipe is updated, set `updatedDate` in both locale files to the current date in `YYYY-MM-DD` format.

## Project map

- Content: `src/content/recipes/{locale}/{slug}.mdx`
- Content schema: `src/content.config.ts`
- Pages: `src/pages/{locale}/` with mirrored `fr` and `en` routes
- Shared recipe helpers: `src/lib/recipes.ts`
- Components: `src/components/`
- Layout: `src/layouts/Layout.astro`
- Theme and global prose styles: `src/styles/global.css`

## Skills

Use the repo-local skills in `.agents/skills/` when their trigger matches:

- `$recipe-content` for creating, editing, correcting, translating, or auditing recipe MDX and its French/English pair.
- `$new-recipe` for scaffolding a new bilingual recipe from the Lorem Ipsum template with dedicated renamed image assets.
- `$astro-ui` for Astro pages/components, React islands, routing, layout, Tailwind, or global styling changes.
- `$project-verification` after source, content, configuration, or build changes to run the repository checks and report failures precisely.

## Development

Use pnpm, matching the pinned `packageManager` in `package.json`.

When starting the dev server, use background mode:

```sh
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status`, and `astro dev logs`.

The normal definition of done is:

```sh
pnpm run ci
```

## Astro documentation

Consult the relevant official guide before routing, component, framework, content, styling, or internationalization changes:

- https://docs.astro.build/en/guides/routing/
- https://docs.astro.build/en/basics/astro-components/
- https://docs.astro.build/en/guides/framework-components/
- https://docs.astro.build/en/guides/content-collections/
- https://docs.astro.build/en/guides/styling/
- https://docs.astro.build/en/guides/internationalization/
