import { countries } from "../healthcare/catalog-data";

// These are empty discussion spaces, not accounts, endorsements or travel packages.
export const starterCircles = [
  {
    id: "support-planning-abroad",
    name: "Planning care abroad",
    kind: "support" as const,
    description:
      "An opt-in space for member experiences and practical planning questions. Peer discussion is not clinical advice; staff can review community content. No treatment, booking or monitoring is provided here.",
    countryCode: null,
  },
  {
    id: "support-after-travel",
    name: "After returning home",
    kind: "support" as const,
    description:
      "Share practical experiences after travel with other consenting members. This is not a clinical follow-up service or an emergency channel. Contact your treating clinician for medical concerns.",
    countryCode: null,
  },
  ...countries.map((country) => ({
    id: `destination-${country.code.toLowerCase()}`,
    name: `${country.name} planning circle`,
    kind: "destination" as const,
    description: `Member discussion about practical travel planning in ${country.name}. Membership is optional. No providers, bookings, packages or outcomes are arranged or endorsed by this circle.`,
    countryCode: country.code,
  })),
];
