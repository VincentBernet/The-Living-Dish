import type { CollectionEntry } from "astro:content";

export type Ingredient =
  CollectionEntry<"recipes">["data"]["ingredients"][number];
export type MeasurementSystem = "metric" | "us";

type MeasurementDefinition = {
  aliases: readonly string[];
} & ({ grams: number } | { milliliters: number } | { count: number });

// Rounded cooking equivalents shared by both recipe languages:
// https://www.nist.gov/pml/owm/metric-si/metric-kitchen/metric-kitchen-cooking-measurement-equivalencies
// Mass uses US avoirdupois ounces and pounds; volumes use kitchen measures.
export const measurementUnits = {
  gram: { grams: 1, aliases: ["g", "gram", "grams", "gramme", "grammes"] },
  kilogram: {
    grams: 1000,
    aliases: ["kg", "kilogram", "kilograms", "kilogramme", "kilogrammes"],
  },
  ounce: { grams: 28.349523125, aliases: ["oz", "ounce", "ounces"] },
  pound: { grams: 453.59237, aliases: ["lb", "lbs", "pound", "pounds"] },
  milliliter: {
    milliliters: 1,
    aliases: ["ml", "milliliter", "milliliters", "millilitre", "millilitres"],
  },
  centiliter: {
    milliliters: 10,
    aliases: ["cl", "centiliter", "centiliters", "centilitre", "centilitres"],
  },
  liter: {
    milliliters: 1000,
    aliases: ["l", "liter", "liters", "litre", "litres"],
  },
  teaspoon: {
    milliliters: 5,
    aliases: ["tsp", "teaspoon", "teaspoons", "c. à c."],
  },
  tablespoon: {
    milliliters: 15,
    aliases: ["tbsp", "tablespoon", "tablespoons", "c. à s."],
  },
  cup: { milliliters: 240, aliases: ["cup", "cups"] },
  fluidOunce: {
    milliliters: 30,
    aliases: ["fl oz", "fluid ounce", "fluid ounces"],
  },
  // Project conventions, not universal glass sizes. Adjust these values here.
  glass: { milliliters: 200, aliases: ["verre", "verres", "glass", "glasses"] },
  largeGlass: {
    milliliters: 300,
    aliases: ["grand verre", "grands verres", "large glass", "large glasses"],
  },
  // Counts stay counts: a bunch, pod or leaf has no universal mass or volume.
  bunch: { count: 1, aliases: ["botte", "bottes", "bunch", "bunches"] },
  stick: { count: 1, aliases: ["bâton", "bâtons", "stick", "sticks"] },
  pod: {
    count: 1,
    aliases: ["gousse", "gousses", "pod", "pods", "clove", "cloves"],
  },
  leaf: { count: 1, aliases: ["feuille", "feuilles", "leaf", "leaves"] },
  piece: {
    count: 1,
    aliases: ["morceau", "morceaux", "pièce", "pièces", "piece", "pieces"],
  },
} satisfies Record<string, MeasurementDefinition>;

export function getMeasurementUnit(
  unit: string,
): MeasurementDefinition | undefined {
  const normalized = unit.trim().toLowerCase();
  return Object.values<MeasurementDefinition>(measurementUnits).find(
    (definition) => definition.aliases.includes(normalized),
  );
}

function formatQuantity(quantity: number, system: MeasurementSystem): string {
  if (Number.isInteger(quantity)) return String(quantity);
  const rounded = Number(quantity.toFixed(system === "us" ? 2 : 1));
  // Keep small scaled amounts visible instead of rounding them down to zero.
  return String(rounded === 0 ? Number(quantity.toPrecision(2)) : rounded);
}

function convertMeasurement(
  quantity: number,
  unit: string,
  system: MeasurementSystem,
) {
  const definition = getMeasurementUnit(unit);

  if (definition && "grams" in definition) {
    const grams = quantity * definition.grams;
    if (system === "metric") return { quantity: grams, unit: "g" };
    return grams >= measurementUnits.pound.grams
      ? { quantity: grams / measurementUnits.pound.grams, unit: "lb" }
      : { quantity: grams / measurementUnits.ounce.grams, unit: "oz" };
  }

  if (definition && "milliliters" in definition) {
    const milliliters = quantity * definition.milliliters;
    if (system === "metric") {
      // Keep familiar spoon labels while retaining their quantified volumes.
      if (
        definition === measurementUnits.teaspoon ||
        definition === measurementUnits.tablespoon
      ) {
        return { quantity, unit };
      }
      return milliliters >= measurementUnits.liter.milliliters
        ? {
            quantity: milliliters / measurementUnits.liter.milliliters,
            unit: "l",
          }
        : { quantity: milliliters, unit: "ml" };
    }
    if (definition === measurementUnits.teaspoon) {
      return {
        quantity: milliliters / measurementUnits.teaspoon.milliliters,
        unit: "tsp",
      };
    }
    if (definition === measurementUnits.tablespoon) {
      return {
        quantity: milliliters / measurementUnits.tablespoon.milliliters,
        unit: "tbsp",
      };
    }
    if (milliliters >= measurementUnits.cup.milliliters / 4) {
      const cups = milliliters / measurementUnits.cup.milliliters;
      return { quantity: cups, unit: cups <= 1 ? "cup" : "cups" };
    }
    if (milliliters >= measurementUnits.tablespoon.milliliters) {
      return {
        quantity: milliliters / measurementUnits.tablespoon.milliliters,
        unit: "tbsp",
      };
    }
    return {
      quantity: milliliters / measurementUnits.teaspoon.milliliters,
      unit: "tsp",
    };
  }

  return {
    quantity:
      definition && "count" in definition
        ? quantity * definition.count
        : quantity,
    unit,
  };
}

export function formatIngredient(
  ingredient: Ingredient,
  multiplier: number,
  system: MeasurementSystem,
): string {
  if (ingredient.quantity === undefined) {
    return [ingredient.unit, ingredient.item].filter(Boolean).join(" ");
  }

  const scaledQuantity = ingredient.quantity * multiplier;
  const { quantity, unit } = ingredient.unit
    ? convertMeasurement(scaledQuantity, ingredient.unit, system)
    : { quantity: scaledQuantity, unit: ingredient.unit };

  return [formatQuantity(quantity, system), unit, ingredient.item]
    .filter(Boolean)
    .join(" ");
}
