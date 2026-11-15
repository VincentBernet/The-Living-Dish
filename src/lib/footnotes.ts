export function initializeFootnoteNavigation() {
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const reference = event.target.closest<HTMLAnchorElement>(
      ".recipe-page a.recipe-footnote-reference[href^='#']",
    );
    if (
      !reference?.id ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;

    const note = document.getElementById(reference.hash.slice(1));
    const returnLink = note?.querySelector<HTMLAnchorElement>(
      "a.recipe-footnote-marker-link",
    );
    if (returnLink) returnLink.href = `#${reference.id}`;
  });
}

initializeFootnoteNavigation();
