import type { Catalog, Offering, Provider } from "./types";

export const normalize = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
export type ProviderFilters = {
  categoryId?: string;
  treatmentId?: string;
  countryCode?: string;
  city?: string;
  q?: string;
  language?: string;
  publishedPriceOnly?: boolean;
  sort?: "name" | "location";
};

export function searchProviders(
  catalog: Catalog,
  filters: ProviderFilters,
): Provider[] {
  const treatments = Object.fromEntries(
    catalog.treatments.map((treatment) => [treatment.id, treatment]),
  );
  const categories = Object.fromEntries(
    catalog.categories.map((category) => [category.id, category.name]),
  );
  const countries = Object.fromEntries(
    catalog.countries.map((country) => [country.code, country.name]),
  );
  const offeringsByProvider = new Map<string, Offering[]>();
  for (const offering of catalog.offerings) {
    const list = offeringsByProvider.get(offering.providerId);
    if (list) list.push(offering);
    else offeringsByProvider.set(offering.providerId, [offering]);
  }
  const terms = normalize(filters.q ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const city = filters.city ? normalize(filters.city) : undefined;
  return catalog.providers
    .filter((provider) => {
      if (filters.countryCode && provider.countryCode !== filters.countryCode)
        return false;
      if (city && normalize(provider.city) !== city) return false;
      if (filters.language && !provider.languages.includes(filters.language))
        return false;
      const offerings = offeringsByProvider.get(provider.id) ?? [];
      const matchingServices =
        filters.treatmentId || filters.categoryId
          ? offerings.filter(
              (offering) =>
                (!filters.treatmentId ||
                  offering.treatmentId === filters.treatmentId) &&
                (!filters.categoryId ||
                  treatments[offering.treatmentId]?.categoryId ===
                    filters.categoryId),
            )
          : offerings;
      if (
        (filters.treatmentId || filters.categoryId) &&
        !matchingServices.length
      )
        return false;
      if (
        filters.publishedPriceOnly &&
        !matchingServices.some(
          (offering) =>
            offering.price.kind === "fixed" ||
            offering.price.kind === "from" ||
            offering.price.kind === "range",
        )
      )
        return false;
      if (!terms.length) return true;
      const searchText = normalize(
        [
          provider.name,
          provider.city,
          countries[provider.countryCode],
          provider.summary,
          ...matchingServices.flatMap((offering) => {
            const treatment = treatments[offering.treatmentId];
            return [
              treatment?.name,
              treatment ? categories[treatment.categoryId] : "",
              offering.summary,
              ...offering.scope,
            ];
          }),
        ].join(" "),
      );
      return terms.every((term) => searchText.includes(term));
    })
    .sort((a, b) =>
      filters.sort === "location"
        ? `${countries[a.countryCode]} ${a.city} ${a.name}`.localeCompare(
            `${countries[b.countryCode]} ${b.city} ${b.name}`,
          )
        : a.name.localeCompare(b.name),
    );
}
