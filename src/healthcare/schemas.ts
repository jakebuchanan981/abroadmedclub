import { z } from "zod";
import type {
  Catalog,
  Inquiry,
  Offering,
  Provider,
  ProviderApplication,
  SupportRequest,
  User,
} from "./types";
import { parseCommunityResponse } from "../community/schemas";
import { parseMessagingResponse } from "../messaging/schemas";
import { parseTravelResponse } from "../travel/schemas";

const source = z.object({
  label: z.string(),
  url: z.string().url(),
  checkedAt: z.string(),
});
const price = z.object({
  kind: z.enum(["not-published", "quote-required", "fixed", "from", "range"]),
  currency: z.string().optional(),
  amountMinor: z.number().int().nonnegative().optional(),
  maximumMinor: z.number().int().nonnegative().optional(),
  minorUnit: z.number().int().nonnegative().optional(),
  unit: z.string().optional(),
  includes: z.array(z.string()),
  excludes: z.array(z.string()),
  sourceUrl: z.string().url().optional(),
});
const provider: z.ZodType<Provider> = z.object({
  id: z.string(),
  name: z.string(),
  countryCode: z.string(),
  city: z.string(),
  address: z.string(),
  website: z.union([z.string().url(), z.literal("")]),
  summary: z.string(),
  languages: z.array(z.string()),
  facilities: z.array(z.string()),
  practitioners: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      sourceUrl: z.string().url(),
    }),
  ),
  credentialClaims: z.array(
    z.object({
      label: z.string(),
      sourceUrl: z.string().url(),
      note: z.string(),
    }),
  ),
  sources: z.array(source),
  status: z.enum(["draft", "published", "suspended"]),
  listingKind: z.enum(["independent", "partner"]),
  profileLevel: z.enum(["basic", "detailed"]).optional(),
  contactUrl: z.union([z.string().url(), z.literal("")]),
  updatedAt: z.string(),
});
const offering: z.ZodType<Offering> = z.object({
  id: z.string(),
  providerId: z.string(),
  treatmentId: z.string(),
  summary: z.string(),
  scope: z.array(z.string()),
  exclusions: z.array(z.string()),
  price,
  source,
});
export const catalogSchema: z.ZodType<Catalog> = z.object({
  categories: z.array(
    z.object({ id: z.string(), name: z.string(), description: z.string() }),
  ),
  treatments: z.array(
    z.object({
      id: z.string(),
      categoryId: z.string(),
      name: z.string(),
      summary: z.string(),
      sourceUrl: z.string().url(),
    }),
  ),
  countries: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      region: z.string(),
      cities: z.array(z.string()),
    }),
  ),
  providers: z.array(provider),
  offerings: z.array(offering),
  guides: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: z.enum(["Planning", "Costs", "Safety", "Aftercare"]),
      summary: z.string(),
      readMinutes: z.number().nonnegative(),
      sections: z.array(
        z.object({
          heading: z.string(),
          paragraphs: z.array(z.string()),
          bullets: z.array(z.string()).optional(),
        }),
      ),
      sources: z.array(source),
    }),
  ),
});
export const userSchema: z.ZodType<User> = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["patient", "staff"]),
});
export const inquirySchema: z.ZodType<Inquiry> = z.object({
  id: z.string(),
  userId: z.string(),
  providerId: z.string(),
  providerName: z.string(),
  offeringId: z.string().nullable(),
  status: z.enum(["received", "responded", "closed"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(
    z.object({
      id: z.string(),
      sender: z.enum(["patient", "staff"]),
      body: z.string(),
      createdAt: z.string(),
    }),
  ),
});
const support: z.ZodType<SupportRequest> = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  topic: z.string(),
  message: z.string(),
  status: z.enum(["received", "closed"]),
  createdAt: z.string(),
});
const application: z.ZodType<ProviderApplication> = z.object({
  id: z.string(),
  organization: z.string(),
  contactName: z.string(),
  email: z.string(),
  website: z.string(),
  countryCode: z.string(),
  city: z.string(),
  message: z.string(),
  status: z.enum(["received", "reviewing", "approved", "declined"]),
  createdAt: z.string(),
});
const ok = z.object({ ok: z.literal(true) });
const receipt = z.object({ id: z.string(), status: z.literal("received") });

export function parseApiResponse(
  path: string,
  method: string,
  value: unknown,
): unknown {
  if (path.startsWith("/community/"))
    return parseCommunityResponse(path, method, value);
  if (path.startsWith("/messaging/"))
    return parseMessagingResponse(path, method, value);
  if (path.startsWith("/travel/"))
    return parseTravelResponse(path, method, value);
  let schema: z.ZodType;
  if (path === "/catalog" || path === "/admin/catalog") schema = catalogSchema;
  else if (path === "/auth/login" || path === "/auth/register")
    schema = z.object({ user: userSchema, token: z.string() });
  else if (path === "/auth/session")
    schema = z.object({ user: userSchema.nullable() });
  else if (
    path === "/auth/logout" ||
    path === "/auth/password" ||
    path === "/auth/account"
  )
    schema = ok;
  else if (path === "/inquiries")
    schema = method === "GET" ? z.array(inquirySchema) : inquirySchema;
  else if (/^\/inquiries\/[^/]+(?:\/messages)?$/.test(path))
    schema = inquirySchema;
  else if (path === "/admin/inquiries") schema = z.array(inquirySchema);
  else if (path === "/support" || path === "/provider-applications")
    schema = receipt;
  else if (path === "/admin/support") schema = z.array(support);
  else if (path === "/admin/provider-applications")
    schema = z.array(application);
  else if (/^\/admin\/providers\/[^/]+$/.test(path) && method === "PUT")
    schema = z.object({ provider, offerings: z.array(offering) });
  else if (
    /^\/admin\/providers\/[^/]+\/(publish|suspend)$/.test(path) ||
    /^\/admin\/(support|provider-applications)\/[^/]+$/.test(path)
  )
    schema = ok;
  else throw new Error("Unsupported directory service response.");
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error(
      "The directory service returned an unexpected format. Refresh and try again.",
    );
  return result.data;
}
