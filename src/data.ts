import type { Destination } from "./types";

export const brand = {
  name: "abroadmedclub",
  displayName: "AbroadMedClub",
  tagline: "Go for care. Find your people.",
};

export const destinations: Destination[] = [
  {
    id: "istanbul",
    city: "Istanbul",
    country: "Türkiye",
    region: "Europe",
    image: require("../assets/destinations/istanbul.jpg"),
    subtitle: "A meeting place of worlds",
    description:
      "Find your bearings on the Bosphorus. Explore the city, prepare questions for care providers, and connect with fellow travelers before you go.",
    timezone: "Europe/Istanbul",
  },
  {
    id: "bangkok",
    city: "Bangkok",
    country: "Thailand",
    region: "Asia",
    image: require("../assets/destinations/bangkok.jpg"),
    subtitle: "A warm welcome, a fresh perspective",
    description:
      "Get to know Bangkok with a community of travelers. Start with practical questions about your stay, transport, and arranging an individual consultation.",
    timezone: "Asia/Bangkok",
  },
  {
    id: "seoul",
    city: "Seoul",
    country: "South Korea",
    region: "Asia",
    image: require("../assets/destinations/seoul.jpg"),
    subtitle: "Thoughtful care, a city to discover",
    description:
      "Explore a different side of Seoul. Meet people planning a similar journey and build a personal checklist for consultations, language support, and time away.",
    timezone: "Asia/Seoul",
  },
  {
    id: "budapest",
    city: "Budapest",
    country: "Hungary",
    region: "Europe",
    image: require("../assets/destinations/budapest.jpg"),
    subtitle: "Room to slow down by the Danube",
    description:
      "Plan your stay around your own needs. Find fellow travelers and prepare for conversations about treatment, follow-up care, and a comfortable place to stay.",
    timezone: "Europe/Budapest",
  },
  {
    id: "san-jose",
    city: "San José",
    country: "Costa Rica",
    region: "Americas",
    image: require("../assets/destinations/san-jose.jpg"),
    subtitle: "A little closer to nature",
    description:
      "Start a Costa Rica travel plan and connect with a supportive circle. Leave room for individual medical advice when considering travel, activities, and recovery.",
    timezone: "America/Costa_Rica",
  },
  {
    id: "lisbon",
    city: "Lisbon",
    country: "Portugal",
    region: "Europe",
    image: require("../assets/destinations/lisbon.jpg"),
    subtitle: "New beginnings on the Atlantic",
    description:
      "Discover Lisbon at your own pace. Gather practical travel tips and prepare a plan with your clinician before making any medical or travel commitments.",
    timezone: "Europe/Lisbon",
  },
];

export function getDestination(id: string) {
  return destinations.find((destination) => destination.id === id);
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
