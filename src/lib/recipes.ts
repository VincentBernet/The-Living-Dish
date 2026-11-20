import { getCollection, type CollectionEntry } from "astro:content";

export type Locale = "fr" | "en";

export function getLocaleFromId(id: string): Locale {
  return id.split("/")[0] as Locale;
}

export function getSlugFromId(id: string): string {
  return id.split("/").slice(1).join("/");
}

const RECIPE_TO_HIDE_LIST = ["lorem-ipsum-recipe", "bolognese-sauce"];

function isAvailableRecipe(recipe: CollectionEntry<"recipes">) {
  if (RECIPE_TO_HIDE_LIST.includes(recipe.data.translationKey)) return false;
  return import.meta.env.PROD ? !recipe.data.draft : true;
}

export async function getRecipesByLocale(locale: Locale) {
  const recipes = await getCollection("recipes", isAvailableRecipe);
  return recipes
    .filter((recipe) => recipe.id.startsWith(`${locale}/`))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getRecipe(locale: Locale, slug: string) {
  const recipes = await getCollection("recipes", isAvailableRecipe);
  return recipes.find((recipe) => recipe.id === `${locale}/${slug}`);
}

export async function getAlternateRecipe(
  recipe: CollectionEntry<"recipes">,
  targetLocale: Locale,
) {
  const recipes = await getCollection("recipes", isAvailableRecipe);
  return recipes.find(
    (entry) =>
      entry.data.translationKey === recipe.data.translationKey &&
      getLocaleFromId(entry.id) === targetLocale,
  );
}

export async function getRecipeRedirects() {
  const recipes = await getCollection("recipes", isAvailableRecipe);
  const canonicalIds = new Set(recipes.map((recipe) => recipe.id));
  const redirects = new Map<string, string>();

  for (const recipe of recipes) {
    const locale = getLocaleFromId(recipe.id) === "fr" ? "en" : "fr";
    const slug = getSlugFromId(recipe.id);
    if (canonicalIds.has(`${locale}/${slug}`)) continue;

    const counterpart = recipes.find(
      (entry) =>
        getLocaleFromId(entry.id) === locale &&
        entry.data.translationKey === recipe.data.translationKey,
    );
    if (counterpart) {
      redirects.set(
        `/${locale}/recipes/${slug}`,
        `/${locale}/recipes/${getSlugFromId(counterpart.id)}/`,
      );
    }
  }

  return redirects;
}
