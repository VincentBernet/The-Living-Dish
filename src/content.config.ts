import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const recipeSchema = z.object({
	title: z.string(),
	description: z.string(),
	pubDate: z.coerce.date(),
	prepTime: z.number(),
	cookTime: z.number(),
	servings: z.number(),
	difficulty: z.enum(['easy', 'medium', 'hard']),
	tags: z.array(z.string()).default([]),
	image: z.string().optional(),
	translationKey: z.string(),
	ingredients: z.array(
		z.object({
			quantity: z.number().optional(),
			unit: z.string().optional(),
			item: z.string(),
		}),
	),
	steps: z.array(z.string()),
});

export const collections = {
	recipes: defineCollection({
		loader: glob({ base: './src/content/recipes', pattern: '**/*.{md,mdx}' }),
		schema: recipeSchema,
	}),
};
