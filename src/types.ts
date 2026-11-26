import type { ImageSourcePropType } from "react-native";

export type Tab = "explore" | "club" | "trips" | "messages" | "profile";
export type PlanMode = "independent" | "abroadmedclub" | "partner";
export type Currency = "USD" | "EUR" | "GBP";

export interface Destination {
  id: string;
  city: string;
  country: string;
  region: "Europe" | "Asia" | "Americas";
  image: ImageSourcePropType;
  subtitle: string;
  description: string;
  timezone: string;
}

export interface Trip {
  id: string;
  destinationId: string;
  startsOn: string;
  endsOn: string;
  mode: PlanMode;
  checklist: Record<string, boolean>;
  createdAt: string;
}

export interface Preferences {
  displayName: string;
  homeCountry: string;
  currency: Currency;
  discoverable: boolean;
}

export interface AppState {
  version: 1;
  savedDestinations: string[];
  joinedCommunities: string[];
  trips: Trip[];
  drafts: Record<string, string>;
  preferences: Preferences;
}
