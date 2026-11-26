import type {
  Catalog,
  Offering,
  Price,
  Provider,
  Source,
} from "../src/healthcare/types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function object(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ApiError(400, "Expected a JSON object.");
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some((key) => !keys.includes(key)))
    throw new ApiError(400, "Unexpected request field.");
  return result;
}

export function text(
  value: unknown,
  label: string,
  maximum: number,
  minimum = 1,
): string {
  if (typeof value !== "string")
    throw new ApiError(400, `${label} is required.`);
  const clean = value.trim();
  if (
    clean.length < minimum ||
    clean.length > maximum ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(clean)
  ) {
    throw new ApiError(
      400,
      `${label} must be ${minimum}–${maximum} characters without control characters.`,
    );
  }
  return clean;
}

export function email(value: unknown): string {
  const result = text(value, "Email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    throw new ApiError(400, "Enter a valid email address.");
  return result;
}

export function password(value: unknown, label = "Password"): string {
  if (typeof value !== "string" || value.length < 12 || value.length > 128)
    throw new ApiError(400, `${label} must be 12–128 characters.`);
  return value;
}

export function identifier(value: unknown, label = "ID"): string {
  const result = text(value, label, 120);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result))
    throw new ApiError(
      400,
      `${label} must use lowercase letters, digits and hyphens.`,
    );
  return result;
}

export function httpsUrl(value: unknown, label = "Source URL"): string {
  const result = text(value, label, 500);
  let url: URL;
  try {
    url = new URL(result);
  } catch {
    throw new ApiError(400, `${label} must be a valid HTTPS URL.`);
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !url.hostname.includes(".") ||
    url.hostname.endsWith(".local")
  ) {
    throw new ApiError(
      400,
      `${label} must be a public HTTPS URL without embedded credentials.`,
    );
  }
  return result;
}

function optionalHttpsUrl(value: unknown, label: string): string {
  const result = text(value, label, 500, 0);
  return result ? httpsUrl(result, label) : "";
}

function strings(value: unknown, label: string, maximumItems = 30): string[] {
  if (!Array.isArray(value) || value.length > maximumItems)
    throw new ApiError(
      400,
      `${label} must be an array with at most ${maximumItems} entries.`,
    );
  return value.map((entry) => text(entry, label, 500));
}

function source(value: unknown): Source {
  const data = object(value, ["label", "url", "checkedAt"]);
  const checkedAt = text(data.checkedAt, "Source review date", 40);
  if (
    !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(checkedAt) ||
    !Number.isFinite(Date.parse(checkedAt)) ||
    Date.parse(checkedAt) > Date.now() + 86400000
  ) {
    throw new ApiError(
      400,
      "Source review date must be a valid non-future date.",
    );
  }
  return {
    label: text(data.label, "Source label", 200),
    url: httpsUrl(data.url),
    checkedAt,
  };
}

function price(value: unknown): Price {
  const data = object(value, [
    "kind",
    "currency",
    "amountMinor",
    "maximumMinor",
    "minorUnit",
    "unit",
    "includes",
    "excludes",
    "sourceUrl",
  ]);
  const kind = data.kind;
  if (
    kind !== "not-published" &&
    kind !== "quote-required" &&
    kind !== "fixed" &&
    kind !== "from" &&
    kind !== "range"
  )
    throw new ApiError(400, "Invalid price kind.");
  const result: Price = {
    kind,
    includes: strings(data.includes, "Price inclusions"),
    excludes: strings(data.excludes, "Price exclusions"),
  };
  if (data.unit !== undefined) result.unit = text(data.unit, "Price unit", 160);
  if (data.sourceUrl !== undefined)
    result.sourceUrl = httpsUrl(data.sourceUrl, "Price source URL");
  if (kind === "not-published" || kind === "quote-required") {
    if (
      [data.amountMinor, data.maximumMinor, data.currency, data.minorUnit].some(
        (field) => field !== undefined,
      )
    )
      throw new ApiError(
        400,
        "Unpublished prices cannot contain numeric amounts or currency.",
      );
    return result;
  }
  const currency = text(data.currency, "Price currency", 3, 3);
  if (!/^[A-Z]{3}$/.test(currency))
    throw new ApiError(400, "Price currency must be an ISO currency code.");
  let currencyDigits: number;
  try {
    if (!Intl.supportedValuesOf("currency").includes(currency))
      throw new Error("currency");
    currencyDigits = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits!;
  } catch {
    throw new ApiError(400, "Unsupported price currency.");
  }
  if (data.minorUnit !== currencyDigits)
    throw new ApiError(400, "Price minor unit must match its currency.");
  if (
    typeof data.amountMinor !== "number" ||
    !Number.isSafeInteger(data.amountMinor) ||
    data.amountMinor <= 0
  )
    throw new ApiError(
      400,
      "Price amount must be a positive integer in minor currency units.",
    );
  if (!result.sourceUrl || !result.unit)
    throw new ApiError(
      400,
      "Published prices require an official source and pricing unit.",
    );
  Object.assign(result, {
    currency,
    minorUnit: currencyDigits,
    amountMinor: data.amountMinor,
  });
  if (kind === "range") {
    if (
      typeof data.maximumMinor !== "number" ||
      !Number.isSafeInteger(data.maximumMinor) ||
      data.maximumMinor < data.amountMinor
    )
      throw new ApiError(400, "Range maximum must be at least the minimum.");
    result.maximumMinor = data.maximumMinor;
  } else if (data.maximumMinor !== undefined)
    throw new ApiError(400, "Only range prices can contain a maximum.");
  return result;
}

export function providerRevision(
  value: unknown,
  id: string,
  catalog: Catalog,
): { provider: Provider; offerings: Offering[] } {
  const body = object(value, ["provider", "offerings"]);
  const data = object(body.provider, [
    "id",
    "name",
    "countryCode",
    "city",
    "address",
    "website",
    "summary",
    "languages",
    "facilities",
    "practitioners",
    "credentialClaims",
    "sources",
    "status",
    "listingKind",
    "profileLevel",
    "contactUrl",
    "updatedAt",
  ]);
  if (identifier(data.id, "Provider ID") !== id)
    throw new ApiError(400, "Provider ID must match the request path.");
  if (data.listingKind !== "independent")
    throw new ApiError(
      400,
      "Only independent listings are supported; editing cannot establish a partnership.",
    );
  if (!["draft", "published", "suspended"].includes(String(data.status)))
    throw new ApiError(400, "Invalid listing status.");
  if (
    data.profileLevel !== undefined &&
    data.profileLevel !== "basic" &&
    data.profileLevel !== "detailed"
  )
    throw new ApiError(400, "Invalid provider profile level.");
  const profileLevel = data.profileLevel ?? "detailed";
  const countryCode = text(data.countryCode, "Country code", 2, 2);
  if (!catalog.countries.some((country) => country.code === countryCode))
    throw new ApiError(400, "Unknown country code.");
  if (
    !Array.isArray(data.sources) ||
    data.sources.length < 1 ||
    data.sources.length > 30
  )
    throw new ApiError(400, "Include 1–30 public sources.");
  if (!Array.isArray(data.practitioners) || data.practitioners.length > 50)
    throw new ApiError(400, "Invalid practitioner list.");
  if (
    !Array.isArray(data.credentialClaims) ||
    data.credentialClaims.length > 30
  )
    throw new ApiError(400, "Invalid credential claims.");
  const provider: Provider = {
    id,
    name: text(data.name, "Provider name", 200),
    countryCode,
    city: text(data.city, "City", 120),
    address: text(
      data.address,
      "Address",
      500,
      profileLevel === "basic" ? 0 : 1,
    ),
    website:
      profileLevel === "basic"
        ? optionalHttpsUrl(data.website, "Official website")
        : httpsUrl(data.website, "Official website"),
    summary: text(data.summary, "Provider summary", 4000),
    languages: strings(data.languages, "Language"),
    facilities: strings(data.facilities, "Facility"),
    contactUrl:
      profileLevel === "basic"
        ? optionalHttpsUrl(data.contactUrl, "Official contact URL")
        : httpsUrl(data.contactUrl, "Official contact URL"),
    sources: data.sources.map(source),
    status: "draft",
    listingKind: "independent",
    profileLevel,
    updatedAt: new Date().toISOString(),
    practitioners: data.practitioners.map((value) => {
      const row = object(value, ["name", "role", "sourceUrl"]);
      return {
        name: text(row.name, "Practitioner name", 160),
        role: text(row.role, "Practitioner role", 160),
        sourceUrl: httpsUrl(row.sourceUrl),
      };
    }),
    credentialClaims: data.credentialClaims.map((value) => {
      const row = object(value, ["label", "sourceUrl", "note"]);
      return {
        label: text(row.label, "Claim label", 250),
        sourceUrl: httpsUrl(row.sourceUrl),
        note: text(row.note, "Claim qualification", 1000),
      };
    }),
  };
  if (
    !Array.isArray(body.offerings) ||
    body.offerings.length < 1 ||
    body.offerings.length > 100
  )
    throw new ApiError(400, "Include 1–100 source-backed offerings.");
  const ids = new Set<string>();
  const offerings: Offering[] = body.offerings.map((value) => {
    const row = object(value, [
      "id",
      "providerId",
      "treatmentId",
      "summary",
      "scope",
      "exclusions",
      "price",
      "source",
    ]);
    const offeringId = identifier(row.id, "Offering ID");
    if (ids.has(offeringId)) throw new ApiError(400, "Duplicate offering ID.");
    ids.add(offeringId);
    if (row.providerId !== id)
      throw new ApiError(400, "Offering belongs to a different provider.");
    const treatmentId = identifier(row.treatmentId, "Treatment ID");
    if (!catalog.treatments.some((treatment) => treatment.id === treatmentId))
      throw new ApiError(400, "Unknown treatment ID.");
    const scope = strings(row.scope, "Offering scope");
    if (!scope.length)
      throw new ApiError(
        400,
        "Offering scope must describe the source-backed service.",
      );
    return {
      id: offeringId,
      providerId: id,
      treatmentId,
      summary: text(row.summary, "Offering summary", 2000),
      scope,
      exclusions: strings(row.exclusions, "Offering exclusion"),
      price: price(row.price),
      source: source(row.source),
    };
  });
  return { provider, offerings };
}
