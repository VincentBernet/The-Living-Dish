// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://thelivingdish.com",
  integrations: [
    mdx(),
    react(),
    sitemap({
      filter: (page) => page !== "https://thelivingdish.com/",
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: "fr",
    locales: ["fr", "en"],
    routing: { prefixDefaultLocale: true },
  },
});
