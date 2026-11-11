#!/usr/bin/env python3
"""Create a bilingual recipe pair and renamed image assets from the template."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import unicodedata
from datetime import date
from pathlib import Path


TEMPLATE_SLUG = "lorem-ipsum-recipe"


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value).strip("-").lower()
    if not slug:
        raise ValueError("The recipe name must contain at least one letter or number.")
    return slug


def display_name(value: str, slug: str) -> str:
    cleaned = " ".join(value.replace("-", " ").split())
    if not cleaned:
        return slug.replace("-", " ").title()
    return cleaned.title() if cleaned.islower() else cleaned


def replace_template_values(content: str, slug: str, name: str, recipe_date: str) -> str:
    content = content.replace(TEMPLATE_SLUG, slug)
    content = re.sub(
        r'(?m)^title: "Lorem ipsum dolor sit amet"$',
        f"title: {json.dumps(name, ensure_ascii=False)}",
        content,
        count=1,
    )
    content = re.sub(
        r"(?m)^## Lorem ipsum dolor sit amet$",
        f"## {name}",
        content,
        count=1,
    )
    content = re.sub(
        r"(?m)^(pubDate|updatedDate): \d{4}-\d{2}-\d{2}$",
        lambda match: f"{match.group(1)}: {recipe_date}",
        content,
    )
    return content


def ensure_available(path: Path) -> None:
    if path.exists():
        raise FileExistsError(f"Refusing to overwrite existing path: {path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Scaffold a bilingual recipe from lorem-ipsum-recipe."
    )
    parser.add_argument("name", help="Recipe name or lowercase kebab-case slug")
    parser.add_argument(
        "--date",
        default=date.today().isoformat(),
        help="Date for pubDate and updatedDate (YYYY-MM-DD; defaults to today)",
    )
    args = parser.parse_args()

    try:
        date.fromisoformat(args.date)
    except ValueError as error:
        raise SystemExit("--date must use YYYY-MM-DD format") from error

    root = Path.cwd()
    slug = slugify(args.name)
    name = display_name(args.name, slug)

    template_recipe_dir = root / "src/content/recipes"
    template_image_dir = root / "public/images/recipes" / TEMPLATE_SLUG
    source_files = {
        locale: template_recipe_dir / locale / f"{TEMPLATE_SLUG}.mdx"
        for locale in ("fr", "en")
    }
    target_files = {
        locale: template_recipe_dir / locale / f"{slug}.mdx"
        for locale in ("fr", "en")
    }
    target_image_dir = root / "public/images/recipes" / slug

    if slug == TEMPLATE_SLUG:
        raise SystemExit("Choose a name other than lorem-ipsum-recipe.")
    for source in (*source_files.values(), template_image_dir):
        if not source.exists():
            raise SystemExit(f"Template path is missing: {source}")
    for target in (*target_files.values(), target_image_dir):
        ensure_available(target)

    for locale, source in source_files.items():
        target_files[locale].parent.mkdir(parents=True, exist_ok=True)
        content = source.read_text(encoding="utf-8")
        target_files[locale].write_text(
            replace_template_values(content, slug, name, args.date),
            encoding="utf-8",
        )

    for source in template_image_dir.rglob("*"):
        if not source.is_file():
            continue
        relative_parts = [part.replace(TEMPLATE_SLUG, slug) for part in source.relative_to(template_image_dir).parts]
        target = target_image_dir.joinpath(*relative_parts)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

    print(f"Created {target_files['fr']}")
    print(f"Created {target_files['en']}")
    print(f"Created assets in {target_image_dir}")


if __name__ == "__main__":
    main()
