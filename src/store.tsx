import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { z } from "zod";
import { destinations } from "./data";
import { isDate, tripChecklist } from "./travel/planning";
import type { AppState, Preferences, Tab, Trip } from "./types";

const storageKey = "abroadmedclub.preview.v1";
const tabs: Tab[] = ["explore", "club", "trips", "messages", "profile"];
const initialState: AppState = {
  version: 1,
  savedDestinations: [],
  joinedCommunities: [],
  trips: [],
  drafts: {},
  preferences: {
    displayName: "",
    homeCountry: "",
    currency: "USD",
    discoverable: false,
  },
};

const appStateSchema: z.ZodType<AppState> = z.object({
  version: z.literal(1),
  savedDestinations: z.array(
    z.string().refine((id) => destinations.some((item) => item.id === id)),
  ),
  // Retained local selections are not real online memberships.
  joinedCommunities: z.array(z.string()),
  trips: z.array(
    z
      .object({
        id: z.string(),
        destinationId: z
          .string()
          .refine((id) => destinations.some((item) => item.id === id)),
        startsOn: z.string().refine(isDate),
        endsOn: z.string().refine(isDate),
        mode: z.enum(["independent", "abroadmedclub", "partner"]),
        createdAt: z.string(),
        checklist: z.record(z.string(), z.boolean()),
      })
      .refine((trip) => trip.endsOn >= trip.startsOn),
  ),
  drafts: z.record(z.string(), z.string()),
  preferences: z.object({
    displayName: z.string(),
    homeCountry: z.string(),
    currency: z.enum(["USD", "EUR", "GBP"]),
    discoverable: z.boolean(),
  }),
});

type NewTrip = Pick<Trip, "destinationId" | "startsOn" | "endsOn" | "mode">;
interface AppContextValue {
  state: AppState;
  tab: Tab;
  ready: boolean;
  storageError: string | null;
  toast: string | null;
  plannerDestinationId: string | null;
  navigate: (tab: Tab, path?: string) => void;
  toggleSaved: (id: string) => void;
  createTrip: (input: NewTrip) => void;
  removeTrip: (id: string) => void;
  toggleChecklist: (tripId: string, key: string) => void;
  saveDraft: (id: string, text: string) => void;
  updatePreferences: (patch: Partial<Preferences>) => void;
  resetData: () => void;
  openPlanner: (destinationId?: string) => void;
  closePlanner: () => void;
  notify: (message: string) => void;
}
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [tab, setTab] = useState<Tab>(() => {
    if (Platform.OS !== "web" || typeof window === "undefined")
      return "explore";
    const hash = window.location.hash.slice(1) as Tab;
    return tabs.includes(hash) ? hash : "explore";
  });
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [plannerDestinationId, setPlannerDestinationId] = useState<
    string | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  const writeQueue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          const result = appStateSchema.safeParse(parsed);
          if (!result.success)
            throw new Error("The saved preview has an unsupported format.");
          setState(result.data);
        }
      })
      .catch(() => {
        if (active)
          setStorageError(
            "Your saved preview could not be loaded. Existing data has not been overwritten. You can reset local data in Profile.",
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || storageError) return;
    const serialized = JSON.stringify(state);
    writeQueue.current = writeQueue.current
      .then(() => AsyncStorage.setItem(storageKey, serialized))
      .catch(() => {
        setStorageError(
          "Changes could not be saved on this device. Your current changes remain visible, but may be lost when you close the app.",
        );
      });
  }, [ready, state, storageError]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onHashChange = () => {
      const next = window.location.hash.slice(1) as Tab;
      setTab(tabs.includes(next) ? next : "explore");
    };
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onHashChange);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const navigate = (next: Tab, path?: string) => {
    setTab(next);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const target = path ?? (next === "explore" ? "/" : `/#${next}`);
      if (
        `${window.location.pathname}${window.location.search}${window.location.hash}` !==
        target
      ) {
        window.history.pushState({ abroadmedclub: true }, "", target);
        window.dispatchEvent(new Event("abroadmedclub:navigate"));
      }
    }
  };

  const createTrip = (input: NewTrip) => {
    if (
      !destinations.some(
        (destination) => destination.id === input.destinationId,
      ) ||
      !isDate(input.startsOn) ||
      !isDate(input.endsOn) ||
      input.endsOn < input.startsOn ||
      !["independent", "abroadmedclub", "partner"].includes(input.mode)
    )
      throw new Error("Choose a destination and valid travel dates.");
    const now = new Date();
    setState((previous) => ({
      ...previous,
      trips: [
        {
          ...input,
          id: `${now.valueOf()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: now.toISOString(),
          checklist: {},
        },
        ...previous.trips,
      ],
    }));
    setPlannerDestinationId(null);
    navigate("trips");
    setToast("Trip plan saved on this device. Nothing has been booked.");
  };

  const value: AppContextValue = {
    state,
    tab,
    ready,
    storageError,
    toast,
    plannerDestinationId,
    navigate,
    createTrip,
    toggleSaved: (id) => {
      if (!destinations.some((item) => item.id === id)) return;
      setState((previous) => ({
        ...previous,
        savedDestinations: previous.savedDestinations.includes(id)
          ? previous.savedDestinations.filter((saved) => saved !== id)
          : [...previous.savedDestinations, id],
      }));
    },
    removeTrip: (id) => {
      setState((previous) => ({
        ...previous,
        trips: previous.trips.filter((trip) => trip.id !== id),
      }));
      setToast("Local trip plan deleted.");
    },
    toggleChecklist: (tripId, key) => {
      if (!tripChecklist.some((item) => item.id === key)) return;
      setState((previous) => ({
        ...previous,
        trips: previous.trips.map((trip) =>
          trip.id === tripId
            ? {
                ...trip,
                checklist: { ...trip.checklist, [key]: !trip.checklist[key] },
              }
            : trip,
        ),
      }));
    },
    saveDraft: (id, text) => {
      setState((previous) => {
        const drafts = { ...previous.drafts };
        if (text) drafts[id] = text;
        else delete drafts[id];
        return { ...previous, drafts };
      });
    },
    updatePreferences: (patch) => {
      setState((previous) => ({
        ...previous,
        preferences: { ...previous.preferences, ...patch },
      }));
    },
    resetData: () => {
      setState({
        ...initialState,
        preferences: { ...initialState.preferences },
      });
      setStorageError(null);
      setToast("Local preview data reset.");
    },
    openPlanner: (destinationId = destinations[0].id) =>
      setPlannerDestinationId(destinationId),
    closePlanner: () => setPlannerDestinationId(null),
    notify: setToast,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider.");
  return context;
}
