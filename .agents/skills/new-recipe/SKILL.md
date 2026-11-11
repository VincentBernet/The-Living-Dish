---
name: new-recipe
description: Scaffold a new bilingual recipe from the lorem-ipsum-recipe template, including a dedicated renamed image folder, when the user provides a recipe name or slug.
---

# New recipe

Use this skill when the user asks to create a new recipe from the repository’s Lorem Ipsum placeholder recipe. Do not use it to edit an existing recipe; use `recipe-content` for that.

## Workflow

1. Treat the user-provided name as the new recipe name. Normalize it to a lowercase kebab-case slug and use that slug for the recipe filenames, `translationKey`, image directory, image filenames, and image references.
2. Run the scaffold script from the repository root:

   ```sh
   python3 .agents/skills/new-recipe/scripts/create_recipe.py "<recipe name>"
   ```

   Pass `--date YYYY-MM-DD` when the intended publication date is not today.

3. The script copies both `src/content/recipes/{fr,en}/lorem-ipsum-recipe.mdx` files and every image under `public/images/recipes/lorem-ipsum-recipe/`. It replaces the template slug in all copied paths and filenames, sets the title and Markdown heading from the supplied name, updates `translationKey`, and sets both dates to the selected date.
4. Keep the new recipe as `draft: true` until the user explicitly asks to publish it. Do not overwrite an existing recipe file or image directory; resolve the conflict with the user.
5. Confirm the French and English files have the same structure, ingredient order, steps, galleries, sources, and renamed image paths. They should be identical at scaffold time because the template is placeholder content.
6. Run `pnpm run ci`, then inspect the diff and confirm no `lorem-ipsum-recipe` references remain in the new pair or its image directory.

## Completion criteria

- Both locale files exist at the new slug and share its `translationKey`.
- All template images are copied into the new dedicated directory with the new slug in their filenames.
- The new recipe remains a draft and has synchronized dates.
- The pair is schema-valid, formatted, and `pnpm run ci` passes.
