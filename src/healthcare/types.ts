export interface Source {
  label: string;
  url: string;
  checkedAt: string;
}

export interface CareCategory {
  id: string;
  name: string;
  description: string;
}

export interface Treatment {
  id: string;
  categoryId: string;
  name: string;
  summary: string;
  sourceUrl: string;
}

export interface Country {
  code: string;
  name: string;
  region: string;
  cities: string[];
}

export interface Price {
  kind: "not-published" | "quote-required" | "fixed" | "from" | "range";
  currency?: string;
  amountMinor?: number;
  maximumMinor?: number;
  minorUnit?: number;
  unit?: string;
  includes: string[];
  excludes: string[];
  sourceUrl?: string;
}

export interface Practitioner {
  name: string;
  role: string;
  sourceUrl: string;
}

export interface Provider {
  id: string;
  name: string;
  countryCode: string;
  city: string;
  address: string;
  website: string;
  summary: string;
  languages: string[];
  facilities: string[];
  practitioners: Practitioner[];
  credentialClaims: { label: string; sourceUrl: string; note: string }[];
  sources: Source[];
  status: "draft" | "published" | "suspended";
  listingKind: "independent" | "partner";
  profileLevel?: "basic" | "detailed";
  contactUrl: string;
  updatedAt: string;
}

export interface Offering {
  id: string;
  providerId: string;
  treatmentId: string;
  summary: string;
  scope: string[];
  exclusions: string[];
  price: Price;
  source: Source;
}

export interface Guide {
  id: string;
  title: string;
  category: "Planning" | "Costs" | "Safety" | "Aftercare";
  summary: string;
  readMinutes: number;
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  sources: Source[];
}

export interface Catalog {
  categories: CareCategory[];
  treatments: Treatment[];
  countries: Country[];
  providers: Provider[];
  offerings: Offering[];
  guides: Guide[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "patient" | "staff";
}

export interface InquiryMessage {
  id: string;
  sender: "patient" | "staff";
  body: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  userId: string;
  providerId: string;
  providerName: string;
  offeringId: string | null;
  status: "received" | "responded" | "closed";
  createdAt: string;
  updatedAt: string;
  messages: InquiryMessage[];
}

export interface ProviderApplication {
  id: string;
  organization: string;
  contactName: string;
  email: string;
  website: string;
  countryCode: string;
  city: string;
  message: string;
  status: "received" | "reviewing" | "approved" | "declined";
  createdAt: string;
}

export interface SupportRequest {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: "received" | "closed";
  createdAt: string;
}
