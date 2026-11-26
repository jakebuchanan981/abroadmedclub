import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { request, useHealthcare } from "../healthcare/client";
import type { Circle } from "./types";

type Memberships = {
  ownerId: string;
  items: Circle[];
  loading: boolean;
  error: string;
};
interface CommunityContextValue {
  memberships: Circle[];
  joinedCount: number;
  loading: boolean;
  error: string;
  refreshMemberships: () => Promise<void>;
}
const CommunityContext = createContext<CommunityContextValue | null>(null);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useHealthcare();
  const ownerId = user?.id ?? null;
  const identity = useRef(ownerId);
  const sequence = useRef(0);
  if (identity.current !== ownerId) {
    identity.current = ownerId;
    sequence.current += 1;
  }
  const [snapshot, setSnapshot] = useState<Memberships | null>(null);
  const refreshMemberships = useCallback(async () => {
    if (!ownerId || identity.current !== ownerId) return;
    const revision = ++sequence.current;
    setSnapshot((old) => ({
      ownerId,
      items: old?.ownerId === ownerId ? old.items : [],
      loading: true,
      error: "",
    }));
    try {
      const result = await request<{ items: Circle[] }>("/community/mine");
      if (identity.current === ownerId && sequence.current === revision)
        setSnapshot({
          ownerId,
          items: result.items,
          loading: false,
          error: "",
        });
    } catch (error) {
      if (identity.current === ownerId && sequence.current === revision)
        setSnapshot({
          ownerId,
          items: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not load your memberships.",
        });
    }
  }, [ownerId]);
  useEffect(() => {
    void refreshMemberships();
  }, [refreshMemberships]);
  const current = ownerId && snapshot?.ownerId === ownerId ? snapshot : null;
  const memberships = current?.items ?? [];
  return (
    <CommunityContext.Provider
      value={{
        memberships,
        joinedCount: memberships.filter(
          (circle) => circle.myMembership?.status === "active",
        ).length,
        loading: current?.loading ?? !!ownerId,
        error: current?.error ?? "",
        refreshMemberships,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const value = useContext(CommunityContext);
  if (!value)
    throw new Error("useCommunity must be used within CommunityProvider.");
  return value;
}
