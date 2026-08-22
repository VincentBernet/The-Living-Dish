import { getCollection, type CollectionEntry } from 'astro:content';

export type Locale = 'fr' | 'en';

export function getLocaleFromId(id: string): Locale {
	return id.split('/')[0] as Locale;
}

export function getSlugFromId(id: string): string {
	return id.split('/').slice(1).join('/');
}

export async function getRecipesByLocale(locale: Locale) {
	const recipes = await getCollection('recipes');
	return recipes
		.filter((recipe) => recipe.id.startsWith(`${locale}/`))
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getRecipe(locale: Locale, slug: string) {
	const recipes = await getCollection('recipes');
	return recipes.find((recipe) => recipe.id === `${locale}/${slug}`);
}

export async function getAlternateRecipe(
	recipe: CollectionEntry<'recipes'>,
	targetLocale: Locale,
) {
	const recipes = await getCollection('recipes');
	return recipes.find(
		(entry) =>
			entry.data.translationKey === recipe.data.translationKey &&
			getLocaleFromId(entry.id) === targetLocale,
	);
}
