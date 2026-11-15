import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = await readFile(
  new URL("../src/lib/recipe-lightbox.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});

// A small DOM adapter lets the tests drive the production click/key handlers.
function viewer(lang = "en", count = 3) {
  class Element {
    constructor(tagName = "div") {
      this.tagName = tagName;
      this.children = [];
      this.dataset = {};
      this.attributes = new Map();
      this.listeners = new Map();
      this.classes = new Set();
      this.classList = {
        add: (...names) => names.forEach((name) => this.classes.add(name)),
        remove: (...names) =>
          names.forEach((name) => this.classes.delete(name)),
        contains: (name) => this.classes.has(name),
      };
    }
    set className(value) {
      this.classes = new Set(value.split(" "));
    }
    setAttribute(name, value) {
      this.attributes.set(name, value);
    }
    append(...children) {
      this.children.push(...children);
      children.forEach((child) => {
        child.parent = this;
      });
    }
    remove() {
      this.parent.children = this.parent.children.filter(
        (child) => child !== this,
      );
    }
    focus() {
      document.activeElement = this;
    }
    addEventListener(type, handler) {
      const handlers = this.listeners.get(type) ?? [];
      handlers.push(handler);
      this.listeners.set(type, handlers);
    }
    removeEventListener(type, handler) {
      this.listeners.set(
        type,
        (this.listeners.get(type) ?? []).filter((item) => item !== handler),
      );
    }
    dispatch(type, properties = {}) {
      const event = {
        target: this,
        ...properties,
        stopPropagation() {
          this.stopped = true;
        },
        preventDefault() {
          this.defaultPrevented = true;
        },
      };
      const bubble = (element) => {
        for (const handler of element.listeners.get(type) ?? []) handler(event);
        element[`on${type}`]?.(event);
        if (!event.stopped && element.parent) bubble(element.parent);
      };
      bubble(this);
      return event;
    }
    querySelectorAll() {
      return this.children.filter(
        (child) =>
          child instanceof Image &&
          !child.classes.has("recipe-handwritten-stamp") &&
          child.attributes.get("aria-hidden") !== "true",
      );
    }
  }
  class Image extends Element {
    constructor() {
      super("img");
      this.complete = true;
    }
  }
  const page = new Element();
  const otherPage = new Element();
  const document = new Element("document");
  document.documentElement = { lang };
  document.body = new Element("body");
  document.activeElement = new Element("button");
  const initialFocus = document.activeElement;
  document.createElement = (tag) =>
    tag === "img" ? new Image() : new Element(tag);
  document.querySelectorAll = () => [page, otherPage];
  document.body.append(page, otherPage);
  const photos = Array.from({ length: count }, (_, index) => {
    const photo = new Image();
    photo.src = `/photo-${index}.jpg`;
    photo.currentSrc = `/large-photo-${index}.jpg`;
    photo.alt = `Photo ${index}`;
    return photo;
  });
  const stamp = new Image();
  stamp.className = "recipe-handwritten-stamp";
  page.append(...photos, stamp);
  const otherPhoto = new Image();
  otherPhoto.src = "/other-article.jpg";
  otherPhoto.alt = "Other article";
  otherPage.append(otherPhoto);
  runInNewContext(outputText, {
    document,
    HTMLElement: Element,
    HTMLImageElement: Image,
    exports: {},
  });
  const overlay = () =>
    document.body.children.find((child) =>
      child.classes.has("recipe-lightbox"),
    );
  const controls = () =>
    Object.fromEntries(
      overlay()
        .children.filter((child) => child.tagName === "button")
        .map((button) => [button.attributes.get("aria-label"), button]),
    );
  return {
    document,
    photos,
    stamp,
    otherPhoto,
    overlay,
    controls,
    initialFocus,
  };
}

test("arrows navigate from the clicked photo in article order and stop at the boundaries", () => {
  const view = viewer();
  view.photos[1].dispatch("click");
  assert.deepEqual(Object.keys(view.controls()), [
    "Previous photo",
    "Next photo",
  ]);
  const image = view
    .overlay()
    .children.find((child) => child.tagName === "img");
  assert.equal(image.src, "/large-photo-1.jpg");
  assert.equal(image.alt, "Photo 1");
  assert.equal(
    view.document.dispatch("keydown", { key: "ArrowRight" }).defaultPrevented,
    true,
  );
  assert.equal(image.src, "/large-photo-2.jpg");
  assert.equal(view.controls()["Next photo"].disabled, true);
  view.document.dispatch("keydown", { key: "ArrowRight" });
  assert.equal(image.src, "/large-photo-2.jpg");
  view.document.dispatch("keydown", { key: "ArrowLeft" });
  view.document.dispatch("keydown", { key: "ArrowLeft" });
  assert.equal(image.src, "/large-photo-0.jpg");
  assert.equal(view.controls()["Previous photo"].disabled, true);
  assert.equal(
    view.overlay().attributes.get("aria-label"),
    "Enlarged image: Photo 0",
  );
});

test("arrow buttons keep the viewer open; Escape restores focus and removes keyboard listeners", () => {
  const view = viewer();
  view.photos[0].dispatch("click");
  const overlay = view.overlay();
  view.controls()["Next photo"].dispatch("click");
  assert.equal(view.overlay(), overlay);
  assert.equal(
    overlay.children.find((child) => child.tagName === "img").alt,
    "Photo 1",
  );
  assert.equal(view.document.activeElement, overlay);
  view.document.dispatch("keydown", { key: "Tab" });
  assert.equal(view.document.activeElement, view.controls()["Previous photo"]);
  view.document.dispatch("keydown", { key: "Escape" });
  assert.equal(view.overlay(), undefined);
  assert.equal(
    view.document.body.classList.contains("recipe-lightbox-open"),
    false,
  );
  assert.equal(view.document.activeElement, view.initialFocus);
  assert.equal(view.document.listeners.get("keydown").length, 0);
  view.photos[2].dispatch("click");
  assert.equal(view.document.listeners.get("keydown").length, 1);
  view
    .overlay()
    .children.find((child) => child.tagName === "img")
    .dispatch("click");
  assert.equal(view.overlay(), undefined);
  view.photos[0].dispatch("click");
  view.overlay().dispatch("click");
  assert.equal(view.overlay(), undefined);
});

test("focus stays within enabled controls at the first and last photos", () => {
  const view = viewer();
  view.photos[1].dispatch("click");
  view.controls()["Next photo"].focus();
  view.controls()["Next photo"].dispatch("click");
  assert.equal(view.document.activeElement, view.controls()["Previous photo"]);
  view.controls()["Previous photo"].dispatch("click");
  view.controls()["Previous photo"].dispatch("click");
  assert.equal(view.document.activeElement, view.controls()["Next photo"]);
  view.document.dispatch("keydown", { key: "Tab", shiftKey: true });
  assert.equal(view.document.activeElement, view.controls()["Next photo"]);
});

test("decorative stamps are skipped and navigation stays inside the clicked article", () => {
  const view = viewer("fr", 1);
  view.stamp.dispatch("click");
  assert.equal(view.overlay(), undefined);
  view.photos[0].dispatch("click");
  assert.equal(view.controls()["Photo suivante"].hidden, true);
  assert.equal(view.controls()["Photo précédente"].hidden, true);
  assert.equal(
    view.document.dispatch("keydown", { key: "Tab" }).defaultPrevented,
    true,
  );
  assert.equal(view.document.activeElement, view.overlay());
  view.document.dispatch("keydown", { key: "Escape" });
  view.otherPhoto.dispatch("click");
  assert.equal(
    view.overlay().children.find((child) => child.tagName === "img").src,
    "/other-article.jpg",
  );
  assert.equal(view.controls()["Photo suivante"].hidden, true);
});

test("a newly selected image fades in after loading or failing", () => {
  const view = viewer();
  view.photos[0].dispatch("click");
  const image = view
    .overlay()
    .children.find((child) => child.tagName === "img");
  image.complete = false;
  view.controls()["Next photo"].dispatch("click");
  assert.equal(image.classList.contains("is-loaded"), false);
  image.dispatch("load");
  assert.equal(image.classList.contains("is-loaded"), true);
  view.controls()["Next photo"].dispatch("click");
  image.dispatch("error");
  assert.equal(image.classList.contains("is-loaded"), true);
});
