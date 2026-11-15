import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = await readFile(
  new URL("../src/lib/footnotes.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});

function navigation() {
  let click;
  const returnLink = { href: "#ingredient-reference" };
  class Element {
    constructor(reference) {
      this.reference = reference;
    }
    closest() {
      return this.reference;
    }
  }
  const document = {
    addEventListener: (type, handler) => {
      assert.equal(type, "click");
      click = handler;
    },
    getElementById: (id) =>
      id === "note" ? { querySelector: () => returnLink } : null,
  };
  runInNewContext(outputText, { document, Element, exports: {} });
  return {
    returnLink,
    follow: (id, options = {}) =>
      click({ target: new Element({ id, hash: "#note" }), ...options }),
    unrelated: () => click({ target: new Element(null) }),
  };
}

test("a shared note returns to the most recently used asterisk", () => {
  const { follow, returnLink } = navigation();
  follow("ingredient-reference");
  assert.equal(returnLink.href, "#ingredient-reference");
  follow("prose-reference");
  assert.equal(returnLink.href, "#prose-reference");
  follow("ingredient-reference");
  assert.equal(returnLink.href, "#ingredient-reference");
});

test("unrelated and modified clicks leave the return destination unchanged", () => {
  const { follow, unrelated, returnLink } = navigation();
  unrelated();
  for (const key of ["ctrlKey", "metaKey", "shiftKey", "altKey"]) {
    follow("prose-reference", { [key]: true });
  }
  assert.equal(returnLink.href, "#ingredient-reference");
});
