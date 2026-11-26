import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { request, useHealthcare } from "../healthcare/client";
import { useApp } from "../store";
import type { Trip } from "../types";
import type {
  AccountTrip,
  TripCommunityFocus,
  TripImportReceipt,
  TripInput,
  TripPatch,
} from "./types";

interface TravelContextValue {
  accountTrips: AccountTrip[];
  loading: boolean;
  pending: boolean;
  error: string | null;
  clubTripFocus: TripCommunityFocus | null;
  refreshTrips: () => Promise<void>;
  getTrip: (id: string) => Promise<AccountTrip>;
  createAccountTrip: (input: TripInput) => Promise<AccountTrip>;
  updateAccountTrip: (
    trip: AccountTrip,
    patch: TripPatch,
  ) => Promise<AccountTrip>;
  deleteAccountTrip: (trip: AccountTrip) => Promise<void>;
  openClubForTrip: (trip: AccountTrip) => void;
  clearClubTripFocus: () => void;
  importLocalTrips: (trips: Trip[]) => Promise<TripImportReceipt>;
}
const TravelContext = createContext<TravelContextValue | null>(null);
type Cache = {
  ownerId: string | null;
  items: AccountTrip[];
  loading: boolean;
  pending: boolean;
  error: string | null;
};

export function TravelProvider({ children }: { children: React.ReactNode }) {
  const { user } = useHealthcare();
  const { tab, navigate } = useApp();
  const ownerId = user?.id ?? null;
  const identity = useRef({ ownerId, generation: 0 });
  if (identity.current.ownerId !== ownerId)
    identity.current = { ownerId, generation: identity.current.generation + 1 };
  const [cache, setCache] = useState<Cache>({
    ownerId: null,
    items: [],
    loading: false,
    pending: false,
    error: null,
  });
  const [clubTripFocus, setClubTripFocus] =
    useState<TripCommunityFocus | null>(null);
  const wasInClub = useRef(tab === "club");
  const sequence = useRef(0);
  const writing = useRef<number | null>(null);
  const refreshTrips = useCallback(async () => {
    const current = identity.current;
    if (!current.ownerId) return;
    const serial = ++sequence.current;
    setCache((previous) => ({
      ownerId: current.ownerId,
      items: previous.ownerId === current.ownerId ? previous.items : [],
      loading: true,
      pending: previous.ownerId === current.ownerId && previous.pending,
      error: null,
    }));
    try {
      const result = await request<{ items: AccountTrip[] }>("/travel/trips");
      if (identity.current !== current || sequence.current !== serial) return;
      setCache((previous) => ({
        ...previous,
        ownerId: current.ownerId,
        items: result.items,
        loading: false,
        error: null,
      }));
    } catch (cause) {
      if (identity.current !== current || sequence.current !== serial) return;
      setCache((previous) => ({
        ...previous,
        loading: false,
        error:
          cause instanceof Error
            ? cause.message
            : "Could not load your account trips.",
      }));
    }
  }, []);
  useEffect(() => {
    setCache({
      ownerId,
      items: [],
      loading: Boolean(ownerId),
      pending: false,
      error: null,
    });
    void refreshTrips();
  }, [ownerId, refreshTrips]);
  useEffect(() => {
    if (tab === "trips") void refreshTrips();
  }, [tab, refreshTrips]);
  useEffect(() => {
    if (wasInClub.current && tab !== "club") setClubTripFocus(null);
    wasInClub.current = tab === "club";
  }, [tab]);

  const openClubForTrip = useCallback(
    (trip: AccountTrip) => {
      setClubTripFocus({
        id: trip.id,
        countryCode: trip.countryCode,
        city: trip.city,
        startsOn: trip.startsOn,
        endsOn: trip.endsOn,
      });
      navigate("club");
    },
    [navigate],
  );
  const clearClubTripFocus = useCallback(() => setClubTripFocus(null), []);

  async function perform<T>(
    operation: () => Promise<T>,
    items: (result: T, previous: AccountTrip[]) => AccountTrip[],
  ): Promise<T> {
    const current = identity.current;
    if (!current.ownerId || current.ownerId !== ownerId)
      throw new Error("Sign in to manage account trips.");
    if (writing.current === current.generation)
      throw new Error("Wait for the current trip request to finish.");
    writing.current = current.generation;
    ++sequence.current;
    setCache((previous) => ({
      ownerId,
      items: previous.ownerId === ownerId ? previous.items : [],
      pending: true,
      loading: false,
      error: null,
    }));
    try {
      const result = await operation();
      if (identity.current !== current)
        throw new Error(
          "Your account changed. The previous account response was discarded.",
        );
      ++sequence.current;
      setCache((previous) => ({
        ownerId,
        items: items(
          result,
          previous.ownerId === ownerId ? previous.items : [],
        ).sort(
          (a, b) =>
            b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id),
        ),
        pending: false,
        loading: false,
        error: null,
      }));
      void refreshTrips();
      return result;
    } catch (cause) {
      if (identity.current === current) {
        ++sequence.current;
        setCache((previous) => ({
          ...previous,
          pending: false,
          loading: false,
          error:
            cause instanceof Error
              ? cause.message
              : "Could not save your account trip.",
        }));
      }
      throw cause;
    } finally {
      if (writing.current === current.generation) writing.current = null;
    }
  }
  const visible = cache.ownerId === ownerId && ownerId !== null;
  return (
    <TravelContext.Provider
      value={{
        accountTrips: visible ? cache.items : [],
        loading: visible ? cache.loading : Boolean(ownerId),
        pending: visible && cache.pending,
        error: visible ? cache.error : null,
        clubTripFocus,
        refreshTrips,
        openClubForTrip,
        clearClubTripFocus,
        getTrip: (id) =>
          perform(
            () =>
              request<AccountTrip>(`/travel/trips/${encodeURIComponent(id)}`),
            (trip, previous) => [
              trip,
              ...previous.filter((item) => item.id !== trip.id),
            ],
          ),
        createAccountTrip: (input) =>
          perform(
            () =>
              request<AccountTrip>("/travel/trips", {
                method: "POST",
                body: { ...input, consent: true },
              }),
            (trip, previous) => [
              trip,
              ...previous.filter((item) => item.id !== trip.id),
            ],
          ),
        updateAccountTrip: (trip, patch) =>
          perform(
            () =>
              request<AccountTrip>(
                `/travel/trips/${encodeURIComponent(trip.id)}`,
                {
                  method: "PATCH",
                  body: { expectedUpdatedAt: trip.updatedAt, patch },
                },
              ),
            (result, previous) => [
              result,
              ...previous.filter((item) => item.id !== result.id),
            ],
          ),
        deleteAccountTrip: (trip) =>
          perform(
            () =>
              request<{ ok: true }>(
                `/travel/trips/${encodeURIComponent(trip.id)}`,
                {
                  method: "DELETE",
                  body: { expectedUpdatedAt: trip.updatedAt },
                },
              ),
            (_result, previous) =>
              previous.filter((item) => item.id !== trip.id),
          ).then(() => undefined),
        importLocalTrips: (trips) =>
          perform(
            () =>
              request<TripImportReceipt>("/travel/import", {
                method: "POST",
                body: { consent: true, trips },
              }),
            (result, previous) => {
              const importedIds = new Set(result.items.map((trip) => trip.id));
              return [
                ...result.items,
                ...previous.filter((trip) => !importedIds.has(trip.id)),
              ];
            },
          ),
      }}
    >
      {children}
    </TravelContext.Provider>
  );
}

export function useTravel() {
  const context = useContext(TravelContext);
  if (!context) throw new Error("TravelProvider is required.");
  return context;
}
