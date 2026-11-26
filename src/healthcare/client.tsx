import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import { useApp } from "../store";
import type { Catalog, User } from "./types";
import {
  directoryPath,
  readDirectoryRoute,
  type DirectoryRoute,
} from "./navigation";
import { parseApiResponse } from "./schemas";

let nativeToken: string | null = null;
let requestAccount: string | null | undefined;
let requestEpoch = 0;
let invalidateSession: (() => void) | null = null;
let publishSessionEvent: (() => void) | null = null;
const unscopedEndpoints: Record<string, true> = {
  "/catalog": true,
  "/auth/session": true,
  "/auth/login": true,
  "/auth/register": true,
  "/support": true,
  "/provider-applications": true,
};
const configuredBase = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
const apiBase =
  configuredBase ??
  (Platform.OS === "web" && typeof window !== "undefined"
    ? window.location.port === "8081"
      ? `${window.location.protocol}//${window.location.hostname}:8090`
      : window.location.origin
    : "http://localhost:8090");

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const accountBound = !unscopedEndpoints[path.split("?")[0]];
  const expectedAccount = requestAccount;
  const epoch = requestEpoch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${apiBase}/api${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(nativeToken ? { Authorization: `Bearer ${nativeToken}` } : {}),
        ...(accountBound && expectedAccount !== undefined
          ? { "X-AMC-Expected-Account": expectedAccount ?? "anonymous" }
          : {}),
      },
      credentials: Platform.OS === "web" ? "include" : "omit",
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    if (accountBound) {
      if (epoch !== requestEpoch) {
        await response.body?.cancel().catch(() => undefined);
        throw new ApiRequestError(
          "The account session changed. Try again from the current account.",
          409,
        );
      }
      const actualAccount = response.headers.get("X-AMC-Account");
      if (
        expectedAccount !== undefined &&
        actualAccount !== null &&
        actualAccount !== (expectedAccount ?? "anonymous")
      ) {
        invalidateSession?.();
        await response.body?.cancel().catch(() => undefined);
        throw new ApiRequestError(
          "The account session changed. Check the active account before continuing.",
          409,
        );
      }
      if (response.status === 401 && expectedAccount) invalidateSession?.();
    }
    const data: unknown = await response.json().catch(() => null);
    if (accountBound && epoch !== requestEpoch)
      throw new ApiRequestError(
        "The account session changed. Try again from the current account.",
        409,
      );
    if (!response.ok) {
      const message =
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof data.error === "string"
          ? data.error
          : "The service could not complete this request. Please try again.";
      throw new ApiRequestError(message, response.status);
    }
    const parsed = parseApiResponse(path, options.method ?? "GET", data);
    // The route-specific schema validates the DTO before binding it to the caller's contract.
    return parsed as T;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        "The service did not respond in time. Check your connection and try again.",
      );
    if (error instanceof TypeError)
      throw new Error(
        "The directory service is unavailable. Check your connection and retry.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

interface HealthcareContextValue {
  catalog: Catalog | null;
  loading: boolean;
  error: string | null;
  refreshCatalog: () => Promise<void>;
  user: User | null;
  sessionLoading: boolean;
  sessionRevision: number;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  route: DirectoryRoute;
  go: (route: DirectoryRoute) => void;
  back: () => boolean;
  compareIds: string[];
  toggleCompare: (providerId: string) => void;
  inquiryTarget: { providerId: string; offeringId?: string } | null;
  startInquiry: (providerId: string, offeringId?: string) => void;
  closeInquiry: () => void;
}

const HealthcareContext = createContext<HealthcareContextValue | null>(null);
const initialRoute = (): DirectoryRoute =>
  Platform.OS === "web" && typeof window !== "undefined"
    ? readDirectoryRoute(window.location.pathname, window.location.search)
    : { page: "home" };

export function HealthcareProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { navigate, notify, tab } = useApp();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionRevision, setSessionRevision] = useState(0);
  const userRef = useRef<User | null>(null);
  const [route, setRoute] = useState<DirectoryRoute>(initialRoute);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [inquiryTarget, setInquiryTarget] = useState<{
    providerId: string;
    offeringId?: string;
  } | null>(null);
  const nativeHistory = useRef<DirectoryRoute[]>([]);
  const catalogGeneration = useRef(0);
  const sessionGeneration = useRef(0);
  const authenticationBusy = useRef(false);

  const acceptUser = useCallback((next: User | null, reset = false) => {
    const previous = userRef.current;
    if (
      reset ||
      requestAccount === undefined ||
      previous?.id !== next?.id ||
      previous?.role !== next?.role
    ) {
      requestEpoch++;
      setSessionRevision((value) => value + 1);
    }
    requestAccount = next?.id ?? null;
    userRef.current = next;
    if (!next) nativeToken = null;
    setUser(next);
  }, []);

  const refreshCatalog = useCallback(async () => {
    const generation = ++catalogGeneration.current;
    setLoading(true);
    setError(null);
    try {
      const next = await request<Catalog>("/catalog");
      if (generation === catalogGeneration.current) {
        setCatalog(next);
        setCompareIds((previous) =>
          previous.filter((id) =>
            next.providers.some((provider) => provider.id === id),
          ),
        );
      }
    } catch (cause) {
      if (generation === catalogGeneration.current) {
        setCatalog(null);
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load the catalog.",
        );
      }
      throw cause;
    } finally {
      if (generation === catalogGeneration.current) setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(
    async (force = false) => {
      if (authenticationBusy.current && !force) return;
      const generation = ++sessionGeneration.current;
      const previousAccount = requestAccount;
      if (previousAccount === undefined) setSessionLoading(true);
      try {
        const result = await request<{ user: User | null }>("/auth/session");
        if (generation === sessionGeneration.current) {
          acceptUser(result.user);
          if (
            previousAccount !== undefined &&
            previousAccount !== (result.user?.id ?? null)
          )
            publishSessionEvent?.();
        }
      } catch (cause) {
        if (
          generation === sessionGeneration.current &&
          previousAccount === undefined
        )
          acceptUser(null);
        throw cause;
      } finally {
        if (generation === sessionGeneration.current) setSessionLoading(false);
      }
    },
    [acceptUser],
  );

  useEffect(() => {
    void refreshCatalog().catch(() => undefined);
    void refreshSession().catch(() => undefined);
    return () => {
      catalogGeneration.current++;
      sessionGeneration.current++;
    };
  }, [refreshCatalog, refreshSession]);

  useEffect(() => {
    let resyncing = false;
    const resync = () => {
      if (resyncing) return;
      resyncing = true;
      acceptUser(null, true);
      requestAccount = undefined;
      setInquiryTarget(null);
      setSessionLoading(true);
      void refreshSession(true)
        .catch(() => undefined)
        .finally(() => {
          resyncing = false;
        });
    };
    invalidateSession = resync;
    if (Platform.OS !== "web" || typeof window === "undefined") {
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void refreshSession().catch(() => undefined);
      });
      return () => {
        invalidateSession = null;
        subscription.remove();
      };
    }
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("abroadmedclub-session")
        : null;
    const marker = "abroadmedclub.session-event";
    publishSessionEvent = () => {
      if (channel) channel.postMessage("changed");
      else {
        try {
          window.localStorage.setItem(marker, `${Date.now()}-${Math.random()}`);
          window.localStorage.removeItem(marker);
        } catch {
          /* Session correctness is also checked on focus and every scoped request. */
        }
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === marker && event.newValue !== null) resync();
    };
    const onFocus = () => {
      void refreshSession().catch(() => undefined);
    };
    if (channel)
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (event.data === "changed") resync();
      };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      invalidateSession = null;
      publishSessionEvent = null;
      channel?.close();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [acceptUser, refreshSession]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const update = () => {
      if (!window.location.hash || window.location.hash === "#explore")
        setRoute(
          readDirectoryRoute(window.location.pathname, window.location.search),
        );
    };
    window.addEventListener("popstate", update);
    window.addEventListener("abroadmedclub:navigate", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("abroadmedclub:navigate", update);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    let title = "Healthcare abroad, on your terms";
    if (tab !== "explore")
      title = {
        club: "Club",
        trips: "My Trips",
        messages: "Messages",
        profile: "Profile",
      }[tab];
    else if (route.page === "provider")
      title =
        catalog?.providers.find((item) => item.id === route.id)?.name ??
        "Medical center";
    else if (route.page === "specialties")
      title =
        catalog?.categories.find((item) => item.id === route.categoryId)
          ?.name ?? "Medical specialties";
    else if (route.page === "destinations")
      title =
        catalog?.countries.find((item) => item.code === route.code)?.name ??
        "Healthcare destinations";
    else if (route.page === "guides")
      title =
        catalog?.guides.find((item) => item.id === route.id)?.title ??
        "Patient guides";
    else if (route.page !== "home")
      title = {
        providers: "Find medical centers",
        about: "About us",
        privacy: "Privacy",
        terms: "Terms and medical disclaimer",
        contact: "Contact the directory team",
        "providers-join": "List your medical center",
        compare: "Compare medical centers",
        "how-it-works": "How it works",
      }[route.page];
    document.title = `${title} · AbroadMedClub`;
  }, [route, catalog, tab]);

  const go = (next: DirectoryRoute) => {
    if (Platform.OS !== "web" && directoryPath(next) !== directoryPath(route))
      nativeHistory.current.push(route);
    setRoute(next);
    navigate("explore", directoryPath(next));
  };
  const back = () => {
    if (route.page === "home") return false;
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.history.state?.abroadmedclub
    )
      window.history.back();
    else {
      const previous = nativeHistory.current.pop() ?? { page: "home" };
      setRoute(previous);
      navigate("explore", directoryPath(previous));
    }
    return true;
  };
  const authenticate = async (path: string, body: unknown) => {
    if (authenticationBusy.current)
      throw new Error("Wait for the current sign-in attempt to finish.");
    authenticationBusy.current = true;
    const generation = ++sessionGeneration.current;
    try {
      const result = await request<{ user: User; token: string }>(path, {
        method: "POST",
        body,
      });
      if (generation !== sessionGeneration.current) {
        publishSessionEvent?.();
        void refreshSession(true).catch(() => undefined);
        throw new ApiRequestError(
          "The account changed during sign-in. Check the active account.",
          409,
        );
      }
      nativeToken = Platform.OS === "web" ? null : result.token;
      acceptUser(result.user, true);
      publishSessionEvent?.();
    } finally {
      authenticationBusy.current = false;
    }
  };
  const signOut = async () => {
    await request("/auth/logout", { method: "POST", body: {} });
    sessionGeneration.current++;
    acceptUser(null, true);
    setInquiryTarget(null);
    publishSessionEvent?.();
  };
  const deleteAccount = async (password: string) => {
    await request("/auth/account", { method: "DELETE", body: { password } });
    sessionGeneration.current++;
    acceptUser(null, true);
    setInquiryTarget(null);
    publishSessionEvent?.();
  };

  return (
    <HealthcareContext.Provider
      value={{
        catalog,
        loading,
        error,
        refreshCatalog,
        user,
        sessionLoading,
        sessionRevision,
        refreshSession,
        signIn: (email, password) =>
          authenticate("/auth/login", { email, password }),
        signUp: (name, email, password) =>
          authenticate("/auth/register", { name, email, password }),
        signOut,
        deleteAccount,
        route,
        go,
        back,
        compareIds,
        toggleCompare: (id) => {
          if (!catalog?.providers.some((item) => item.id === id)) return;
          if (compareIds.includes(id))
            setCompareIds((previous) => previous.filter((item) => item !== id));
          else if (compareIds.length >= 3)
            notify(
              "Compare up to three centers. Remove one before adding another.",
            );
          else setCompareIds((previous) => [...previous, id]);
        },
        inquiryTarget,
        startInquiry: (providerId, offeringId) =>
          setInquiryTarget({ providerId, offeringId }),
        closeInquiry: () => setInquiryTarget(null),
      }}
    >
      {children}
    </HealthcareContext.Provider>
  );
}

export function useHealthcare() {
  const context = useContext(HealthcareContext);
  if (!context)
    throw new Error("useHealthcare must be used within HealthcareProvider.");
  return context;
}
