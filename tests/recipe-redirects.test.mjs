import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const project = fileURLToPath(new URL("../", import.meta.url));
const cli = path.join(project, "node_modules/astro/bin/astro.mjs");
const site = "https://thelivingdish.com";
const pairs = [
  ["huile-pimente", "chili-crisp-oil"],
  ["nouille-dandan", "dan-dan-noodles"],
  ["pickles-oignon-rouge", "pickled-red-onions"],
  ["sauce-bolognaise", "ragu-alla-bolognese"],
];
let root;
let origin;
let recipes;

function astro(...args) {
  return run(process.execPath, [cli, ...args, "--root", root], {
    cwd: root,
    timeout: 60_000,
    maxBuffer: 2 * 1024 * 1024,
  });
}

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

before(
  async () => {
    root = await realpath(
      await mkdtemp(path.join(tmpdir(), "living-dish-redirects-")),
    );
    await cp(path.join(project, "src"), path.join(root, "src"), {
      recursive: true,
    });
    for (const file of ["astro.config.mjs", "package.json", "tsconfig.json"]) {
      await cp(path.join(project, file), path.join(root, file));
    }
    await symlink(
      path.join(project, "node_modules"),
      path.join(root, "node_modules"),
      "dir",
    );

    // Add fixtures only in the temporary site, never in the user's recipe files.
    for (const locale of ["fr", "en"]) {
      const templateSlug =
        locale === "fr" ? "nouille-dandan" : "dan-dan-noodles";
      const template = await readFile(
        path.join(root, `src/content/recipes/${locale}/${templateSlug}.mdx`),
        "utf8",
      );
      for (const [slug, key, draft] of [
        [`only-${locale}`, `only-${locale}`, false],
        ["shared-slug", `unrelated-${locale}`, false],
        [
          `translated-${locale}`,
          `unrelated-${locale === "fr" ? "en" : "fr"}`,
          false,
        ],
        [`draft-counterpart-${locale}`, "draft-counterpart", locale === "en"],
      ]) {
        await writeFile(
          path.join(root, `src/content/recipes/${locale}/${slug}.mdx`),
          template.replace(
            /^translationKey:.*$/m,
            `draft: ${draft}\ntranslationKey: ${key}`,
          ),
        );
      }
    }

    recipes = [];
    for (const locale of ["fr", "en"]) {
      const directory = path.join(root, `src/content/recipes/${locale}`);
      for (const file of await readdir(directory)) {
        const content = await readFile(path.join(directory, file), "utf8");
        const key = content.match(/^translationKey: (.+)$/m)[1];
        if (key === "lorem-ipsum-recipe") continue;
        recipes.push({
          locale,
          key,
          path: `/${locale}/recipes/${file.replace(/\.mdx$/, "")}/`,
          draft: /^draft: true$/m.test(content),
        });
      }
    }

    await astro("build");
    const port = await availablePort();
    origin = `http://127.0.0.1:${port}`;
    await astro(
      "dev",
      "--background",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
    );
  },
  { timeout: 60_000 },
);

after(async () => {
  if (!root) return;
  try {
    await astro("dev", "stop");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function request(url) {
  return fetch(new URL(url, origin), { redirect: "manual" });
}

for (const [fr, en] of pairs) {
  for (const [locale, wrong, canonical] of [
    ["en", fr, en],
    ["fr", en, fr],
  ]) {
    test(`301: /${locale}/recipes/${wrong}/ preserves language and query parameters`, async () => {
      const destination = `/${locale}/recipes/${canonical}/`;
      const query = "?utm_source=recipe&tag=one&tag=two&q=a%2Bb%20c&empty=";
      for (const slash of ["", "/"]) {
        const response = await request(
          `/${locale}/recipes/${wrong}${slash}${query}`,
        );
        assert.equal(response.status, 301);
        const location = new URL(response.headers.get("location"), origin);
        assert.equal(location.pathname, destination);
        assert.equal(location.search, query);
        const target = await request(location);
        assert.equal(target.status, 200);
        assert.equal(target.headers.get("location"), null);
      }
    });
  }
}

test("canonical recipe URLs return 200 directly, including colliding slugs", async () => {
  for (const recipe of recipes) {
    const response = await request(recipe.path);
    assert.equal(response.status, 200, recipe.path);
    assert.equal(response.headers.get("location"), null, recipe.path);
  }
});

test("unknown slugs, missing translations, and hidden templates return 404", async () => {
  for (const locale of ["fr", "en"]) {
    const other = locale === "fr" ? "en" : "fr";
    for (const slug of [
      "unknown-recipe",
      `only-${other}`,
      "lorem-ipsum-recipe",
    ]) {
      const response = await request(`/${locale}/recipes/${slug}/?from=test`);
      assert.equal(response.status, 404, `${locale}/${slug}`);
      assert.equal(response.headers.get("location"), null);
    }
  }
});

test("production Netlify rules are permanent, canonical, and exclude unavailable translations", async () => {
  const rules = (await readFile(path.join(root, "dist/_redirects"), "utf8"))
    .trim()
    .split("\n");
  const published = recipes.filter((recipe) => !recipe.draft);
  const canonicalPaths = new Set(published.map((recipe) => recipe.path));
  const redirects = new Map();
  for (const rule of rules) {
    const [from, destination, status] = rule.split(/\s+/);
    assert.equal(status, "301");
    assert.ok(!canonicalPaths.has(`${from}/`), from);
    assert.ok(canonicalPaths.has(destination), destination);
    redirects.set(from, destination);
  }

  const expected = new Map();
  for (const recipe of published) {
    const other = recipe.locale === "fr" ? "en" : "fr";
    const wrong = recipe.path
      .replace(`/${recipe.locale}/`, `/${other}/`)
      .replace(/\/$/, "");
    const counterpart = published.find(
      (entry) => entry.locale === other && entry.key === recipe.key,
    );
    if (counterpart && !canonicalPaths.has(`${wrong}/`))
      expected.set(wrong, counterpart.path);
  }
  assert.deepEqual(redirects, expected);
  for (const destination of redirects.values()) {
    assert.ok(!redirects.has(destination.replace(/\/$/, "")), destination);
  }
  assert.ok(!redirects.has("/en/recipes/draft-counterpart-fr"));
  assert.ok(!redirects.has("/fr/recipes/draft-counterpart-en"));
  assert.ok(!redirects.has("/en/recipes/only-fr"));
  assert.ok(!redirects.has("/fr/recipes/only-en"));
});

test("canonical tags, hreflang, and sitemaps contain only canonical URLs", async () => {
  const published = recipes.filter((recipe) => !recipe.draft);
  const urls = new Set(published.map((recipe) => `${site}${recipe.path}`));
  const sitemap = await readFile(path.join(root, "dist/sitemap-0.xml"), "utf8");
  const sitemapRecipes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1])
    .filter((url) => url.includes("/recipes/"));
  assert.deepEqual(new Set(sitemapRecipes), urls);
  assert.ok(!sitemap.includes("_redirects"));

  for (const recipe of published) {
    const html = await readFile(
      path.join(root, "dist", recipe.path, "index.html"),
      "utf8",
    );
    const links = [...html.matchAll(/<link\b[^>]*>/g)].map((match) => match[0]);
    const canonical = links.find((tag) => tag.includes('rel="canonical"'));
    assert.ok(canonical.includes(`href="${site}${recipe.path}"`), recipe.path);
    const alternates = links.filter((tag) => tag.includes('rel="alternate"'));
    const expected = published.filter((entry) => entry.key === recipe.key);
    assert.equal(alternates.length, expected.length, recipe.path);
    for (const counterpart of expected) {
      assert.ok(
        alternates.some((tag) => {
          const href = tag.match(/href="([^"]+)"/)[1];
          return (
            tag.includes(`hreflang="${counterpart.locale}"`) &&
            `${href.replace(/\/$/, "")}/` === `${site}${counterpart.path}`
          );
        }),
        recipe.path,
      );
    }
  }
});

test("footnote links contain only asterisks and resolve to unique destinations", async () => {
  let checked = 0;
  for (const recipe of recipes) {
    const response = await request(recipe.path);
    const html = await response.text();
    const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    for (const [, attributes, content] of anchors) {
      if (
        !/class="[^"]*recipe-footnote-(?:reference|marker-link)/.test(
          attributes,
        )
      )
        continue;
      assert.equal(content.replace(/<[^>]+>/g, "").trim(), "*", recipe.path);
      const destination = attributes.match(/href="#([^"]+)"/)?.[1];
      assert.ok(destination, recipe.path);
      assert.equal(
        ids.filter((id) => id === destination).length,
        1,
        `${recipe.path} -> ${destination}`,
      );
      if (attributes.includes("recipe-footnote-reference")) {
        const reference = attributes.match(/\bid="([^"]+)"/)?.[1];
        assert.ok(reference, recipe.path);
        assert.equal(
          ids.filter((id) => id === reference).length,
          1,
          `${recipe.path}: ${reference}`,
        );
      }
      checked++;
    }
  }
  assert.ok(checked > 0);
});
