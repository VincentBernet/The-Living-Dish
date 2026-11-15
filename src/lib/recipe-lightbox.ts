const photoSelector =
  'img:not(.recipe-handwritten-stamp):not([aria-hidden="true"])';

export function initializeRecipeImageLightboxes() {
  document
    .querySelectorAll<HTMLElement>(".recipe-page")
    .forEach((recipePage) => {
      if (recipePage.dataset.lightboxInitialized) return;
      recipePage.dataset.lightboxInitialized = "true";

      recipePage.addEventListener("click", (event) => {
        if (!(event.target instanceof HTMLImageElement)) return;
        const photos = Array.from(
          recipePage.querySelectorAll<HTMLImageElement>(photoSelector),
        );
        let index = photos.indexOf(event.target);
        if (index < 0) return;

        const previousFocus =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const labels =
          document.documentElement.lang === "fr"
            ? {
                previous: "Photo précédente",
                next: "Photo suivante",
                image: "Image agrandie",
              }
            : {
                previous: "Previous photo",
                next: "Next photo",
                image: "Enlarged image",
              };
        const lightbox = document.createElement("div");
        const enlargedImage = document.createElement("img");
        lightbox.className = "recipe-lightbox";
        lightbox.setAttribute("role", "dialog");
        lightbox.setAttribute("aria-modal", "true");
        lightbox.tabIndex = -1;
        enlargedImage.className = "recipe-lightbox-image";

        const control = (
          label: string,
          symbol: string,
          position: string,
          action: () => void,
        ) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `recipe-lightbox-control recipe-lightbox-${position}`;
          button.setAttribute("aria-label", label);
          button.textContent = symbol;
          button.addEventListener("click", (buttonEvent) => {
            buttonEvent.stopPropagation();
            action();
          });
          return button;
        };

        const revealImage = () => enlargedImage.classList.add("is-loaded");
        enlargedImage.onload = revealImage;
        enlargedImage.onerror = revealImage;
        const showImage = (nextIndex: number) => {
          index = Math.max(0, Math.min(photos.length - 1, nextIndex));
          const photo = photos[index];
          enlargedImage.classList.remove("is-loaded");
          enlargedImage.alt = photo.alt;
          enlargedImage.src = photo.currentSrc || photo.src;
          lightbox.setAttribute(
            "aria-label",
            photo.alt ? `${labels.image}: ${photo.alt}` : labels.image,
          );
          previous.disabled = index === 0;
          next.disabled = index === photos.length - 1;
          if (document.activeElement === previous && previous.disabled) {
            (next.hidden || next.disabled ? lightbox : next).focus();
          } else if (document.activeElement === next && next.disabled) {
            (previous.hidden || previous.disabled
              ? lightbox
              : previous
            ).focus();
          }
          if (enlargedImage.complete) revealImage();
        };
        const closeLightbox = () => {
          document.removeEventListener("keydown", handleKeydown);
          document.body.classList.remove("recipe-lightbox-open");
          enlargedImage.onload = null;
          enlargedImage.onerror = null;
          lightbox.remove();
          previousFocus?.focus();
        };
        const previous = control(labels.previous, "←", "previous", () =>
          showImage(index - 1),
        );
        const next = control(labels.next, "→", "next", () =>
          showImage(index + 1),
        );
        previous.hidden = next.hidden = photos.length < 2;

        const handleKeydown = (keyboardEvent: KeyboardEvent) => {
          if (keyboardEvent.key === "Escape") {
            keyboardEvent.preventDefault();
            closeLightbox();
          } else if (
            keyboardEvent.key === "ArrowLeft" ||
            keyboardEvent.key === "ArrowRight"
          ) {
            keyboardEvent.preventDefault();
            showImage(index + (keyboardEvent.key === "ArrowRight" ? 1 : -1));
          } else if (keyboardEvent.key === "Tab") {
            const controls = [previous, next].filter(
              (button) => !button.disabled && !button.hidden,
            );
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (!first) {
              keyboardEvent.preventDefault();
              lightbox.focus();
            } else if (document.activeElement === lightbox) {
              keyboardEvent.preventDefault();
              (keyboardEvent.shiftKey ? last : first).focus();
            } else if (
              keyboardEvent.shiftKey &&
              document.activeElement === first
            ) {
              keyboardEvent.preventDefault();
              last.focus();
            } else if (
              !keyboardEvent.shiftKey &&
              document.activeElement === last
            ) {
              keyboardEvent.preventDefault();
              first.focus();
            }
          }
        };

        showImage(index);
        lightbox.addEventListener("click", closeLightbox);
        lightbox.append(previous, enlargedImage, next);
        document.body.append(lightbox);
        document.body.classList.add("recipe-lightbox-open");
        document.addEventListener("keydown", handleKeydown);
        lightbox.focus();
      });
    });
}

initializeRecipeImageLightboxes();
