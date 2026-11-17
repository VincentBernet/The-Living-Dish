import type { CollectionEntry } from "astro:content";
import type { Locale } from "./recipes";

export type ServingsUnit = NonNullable<
  CollectionEntry<"recipes">["data"]["servingsUnit"]
>;

const defaultUnits: Record<Locale, ServingsUnit> = {
  fr: { singular: "portion", plural: "portions" },
  en: { singular: "serving", plural: "servings" },
};

export function getServingsUnit(
  servings: number,
  locale: Locale,
  unit: ServingsUnit = defaultUnits[locale],
): string {
  return servings === 1 ? unit.singular : unit.plural;
}
