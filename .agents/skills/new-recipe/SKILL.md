---
name: new-recipe
description: Scaffold a new bilingual recipe from the lorem-ipsum-recipe template using French and English recipe names, with translated slugs and dedicated renamed image assets.
---

# New recipe

Use this skill when the user asks to create a new recipe from the repository’s Lorem Ipsum placeholder recipe. Do not use it to edit an existing recipe; use `recipe-content` for that.

## Workflow

1. Require both the French recipe name and the English recipe name. If either is missing, ask for the missing name before scaffolding. Normalize each name independently to a lowercase kebab-case slug for its locale's filename and URL. Use the French slug as the shared `translationKey` and for the image directory, image filenames, and image references in both locale files.
2. Run the scaffold script from the repository root:

   ```sh
   python3 .agents/skills/new-recipe/scripts/create_recipe.py "<French recipe name>" "<English recipe name>"
   ```

   Pass `--date YYYY-MM-DD` when the intended publication date is not today.

3. The script copies both `src/content/recipes/{fr,en}/lorem-ipsum-recipe.mdx` files and every image under `public/images/recipes/lorem-ipsum-recipe/`. Each locale receives its own filename, title, and Markdown heading from its supplied name; both files reference the shared image directory and `translationKey`. Both dates are set to the selected date.
4. Keep the new recipe as `draft: true` until the user explicitly asks to publish it. Do not overwrite an existing recipe file or image directory; resolve the conflict with the user.
5. Confirm the French and English files have the same structure, ingredient order, steps, galleries, sources, and shared image paths. Their filenames, titles, and Markdown headings reflect their respective input names; the remaining content stays as template placeholders.
6. Run `pnpm run ci`, then inspect the diff and confirm no `lorem-ipsum-recipe` references remain in the new pair or its image directory.

## Completion criteria

- Both locale files exist at their respective localized slugs, with localized titles and headings and the same French-slug `translationKey`.
- All template images are copied into one dedicated directory with the French slug in its path and filenames, referenced by both locale files.
- The new recipe remains a draft and has synchronized dates.
- The pair is schema-valid, formatted, and `pnpm run ci` passes.
