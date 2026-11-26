import type { PlanMode } from "../types";

export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

export const planModes: {
  id: PlanMode;
  title: string;
  description: string;
  organizer: string;
}[] = [
  {
    id: "independent",
    title: "Plan it myself",
    description: "Your pace, your choices. Keep everything in one place.",
    organizer: "You coordinate your own trip",
  },
  {
    id: "abroadmedclub",
    title: "Plan with the club",
    description: "Explore having the AbroadMedClub team coordinate your trip.",
    organizer: "AbroadMedClub — planning preference only",
  },
  {
    id: "partner",
    title: "Plan with a partner",
    description: "Explore support from an independent trip organizer.",
    organizer: "Independent organizer — not yet selected",
  },
];
export const tripChecklist = [
  {
    id: "consultation",
    title: "Discuss suitability and follow-up with a clinician",
    detail:
      "Treatment decisions are individual, even when you travel together.",
  },
  {
    id: "documents",
    title: "Check entry rules and travel documents",
    detail: "Requirements depend on your passport and destination.",
  },
  {
    id: "costs",
    title: "Confirm itemized costs and cancellation terms",
    detail: "Ask who provides care, takes payment, and handles support.",
  },
  {
    id: "stay",
    title: "Plan accommodation and airport transfers",
    detail: "Check accessibility and distance from your care provider.",
  },
  {
    id: "support",
    title: "Arrange a personal support and aftercare plan",
    detail: "Confirm local contacts, coverage, and emergency arrangements.",
  },
];

export const legacyDestinationPlaces: Record<
  string,
  { countryCode: string; city: string }
> = {
  istanbul: { countryCode: "TR", city: "Istanbul" },
  bangkok: { countryCode: "TH", city: "Bangkok" },
  seoul: { countryCode: "KR", city: "Seoul" },
  budapest: { countryCode: "HU", city: "Budapest" },
  "san-jose": { countryCode: "CR", city: "San José" },
  lisbon: { countryCode: "PT", city: "Lisbon" },
};
