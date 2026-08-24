import { useState } from "react";

export interface Ingredient {
  quantity?: number;
  unit?: string;
  item: string;
}

interface Props {
  ingredients: Ingredient[];
  baseServings: number;
  locale: "fr" | "en";
}

function formatQuantity(quantity: number): string {
  if (Number.isInteger(quantity)) return String(quantity);
  return quantity.toFixed(1).replace(/\.0$/, "");
}

function formatIngredient(ingredient: Ingredient, multiplier: number): string {
  const parts: string[] = [];
  if (ingredient.quantity !== undefined) {
    parts.push(formatQuantity(ingredient.quantity * multiplier));
  }
  if (ingredient.unit) {
    parts.push(ingredient.unit);
  }
  parts.push(ingredient.item);
  return parts.join(" ");
}

export default function ServingsScaler({
  ingredients,
  baseServings,
  locale,
}: Props) {
  const [servings, setServings] = useState(baseServings);
  const multiplier = servings / baseServings;

  const labels = {
    fr: { servings: "Portions", decrease: "Diminuer", increase: "Augmenter" },
    en: { servings: "Servings", decrease: "Decrease", increase: "Increase" },
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <label htmlFor="servings" className="text-sm font-medium text-warm-800">
          {labels[locale].servings}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setServings((s) => Math.max(1, s - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-warm-200 bg-white text-warm-900 hover:bg-warm-100 transition-colors"
            aria-label={labels[locale].decrease}
          >
            −
          </button>
          <input
            id="servings"
            type="number"
            min={1}
            max={20}
            value={servings}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 1) setServings(value);
            }}
            className="w-16 rounded-md border border-warm-200 bg-white px-2 py-1 text-center text-sm"
          />
          <button
            type="button"
            onClick={() => setServings((s) => Math.min(20, s + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-warm-200 bg-white text-warm-900 hover:bg-warm-100 transition-colors"
            aria-label={labels[locale].increase}
          >
            +
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="flex items-start gap-2 text-warm-800">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>{formatIngredient(ingredient, multiplier)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
