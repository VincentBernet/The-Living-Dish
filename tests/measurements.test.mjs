import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

async function loadModule(path, dependencies = {}) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require: (name) => dependencies[name] ?? require(name),
  });
  return exports;
}

const measurements = await loadModule("../src/lib/measurements.ts");
const { formatIngredient, getMeasurementUnit } = measurements;
const servings = await loadModule("../src/lib/servings.ts");

test("every recipe unit has a positive, explicit measurement definition", async () => {
  const base = new URL("../src/content/recipes/", import.meta.url);
  for (const locale of ["fr", "en"]) {
    const directory = new URL(`${locale}/`, base);
    for (const file of await readdir(directory)) {
      if (!file.endsWith(".mdx")) continue;
      const source = await readFile(new URL(file, directory), "utf8");
      for (const [, unit] of source.matchAll(/^    unit: (.+)$/gm)) {
        const definition = getMeasurementUnit(unit);
        assert.ok(
          definition,
          `${locale}/${file}: missing definition for ${unit}`,
        );
        const amount =
          definition.grams ?? definition.milliliters ?? definition.count;
        assert.ok(Number.isFinite(amount) && amount > 0, unit);
      }
    }
  }
});

test("glass conventions convert in both languages and scale in either system", () => {
  for (const unit of ["verre", "verres", "glass", "glasses"]) {
    assert.equal(
      formatIngredient({ quantity: 1, unit, item: "wine" }, 1, "metric"),
      "200 ml wine",
    );
    assert.equal(
      formatIngredient({ quantity: 1, unit, item: "wine" }, 1, "us"),
      "0.83 cup wine",
    );
  }
  for (const unit of [
    "grand verre",
    "grands verres",
    "large glass",
    "large glasses",
  ]) {
    assert.equal(
      formatIngredient({ quantity: 2, unit, item: "water" }, 1, "metric"),
      "600 ml water",
    );
    assert.equal(
      formatIngredient({ quantity: 2, unit, item: "water" }, 1, "us"),
      "2.5 cups water",
    );
    assert.equal(
      formatIngredient({ quantity: 2, unit, item: "water" }, 2, "metric"),
      "1.2 l water",
    );
  }
});

test("spoons keep their metric labels and retain explicit conversion volumes", () => {
  for (const [unit, milliliters] of [
    ["tsp", 5],
    ["c. à c.", 5],
    ["tbsp", 15],
    ["c. à s.", 15],
  ]) {
    assert.equal(getMeasurementUnit(unit).milliliters, milliliters);
    assert.equal(
      formatIngredient({ quantity: 1, unit, item: "ingredient" }, 2, "metric"),
      `2 ${unit} ingredient`,
    );
  }
  const pepper = {
    quantity: 1,
    unit: "c. à c.",
    item: "de piment d'Espelette",
  };
  assert.equal(
    formatIngredient(pepper, 1, "metric"),
    "1 c. à c. de piment d'Espelette",
  );
  assert.equal(
    formatIngredient(pepper, 1, "us"),
    "1 tsp de piment d'Espelette",
  );
});

test("cups, fluid ounces and mass units convert to metric", () => {
  assert.equal(
    formatIngredient({ quantity: 1, unit: "fl oz", item: "oil" }, 1, "metric"),
    "30 ml oil",
  );
  assert.equal(
    formatIngredient(
      { quantity: 1, unit: "cup", item: "sugar" },
      0.5,
      "metric",
    ),
    "120 ml sugar",
  );
  assert.equal(
    formatIngredient({ quantity: 1, unit: "oz", item: "sugar" }, 1, "metric"),
    "28.3 g sugar",
  );
  assert.equal(
    formatIngredient({ quantity: 2, unit: "kg", item: "flour" }, 1, "metric"),
    "2000 g flour",
  );
});

test("metric quantifies volumes in ml or liters and scales source quantities", () => {
  for (const [ingredient, expected] of [
    [
      { quantity: 100, unit: "g", item: "de cacahuètes" },
      "200 g de cacahuètes",
    ],
    [{ quantity: 25, unit: "cl", item: "d'huile" }, "500 ml d'huile"],
    [{ quantity: 1, unit: "c. à s.", item: "de sel" }, "2 c. à s. de sel"],
  ]) {
    assert.equal(formatIngredient(ingredient, 2, "metric"), expected);
  }
});

test("US converts mass to weight units without assuming ingredient density", () => {
  assert.equal(
    formatIngredient({ quantity: 100, unit: "g", item: "peanuts" }, 1, "us"),
    "3.53 oz peanuts",
  );
  assert.equal(
    formatIngredient({ quantity: 1000, unit: "g", item: "shrimp" }, 1, "us"),
    "2.2 lb shrimp",
  );
  assert.equal(
    formatIngredient({ quantity: 1, unit: "kg", item: "shrimp" }, 0.25, "us"),
    "8.82 oz shrimp",
  );
});

test("US converts ml, cl and liters using US cups and measuring spoons", () => {
  for (const [quantity, unit, expected] of [
    [25, "cl", "1.04 cups oil"],
    [240, "ml", "1 cup oil"],
    [120, "ml", "0.5 cup oil"],
    [15, "ml", "1 tbsp oil"],
    [5, "ml", "1 tsp oil"],
    [1, "l", "4.17 cups oil"],
  ]) {
    assert.equal(
      formatIngredient({ quantity, unit, item: "oil" }, 1, "us"),
      expected,
    );
  }
});

test("French and English spoon measures use the same US labels", () => {
  for (const unit of ["c. à s.", "tbsp"]) {
    assert.equal(
      formatIngredient({ quantity: 1, unit, item: "soy sauce" }, 0.5, "us"),
      "0.5 tbsp soy sauce",
    );
  }
  for (const unit of ["c. à c.", "tsp"]) {
    assert.equal(
      formatIngredient({ quantity: 2, unit, item: "salt" }, 2, "us"),
      "4 tsp salt",
    );
  }
});

test("counts, unknown measures and unquantified ingredients stay intact", () => {
  for (const system of ["metric", "us"]) {
    assert.equal(
      formatIngredient({ quantity: 2, item: "onions" }, 2, system),
      "4 onions",
    );
    assert.equal(
      formatIngredient(
        { quantity: 1, unit: "unknown unit", item: "ingredient" },
        2,
        system,
      ),
      "2 unknown unit ingredient",
    );
    assert.equal(
      formatIngredient({ item: "salt to taste" }, 2, system),
      "salt to taste",
    );
    assert.equal(
      formatIngredient({ unit: "pinch", item: "of salt" }, 2, system),
      "pinch of salt",
    );
    assert.notEqual(
      formatIngredient(
        { quantity: 0.01, unit: "g", item: "salt" },
        0.1,
        system,
      ).split(" ")[0],
      "0",
    );
  }
});

test("switching systems preserves servings, source data and footnote references", async () => {
  for (const locale of ["fr", "en"]) {
    const state = [];
    let cursor = 0;
    const { default: ServingsScaler } = await loadModule(
      "../src/components/ServingsScaler.tsx",
      {
        "../lib/measurements": measurements,
        "../lib/servings": servings,
        react: {
          useState(initial) {
            const index = cursor++;
            if (!(index in state)) state[index] = initial;
            return [
              state[index],
              (value) => {
                state[index] =
                  typeof value === "function" ? value(state[index]) : value;
              },
            ];
          },
        },
      },
    );
    const ingredient = Object.freeze({
      quantity: 100,
      unit: "g",
      item: "peanuts",
      footnoteId: "note",
    });
    const props = {
      ingredients: [ingredient],
      baseServings: 1,
      locale,
      title: "Ingredients",
      imageAlt: "Ingredients",
      servingsUnit: { singular: "jar", plural: "jars" },
    };
    function render() {
      cursor = 0;
      const nodes = [];
      function visit(node) {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) return node.forEach(visit);
        nodes.push(node);
        visit(node.props?.children);
      }
      visit(ServingsScaler(props));
      return nodes;
    }
    const button = (nodes, label) =>
      nodes.find(
        (node) => node.type === "button" && node.props.children === label,
      );
    const reference = (nodes) => nodes.find((node) => node.type === "a");
    let nodes = render();
    assert.equal(button(nodes, "Metric").props["aria-pressed"], true);
    assert.equal(button(nodes, "US").props["aria-pressed"], false);
    assert.match(reference(nodes).props["aria-label"], /^100 g peanuts,/);
    button(nodes, "US").props.onClick();
    nodes = render();
    assert.equal(button(nodes, "US").props["aria-pressed"], true);
    assert.match(reference(nodes).props["aria-label"], /^3\.53 oz peanuts,/);
    button(nodes, "+").props.onClick();
    nodes = render();
    assert.match(reference(nodes).props["aria-label"], /^7\.05 oz peanuts,/);
    assert.equal(nodes.find((node) => node.type === "input").props.value, 2);
    assert.equal(
      nodes.find((node) => node.type === "label").props.children,
      "Jars",
    );
    button(nodes, "Metric").props.onClick();
    nodes = render();
    assert.match(reference(nodes).props["aria-label"], /^200 g peanuts,/);
    assert.equal(reference(nodes).props.href, "#footnote-note");
    assert.equal(reference(nodes).props.id, "footnote-ref-note");
    assert.equal(ingredient.quantity, 100);
    assert.equal(nodes.find((node) => node.type === "input").props.value, 2);
  }
});
