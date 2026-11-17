# 🍽️ The Living Dish

![blog](https://img.shields.io/badge/blog-000?style=for-the-badge&logo=googlechrome&logoColor=white)
![tracking dashboard](https://img.shields.io/badge/tracking_dashboard-000?style=for-the-badge&logo=goatcounter&logoColor=white)
![Google Search Console](https://img.shields.io/badge/google_search_console-000?style=for-the-badge&logo=google&logoColor=white)
![Netlify](https://img.shields.io/badge/netlify-000?style=for-the-badge&logo=netlify&logoColor=white)
![Netlify Status](https://api.netlify.com/api/v1/badges/bd3854cb-a227-43fc-9d78-140dbc4f955b/deploy-status)

For me, a dish is a link to the past. When you eat a dish, you become part of a chain of people who have cooked it, shared it, and passed it on before you. The recipe may have changed over time, but what you are cooking is the result of that history and all the small mutations along the way.

A grandmother changes an ingrediendifférentes préparationst. A region adapts to what grows there. A migrant carries a recipe somewhere else. A new ingredient becomes available. A technique evolves. Someone interprets it differently.

By understanding a dish and how it evolved, we can understand a part of the culture that created it. **The history of a dish becomes a lens through which we can see a culture.**

Feature :

- Click on image to zoom on it
- Link with asteric redirect to the given asteric explanation
- Swap gallery for all recipes photos
- Specific units / portions result
- Handle units in metrics 

## Recipe language redirects

When a recipe slug belongs to the other language, the site resolves its
`translationKey` and redirects to the counterpart in the requested language. For
example, `/en/recipes/huile-pimente/` redirects to
`/en/recipes/chili-crisp-oil/` with HTTP 301. Existing canonical routes take
priority; unknown recipes and missing translations retain their 404 behavior.

`src/lib/recipes.ts` generates the redirects from available collection entries.
Astro middleware applies them in local development, preserving query parameters.
The dynamic endpoint `src/pages/[redirects].ts` builds `dist/_redirects`, which
Netlify reads when deploying the existing static output. Netlify sends the HTTP
301 response and forwards query parameters automatically. Static Astro middleware
does not run per request on Netlify, so the generated file must be deployed with
`dist`. Drafts are available locally and excluded from production redirects; the
Lorem Ipsum template is always excluded.

Run `pnpm run test` to validate redirects, canonical URLs, 404 responses, query
parameters, and SEO metadata. The tests build and serve an isolated temporary copy
of the site with extra translation fixtures, then stop its background Astro dev
server and remove the copy. They need permission to bind a localhost port.
`pnpm run ci` runs these tests after the existing checks and build.
