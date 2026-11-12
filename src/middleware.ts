import { defineMiddleware } from "astro:middleware";
import { getRecipeRedirects } from "./lib/recipes";

// Static deployments use the generated Netlify _redirects file. This also
// handles requests during local development with Astro's native redirect API.
export const onRequest = defineMiddleware(async ({ url, redirect }, next) => {
  if (!/^\/(fr|en)\/recipes\/[^/]+\/?$/.test(url.pathname)) return next();

  const redirects = await getRecipeRedirects();
  const destination = redirects.get(url.pathname.replace(/\/$/, ""));
  if (destination) return redirect(`${destination}${url.search}`, 301);

  return next();
});
