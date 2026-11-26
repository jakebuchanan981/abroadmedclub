import type { Circle, PageResult } from "../community/types";
import type { PlanMode } from "../types";

export type TripChecklist = Partial<
  Record<"consultation" | "documents" | "costs" | "stay" | "support", boolean>
>;

export interface AccountTrip {
  id: string;
  countryCode: string;
  city: string;
  startsOn: string;
  endsOn: string;
  mode: PlanMode;
  checklist: TripChecklist;
  createdAt: string;
  updatedAt: string;
}

export type TripInput = Pick<
  AccountTrip,
  "countryCode" | "city" | "startsOn" | "endsOn" | "mode"
>;
export type TripPatch = Partial<TripInput & Pick<AccountTrip, "checklist">>;
export interface TripImportReceipt {
  items: AccountTrip[];
  createdCount: number;
  existingCount: number;
}

export interface TripCommunityFocus {
  id: string;
  countryCode: string;
  city: string;
  startsOn: string;
  endsOn: string;
}

export interface TripCommunityMatchSource {
  countryCode: string;
  city: string;
  startsOn: string;
  endsOn: string;
  updatedAt: string;
}

export interface TripCommunityMatches {
  source: TripCommunityMatchSource;
  destinationCircle: Circle | null;
  travelGroups: PageResult<Circle>;
}
