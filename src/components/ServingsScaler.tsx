import { useState } from "react";
import {
  formatIngredient,
  type Ingredient,
  type MeasurementSystem,
} from "../lib/measurements";
import type { Locale } from "../lib/recipes";
import { getServingsUnit, type ServingsUnit } from "../lib/servings";

interface Props {
  ingredients: Ingredient[];
  baseServings: number;
  servingsUnit?: ServingsUnit;
  locale: Locale;
  title: string;
  ingredientsImage?: string;
  ingredientsImageOrientation?: "horizontal" | "vertical";
  imageAlt: string;
}

export default function ServingsScaler({
  ingredients,
  baseServings,
  servingsUnit,
  locale,
  title,
  ingredientsImage,
  ingredientsImageOrientation = "horizontal",
  imageAlt,
}: Props) {
  const [servings, setServings] = useState(baseServings);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [measurementSystem, setMeasurementSystem] =
    useState<MeasurementSystem>("metric");
  const multiplier = servings / baseServings;
  const unitLabel = getServingsUnit(servings, locale, servingsUnit);

  const labels = {
    fr: {
      decrease: "Diminuer",
      increase: "Augmenter",
      seeNote: "Voir la note",
      measurementSystem: "Système de mesure",
    },
    en: {
      decrease: "Decrease",
      increase: "Increase",
      seeNote: "See note",
      measurementSystem: "Measurement system",
    },
  };

  return (
    <div className="grid items-start gap-x-2 gap-y-4 md:grid-cols-[1.2fr_1.8fr]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
        <h2 className="text-2xl font-serif font-bold text-warm-900">{title}</h2>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div
            role="group"
            aria-label={labels[locale].measurementSystem}
            className="inline-flex shrink-0 rounded-md border border-warm-200 bg-white p-0.5"
          >
            {(["us", "metric"] as const).map((system) => (
              <button
                key={system}
                type="button"
                aria-pressed={measurementSystem === system}
                onClick={() => setMeasurementSystem(system)}
                className={`rounded px-2.5 py-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  measurementSystem === system
                    ? "cursor-default bg-accent text-white"
                    : "cursor-pointer text-warm-800 hover:bg-warm-100"
                }`}
              >
                {system === "us" ? "US" : "Metric"}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label
              htmlFor="servings"
              className="text-sm font-medium text-warm-800"
            >
              {unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1)}
            </label>
            <button
              type="button"
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-warm-200 bg-white text-warm-900 transition-colors hover:bg-warm-100"
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
              className="w-13 rounded-md border border-warm-200 bg-white px-2 py-1 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setServings((s) => Math.min(20, s + 1))}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-warm-200 bg-white text-warm-900 transition-colors hover:bg-warm-100"
              aria-label={labels[locale].increase}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div>
        <ul className="space-y-2">
          {ingredients.map((ingredient, index) => {
            const ingredientLabel = formatIngredient(
              ingredient,
              multiplier,
              measurementSystem,
            );

            return (
              <li key={index} className="flex items-start gap-2 text-warm-800">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>
                  {ingredientLabel}
                  {ingredient.footnoteId && (
                    <a
                      id={`footnote-ref-${ingredient.footnoteId}${ingredients.findIndex((item) => item.footnoteId === ingredient.footnoteId) === index ? "" : `-${index}`}`}
                      href={`#footnote-${ingredient.footnoteId}`}
                      className="recipe-footnote-reference"
                      aria-label={`${ingredientLabel}, ${labels[locale].seeNote}`}
                    >
                      *
                    </a>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {ingredientsImage && (
        <img
          data-react-image
          ref={(image) => {
            if (image?.complete) setImageLoaded(true);
          }}
          src={ingredientsImage}
          alt={imageAlt}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          className={`${
            ingredientsImageOrientation === "vertical"
              ? "aspect-[3/4] w-full rounded-lg object-cover md:self-center"
              : "aspect-[4/3] w-full rounded-lg object-cover md:self-center"
          }${imageLoaded ? " is-loaded" : ""}`}
        />
      )}
    </div>
  );
}
