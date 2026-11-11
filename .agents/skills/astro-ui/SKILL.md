---
name: astro-ui
description: Change Astro UI and application structure in this project. Use when editing .astro pages or components, React islands, layouts, routes, locale navigation, Tailwind styles, global CSS, or shared recipe data access.
---

# Astro UI workflow

## Architecture

- Use `.astro` components for static UI such as headers, cards, lists, and recipe sections.
- Use a `.tsx` React island only when client-side state or interaction is needed, and keep hydration directives deliberate and minimal.
- Type Astro component props with an `interface Props`; import `Locale` from `src/lib/recipes.ts` for locale-typed props.
- Pass `locale` through `Layout` so the document language, navigation, and language switcher remain consistent.
- Fetch collection data in Astro frontmatter and reuse `src/lib/recipes.ts` helpers instead of duplicating queries.

## Routing and internationalization

1. Read the relevant Astro routing, component, framework, styling, content, or internationalization guide before changing that surface.
2. Keep `src/pages/fr/` and `src/pages/en/` structurally mirrored. Change locale constants, translated labels, and locale-specific copy together.
3. Use `getStaticPaths()` for dynamic recipe routes and preserve the existing redirect or missing-content behavior.
4. When a recipe page or switcher changes, verify alternate links still resolve through `translationKey` and the locale-specific slug.

## Styling

- Prefer the existing Tailwind utility classes and design tokens (`warm-*`, `cream`, and `accent`).
- Use `.recipe-prose` for recipe body typography.
- Add global CSS only for theme tokens, shared prose rules, or behavior that cannot be expressed locally.
- Preserve the existing visual language and responsive behavior; inspect nearby components before introducing a new pattern.

## Steps

1. Inspect the existing component/page, its consumers, and nearby locale counterpart before editing.
2. Make the smallest change that preserves the current data flow and public props.
3. Keep data fetching in frontmatter and presentation in the template; keep client state inside the island that owns it.
4. Run `$project-verification`. If the change affects a visible interaction or layout, start `astro dev --background` and use its status/log commands while checking the result.
5. Inspect the final diff for mirrored locale changes, accidental global-style changes, and unused imports.

## Completion criteria

- The requested UI or application behavior works in both locales where applicable.
- Astro and TypeScript conventions remain consistent with surrounding code.
- Styling uses existing tokens and avoids unnecessary global CSS.
- Verification passes, or any failure is reported with its exact command and cause.
