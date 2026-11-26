export type DirectoryRoute =
  | { page: "home" }
  | { page: "specialties"; categoryId?: string }
  | {
      page: "providers";
      categoryId?: string;
      treatmentId?: string;
      countryCode?: string;
      city?: string;
      q?: string;
    }
  | { page: "provider"; id: string }
  | { page: "destinations"; code?: string }
  | { page: "guides"; id?: string }
  | {
      page:
        | "about"
        | "privacy"
        | "terms"
        | "contact"
        | "providers-join"
        | "compare"
        | "how-it-works";
    };

export function directoryPath(route: DirectoryRoute): string {
  const encode = encodeURIComponent;
  switch (route.page) {
    case "home":
      return "/";
    case "specialties":
      return route.categoryId
        ? `/specialties/${encode(route.categoryId)}`
        : "/specialties";
    case "provider":
      return `/centers/${encode(route.id)}`;
    case "destinations":
      return route.code
        ? `/destinations/${encode(route.code.toLowerCase())}`
        : "/destinations";
    case "guides":
      return route.id ? `/guides/${encode(route.id)}` : "/guides";
    case "providers": {
      const params = new URLSearchParams();
      if (route.categoryId) params.set("specialty", route.categoryId);
      if (route.treatmentId) params.set("treatment", route.treatmentId);
      if (route.countryCode) params.set("country", route.countryCode);
      if (route.city) params.set("city", route.city);
      if (route.q) params.set("q", route.q);
      return `/centers${params.size ? `?${params}` : ""}`;
    }
    default:
      return `/${route.page}`;
  }
}

export function readDirectoryRoute(
  pathname: string,
  search = "",
): DirectoryRoute {
  let parts: string[];
  try {
    parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return { page: "providers", q: pathname };
  }
  const [section, id] = parts;
  if (!section) return { page: "home" };
  if (section === "specialties") return { page: "specialties", categoryId: id };
  if (section === "centers" && id) return { page: "provider", id };
  if (section === "centers") {
    const params = new URLSearchParams(search);
    return {
      page: "providers",
      categoryId: params.get("specialty") || undefined,
      treatmentId: params.get("treatment") || undefined,
      countryCode: params.get("country") || undefined,
      city: params.get("city") || undefined,
      q: params.get("q") || undefined,
    };
  }
  if (section === "destinations")
    return { page: "destinations", code: id?.toUpperCase() };
  if (section === "guides") return { page: "guides", id };
  if (
    [
      "about",
      "privacy",
      "terms",
      "contact",
      "providers-join",
      "compare",
      "how-it-works",
    ].includes(section)
  )
    return {
      page: section as
        | "about"
        | "privacy"
        | "terms"
        | "contact"
        | "providers-join"
        | "compare"
        | "how-it-works",
    };
  return { page: "providers", q: pathname };
}
