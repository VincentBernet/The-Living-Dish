import type { APIRoute } from "astro";
import { getRecipeRedirects } from "../lib/recipes";

// A dynamic endpoint is needed because Astro ignores filenames starting with _.
export function getStaticPaths() {
  return [{ params: { redirects: "_redirects" } }];
}

export const GET: APIRoute = async () => {
  const redirects = await getRecipeRedirects();
  const rules = [...redirects].map(
    ([from, destination]) => `${from} ${destination} 301`,
  );

  // Netlify forwards query parameters automatically for these 301 rules.
  return new Response(`${rules.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
