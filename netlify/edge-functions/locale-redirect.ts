const supportedLocales = ["fr", "en"] as const;

function getPreferredLocale(acceptLanguage: string | null) {
  if (!acceptLanguage) {
    return "fr";
  }

  const preferences = acceptLanguage
    .toLowerCase()
    .split(",")
    .map((entry, index) => {
      const [range, ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      const quality = qualityParameter
        ? Number(qualityParameter.trim().slice(2))
        : 1;

      return { index, quality, range };
    })
    .filter((preference) => preference.quality > 0)
    .sort(
      (first, second) =>
        second.quality - first.quality || first.index - second.index,
    );

  const preferredLanguage = preferences.find(({ range }) =>
    supportedLocales.some(
      (locale) => range === locale || range.startsWith(`${locale}-`),
    ),
  );

  return preferredLanguage?.range.startsWith("en") ? "en" : "fr";
}

export default (request: Request) => {
  const locale = getPreferredLocale(request.headers.get("accept-language"));
  const destination = new URL(`/${locale}/`, request.url);

  destination.search = new URL(request.url).search;

  return Response.redirect(destination, 302);
};

export const config = {
  path: "/",
  onError: "bypass",
};
