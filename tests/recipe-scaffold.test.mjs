import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  access,
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const project = fileURLToPath(new URL("../", import.meta.url));
const script = path.join(
  project,
  ".agents/skills/new-recipe/scripts/create_recipe.py",
);
const templateSlug = "lorem-ipsum-recipe";

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "living-dish-scaffold-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const locale of ["fr", "en"]) {
    const directory = `src/content/recipes/${locale}`;
    await cp(path.join(project, directory), path.join(root, directory), {
      recursive: true,
      filter: (source) =>
        !source.endsWith(".mdx") || source.endsWith(`/${templateSlug}.mdx`),
    });
  }
  const directory = `public/images/recipes/${templateSlug}`;
  await cp(path.join(project, directory), path.join(root, directory), {
    recursive: true,
  });
  return root;
}

function scaffold(root, ...names) {
  return run("python3", [script, ...names, "--date", "2026-11-12"], {
    cwd: root,
  });
}

test("scaffolds localized names and slugs with a shared translation key and images", async (t) => {
  const root = await fixture(t);
  const frSlug = "huile-pimentee-aux-echalotes";
  const enSlug = "chili-crisp-with-shallots";
  await scaffold(
    root,
    "Huile pimentée aux échalotes",
    "Chili crisp with shallots",
  );

  for (const [locale, slug, name] of [
    ["fr", frSlug, "Huile pimentée aux échalotes"],
    ["en", enSlug, "Chili crisp with shallots"],
  ]) {
    const content = await readFile(
      path.join(root, `src/content/recipes/${locale}/${slug}.mdx`),
      "utf8",
    );
    assert.equal(JSON.parse(content.match(/^title: (.+)$/m)[1]), name);
    assert.ok(content.includes(`\n## ${name}\n`));
    assert.ok(content.includes(`\ntranslationKey: ${frSlug}\n`));
    assert.ok(
      content.includes(
        `\nimage: /images/recipes/${frSlug}/${frSlug}-horizontal.png\n`,
      ),
    );
    assert.ok(content.includes("\ndraft: true\n"));
    assert.ok(content.includes("\npubDate: 2026-11-12\n"));
    assert.ok(content.includes("\nupdatedDate: 2026-11-12\n"));
    assert.ok(!content.includes(templateSlug));
  }

  const templateImages = path.join(
    root,
    `public/images/recipes/${templateSlug}`,
  );
  const images = path.join(root, `public/images/recipes/${frSlug}`);
  for (const name of await readdir(templateImages)) {
    assert.deepEqual(
      await readFile(path.join(images, name.replaceAll(templateSlug, frSlug))),
      await readFile(path.join(templateImages, name)),
    );
  }
  await assert.rejects(
    access(path.join(root, `public/images/recipes/${enSlug}`)),
  );
  await assert.rejects(
    access(path.join(root, `src/content/recipes/en/${frSlug}.mdx`)),
  );
});

test("requires both names and rejects either name using the reserved template slug", async (t) => {
  const root = await fixture(t);
  for (const names of [
    ["Sauce test"],
    ["Sauce test", templateSlug],
    [templateSlug, "Test sauce"],
  ]) {
    await assert.rejects(scaffold(root, ...names));
  }
  for (const locale of ["fr", "en"]) {
    assert.deepEqual(
      await readdir(path.join(root, `src/content/recipes/${locale}`)),
      [`${templateSlug}.mdx`],
    );
  }
  assert.deepEqual(await readdir(path.join(root, "public/images/recipes")), [
    templateSlug,
  ]);
});

test("checks English filename conflicts before creating any French recipe or assets", async (t) => {
  const root = await fixture(t);
  const existing = path.join(root, "src/content/recipes/en/test-sauce.mdx");
  await writeFile(existing, "Existing English recipe\n");
  await assert.rejects(scaffold(root, "Sauce test", "Test sauce"));
  assert.equal(await readFile(existing, "utf8"), "Existing English recipe\n");
  await assert.rejects(
    access(path.join(root, "src/content/recipes/fr/sauce-test.mdx")),
  );
  await assert.rejects(
    access(path.join(root, "public/images/recipes/sauce-test")),
  );
});

test("supports names with the same slug in both languages", async (t) => {
  const root = await fixture(t);
  await scaffold(root, "Kimchi", "Kimchi");
  for (const locale of ["fr", "en"]) {
    const content = await readFile(
      path.join(root, `src/content/recipes/${locale}/kimchi.mdx`),
      "utf8",
    );
    assert.ok(content.includes('\ntitle: "Kimchi"\n'));
    assert.ok(content.includes("\ntranslationKey: kimchi\n"));
  }
});
