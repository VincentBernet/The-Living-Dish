export const DesignSystemColors = {
  cream: "#faf7f2",
  warm50: "#fdf8f3",
  warm100: "#f5ebe0",
  warm200: "#e8d5c4",
  warm800: "#3d2c1e",
  warm900: "#2a1f15",
  accent: "#c45c26",
  accentDark: "#a34a1e",
  selection: "rgb(196 92 38 / 30%)",
  selectionText: "#2a1f15",
  black: "#000000",
  lightboxOverlay: "rgb(42 31 21 / 84%)",
  shadow: "rgb(0 0 0 / 35%)",
} as const;

export const designSystemCssVariables = Object.entries(DesignSystemColors)
  .map(([name, value]) => `--ds-color-${name}: ${value}`)
  .join("; ");
